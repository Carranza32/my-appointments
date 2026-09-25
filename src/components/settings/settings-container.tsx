"use client";

import { useState, useTransition, useEffect, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { googleOAuthOptions } from "@/lib/google-oauth";
import { disconnectGoogleCalendar } from "@/actions/google-calendar";
import {
  saveProfileSettings,
  saveWeeklyHours,
  saveIntegrationSettings,
  saveBankTransferSettings,
  saveRegionalSettings,
  deleteAccount,
} from "@/actions/settings";
import { togglePlanDev } from "@/actions/wompi-dev";
import {
  DAY_LABELS,
  WEEK_DAYS,
  type DaySchedule,
  type TimeSlot,
  type WeeklyHours,
} from "@/types/business";
import {
  COUNTRY_PRESETS,
  SUPPORTED_CURRENCIES,
  SUPPORTED_TIMEZONES,
  detectCountryPreset,
  getCurrencySymbol,
  getPresetByCode,
  formatMoney,
  type CountryPreset,
} from "@/lib/regional";
import {
  Globe,
  Zap,
  DollarSign,
  Clock,
  Check,
  Sparkles,
  RefreshCw,
  ChevronRight,
  ShieldCheck,
  Layers,
  Sliders,
  Camera,
  Image as ImageIcon,
  Upload,
  Trash2,
  Palette,
  ExternalLink,
  Copy,
  MapPin,
  Phone,
  Video,
  Building,
  Eye,
} from "lucide-react";

export const COVER_PRESETS = [
  {
    id: "ocean",
    name: "Océano Calmo",
    gradient: "linear-gradient(135deg, #007AFF 0%, #5856D6 50%, #00C6FF 100%)",
  },
  {
    id: "serene",
    name: "Mente Serena",
    gradient: "linear-gradient(135deg, #0ba360 0%, #3cba92 50%, #30dd8a 100%)",
  },
  {
    id: "warm",
    name: "Atardecer Ámbar",
    gradient: "linear-gradient(135deg, #FF9500 0%, #FF2D55 50%, #FFCC00 100%)",
  },
  {
    id: "minimal",
    name: "Clínica Pureza",
    gradient: "linear-gradient(135deg, #E2E8F0 0%, #CBD5E1 50%, #94A3B8 100%)",
  },
  {
    id: "night",
    name: "Estudio Índigo",
    gradient: "linear-gradient(135deg, #1E293B 0%, #334155 50%, #0F172A 100%)",
  },
];

export const BRAND_COLORS = [
  { hex: "#007AFF", name: "Azul Apple" },
  { hex: "#34C759", name: "Esmeralda" },
  { hex: "#5856D6", name: "Índigo" },
  { hex: "#AF52DE", name: "Púrpura" },
  { hex: "#FF9500", name: "Ámbar" },
  { hex: "#FF2D55", name: "Rosa" },
  { hex: "#1D1D1F", name: "Grafito" },
];

type Props = {
  initialName: string;
  initialSlug: string;
  initialAvatarUrl: string;
  initialDescription: string;
  initialTimezone: string;
  initialCurrency?: string;
  initialCoverUrl?: string | null;
  initialPhone?: string | null;
  initialLocation?: string | null;
  initialThemeColor?: string | null;
  initialModality?: string | null;
  rubro?: string;
  initialHours: WeeklyHours;
  googleConnected: boolean;
  googleLinkedAt?: string;
  initialEnableWhatsApp: boolean;
  initialWhatsappNumber: string;
  planTier: "FREE" | "PRO";
  initialAcceptBankTransfer: boolean;
  initialBankName: string;
  initialBankClabe: string;
  initialBankHolder: string;
  initialBankInstructions: string;
};

const COMMON_TIMEZONES = SUPPORTED_TIMEZONES;

const TIME_OPTIONS = Array.from({ length: 96 }, (_, i) => {
  const h = Math.floor(i / 4);
  const m = (i % 4) * 15;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
});

function getDaySchedule(hours: WeeklyHours, day: number): DaySchedule {
  return hours.find((d) => d.day === day) ?? { day, slots: [] };
}

function upsertDay(hours: WeeklyHours, daySchedule: DaySchedule): WeeklyHours {
  const rest = hours.filter((d) => d.day !== daySchedule.day);
  if (daySchedule.slots.length === 0) return rest;
  return [...rest, daySchedule].sort((a, b) => a.day - b.day);
}

function hasInvalidSlots(slots: TimeSlot[]): boolean {
  return slots.some((slot) => {
    const [openH, openM] = slot.open.split(":").map(Number);
    const [closeH, closeM] = slot.close.split(":").map(Number);
    const openMin = openH * 60 + openM;
    const closeMin = closeH * 60 + closeM;
    return closeMin <= openMin;
  });
}

const to12h = (time: string): string => {
  if (!time) return "";
  const [hStr, mStr] = time.split(":");
  const h = parseInt(hStr, 10);
  if (isNaN(h)) return time;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(h12).padStart(2, "0")}:${mStr} ${ampm}`;
};


export function SettingsContainer({
  initialName,
  initialSlug,
  initialAvatarUrl,
  initialDescription,
  initialTimezone,
  initialCurrency = "USD",
  initialCoverUrl,
  initialPhone,
  initialLocation,
  initialThemeColor = "#007AFF",
  initialModality = "BOTH",
  rubro = "GENERAL",
  initialHours,
  googleConnected,
  googleLinkedAt,
  initialEnableWhatsApp,
  initialWhatsappNumber,
  planTier,
  initialAcceptBankTransfer,
  initialBankName,
  initialBankClabe,
  initialBankHolder,
  initialBankInstructions,
}: Props) {
  const [activeTab, _setActiveTab] = useState<
    "profile" | "regional" | "schedule" | "notifications" | "integrations" | "plan" | "account" | "payments"
  >("profile");

  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams?.get("tab");

  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [pendingDev, startDevTransition] = useTransition();

  const isMockMode = 
    searchParams?.get("wompi_mock") === "checkout" || 
    searchParams?.get("mockCheckout") === "true";

  async function handleWompiUpgrade(amount: number) {
    setLoadingCheckout(true);
    try {
      const res = await fetch("/api/checkout/wompi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceAmount: amount }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Error al iniciar checkout: " + (data.error || "Desconocido"));
        setLoadingCheckout(false);
      }
    } catch (err) {
      alert("Error al procesar solicitud.");
      setLoadingCheckout(false);
    }
  }

  function handleSimulatePayment(targetTier: "FREE" | "PRO") {
    startDevTransition(async () => {
      const res = await togglePlanDev(targetTier);
      if ("error" in res && res.error) {
        alert("Error en simulación: " + res.error);
      } else {
        router.replace("/dashboard/settings?tab=plan");
        router.refresh();
      }
    });
  }

  // Sync tab from URL query parameter
  useEffect(() => {
    if (!tab) {
      _setActiveTab("profile");
    } else if (
      tab === "profile" ||
      tab === "regional" ||
      tab === "schedule" ||
      tab === "notifications" ||
      tab === "integrations" ||
      tab === "plan" ||
      tab === "account" ||
      tab === "payments"
    ) {
      _setActiveTab(tab);
    }
  }, [tab]);

  // Wrapper function to set local state and update search params reactively
  const setActiveTab = (newTab: "profile" | "regional" | "schedule" | "notifications" | "integrations" | "plan" | "account" | "payments") => {
    _setActiveTab(newTab);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      params.set("tab", newTab);
      router.replace(`/dashboard/settings?${params.toString()}`, { scroll: false });
    }
  };

  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [pending, startTransition] = useTransition();

  // Toast auto-hide
  useEffect(() => {
    if (message) {
      const t = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(t);
    }
  }, [message]);

  // Regional settings state
  const defaultPreset = useMemo(() => detectCountryPreset(initialTimezone), [initialTimezone]);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>(defaultPreset.code);
  const [regionalTimezone, setRegionalTimezone] = useState<string>(initialTimezone || "America/El_Salvador");
  const [regionalCurrency, setRegionalCurrency] = useState<string>(initialCurrency || defaultPreset.currency);
  const [updateServicesCurrency, setUpdateServicesCurrency] = useState<boolean>(true);
  const [isDetectingLocation, setIsDetectingLocation] = useState<boolean>(false);
  const [detectedNotification, setDetectedNotification] = useState<string | null>(null);

  // Profile Form States
  const [profileName, setProfileName] = useState(initialName || "");
  const [profileSlug, setProfileSlug] = useState(initialSlug || "");
  const [profileBio, setProfileBio] = useState(initialDescription || "");
  const [profileAvatarUrl, setProfileAvatarUrl] = useState(initialAvatarUrl || "");
  const [profileCoverUrl, setProfileCoverUrl] = useState<string>(initialCoverUrl || COVER_PRESETS[0].gradient);
  const [profileTimezone, setProfileTimezone] = useState(initialTimezone || "America/El_Salvador");
  const [profilePhone, setProfilePhone] = useState<string>(initialPhone || "");
  const [profileLocation, setProfileLocation] = useState<string>(initialLocation || "");
  const [profileThemeColor, setProfileThemeColor] = useState<string>(initialThemeColor || "#007AFF");
  const [profileModality, setProfileModality] = useState<string>(initialModality || "BOTH");

  const [isCopiedSlug, setIsCopiedSlug] = useState(false);
  const [showCoverPresets, setShowCoverPresets] = useState(false);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);

  // Keep profileTimezone in sync with regionalTimezone
  useEffect(() => {
    setProfileTimezone(regionalTimezone);
  }, [regionalTimezone]);

  // Load localStorage fallback for Phone & Location if not initially provided
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!initialPhone) {
        const storedPhone = localStorage.getItem("settings_phone");
        if (storedPhone) setProfilePhone(storedPhone);
      }
      if (!initialLocation) {
        const storedLoc = localStorage.getItem("settings_location");
        if (storedLoc) setProfileLocation(storedLoc);
      }
    }
  }, [initialPhone, initialLocation]);

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      setMessage({ type: "error", text: "La foto o logo debe pesar menos de 4MB" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setProfileAvatarUrl(reader.result);
        setMessage({ type: "success", text: "Foto / Logo cargado. Guarda los cambios para aplicar." });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCoverFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 6 * 1024 * 1024) {
      setMessage({ type: "error", text: "La imagen de portada debe pesar menos de 6MB" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setProfileCoverUrl(reader.result);
        setMessage({ type: "success", text: "Foto de portada cargada. Guarda los cambios para aplicar." });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCopyPublicLink = () => {
    if (typeof window !== "undefined" && profileSlug) {
      const url = `${window.location.origin}/${profileSlug}`;
      navigator.clipboard.writeText(url);
      setIsCopiedSlug(true);
      setTimeout(() => setIsCopiedSlug(false), 2200);
      setMessage({ type: "success", text: "Enlace público copiado al portapapeles." });
    }
  };

  // Handler for Auto-detecting location via browser API
  const handleAutoDetectLocation = () => {
    setIsDetectingLocation(true);
    setDetectedNotification(null);
    try {
      const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const detected = detectCountryPreset(browserTz);
      setSelectedCountryCode(detected.code);
      setRegionalTimezone(detected.timezone);
      setRegionalCurrency(detected.currency);
      setProfileTimezone(detected.timezone);
      
      // Update phone placeholder/prefix if phone was default
      if (!profilePhone || profilePhone.includes("555")) {
        setProfilePhone(`${detected.phonePrefix} `);
        localStorage.setItem("settings_phone", `${detected.phonePrefix} `);
      }

      setDetectedNotification(`¡Ubicación detectada: ${detected.flag} ${detected.name} (${detected.gmt})!`);
      setMessage({
        text: `Ubicación detectada: ${detected.flag} ${detected.name} • ${detected.timezone} • Moneda: ${detected.currency}`,
        type: "success",
      });
    } catch {
      setMessage({
        text: "No fue posible detectar la zona horaria del navegador. Selecciónala manualmente.",
        type: "error",
      });
    } finally {
      setTimeout(() => setIsDetectingLocation(false), 300);
    }
  };

  const handleSelectCountryPreset = (preset: CountryPreset) => {
    setSelectedCountryCode(preset.code);
    setRegionalTimezone(preset.timezone);
    setRegionalCurrency(preset.currency);
    setProfileTimezone(preset.timezone);
    setDetectedNotification(null);
    setMessage({
      text: `Preset aplicado: ${preset.flag} ${preset.name} (${preset.currency} · ${preset.gmt})`,
      type: "success",
    });
  };

  const handleSaveRegional = () => {
    setMessage(null);
    startTransition(async () => {
      const res = await saveRegionalSettings({
        timezone: regionalTimezone,
        currency: regionalCurrency,
        updateServicesCurrency,
      });

      if (res?.error) {
        setMessage({ text: res.error, type: "error" });
      } else {
        setMessage({
          text: `Configuración regional guardada (${regionalTimezone}, ${regionalCurrency}).`,
          type: "success",
        });
      }
    });
  };

  // Schedule States
  const [hours, setHours] = useState<WeeklyHours>(initialHours);
  const [isTimezoneEditing, setIsTimezoneEditing] = useState(false);

  // Notifications States (local mockup)
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifWhatsApp, setNotifWhatsApp] = useState(initialEnableWhatsApp);
  const [notifDaily, setNotifDaily] = useState(false);

  // Load notifications from localStorage if preset
  useEffect(() => {
    if (typeof window !== "undefined") {
      const emailVal = localStorage.getItem("notif_email");
      const dailyVal = localStorage.getItem("notif_daily");
      if (emailVal !== null) setNotifEmail(emailVal === "true");
      if (dailyVal !== null) setNotifDaily(dailyVal === "true");
    }
  }, []);

  // Integrations States
  const [enableWhatsApp, setEnableWhatsApp] = useState(initialEnableWhatsApp);
  const [whatsappNumber, setWhatsappNumber] = useState(initialWhatsappNumber);

  // Account settings state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Payments (Bank Transfer) States
  const [acceptBankTransfer, setAcceptBankTransfer] = useState(initialAcceptBankTransfer);
  const [bankName, setBankName] = useState(initialBankName);
  const [bankClabe, setBankClabe] = useState(initialBankClabe);
  const [bankHolder, setBankHolder] = useState(initialBankHolder);
  const [bankInstructions, setBankInstructions] = useState(initialBankInstructions);
  const [isSavingPayments, setIsSavingPayments] = useState(false);

  const handleSavePayments = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setIsSavingPayments(true);

    try {
      const res = await saveBankTransferSettings({
        acceptBankTransfer,
        bankName: bankName.trim() || null,
        bankClabe: bankClabe.trim() || null,
        bankHolder: bankHolder.trim() || null,
        bankInstructions: bankInstructions.trim() || null,
      });

      if (res.error) {
        setMessage({ type: "error", text: res.error });
      } else {
        setMessage({ type: "success", text: "Configuración de pagos por transferencia guardada con éxito." });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Error al guardar pagos." });
    } finally {
      setIsSavingPayments(false);
    }
  };

  // Profile Submit Handler
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // Save Phone/Location to LocalStorage
    localStorage.setItem("settings_phone", profilePhone);
    localStorage.setItem("settings_location", profileLocation);

    startTransition(async () => {
      const res = await saveProfileSettings({
        name: profileName,
        slug: profileSlug,
        description: profileBio.trim() || null,
        avatarUrl: profileAvatarUrl.trim() || null,
        timezone: profileTimezone,
        coverUrl: profileCoverUrl,
        phone: profilePhone.trim() || null,
        location: profileLocation.trim() || null,
        themeColor: profileThemeColor,
        modality: profileModality,
      });

      if (res?.error) {
        setMessage({ text: res.error, type: "error" });
      } else {
        setMessage({ text: "Perfil público y personalización guardados correctamente.", type: "success" });
      }
    });
  };

  // Schedule Actions
  const updateDay = (day: number, slots: TimeSlot[]) => {
    setHours((prev) => upsertDay(prev, { day, slots }));
  };

  const addSlot = (day: number) => {
    const current = getDaySchedule(hours, day);
    const newSlot = current.slots.length === 0
      ? { open: "09:00", close: "17:00" }
      : { open: "09:00", close: "13:00" };
    updateDay(day, [...current.slots, newSlot]);
  };

  const removeSlot = (day: number, index: number) => {
    const current = getDaySchedule(hours, day);
    updateDay(
      day,
      current.slots.filter((_, i) => i !== index)
    );
  };

  const updateSlot = (
    day: number,
    index: number,
    field: "open" | "close",
    value: string
  ) => {
    const current = getDaySchedule(hours, day);
    const slots = current.slots.map((slot, i) =>
      i === index ? { ...slot, [field]: value } : slot
    );
    updateDay(day, slots);
  };

  const handleSaveSchedule = () => {
    setMessage(null);

    const hasErrors = hours.some((d) => hasInvalidSlots(d.slots));
    if (hasErrors) {
      setMessage({
        text: "Corrige los intervalos de tiempo inválidos antes de guardar.",
        type: "error",
      });
      return;
    }

    startTransition(async () => {
      const res = await saveWeeklyHours(hours);
      if (res?.error) {
        setMessage({ text: res.error, type: "error" });
      } else {
        setMessage({ text: "Horarios de atención guardados correctamente.", type: "success" });
      }
    });
  };

  // Notification Preferences Save
  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    localStorage.setItem("notif_email", String(notifEmail));
    localStorage.setItem("notif_daily", String(notifDaily));

    startTransition(async () => {
      const res = await saveIntegrationSettings({
        enableWhatsApp: notifWhatsApp,
      });

      if (res?.error) {
        setMessage({ text: res.error, type: "error" });
      } else {
        setEnableWhatsApp(notifWhatsApp);
        setMessage({ text: "Preferencias de notificación guardadas.", type: "success" });
      }
    });
  };

  // Google Calendar Connection Actions
  const handleConnectGoogle = async () => {
    setMessage(null);
    startTransition(async () => {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=/dashboard/settings`;

      const { error } = await supabase.auth.linkIdentity({
        provider: "google",
        options: googleOAuthOptions(redirectTo),
      });

      if (error) {
        const msg = error.message.toLowerCase().includes("manual linking")
          ? "Activa «Allow manual linking» en Supabase → Authentication → Sign In Providers."
          : error.message;
        setMessage({ text: msg, type: "error" });
      }
    });
  };

  const handleDisconnectGoogle = async () => {
    setMessage(null);
    startTransition(async () => {
      try {
        await disconnectGoogleCalendar();
        setMessage({ text: "Google Calendar desconectado correctamente.", type: "success" });
        setTimeout(() => window.location.reload(), 1500);
      } catch (e) {
        setMessage({
          text: e instanceof Error ? e.message : "Error al desconectar",
          type: "error",
        });
      }
    });
  };

  // WhatsApp Integration Action
  const handleToggleWhatsApp = () => {
    const nextWhatsApp = !enableWhatsApp;
    setEnableWhatsApp(nextWhatsApp);
    setNotifWhatsApp(nextWhatsApp);

    startTransition(async () => {
      const res = await saveIntegrationSettings({
        enableWhatsApp: nextWhatsApp,
        whatsappNumber: nextWhatsApp ? whatsappNumber : null,
      });
      if (res?.error) {
        setEnableWhatsApp(!nextWhatsApp);
        setNotifWhatsApp(!nextWhatsApp);
        setMessage({ text: res.error, type: "error" });
      } else {
        setMessage({
          text: nextWhatsApp ? "Recordatorios por WhatsApp activados." : "Recordatorios por WhatsApp desactivados.",
          type: "success",
        });
      }
    });
  };

  // Password Update
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ text: "Las contraseñas nuevas no coinciden.", type: "error" });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ text: "La contraseña debe tener al menos 6 caracteres.", type: "error" });
      return;
    }

    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        setMessage({ text: error.message, type: "error" });
      } else {
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setMessage({ text: "Contraseña actualizada correctamente.", type: "success" });
      }
    });
  };

  // Delete Account
  const handleDeleteAccount = () => {
    setIsDeleteConfirmOpen(false);
    setMessage(null);
    startTransition(async () => {
      // 1. Delete user & cascade delete tenant data from database
      const res = await deleteAccount();
      if (res?.error) {
        setMessage({ text: res.error, type: "error" });
        return;
      }

      // 2. Clear onboarding draft and local cache
      if (typeof window !== "undefined") {
        localStorage.removeItem("my_appointment_onboarding_draft_v2");
        localStorage.removeItem("settings_phone");
        localStorage.removeItem("settings_location");
      }

      // 3. Sign out of Supabase
      const supabase = createClient();
      await supabase.auth.signOut();

      // 4. Redirect to login
      window.location.href = "/login";
    });
  };

  // Helpers for timezone inline selector
  const handleSaveTimezone = () => {
    setIsTimezoneEditing(false);
    setMessage(null);
    startTransition(async () => {
      const res = await saveProfileSettings({
        name: profileName,
        slug: profileSlug,
        description: profileBio.trim() || null,
        avatarUrl: profileAvatarUrl.trim() || null,
        timezone: profileTimezone,
      });
      if (res?.error) {
        setMessage({ text: res.error, type: "error" });
      } else {
        setMessage({ text: "Zona horaria actualizada correctamente.", type: "success" });
      }
    });
  };

  const hasAnyValidationError = useMemo(() => {
    return hours.some((d) => hasInvalidSlots(d.slots));
  }, [hours]);

  return (
    <div className="w-full flex flex-col md:flex-row items-start gap-6">
      {/* Toast Notification */}
      {message && (
        <div
          className={`fixed right-6 top-24 z-50 flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-xl transition-all duration-300 backdrop-blur-2xl ${
            message.type === "success"
              ? "border-[#34C759]/20 bg-white/95 text-[#34C759]"
              : "border-[#FF3B30]/20 bg-white/95 text-[#FF3B30]"
          }`}
        >
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                message.type === "success" ? "bg-[#34C759]" : "bg-[#FF3B30]"
              }`}
            ></span>
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                message.type === "success" ? "bg-[#34C759]" : "bg-[#FF3B30]"
              }`}
            ></span>
          </span>
          <p className="text-xs font-medium leading-none">{message.text}</p>
        </div>
      )}

      {/* TABS SIDE NAVIGATION MENU */}
      <div className="w-full md:w-56 shrink-0 flex flex-col gap-1 select-none p-2 bg-white/80 backdrop-blur-2xl rounded-2xl border border-black/[0.06] shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
        <button
          onClick={() => setActiveTab("profile")}
          className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer active:scale-[0.98] ${
            activeTab === "profile"
              ? "bg-[#007AFF] text-white shadow-xs"
              : "text-[#86868B] hover:bg-black/[0.03] hover:text-[#1D1D1F]"
          }`}
        >
          Perfil
        </button>
        <button
          onClick={() => setActiveTab("regional")}
          className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer active:scale-[0.98] flex items-center justify-between ${
            activeTab === "regional"
              ? "bg-[#007AFF] text-white shadow-xs"
              : "text-[#86868B] hover:bg-black/[0.03] hover:text-[#1D1D1F]"
          }`}
        >
          <span>Región y Moneda</span>
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
            activeTab === "regional" ? "bg-white/20 text-white" : "bg-black/[0.04] text-[#1D1D1F]"
          }`}>
            {(getPresetByCode(selectedCountryCode) || defaultPreset).flag} {regionalCurrency}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("schedule")}
          className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer active:scale-[0.98] ${
            activeTab === "schedule"
              ? "bg-[#007AFF] text-white shadow-xs"
              : "text-[#86868B] hover:bg-black/[0.03] hover:text-[#1D1D1F]"
          }`}
        >
          Horarios
        </button>
        <button
          onClick={() => setActiveTab("notifications")}
          className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer active:scale-[0.98] ${
            activeTab === "notifications"
              ? "bg-[#007AFF] text-white shadow-xs"
              : "text-[#86868B] hover:bg-black/[0.03] hover:text-[#1D1D1F]"
          }`}
        >
          Notificaciones
        </button>
        <button
          onClick={() => setActiveTab("integrations")}
          className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer active:scale-[0.98] ${
            activeTab === "integrations"
              ? "bg-[#007AFF] text-white shadow-xs"
              : "text-[#86868B] hover:bg-black/[0.03] hover:text-[#1D1D1F]"
          }`}
        >
          Integraciones
        </button>
        <button
          onClick={() => setActiveTab("plan")}
          className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer active:scale-[0.98] ${
            activeTab === "plan"
              ? "bg-[#007AFF] text-white shadow-xs"
              : "text-[#86868B] hover:bg-black/[0.03] hover:text-[#1D1D1F]"
          }`}
        >
          Plan & Facturación
        </button>
        <button
          onClick={() => setActiveTab("account")}
          className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer active:scale-[0.98] ${
            activeTab === "account"
              ? "bg-[#007AFF] text-white shadow-xs"
              : "text-[#86868B] hover:bg-black/[0.03] hover:text-[#1D1D1F]"
          }`}
        >
          Cuenta
        </button>
        <button
          onClick={() => setActiveTab("payments")}
          className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer active:scale-[0.98] ${
            activeTab === "payments"
              ? "bg-[#007AFF] text-white shadow-xs"
              : "text-[#86868B] hover:bg-black/[0.03] hover:text-[#1D1D1F]"
          }`}
        >
          Métodos de Pago
        </button>
      </div>

      {/* CONTENT PANEL DISPLAY */}
      <div className="flex-1 min-w-0 w-full bg-white/80 backdrop-blur-2xl p-6 sm:p-8 rounded-2xl border border-black/[0.06] shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
        
        {/* PROFILE TAB */}
        {activeTab === "profile" && (
          <form onSubmit={handleSaveProfile} className="space-y-6">
            {/* Header */}
            <div className="border-b border-black/[0.06] pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="text-lg font-semibold text-[#1D1D1F]">
                  Perfil Público & Identidad de Marca
                </h3>
                <p className="mt-0.5 text-xs text-[#86868B]">
                  Personaliza cómo ven tu negocio tus pacientes: portada, foto de perfil, datos de contacto y colores.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyPublicLink}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-black/[0.08] bg-white text-xs font-medium text-[#1D1D1F] hover:bg-black/[0.02] shadow-xs cursor-pointer transition-all"
                >
                  {isCopiedSlug ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#34C759]" />
                      <span className="text-[#34C759]">Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#86868B]" />
                      <span>Copiar Enlace</span>
                    </>
                  )}
                </button>
                {profileSlug && (
                  <a
                    href={`/${profileSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#007AFF]/10 text-xs font-medium text-[#007AFF] hover:bg-[#007AFF]/20 transition-all cursor-pointer"
                  >
                    <span>Ver Portal</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>

            {/* CARD 1: VISUAL IDENTITY (COVER BANNER & AVATAR) */}
            <div className="rounded-3xl border border-black/[0.08] bg-[#F5F5F7] overflow-hidden shadow-xs">
              {/* Cover Banner */}
              <div
                className="h-44 sm:h-52 w-full relative transition-all duration-300"
                style={{
                  background: profileCoverUrl?.startsWith("data:") || profileCoverUrl?.startsWith("http")
                    ? `url('${profileCoverUrl}') center/cover no-repeat`
                    : profileCoverUrl || COVER_PRESETS[0].gradient,
                }}
              >
                {/* Dark gradient overlay for contrast */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent pointer-events-none" />

                {/* Top Actions in Cover */}
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCoverPresets(!showCoverPresets)}
                    className="backdrop-blur-md bg-black/40 hover:bg-black/60 text-white text-[11px] font-medium px-3 py-1.5 rounded-full border border-white/20 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Palette className="w-3.5 h-3.5" />
                    <span>{showCoverPresets ? "Cerrar Temas" : "Temas / Gradientes"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => coverFileInputRef.current?.click()}
                    className="backdrop-blur-md bg-black/40 hover:bg-black/60 text-white text-[11px] font-medium px-3 py-1.5 rounded-full border border-white/20 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Subir Portada</span>
                  </button>
                  <input
                    ref={coverFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCoverFile}
                  />
                </div>

                {/* Cover Presets Drawer */}
                {showCoverPresets && (
                  <div className="absolute inset-x-3 bottom-3 p-3 rounded-2xl backdrop-blur-xl bg-black/75 border border-white/20 shadow-xl animate-in fade-in-50 duration-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-semibold text-white/90">
                        Elige un degradado Apple o sube tu propia foto:
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowCoverPresets(false)}
                        className="text-[11px] text-white/70 hover:text-white"
                      >
                        Listo
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {COVER_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            setProfileCoverUrl(preset.gradient);
                          }}
                          className={`group relative h-12 rounded-xl border p-1 text-left transition-all overflow-hidden flex flex-col justify-end ${
                            profileCoverUrl === preset.gradient
                              ? "border-white ring-2 ring-white/60 scale-[1.02]"
                              : "border-white/20 hover:border-white/50"
                          }`}
                          style={{ background: preset.gradient }}
                        >
                          <span className="text-[10px] font-medium text-white drop-shadow-sm px-1 truncate">
                            {preset.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Avatar & Subtitle Bar */}
              <div className="px-6 pb-6 pt-0 relative bg-white">
                <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-12 sm:-mt-14 mb-2">
                  <div className="flex items-end gap-4">
                    {/* Overlapping Avatar */}
                    <div className="relative group shrink-0">
                      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white shadow-md bg-white overflow-hidden flex items-center justify-center">
                        <img
                          src={
                            profileAvatarUrl ||
                            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256"
                          }
                          alt="Avatar o Logo"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => avatarFileInputRef.current?.click()}
                        className="absolute bottom-1 right-1 p-2 rounded-full bg-[#007AFF] hover:bg-[#0062cc] text-white shadow-md cursor-pointer transition-transform active:scale-95 group-hover:scale-105"
                        title="Subir foto o logo"
                      >
                        <Camera className="w-3.5 h-3.5" />
                      </button>
                      <input
                        ref={avatarFileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarFile}
                      />
                    </div>

                    <div className="pb-1">
                      <h4 className="text-base font-semibold text-[#1D1D1F]">
                        {profileName || "Tu Nombre o Marca"}
                      </h4>
                      <p className="text-xs text-[#86868B] flex items-center gap-1 mt-0.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#34C759]" />
                        <span>Identidad de negocio verificada</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pb-1">
                    <button
                      type="button"
                      onClick={() => avatarFileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-black/[0.08] bg-[#F5F5F7] hover:bg-black/[0.05] text-xs font-medium text-[#1D1D1F] transition-all cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#007AFF]" />
                      <span>Subir Foto o Logo</span>
                    </button>
                    {profileAvatarUrl && (
                      <button
                        type="button"
                        onClick={() => setProfileAvatarUrl("")}
                        className="p-2 rounded-xl border border-black/[0.08] bg-[#F5F5F7] hover:bg-red-50 hover:text-red-500 text-[#86868B] transition-all cursor-pointer"
                        title="Quitar foto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 2: INFORMACIÓN PRINCIPAL & SLUG */}
            <div className="rounded-2xl border border-black/[0.06] bg-white p-5 sm:p-6 space-y-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#86868B]">
                Información de Reserva
              </h4>

              {/* Display Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#1D1D1F]">
                  Nombre para mostrar o de la Clínica / Negocio
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Lic. Alex Henderson - Psicología Clínica"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 text-xs font-medium text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-hidden focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/10 transition-all"
                />
              </div>

              {/* URL Slug */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#1D1D1F]">
                  Enlace público de reserva (Slug)
                </label>
                <div className="flex rounded-xl overflow-hidden border border-black/[0.08] bg-white focus-within:border-[#007AFF] focus-within:ring-2 focus-within:ring-[#007AFF]/10 transition-all">
                  <span className="bg-black/[0.03] px-3.5 py-2.5 text-xs font-medium text-[#86868B] select-none flex items-center border-r border-black/[0.06]">
                    myappointment.app/
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="alex-henderson"
                    value={profileSlug}
                    onChange={(e) => setProfileSlug(e.target.value)}
                    className="flex-1 bg-transparent px-3.5 py-2.5 text-xs font-medium text-[#1D1D1F] outline-hidden border-0"
                  />
                </div>
                <p className="text-[11px] text-[#86868B]">
                  Tus pacientes utilizarán este enlace único para ver tus servicios y agendar sus citas.
                </p>
              </div>

              {/* Bio */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#1D1D1F]">
                  Descripción profesional / Biografía
                </label>
                <textarea
                  rows={3}
                  placeholder={
                    rubro === "PSICOLOGIA"
                      ? "Especialista en psicología clínica, terapia cognitivo conductual, manejo de ansiedad y crecimiento personal..."
                      : "Describe brevemente tu especialidad, años de experiencia o enfoque de atención..."
                  }
                  value={profileBio}
                  onChange={(e) => setProfileBio(e.target.value)}
                  className="w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 text-xs font-medium text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-hidden focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/10 transition-all resize-none"
                />
              </div>
            </div>

            {/* CARD 3: MODALIDAD Y CONTACTO */}
            <div className="rounded-2xl border border-black/[0.06] bg-white p-5 sm:p-6 space-y-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#86868B]">
                Modalidad de Atención & Contacto
              </h4>

              {/* Modality Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-[#1D1D1F]">
                  ¿Cómo atiendes a tus pacientes / clientes?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setProfileModality("ONLINE")}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                      profileModality === "ONLINE"
                        ? "border-[#007AFF] bg-[#007AFF]/5 text-[#007AFF] ring-1 ring-[#007AFF]"
                        : "border-black/[0.08] hover:bg-black/[0.02] text-[#1D1D1F]"
                    }`}
                  >
                    <Video className="w-4 h-4 shrink-0" />
                    <div>
                      <div className="text-xs font-semibold">100% En Línea</div>
                      <div className="text-[10px] text-[#86868B]">Google Meet / Zoom</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setProfileModality("IN_PERSON")}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                      profileModality === "IN_PERSON"
                        ? "border-[#007AFF] bg-[#007AFF]/5 text-[#007AFF] ring-1 ring-[#007AFF]"
                        : "border-black/[0.08] hover:bg-black/[0.02] text-[#1D1D1F]"
                    }`}
                  >
                    <Building className="w-4 h-4 shrink-0" />
                    <div>
                      <div className="text-xs font-semibold">Presencial</div>
                      <div className="text-[10px] text-[#86868B]">Consultorio o Local</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setProfileModality("BOTH")}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                      profileModality === "BOTH"
                        ? "border-[#007AFF] bg-[#007AFF]/5 text-[#007AFF] ring-1 ring-[#007AFF]"
                        : "border-black/[0.08] hover:bg-black/[0.02] text-[#1D1D1F]"
                    }`}
                  >
                    <RefreshCw className="w-4 h-4 shrink-0" />
                    <div>
                      <div className="text-xs font-semibold">Híbrida</div>
                      <div className="text-[10px] text-[#86868B]">Ambas opciones</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Phone & Location Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#1D1D1F] flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-[#007AFF]" />
                    <span>Teléfono / WhatsApp de Contacto</span>
                  </label>
                  <input
                    type="text"
                    placeholder="+503 7000-0000"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    className="w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 text-xs font-medium text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-hidden focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/10 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#1D1D1F] flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#007AFF]" />
                    <span>Ciudad / Dirección del Consultorio</span>
                  </label>
                  <input
                    type="text"
                    placeholder="San Salvador, El Salvador"
                    value={profileLocation}
                    onChange={(e) => setProfileLocation(e.target.value)}
                    className="w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 text-xs font-medium text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-hidden focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/10 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* CARD 4: BRAND COLOR & THEME */}
            <div className="rounded-2xl border border-black/[0.06] bg-white p-5 sm:p-6 space-y-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#86868B]">
                    Color de Acento / Marca
                  </h4>
                  <p className="text-xs text-[#86868B] mt-0.5">
                    Este color iluminará los botones de reserva, selector de horarios y detalles en tu portal.
                  </p>
                </div>
                <div
                  className="w-6 h-6 rounded-full border border-black/[0.1] shadow-xs shrink-0"
                  style={{ backgroundColor: profileThemeColor }}
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                {BRAND_COLORS.map((color) => {
                  const isSelected = profileThemeColor.toLowerCase() === color.hex.toLowerCase();
                  return (
                    <button
                      key={color.hex}
                      type="button"
                      onClick={() => setProfileThemeColor(color.hex)}
                      className={`group flex items-center gap-2 px-3 py-2 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? "border-black/[0.2] bg-[#F5F5F7] shadow-xs ring-1 ring-black/[0.1]"
                          : "border-black/[0.06] hover:bg-black/[0.02]"
                      }`}
                    >
                      <span
                        className="w-4 h-4 rounded-full shrink-0 flex items-center justify-center shadow-xs"
                        style={{ backgroundColor: color.hex }}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                      </span>
                      <span className="text-xs font-medium text-[#1D1D1F]">{color.name}</span>
                    </button>
                  );
                })}

                {/* Custom Color Input */}
                <div className="flex items-center gap-2 pl-2 border-l border-black/[0.08]">
                  <input
                    type="color"
                    value={profileThemeColor}
                    onChange={(e) => setProfileThemeColor(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer border border-black/[0.1] bg-transparent"
                    title="Seleccionar color personalizado"
                  />
                  <span className="text-[11px] font-mono text-[#86868B]">{profileThemeColor}</span>
                </div>
              </div>
            </div>

            {/* CARD 5: LIVE STUDIO PREVIEW */}
            <div className="rounded-2xl border border-black/[0.06] bg-[#F5F5F7] p-5 sm:p-6 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-[#007AFF]" />
                  <h4 className="text-xs font-semibold text-[#1D1D1F]">
                    Vista Previa en Vivo de tu Encabezado Público
                  </h4>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#34C759]/10 text-[#34C759]">
                  EN TIEMPO REAL
                </span>
              </div>

              {/* Miniature Portal Card */}
              <div className="rounded-2xl border border-black/[0.08] bg-white overflow-hidden shadow-sm">
                <div
                  className="h-28 sm:h-32 w-full relative"
                  style={{
                    background: profileCoverUrl?.startsWith("data:") || profileCoverUrl?.startsWith("http")
                      ? `url('${profileCoverUrl}') center/cover no-repeat`
                      : profileCoverUrl || COVER_PRESETS[0].gradient,
                  }}
                />
                <div className="p-4 sm:p-5 pt-0 relative bg-white">
                  <div className="flex items-end justify-between -mt-10 sm:-mt-12 mb-3">
                    <img
                      src={
                        profileAvatarUrl ||
                        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256"
                      }
                      alt="Preview Avatar"
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-white shadow-md object-cover bg-white"
                    />
                    <span
                      className="text-xs font-semibold text-white px-3 py-1.5 rounded-xl shadow-xs"
                      style={{ backgroundColor: profileThemeColor }}
                    >
                      Agendar Cita
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h5 className="text-sm font-bold text-[#1D1D1F]">
                        {profileName || "Nombre de tu Consultorio"}
                      </h5>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#007AFF]/10 text-[#007AFF]">
                        {profileModality === "ONLINE"
                          ? "🌐 En Línea"
                          : profileModality === "IN_PERSON"
                          ? "🏥 Presencial"
                          : "🔄 Híbrida"}
                      </span>
                    </div>
                    <p className="text-xs text-[#86868B] line-clamp-2">
                      {profileBio || "Escribe tu biografía o resumen para que aparezca aquí..."}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] text-[#86868B]">
                      {profileLocation && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#1D1D1F]" />
                          {profileLocation}
                        </span>
                      )}
                      {profilePhone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-[#1D1D1F]" />
                          {profilePhone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 6: REGIONAL & CURRENCY INSET CARD */}
            <div className="p-4 rounded-2xl border border-black/[0.06] bg-[#F5F5F7]/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl select-none">
                  {(getPresetByCode(selectedCountryCode) || defaultPreset).flag}
                </span>
                <div>
                  <h4 className="text-xs font-semibold text-[#1D1D1F] flex items-center gap-1.5">
                    <span>Región: {(getPresetByCode(selectedCountryCode) || defaultPreset).name}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-[#007AFF]/10 text-[#007AFF]">
                      {regionalCurrency} ({getCurrencySymbol(regionalCurrency)})
                    </span>
                  </h4>
                  <p className="text-[11px] text-[#86868B] mt-0.5">
                    Zona horaria: <span className="font-mono text-[#1D1D1F]">{profileTimezone}</span> ({(getPresetByCode(selectedCountryCode) || defaultPreset).gmt})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("regional")}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#007AFF] hover:underline cursor-pointer"
              >
                <span>Ajustar Moneda y Región</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Save Button */}
            <div className="pt-2 flex justify-start">
              <button
                type="submit"
                disabled={pending}
                className="rounded-xl bg-[#007AFF] hover:bg-[#0062cc] active:scale-[0.98] px-6 py-2.5 text-xs font-medium text-white shadow-xs transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
              >
                {pending ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Guardando Perfil y Marca...</span>
                  </>
                ) : (
                  <span>Guardar Cambios</span>
                )}
              </button>
            </div>
          </form>
        )}

        {/* REGIONAL & CURRENCY TAB */}
        {activeTab === "regional" && (
          <div className="space-y-6 animate-in fade-in-50 duration-200">
            {/* Header */}
            <div className="border-b border-black/[0.06] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-[#1D1D1F] flex items-center gap-2">
                  <span>Región, Moneda y Zona Horaria</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#007AFF]/10 text-[#007AFF]">
                    LATAM & Global
                  </span>
                </h3>
                <p className="mt-0.5 text-xs text-[#86868B]">
                  Configura tu país, la moneda para el cobro de citas y la zona horaria en la que atiendes a tus pacientes.
                </p>
              </div>

              {/* Botón de Auto-Detección */}
              <button
                type="button"
                onClick={handleAutoDetectLocation}
                disabled={isDetectingLocation || pending}
                className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-[#007AFF]/10 hover:bg-[#007AFF]/15 active:scale-[0.97] text-[#007AFF] text-xs font-semibold transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Zap className={`h-3.5 w-3.5 ${isDetectingLocation ? "animate-spin text-[#007AFF]" : "text-[#007AFF]"}`} />
                <span>{isDetectingLocation ? "Detectando..." : "Detectar automáticamente"}</span>
              </button>
            </div>

            {/* Notification Badge if auto-detected */}
            {detectedNotification && (
              <div className="p-3.5 rounded-2xl bg-[#34C759]/10 border border-[#34C759]/20 flex items-center gap-2.5 text-xs font-semibold text-[#34C759] animate-in slide-in-from-top-2 duration-300">
                <Check className="h-4 w-4 shrink-0" />
                <span>{detectedNotification}</span>
              </div>
            )}

            {/* CARD 1: ESTADO ACTUAL HERO */}
            {(() => {
              const currentPreset = getPresetByCode(selectedCountryCode) || detectCountryPreset(regionalTimezone);
              const nowInTz = new Date().toLocaleTimeString("es-ES", {
                timeZone: regionalTimezone,
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              });

              return (
                <div className="p-5 rounded-2xl border border-black/[0.08] bg-gradient-to-br from-[#F5F5F7]/80 to-white shadow-xs">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="text-4xl select-none filter drop-shadow-xs">
                        {currentPreset.flag}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-[#1D1D1F]">
                            {currentPreset.name}
                          </h4>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/[0.05] text-[#1D1D1F]">
                            {currentPreset.gmt}
                          </span>
                        </div>
                        <p className="text-xs text-[#86868B] mt-0.5">
                          Moneda de cobro: <strong className="text-[#1D1D1F]">{regionalCurrency} ({getCurrencySymbol(regionalCurrency)})</strong> • Zona: <span className="font-mono text-[11px] text-[#1D1D1F]">{regionalTimezone}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end gap-1 px-3 py-1.5 sm:px-0 sm:py-0 bg-white sm:bg-transparent rounded-xl border border-black/[0.04] sm:border-0">
                      <div className="flex items-center gap-1.5 text-xs text-[#86868B]">
                        <Clock className="h-3.5 w-3.5 text-[#007AFF]" />
                        <span>Hora del negocio:</span>
                      </div>
                      <span className="text-sm font-bold text-[#1D1D1F] font-mono">
                        {nowInTz}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* CARD 2: PRESETS RÁPIDOS DE PAÍSES */}
            <div className="p-5 rounded-2xl border border-black/[0.06] bg-[#F5F5F7]/50 space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#1D1D1F] flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-[#007AFF]" />
                    <span>Selección Rápida de País / Región</span>
                  </h4>
                  <p className="text-[11px] text-[#86868B] mt-0.5">
                    Haz clic en tu país para sincronizar al instante zona horaria, moneda y formato telefónico:
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 pt-1">
                {COUNTRY_PRESETS.map((preset) => {
                  const isSelected = selectedCountryCode === preset.code;
                  return (
                    <button
                      key={preset.code}
                      type="button"
                      onClick={() => handleSelectCountryPreset(preset)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer active:scale-[0.97] flex flex-col justify-between gap-1.5 ${
                        isSelected
                          ? "border-[#007AFF] bg-white shadow-sm ring-2 ring-[#007AFF]/15"
                          : "border-black/[0.06] bg-white/70 hover:bg-white hover:border-black/[0.12]"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xl select-none">{preset.flag}</span>
                        {isSelected ? (
                          <div className="h-4 w-4 rounded-full bg-[#007AFF] text-white flex items-center justify-center">
                            <Check className="h-2.5 w-2.5 stroke-[3]" />
                          </div>
                        ) : (
                          <span className="text-[10px] font-mono text-[#86868B]">{preset.gmt}</span>
                        )}
                      </div>
                      <div>
                        <p className={`text-xs font-semibold leading-tight ${isSelected ? "text-[#007AFF]" : "text-[#1D1D1F]"}`}>
                          {preset.name}
                        </p>
                        <p className="text-[10px] text-[#86868B] font-medium mt-0.5">
                          {preset.currency} • {preset.phonePrefix}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CARD 3: AJUSTES GRANULARES INDEPENDIENTES */}
            <div className="p-5 rounded-2xl border border-black/[0.06] bg-white space-y-4 shadow-xs">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#1D1D1F] flex items-center gap-1.5">
                  <Sliders className="h-3.5 w-3.5 text-[#007AFF]" />
                  <span>Ajustes Granulares de Moneda y Zona Horaria</span>
                </h4>
                <p className="text-[11px] text-[#86868B] mt-0.5">
                  Puedes personalizar independientemente la moneda en la que cobras tus sesiones y la zona horaria de tu calendario.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {/* Moneda Principal */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#1D1D1F]">
                    Moneda de Cobro Principal
                  </label>
                  <select
                    value={regionalCurrency}
                    onChange={(e) => setRegionalCurrency(e.target.value)}
                    className="w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 text-xs font-medium text-[#1D1D1F] focus:outline-hidden focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/10 transition-all cursor-pointer shadow-2xs"
                  >
                    {SUPPORTED_CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Zona Horaria */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#1D1D1F]">
                    Zona Horaria del Negocio
                  </label>
                  <select
                    value={regionalTimezone}
                    onChange={(e) => {
                      setRegionalTimezone(e.target.value);
                      const matched = detectCountryPreset(e.target.value);
                      setSelectedCountryCode(matched.code);
                    }}
                    className="w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 text-xs font-medium text-[#1D1D1F] focus:outline-hidden focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/10 transition-all cursor-pointer shadow-2xs"
                  >
                    {SUPPORTED_TIMEZONES.map((tz) => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sincronizar servicios existentes */}
              <div className="pt-2 border-t border-black/[0.04]">
                <label className="flex items-start gap-3 cursor-pointer select-none group">
                  <input
                    type="checkbox"
                    checked={updateServicesCurrency}
                    onChange={(e) => setUpdateServicesCurrency(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded-md border-black/[0.15] text-[#007AFF] focus:ring-[#007AFF]/20 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-semibold text-[#1D1D1F] group-hover:text-[#007AFF] transition-colors">
                      Actualizar automáticamente la moneda de mis servicios existentes
                    </span>
                    <p className="text-[11px] text-[#86868B] mt-0.5">
                      Al guardar, todos los servicios activos en tu catálogo cambiarán a cobrar en <strong className="text-[#1D1D1F]">{regionalCurrency}</strong>.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* CARD 4: VISTA PREVIA EN VIVO */}
            <div className="p-4 rounded-2xl border border-black/[0.06] bg-[#F5F5F7]/60 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#86868B]">
                Vista previa de cómo lo verán tus pacientes
              </span>
              <div className="p-3.5 rounded-xl bg-white border border-black/[0.06] shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center font-bold text-sm">
                    {getCurrencySymbol(regionalCurrency)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#1D1D1F]">
                      Consulta Psicológica / Sesión Individual
                    </p>
                    <p className="text-[11px] text-[#86868B]">
                      50 min • Horario local paciente sincronizado
                    </p>
                  </div>
                </div>
                <div className="text-right sm:self-center">
                  <span className="text-sm font-extrabold text-[#34C759]">
                    {formatMoney(50, regionalCurrency)}
                  </span>
                  <p className="text-[10px] font-medium text-[#86868B]">
                    Hora {regionalTimezone.split("/")[1]?.replace("_", " ") || "local"}
                  </p>
                </div>
              </div>
            </div>

            {/* BOTÓN GUARDAR */}
            <div className="pt-2 flex justify-start">
              <button
                type="button"
                onClick={handleSaveRegional}
                disabled={pending}
                className="rounded-xl bg-[#007AFF] hover:bg-[#0062cc] active:scale-[0.98] px-6 py-2.5 text-xs font-semibold text-white shadow-xs transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
              >
                {pending ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Guardando cambios...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>Guardar Configuración Regional</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* SCHEDULE TAB */}
        {activeTab === "schedule" && (
          <div className="space-y-6">
            <div className="border-b border-black/[0.06] pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="text-lg font-semibold text-[#1D1D1F]">
                  Horarios de Atención
                </h3>
                <p className="mt-0.5 text-xs text-[#86868B]">
                  Define tus horas laborables habituales para recibir citas.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("regional")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-black/[0.08] bg-white hover:bg-black/[0.03] active:scale-[0.98] text-xs font-medium text-[#1D1D1F] shadow-2xs transition-all cursor-pointer"
                  title="Configurar zona horaria y moneda"
                >
                  <Globe className="h-3.5 w-3.5 text-[#007AFF]" />
                  <span>{(getPresetByCode(selectedCountryCode) || defaultPreset).flag}</span>
                  <span className="font-mono text-[11px] text-[#86868B]">{profileTimezone}</span>
                  <ChevronRight className="h-3 w-3 text-[#86868B]" />
                </button>
              </div>
            </div>

            {/* List of working days */}
            <div className="space-y-3 pt-1">
              {WEEK_DAYS.map((day) => {
                const schedule = getDaySchedule(hours, day);
                const enabled = schedule.slots.length > 0;

                return (
                  <div
                    key={day}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border transition-all ${
                      enabled
                        ? "border-black/[0.08] bg-white shadow-xs"
                        : "border-black/[0.04] bg-black/[0.015] opacity-70"
                    }`}
                  >
                    {/* Toggle and Day Label */}
                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        onClick={() => {
                          if (enabled) updateDay(day, []);
                          else addSlot(day);
                        }}
                        type="button"
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus:outline-hidden ${
                          enabled ? "bg-[#34C759]" : "bg-black/[0.12]"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out mt-0.5 ${
                            enabled ? "translate-x-4.5" : "translate-x-0.5"
                          }`}
                        />
                      </button>
                      <span className="text-xs font-medium text-[#1D1D1F] min-w-[90px]">
                        {DAY_LABELS[day]}
                      </span>
                    </div>

                    {/* Time slots controls */}
                    <div className="flex-1 flex flex-col gap-2">
                      {enabled ? (
                        schedule.slots.map((slot, index) => {
                          const isSlotInvalid = slot.close <= slot.open;
                          return (
                            <div key={index} className="flex items-center gap-2">
                              <div className="flex items-center gap-2">
                                <select
                                  value={slot.open}
                                  onChange={(e) =>
                                    updateSlot(day, index, "open", e.target.value)
                                  }
                                  className="rounded-lg border border-black/[0.08] bg-white px-2.5 py-1.5 text-xs font-medium text-[#1D1D1F] cursor-pointer focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]/10 focus:outline-hidden"
                                >
                                  {TIME_OPTIONS.map((t) => (
                                    <option key={`open-${t}`} value={t}>
                                      {to12h(t)}
                                    </option>
                                  ))}
                                </select>
                                
                                <span className="text-xs text-[#86868B]">a</span>
                                
                                <select
                                  value={slot.close}
                                  onChange={(e) =>
                                    updateSlot(day, index, "close", e.target.value)
                                  }
                                  className="rounded-lg border border-black/[0.08] bg-white px-2.5 py-1.5 text-xs font-medium text-[#1D1D1F] cursor-pointer focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]/10 focus:outline-hidden"
                                >
                                  {TIME_OPTIONS.map((t) => (
                                    <option key={`close-${t}`} value={t}>
                                      {to12h(t)}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <button
                                type="button"
                                onClick={() => removeSlot(day, index)}
                                className="h-6 w-6 inline-flex items-center justify-center rounded-md text-[#86868B] hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 transition-all cursor-pointer text-xs"
                              >
                                ✕
                              </button>

                              {isSlotInvalid && (
                                <span className="text-[10px] font-medium text-[#FF3B30] bg-[#FF3B30]/10 px-2 py-0.5 rounded-md">
                                  Horario inválido
                                </span>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <span className="text-xs text-[#86868B] italic">Cerrado</span>
                      )}
                    </div>

                    {/* Add Slot Button */}
                    {enabled && (
                      <button
                        onClick={() => addSlot(day)}
                        type="button"
                        className="text-xs font-medium text-[#007AFF] hover:underline shrink-0"
                      >
                        + Agregar tramo
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-t border-black/[0.06] pt-4">
              <button
                onClick={() => {
                  const closed = WEEK_DAYS.find((d) => getDaySchedule(hours, d).slots.length === 0);
                  if (closed !== undefined) {
                    addSlot(closed);
                  }
                }}
                type="button"
                className="text-xs font-medium text-[#007AFF] hover:underline flex items-center gap-1 self-start cursor-pointer"
              >
                <span>+ Habilitar otro día</span>
              </button>

              <button
                onClick={handleSaveSchedule}
                disabled={pending || hasAnyValidationError}
                type="button"
                className="rounded-xl bg-[#007AFF] hover:bg-[#0062cc] active:scale-[0.98] px-5 py-2.5 text-xs font-medium text-white shadow-xs transition-all disabled:opacity-50 cursor-pointer self-end"
              >
                {pending ? "Guardando..." : "Guardar Cambios"}
              </button>
            </div>
          </div>
        )}

        {/* NOTIFICATIONS TAB */}
        {activeTab === "notifications" && (
          <form onSubmit={handleSaveNotifications} className="space-y-6">
            <div className="border-b border-black/[0.06] pb-4">
              <h3 className="text-lg font-semibold text-[#1D1D1F]">
                Notificaciones
              </h3>
              <p className="mt-0.5 text-xs text-[#86868B]">
                Configura los canales y alertas automáticas para tu negocio.
              </p>
            </div>

            <div className="space-y-3 pt-1">
              {/* Email notifications */}
              <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-black/[0.06] bg-white shadow-xs">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-medium text-[#1D1D1F]">
                    Notificaciones por Correo Electrónico
                  </h4>
                  <p className="text-[11px] text-[#86868B] leading-relaxed">
                    Recibe correos electrónicos sobre nuevas reservas, cancelaciones o reprogramaciones.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setNotifEmail(!notifEmail)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus:outline-hidden ${
                    notifEmail ? "bg-[#34C759]" : "bg-black/[0.12]"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out mt-0.5 ${
                      notifEmail ? "translate-x-4.5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              {/* WhatsApp notifications */}
              <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-black/[0.06] bg-white shadow-xs">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-medium text-[#1D1D1F]">
                    Notificaciones por WhatsApp
                  </h4>
                  <p className="text-[11px] text-[#86868B] leading-relaxed">
                    Enviar confirmaciones y recordatorios por WhatsApp automáticos a los teléfonos de tus clientes.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setNotifWhatsApp(!notifWhatsApp)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus:outline-hidden ${
                    notifWhatsApp ? "bg-[#34C759]" : "bg-black/[0.12]"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out mt-0.5 ${
                      notifWhatsApp ? "translate-x-4.5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              {/* Daily summaries */}
              <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-black/[0.06] bg-white shadow-xs">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-medium text-[#1D1D1F]">
                    Resumen Diario matutino
                  </h4>
                  <p className="text-[11px] text-[#86868B] leading-relaxed">
                    Recibe un correo de resumen cada mañana con la agenda de citas programadas para el día.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setNotifDaily(!notifDaily)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus:outline-hidden ${
                    notifDaily ? "bg-[#34C759]" : "bg-black/[0.12]"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out mt-0.5 ${
                      notifDaily ? "translate-x-4.5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-black/[0.06] flex justify-end">
              <button
                type="submit"
                disabled={pending}
                className="rounded-xl bg-[#007AFF] hover:bg-[#0062cc] active:scale-[0.98] px-5 py-2.5 text-xs font-medium text-white shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                {pending ? "Guardando..." : "Guardar Preferencias"}
              </button>
            </div>
          </form>
        )}

        {/* INTEGRATIONS TAB */}
        {activeTab === "integrations" && (
          <div className="space-y-6">
            <div className="border-b border-black/[0.06] pb-4">
              <h3 className="text-lg font-semibold text-[#1D1D1F]">
                Integraciones
              </h3>
              <p className="mt-0.5 text-xs text-[#86868B]">
                Conecta herramientas externas para sincronizar citas y automatizar recordatorios.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {/* Google Calendar Card */}
              <div className="p-5 rounded-2xl border border-black/[0.06] bg-white flex flex-col justify-between min-h-[180px] shadow-xs">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#007AFF]/10 text-[#007AFF] shrink-0">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7v-5z"/>
                    </svg>
                  </div>
                  <div className="space-y-1 flex-1 min-w-0">
                    <h4 className="text-xs font-medium text-[#1D1D1F]">
                      Google Calendar
                    </h4>
                    <p className="text-[11px] text-[#86868B] leading-relaxed">
                      Sincroniza tus reservas automáticamente
                    </p>
                    <div className="pt-0.5">
                      {googleConnected ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#34C759]/10 px-2 py-0.5 text-[10px] font-medium text-[#34C759]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#34C759]"></span>
                          <span>CONECTADO</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-black/[0.04] px-2 py-0.5 text-[10px] font-medium text-[#86868B]">
                          DESCONECTADO
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="pt-3 flex items-center justify-end">
                  {googleConnected ? (
                    <button
                      onClick={handleDisconnectGoogle}
                      disabled={pending}
                      className="text-xs font-medium text-[#FF3B30] hover:underline cursor-pointer"
                    >
                      Desconectar
                    </button>
                  ) : (
                    <button
                      onClick={handleConnectGoogle}
                      disabled={pending}
                      className="text-xs font-medium text-[#007AFF] hover:underline cursor-pointer"
                    >
                      Conectar Cuenta
                    </button>
                  )}
                </div>
              </div>

              {/* WhatsApp Integration Card */}
              <div className="p-5 rounded-2xl border border-black/[0.06] bg-white flex flex-col justify-between min-h-[180px] shadow-xs">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#34C759]/10 text-[#34C759] shrink-0">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 001.37 5.054L2 22l5.077-1.331a9.907 9.907 0 004.93 1.306h.004c5.507 0 9.99-4.478 9.99-9.986 0-2.67-1.037-5.178-2.923-7.065C17.197 3.037 14.686 2 12.012 2zm5.726 14.127c-.246.696-1.427 1.285-1.961 1.344-.486.053-.984.095-3.136-.773-2.753-1.111-4.509-3.905-4.646-4.09-.138-.184-1.12-1.488-1.12-2.839 0-1.35.707-2.014.953-2.28.246-.265.541-.332.721-.332.18 0 .361.001.517.008.163.007.382-.062.597.457.22.533.75 1.83.815 1.962.065.132.109.286.022.459-.087.172-.131.28-.262.433-.131.152-.275.339-.393.455-.131.129-.268.27-.116.533.152.263.676 1.116 1.45 1.808.998.892 1.838 1.168 2.099 1.298.262.13.414.108.567-.068.152-.176.656-.762.831-1.022.175-.26.35-.217.59-.13.24.086 1.528.72 1.791.85.263.13.437.196.502.308.066.113.066.654-.18 1.35z"/>
                    </svg>
                  </div>
                  <div className="space-y-1 flex-1 min-w-0">
                    <h4 className="text-xs font-medium text-[#1D1D1F]">
                      WhatsApp Reminders
                    </h4>
                    <p className="text-[11px] text-[#86868B] leading-relaxed">
                      Recordatorios automáticos a clientes
                    </p>
                    <div className="pt-0.5">
                      {enableWhatsApp ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#34C759]/10 px-2 py-0.5 text-[10px] font-medium text-[#34C759]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#34C759]"></span>
                          <span>ACTIVO</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-black/[0.04] px-2 py-0.5 text-[10px] font-medium text-[#86868B]">
                          INACTIVO
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {enableWhatsApp && (
                  <div className="mt-3 p-3 rounded-xl bg-black/[0.02] border border-black/[0.06] space-y-2">
                    <label className="block text-[10px] font-medium text-[#86868B] uppercase tracking-wider">
                      Número de WhatsApp de Contacto *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="tel"
                        placeholder="+52 55 1234 5678"
                        value={whatsappNumber}
                        onChange={(e) => setWhatsappNumber(e.target.value)}
                        className="flex-1 rounded-xl border border-black/[0.08] bg-white px-3 py-1.5 text-xs font-medium text-[#1D1D1F] focus:outline-hidden focus:border-[#007AFF]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          startTransition(async () => {
                            const res = await saveIntegrationSettings({
                              enableWhatsApp: true,
                              whatsappNumber: whatsappNumber.trim() || null,
                            });
                            if (res?.error) {
                              setMessage({ text: res.error, type: "error" });
                            } else {
                              setMessage({ text: "Número de WhatsApp guardado con éxito.", type: "success" });
                            }
                          });
                        }}
                        className="rounded-xl bg-[#007AFF] hover:bg-[#0062cc] px-3.5 py-1.5 text-xs font-medium text-white shadow-xs transition-all cursor-pointer"
                      >
                        Guardar
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="pt-3 flex items-center justify-end border-t border-black/[0.04] mt-3">
                  <button
                    onClick={handleToggleWhatsApp}
                    disabled={pending}
                    className="text-xs font-medium text-[#007AFF] hover:underline cursor-pointer"
                  >
                    {enableWhatsApp ? "Desactivar" : "Activar"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PLAN & BILLING TAB */}
        {activeTab === "plan" && (
          <div className="space-y-6">
            <div className="border-b border-black/[0.06] pb-4">
              <h3 className="text-lg font-semibold text-[#1D1D1F]">
                Plan & Facturación
              </h3>
              <p className="mt-0.5 text-xs text-[#86868B]">
                Administra tus suscripciones y métodos de facturación a través de Wompi El Salvador.
              </p>
            </div>

            {/* DEV SANDBOX CARD */}
            {isMockMode && (
              <div className="p-5 rounded-2xl border border-dashed border-[#FF9500] bg-[#FF9500]/5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FF9500] text-white font-medium text-base shrink-0">
                    🧪
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-[#1D1D1F]">
                      Wompi Developer Sandbox
                    </h4>
                    <p className="text-[11px] text-[#86868B] leading-normal">
                      Entorno de pruebas local detectado. Simula transacciones aprobadas o cancelaciones de la pasarela para actualizar instantáneamente la base de datos de desarrollo.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                  <button
                    disabled={pendingDev}
                    onClick={() => handleSimulatePayment("PRO")}
                    className="flex-1 text-center rounded-xl bg-[#FF9500] hover:bg-[#e68600] active:scale-[0.98] py-2 text-xs font-medium text-white shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    {pendingDev ? "Procesando..." : "Simular Pago APROBADO (PRO)"}
                  </button>
                  <button
                    disabled={pendingDev}
                    onClick={() => handleSimulatePayment("FREE")}
                    className="flex-1 text-center rounded-xl border border-black/[0.08] bg-white hover:bg-black/[0.03] active:scale-[0.98] text-[#1D1D1F] py-2 text-xs font-medium transition-all cursor-pointer disabled:opacity-50"
                  >
                    {pendingDev ? "Procesando..." : "Simular Pago RECHAZADO / FREE"}
                  </button>
                </div>
              </div>
            )}

            {/* Plan Info Card */}
            <div className="p-5 rounded-2xl border border-black/[0.06] bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#007AFF]/10 text-[#007AFF] shrink-0">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-[#1D1D1F]">
                      {planTier === "PRO" ? "Plan PRO Activo 🏅" : "Plan Gratuito (FREE)"}
                    </h4>
                    <span className="rounded-full bg-[#007AFF] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white">
                      ACTIVO
                    </span>
                  </div>
                  <p className="text-xs text-[#86868B]">
                    {planTier === "PRO"
                      ? "$15.00 USD cobrado mensualmente por Wompi."
                      : "Gratuito con limitaciones en citas, sedes, especialistas y características premium."}
                  </p>
                </div>
              </div>
              
              {planTier === "PRO" ? (
                <div className="text-xs font-medium text-[#34C759] bg-[#34C759]/10 border border-[#34C759]/20 px-3.5 py-2 rounded-xl shrink-0">
                  ✓ Beneficios PRO Habilitados
                </div>
              ) : (
                <button
                  disabled={loadingCheckout}
                  onClick={() => handleWompiUpgrade(15)}
                  className="rounded-xl bg-[#007AFF] hover:bg-[#0062cc] active:scale-[0.98] text-white px-5 py-2.5 text-xs font-medium transition-all shrink-0 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {loadingCheckout ? "Generando Enlace Wompi..." : "Actualizar a PRO ($15 USD/mes)"}
                </button>
              )}
            </div>

            {/* Features comparison table */}
            <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-xs">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-black/[0.06] bg-black/[0.01] text-[11px] font-medium uppercase tracking-wider text-[#86868B]">
                    <th className="px-6 py-3.5">Características</th>
                    <th className="px-6 py-3.5 text-center">Plan FREE</th>
                    <th className="px-6 py-3.5 text-center text-[#007AFF]">Plan PRO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.04] text-[#1D1D1F]">
                  <tr>
                    <td className="px-6 py-3.5">Citas mensuales</td>
                    <td className="px-6 py-3.5 text-center text-[#86868B]">Hasta 30</td>
                    <td className="px-6 py-3.5 text-center text-[#34C759] font-medium">Ilimitadas</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-3.5">Directorio de clientes</td>
                    <td className="px-6 py-3.5 text-center text-[#86868B]">Hasta 50</td>
                    <td className="px-6 py-3.5 text-center text-[#34C759] font-medium">Ilimitados</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-3.5">Sedes y Consultorios</td>
                    <td className="px-6 py-3.5 text-center text-[#86868B]">Máximo 1</td>
                    <td className="px-6 py-3.5 text-center text-[#34C759] font-medium">Ilimitadas</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-3.5">Personal y Especialistas</td>
                    <td className="px-6 py-3.5 text-center text-[#86868B]">No disponible (0)</td>
                    <td className="px-6 py-3.5 text-center text-[#34C759] font-medium">Ilimitados</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-3.5">Sincronización con Google Calendar</td>
                    <td className="px-6 py-3.5 text-center text-[#FF3B30]">✕ No</td>
                    <td className="px-6 py-3.5 text-center text-[#34C759] font-medium">✓ Sí</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-3.5">Remover Marca de Agua</td>
                    <td className="px-6 py-3.5 text-center text-[#FF3B30]">✕ No</td>
                    <td className="px-6 py-3.5 text-center text-[#34C759] font-medium">✓ Sí</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ACCOUNT TAB */}
        {activeTab === "account" && (
          <div className="space-y-6">
            {/* Password section */}
            <form onSubmit={handleUpdatePassword} className="space-y-5">
              <div className="border-b border-black/[0.06] pb-4">
                <h3 className="text-lg font-semibold text-[#1D1D1F]">
                  Seguridad de la Cuenta
                </h3>
                <p className="mt-0.5 text-xs text-[#86868B]">
                  Protege tu cuenta actualizando tus credenciales de acceso.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#1D1D1F]">
                    Nueva Contraseña
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Mínimo 6 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 text-xs font-medium text-[#1D1D1F] focus:outline-hidden focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/10 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#1D1D1F]">
                    Confirmar Contraseña
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Repite la contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 text-xs font-medium text-[#1D1D1F] focus:outline-hidden focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/10 transition-all"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-xl bg-[#007AFF] hover:bg-[#0062cc] active:scale-[0.98] px-5 py-2.5 text-xs font-medium text-white shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  Actualizar Contraseña
                </button>
              </div>
            </form>

            {/* Delete account safety */}
            <div className="border-t border-black/[0.06] pt-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-medium text-[#FF3B30]">
                    Eliminar Cuenta
                  </h4>
                  <p className="text-[11px] text-[#86868B] leading-relaxed">
                    Elimina de forma permanente tu cuenta, citas y datos asociados.
                  </p>
                </div>
                <button
                  onClick={() => setIsDeleteConfirmOpen(true)}
                  type="button"
                  className="rounded-xl bg-[#FF3B30]/10 hover:bg-[#FF3B30]/15 text-[#FF3B30] active:scale-[0.98] px-4 py-2 text-xs font-medium transition-all cursor-pointer shrink-0"
                >
                  Eliminar Cuenta...
                </button>
              </div>
            </div>

            {/* DELETE ACCOUNT CONFIRM MODAL */}
            {isDeleteConfirmOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/40 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
                <div className="w-full max-w-md bg-white/95 backdrop-blur-2xl border border-black/[0.08] p-6 sm:p-7 shadow-[0_24px_60px_rgba(0,0,0,0.16)] rounded-[28px] space-y-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FF3B30]/10 text-[#FF3B30] text-lg font-bold">
                    ⚠️
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-[#1D1D1F]">
                      ¿Eliminar tu cuenta?
                    </h4>
                    <p className="mt-1.5 text-xs sm:text-sm text-[#86868B] leading-relaxed">
                      Esta acción es definitiva. Cerrarás la sesión y todos tus datos (citas, clientes y configuraciones) serán destruidos de forma irreversible.
                    </p>
                  </div>
                  <div className="flex justify-end gap-2.5 pt-2">
                    <button
                      onClick={() => setIsDeleteConfirmOpen(false)}
                      type="button"
                      className="rounded-xl border border-black/[0.08] bg-white px-4 py-2 text-xs font-medium text-[#1D1D1F] hover:bg-black/[0.03] active:scale-[0.98] transition-all cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleDeleteAccount}
                      disabled={pending}
                      className="rounded-xl bg-[#FF3B30] hover:bg-[#d9342b] active:scale-[0.98] px-5 py-2 text-xs font-medium text-white shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                    >
                      Eliminar Cuenta
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PAYMENTS TAB */}
        {activeTab === "payments" && (
          <form onSubmit={handleSavePayments} className="space-y-6">
            <div className="border-b border-black/[0.06] pb-4">
              <h3 className="text-lg font-semibold text-[#1D1D1F]">
                Métodos de Pago
              </h3>
              <p className="mt-0.5 text-xs text-[#86868B]">
                Configura los métodos de pago que aceptas para las sesiones de tus pacientes.
              </p>
            </div>

            {/* Toggle Accept Bank Transfer */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-black/[0.06] bg-white shadow-xs">
              <div className="space-y-0.5">
                <h4 className="text-xs font-medium text-[#1D1D1F]">
                  Aceptar Transferencia Bancaria Directa
                </h4>
                <p className="text-[11px] text-[#86868B]">
                  Permite a los pacientes reservar su sesión y realizar el pago mediante transferencia. Deberán subir su comprobante.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAcceptBankTransfer(!acceptBankTransfer)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus:outline-hidden ${
                  acceptBankTransfer ? "bg-[#34C759]" : "bg-black/[0.12]"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out mt-0.5 ${
                    acceptBankTransfer ? "translate-x-4.5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>

            {/* Bank Transfer Details Form fields (shown if active) */}
            {acceptBankTransfer && (
              <div className="space-y-4 p-5 rounded-xl border border-black/[0.06] bg-black/[0.015]">
                <h4 className="text-[11px] font-medium text-[#007AFF] uppercase tracking-wider">
                  Datos de Cuenta para Transferencias
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-[#1D1D1F]">
                      Nombre del Banco *
                    </label>
                    <input
                      type="text"
                      required={acceptBankTransfer}
                      placeholder="Ej. BBVA, Santander, Banco del Barrio"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 text-xs font-medium text-[#1D1D1F] focus:outline-hidden focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/10 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-[#1D1D1F]">
                      CLABE Interbancaria o Número de Cuenta *
                    </label>
                    <input
                      type="text"
                      required={acceptBankTransfer}
                      placeholder="Ej. 012 345 6789012345 6"
                      value={bankClabe}
                      onChange={(e) => setBankClabe(e.target.value)}
                      className="w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 text-xs font-medium text-[#1D1D1F] focus:outline-hidden focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/10 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#1D1D1F]">
                    Nombre del Titular de la Cuenta *
                  </label>
                  <input
                    type="text"
                    required={acceptBankTransfer}
                    placeholder="Ej. Dra. María García"
                    value={bankHolder}
                    onChange={(e) => setBankHolder(e.target.value)}
                    className="w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 text-xs font-medium text-[#1D1D1F] focus:outline-hidden focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/10 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#1D1D1F]">
                    Instrucciones Especiales para el Pago (Opcional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Ej. Favor de enviar el comprobante de transferencia al correo o número de WhatsApp antes de iniciar tu sesión."
                    value={bankInstructions}
                    onChange={(e) => setBankInstructions(e.target.value)}
                    className="w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 text-xs font-medium text-[#1D1D1F] focus:outline-hidden focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/10 transition-all resize-none"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSavingPayments}
                className="rounded-xl bg-[#007AFF] hover:bg-[#0062cc] active:scale-[0.98] px-5 py-2.5 text-xs font-medium text-white shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSavingPayments ? "Guardando..." : "Guardar Métodos de Pago"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

