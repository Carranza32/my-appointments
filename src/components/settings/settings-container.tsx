"use client";

import { useState, useTransition, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { googleOAuthOptions } from "@/lib/google-oauth";
import { disconnectGoogleCalendar } from "@/actions/google-calendar";
import {
  saveProfileSettings,
  saveWeeklyHours,
  saveIntegrationSettings,
} from "@/actions/settings";
import {
  DAY_LABELS,
  WEEK_DAYS,
  type DaySchedule,
  type TimeSlot,
  type WeeklyHours,
} from "@/types/business";

type Props = {
  initialName: string;
  initialSlug: string;
  initialAvatarUrl: string;
  initialDescription: string;
  initialTimezone: string;
  initialHours: WeeklyHours;
  googleConnected: boolean;
  googleLinkedAt?: string;
  initialEnableWhatsApp: boolean;
  planTier: "FREE" | "PRO";
};

const COMMON_TIMEZONES = [
  { value: "America/Mexico_City", label: "CDMX / México (GMT-6)" },
  { value: "America/Bogota", label: "Bogotá / Colombia (GMT-5)" },
  { value: "America/Lima", label: "Lima / Perú (GMT-5)" },
  { value: "America/Caracas", label: "Caracas / Venezuela (GMT-4)" },
  { value: "America/Santiago", label: "Santiago / Chile (GMT-4)" },
  { value: "America/Argentina/Buenos_Aires", label: "Buenos Aires / Argentina (GMT-3)" },
  { value: "Europe/Madrid", label: "Madrid / España (GMT+1)" },
  { value: "America/New_York", label: "Nueva York / EE.UU. (GMT-5)" },
];

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
  initialHours,
  googleConnected,
  googleLinkedAt,
  initialEnableWhatsApp,
  planTier,
}: Props) {
  const [activeTab, _setActiveTab] = useState<
    "profile" | "schedule" | "notifications" | "integrations" | "plan" | "account"
  >("profile");

  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams?.get("tab");

  // Sync tab from URL query parameter
  useEffect(() => {
    if (!tab) {
      _setActiveTab("profile");
    } else if (
      tab === "profile" ||
      tab === "schedule" ||
      tab === "notifications" ||
      tab === "integrations" ||
      tab === "plan" ||
      tab === "account"
    ) {
      _setActiveTab(tab);
    }
  }, [tab]);

  // Wrapper function to set local state and update search params reactively
  const setActiveTab = (newTab: "profile" | "schedule" | "notifications" | "integrations" | "plan" | "account") => {
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

  // Profile Form States
  const [profileName, setProfileName] = useState(initialName || "");
  const [profileSlug, setProfileSlug] = useState(initialSlug || "");
  const [profileBio, setProfileBio] = useState(initialDescription || "");
  const [profileAvatarUrl, setProfileAvatarUrl] = useState(initialAvatarUrl || "");
  const [profileTimezone, setProfileTimezone] = useState(initialTimezone || "America/Mexico_City");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileLocation, setProfileLocation] = useState("");

  // Load localStorage fields for Phone & Location
  useEffect(() => {
    if (typeof window !== "undefined") {
      setProfilePhone(localStorage.getItem("settings_phone") || "+1 (555) 000-0000");
      setProfileLocation(localStorage.getItem("settings_location") || "San Francisco, CA");
    }
  }, []);

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

  // Account settings state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

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
      });

      if (res?.error) {
        setMessage({ text: res.error, type: "error" });
      } else {
        setMessage({ text: "Perfil público guardado correctamente.", type: "success" });
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
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();
      if (error) {
        setMessage({ text: error.message, type: "error" });
      } else {
        // Redirect to homepage
        window.location.href = "/";
      }
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
    <div className="w-full flex flex-col md:flex-row items-start gap-8">
      {/* Toast Notification */}
      {message && (
        <div
          className={`fixed right-6 top-24 z-50 flex items-center gap-3 rounded-2xl border px-5 py-4 shadow-xl transition-all duration-300 backdrop-blur-md ${
            message.type === "success"
              ? "border-emerald-200/50 bg-white/95 text-emerald-800 dark:border-emerald-900/30 dark:bg-slate-900/95 dark:text-emerald-300"
              : "border-red-200/50 bg-white/95 text-red-750 dark:border-red-900/30 dark:bg-slate-900/95 dark:text-red-400"
          }`}
        >
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                message.type === "success" ? "bg-emerald-400" : "bg-red-400"
              }`}
            ></span>
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                message.type === "success" ? "bg-emerald-500" : "bg-red-500"
              }`}
            ></span>
          </span>
          <p className="text-xs font-bold leading-none">{message.text}</p>
        </div>
      )}

      {/* TABS SIDE NAVIGATION MENU */}
      <div className="w-full md:w-56 shrink-0 flex flex-col gap-1 select-none">
        <button
          onClick={() => setActiveTab("profile")}
          className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "profile"
              ? "bg-[#1A73E8]/8 text-[#1A73E8] dark:bg-blue-955/25 dark:text-blue-400"
              : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100/40 dark:hover:bg-slate-800/20"
          }`}
        >
          Profile
        </button>
        <button
          onClick={() => setActiveTab("schedule")}
          className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "schedule"
              ? "bg-[#1A73E8]/8 text-[#1A73E8] dark:bg-blue-955/25 dark:text-blue-400"
              : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100/40 dark:hover:bg-slate-800/20"
          }`}
        >
          Schedule
        </button>
        <button
          onClick={() => setActiveTab("notifications")}
          className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "notifications"
              ? "bg-[#1A73E8]/8 text-[#1A73E8] dark:bg-blue-955/25 dark:text-blue-400"
              : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100/40 dark:hover:bg-slate-800/20"
          }`}
        >
          Notifications
        </button>
        <button
          onClick={() => setActiveTab("integrations")}
          className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "integrations"
              ? "bg-[#1A73E8]/8 text-[#1A73E8] dark:bg-blue-955/25 dark:text-blue-400"
              : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100/40 dark:hover:bg-slate-800/20"
          }`}
        >
          Integrations
        </button>
        <button
          onClick={() => setActiveTab("plan")}
          className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "plan"
              ? "bg-[#1A73E8]/8 text-[#1A73E8] dark:bg-blue-955/25 dark:text-blue-400"
              : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100/40 dark:hover:bg-slate-800/20"
          }`}
        >
          Plan & Billing
        </button>
        <button
          onClick={() => setActiveTab("account")}
          className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "account"
              ? "bg-[#1A73E8]/8 text-[#1A73E8] dark:bg-blue-955/25 dark:text-blue-400"
              : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100/40 dark:hover:bg-slate-800/20"
          }`}
        >
          Account
        </button>
      </div>

      {/* CONTENT PANEL DISPLAY */}
      <div className="flex-1 min-w-0 w-full border border-slate-200/60 bg-white p-8 rounded-[32px] shadow-xs dark:border-white/5 dark:bg-slate-900/40 backdrop-blur-xl transition-all duration-300">
        
        {/* PROFILE TAB */}
        {activeTab === "profile" && (
          <form onSubmit={handleSaveProfile} className="space-y-6 animate-fade-in">
            <div className="border-b border-slate-100 dark:border-slate-800/60 pb-5">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-150">
                Public profile
              </h3>
            </div>

            {/* Profile Avatar and Name */}
            <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
              <div className="relative shrink-0">
                <img
                  src={
                    profileAvatarUrl ||
                    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256"
                  }
                  alt="Avatar"
                  className="w-24 h-24 rounded-full border border-slate-200/60 dark:border-slate-800 object-cover shadow-sm bg-slate-50"
                />
              </div>
              <div className="w-full space-y-1.5 flex-1">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Display name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Alex Henderson"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-[#fbf9f8]/40 px-4 py-3.5 text-sm font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-100 focus:outline-hidden focus:bg-white focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] transition-all shadow-inner"
                />
              </div>
            </div>

            {/* URL Slug */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                URL slug
              </label>
              <div className="flex rounded-xl overflow-hidden border border-slate-200 bg-[#fbf9f8]/40 dark:border-slate-800 dark:bg-slate-955/40 focus-within:bg-white focus-within:border-[#1A73E8] focus-within:ring-1 focus-within:ring-[#1A73E8] transition-all shadow-inner">
                <span className="bg-slate-100 dark:bg-slate-900 px-4 py-3.5 text-sm font-semibold text-slate-400 select-none flex items-center border-r border-slate-200 dark:border-slate-800">
                  schedulerpro.com/
                </span>
                <input
                  type="text"
                  required
                  placeholder="alex-h"
                  value={profileSlug}
                  onChange={(e) => setProfileSlug(e.target.value)}
                  className="flex-1 bg-transparent px-4 py-3.5 text-sm font-semibold text-slate-800 dark:text-slate-100 outline-hidden border-0"
                />
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                Bio
              </label>
              <textarea
                rows={4}
                placeholder="Experienced design consultant..."
                value={profileBio}
                onChange={(e) => setProfileBio(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-[#fbf9f8]/40 px-4 py-3.5 text-sm font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-955/40 dark:text-slate-100 focus:outline-hidden focus:bg-white focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] transition-all shadow-inner resize-none"
              />
            </div>

            {/* Grid for Phone & Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Phone
                </label>
                <input
                  type="text"
                  placeholder="+1 (555) 000-0000"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-[#fbf9f8]/40 px-4 py-3.5 text-sm font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-955/40 dark:text-slate-100 focus:outline-hidden focus:bg-white focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] transition-all shadow-inner"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Location
                </label>
                <input
                  type="text"
                  placeholder="San Francisco, CA"
                  value={profileLocation}
                  onChange={(e) => setProfileLocation(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-[#fbf9f8]/40 px-4 py-3.5 text-sm font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-955/40 dark:text-slate-100 focus:outline-hidden focus:bg-white focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] transition-all shadow-inner"
                />
              </div>
            </div>

            {/* Photo URL */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                Profile photo URL
              </label>
              <input
                type="url"
                placeholder="https://enlace-a-tu-foto.jpg"
                value={profileAvatarUrl}
                onChange={(e) => setProfileAvatarUrl(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-[#fbf9f8]/40 px-4 py-3.5 text-sm font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-955/40 dark:text-slate-100 focus:outline-hidden focus:bg-white focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] transition-all shadow-inner"
              />
            </div>

            {/* Timezone */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                Timezone
              </label>
              <select
                value={profileTimezone}
                onChange={(e) => setProfileTimezone(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-[#fbf9f8]/40 px-4 py-3.5 text-sm font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-955/40 dark:text-slate-100 focus:outline-hidden focus:bg-white focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] transition-all shadow-inner cursor-pointer"
              >
                {COMMON_TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-4 flex justify-start">
              <button
                type="submit"
                disabled={pending}
                className="rounded-full bg-[#1A73E8] px-6 py-3.5 text-xs font-bold text-white shadow-md shadow-blue-500/10 hover:bg-[#005bbf] transition-all disabled:opacity-50 cursor-pointer"
              >
                {pending ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        )}

        {/* SCHEDULE TAB */}
        {activeTab === "schedule" && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-slate-100 dark:border-slate-800/60 pb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-150">
                  Weekly schedule
                </h3>
                <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                  Set your standard working hours for appointments.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isTimezoneEditing ? (
                  <div className="flex items-center gap-1.5">
                    <select
                      value={profileTimezone}
                      onChange={(e) => setProfileTimezone(e.target.value)}
                      className="rounded-xl border border-slate-200 bg-white/95 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-955/40 dark:text-slate-100 cursor-pointer"
                    >
                      {COMMON_TIMEZONES.map((tz) => (
                        <option key={tz.value} value={tz.value}>
                          {tz.label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleSaveTimezone}
                      disabled={pending}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase transition-colors"
                    >
                      Ok
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsTimezoneEditing(true)}
                    className="text-xs font-semibold text-[#1A73E8] hover:underline cursor-pointer"
                  >
                    Edit Timezone
                  </button>
                )}
              </div>
            </div>

            {/* List of working days */}
            <div className="space-y-4 pt-2">
              {WEEK_DAYS.map((day) => {
                const schedule = getDaySchedule(hours, day);
                const enabled = schedule.slots.length > 0;

                return (
                  <div
                    key={day}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border transition-all duration-300 ${
                      enabled
                        ? "border-slate-200 bg-white dark:border-slate-800/80 dark:bg-slate-950/20"
                        : "border-slate-100 bg-slate-50/50 dark:border-slate-900/10 dark:bg-slate-900/5 opacity-70"
                    }`}
                  >
                    {/* Toggle and Day Label */}
                    <div className="flex items-center gap-4 shrink-0">
                      <button
                        onClick={() => {
                          if (enabled) updateDay(day, []);
                          else addSlot(day);
                        }}
                        type="button"
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                          enabled ? "bg-[#1A73E8]" : "bg-slate-200 dark:bg-slate-850"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                            enabled ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-100 min-w-[100px]">
                        {DAY_LABELS[day]}
                      </span>
                    </div>

                    {/* Time slots controls */}
                    <div className="flex-1 flex flex-col gap-3">
                      {enabled ? (
                        schedule.slots.map((slot, index) => {
                          const isSlotInvalid = slot.close <= slot.open;
                          return (
                            <div key={index} className="flex items-center gap-3">
                              <div className="flex items-center gap-2.5">
                                <select
                                  value={slot.open}
                                  onChange={(e) =>
                                    updateSlot(day, index, "open", e.target.value)
                                  }
                                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-850 dark:border-slate-800 dark:bg-slate-955/40 dark:text-slate-100 cursor-pointer shadow-sm focus:border-[#1A73E8] focus:outline-hidden"
                                >
                                  {TIME_OPTIONS.map((t) => (
                                    <option key={`open-${t}`} value={t} className="bg-white dark:bg-slate-900">
                                      {to12h(t)}
                                    </option>
                                  ))}
                                </select>
                                
                                <span className="text-xs font-semibold text-slate-400">to</span>
                                
                                <select
                                  value={slot.close}
                                  onChange={(e) =>
                                    updateSlot(day, index, "close", e.target.value)
                                  }
                                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-850 dark:border-slate-800 dark:bg-slate-955/40 dark:text-slate-100 cursor-pointer shadow-sm focus:border-[#1A73E8] focus:outline-hidden"
                                >
                                  {TIME_OPTIONS.map((t) => (
                                    <option key={`close-${t}`} value={t} className="bg-white dark:bg-slate-900">
                                      {to12h(t)}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <button
                                type="button"
                                onClick={() => removeSlot(day, index)}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-500/10 bg-red-500/5 text-red-650 hover:bg-red-500/15 transition-all cursor-pointer shadow-xs"
                              >
                                <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>

                              {isSlotInvalid && (
                                <span className="text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-50/50 px-2 py-0.5 rounded-md border border-red-500/10 animate-pulse">
                                  Invalid hours
                                </span>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <span className="text-xs font-semibold text-slate-400">Closed</span>
                      )}
                    </div>

                    {/* Add Slot Button */}
                    {enabled && (
                      <button
                        onClick={() => addSlot(day)}
                        type="button"
                        className="text-xs font-bold text-[#1A73E8] hover:underline shrink-0"
                      >
                        + Add slot
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add day shortcut or disabled day enabler */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800/60 pt-6">
              <button
                onClick={() => {
                  const closed = WEEK_DAYS.find((d) => getDaySchedule(hours, d).slots.length === 0);
                  if (closed !== undefined) {
                    addSlot(closed);
                  }
                }}
                type="button"
                className="text-xs font-bold text-[#1A73E8] hover:underline flex items-center gap-1.5 self-start"
              >
                <span>+ Add Day</span>
              </button>

              <button
                onClick={handleSaveSchedule}
                disabled={pending || hasAnyValidationError}
                type="button"
                className="rounded-full bg-[#1A73E8] px-6 py-3.5 text-xs font-bold text-white shadow-md shadow-blue-500/10 hover:bg-[#005bbf] transition-all disabled:opacity-50 cursor-pointer self-end"
              >
                {pending ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        )}

        {/* NOTIFICATIONS TAB */}
        {activeTab === "notifications" && (
          <form onSubmit={handleSaveNotifications} className="space-y-6 animate-fade-in">
            <div className="border-b border-slate-100 dark:border-slate-800/60 pb-5">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-150">
                Notifications
              </h3>
              <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                Configura los canales y alertas automáticas para tu negocio.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              {/* Email notifications */}
              <div className="flex items-center justify-between gap-4 p-5 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950/20">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-850 dark:text-slate-150">
                    Email notifications
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                    Recibe correos electrónicos sobre nuevas reservas, cancelaciones o reprogramaciones.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setNotifEmail(!notifEmail)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    notifEmail ? "bg-[#1A73E8]" : "bg-slate-200 dark:bg-slate-800"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                      notifEmail ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* WhatsApp notifications */}
              <div className="flex items-center justify-between gap-4 p-5 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-955/20">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-850 dark:text-slate-150">
                    WhatsApp notifications
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                    Enviar confirmaciones y recordatorios por WhatsApp automáticos a los teléfonos de tus clientes.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setNotifWhatsApp(!notifWhatsApp)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    notifWhatsApp ? "bg-[#1A73E8]" : "bg-slate-200 dark:bg-slate-800"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                      notifWhatsApp ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Daily summaries */}
              <div className="flex items-center justify-between gap-4 p-5 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950/20">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-850 dark:text-slate-150">
                    Daily summary
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                    Recibe un correo de resumen cada mañana con la agenda de citas programadas para el día.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setNotifDaily(!notifDaily)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    notifDaily ? "bg-[#1A73E8]" : "bg-slate-200 dark:bg-slate-800"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                      notifDaily ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-800/60 flex justify-end">
              <button
                type="submit"
                disabled={pending}
                className="rounded-full bg-[#1A73E8] px-6 py-3.5 text-xs font-bold text-white shadow-md shadow-blue-500/10 hover:bg-[#005bbf] transition-all disabled:opacity-50 cursor-pointer"
              >
                {pending ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        )}

        {/* INTEGRATIONS TAB */}
        {activeTab === "integrations" && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-slate-100 dark:border-slate-800/60 pb-5">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-150">
                Integrations
              </h3>
              <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                Conecta herramientas de terceros para automatizar tu flujo de trabajo.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Google Calendar Card */}
              <div className="p-6 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-955/20 flex flex-col justify-between min-h-[190px] shadow-xs">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-[#1A73E8] border border-blue-100 dark:border-blue-900/30 shrink-0">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7v-5z"/>
                    </svg>
                  </div>
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      Google Calendar
                    </h4>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
                      Sync your bookings instantly
                    </p>
                    <div className="pt-0.5">
                      {googleConnected ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span>CONNECTED</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                          <span>DISCONNECTED</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 flex items-center justify-end">
                  {googleConnected ? (
                    <button
                      onClick={handleDisconnectGoogle}
                      disabled={pending}
                      className="text-xs font-bold text-slate-450 hover:text-red-600 transition-colors cursor-pointer"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={handleConnectGoogle}
                      disabled={pending}
                      className="text-xs font-bold text-[#1A73E8] hover:underline cursor-pointer"
                    >
                      Connect
                    </button>
                  )}
                </div>
              </div>

              {/* WhatsApp Integration Card */}
              <div className="p-6 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-955/20 flex flex-col justify-between min-h-[190px] shadow-xs">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-955/20 text-[#25D366] border border-emerald-100 dark:border-emerald-900/30 shrink-0">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 001.37 5.054L2 22l5.077-1.331a9.907 9.907 0 004.93 1.306h.004c5.507 0 9.99-4.478 9.99-9.986 0-2.67-1.037-5.178-2.923-7.065C17.197 3.037 14.686 2 12.012 2zm5.726 14.127c-.246.696-1.427 1.285-1.961 1.344-.486.053-.984.095-3.136-.773-2.753-1.111-4.509-3.905-4.646-4.09-.138-.184-1.12-1.488-1.12-2.839 0-1.35.707-2.014.953-2.28.246-.265.541-.332.721-.332.18 0 .361.001.517.008.163.007.382-.062.597.457.22.533.75 1.83.815 1.962.065.132.109.286.022.459-.087.172-.131.28-.262.433-.131.152-.275.339-.393.455-.131.129-.268.27-.116.533.152.263.676 1.116 1.45 1.808.998.892 1.838 1.168 2.099 1.298.262.13.414.108.567-.068.152-.176.656-.762.831-1.022.175-.26.35-.217.59-.13.24.086 1.528.72 1.791.85.263.13.437.196.502.308.066.113.066.654-.18 1.35z"/>
                    </svg>
                  </div>
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      WhatsApp
                    </h4>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
                      Automated reminders
                    </p>
                    <div className="pt-0.5">
                      {enableWhatsApp ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span>ACTIVE</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                          <span>INACTIVE</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 flex items-center justify-end">
                  <button
                    onClick={handleToggleWhatsApp}
                    disabled={pending}
                    className="text-xs font-bold text-[#1A73E8] hover:underline cursor-pointer"
                  >
                    {enableWhatsApp ? "Deactivate" : "Connect"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PLAN & BILLING TAB */}
        {activeTab === "plan" && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-slate-100 dark:border-slate-800/60 pb-5">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-150">
                Plan & Billing
              </h3>
              <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                Administra tus suscripciones y métodos de facturación.
              </p>
            </div>

            {/* Plan Info Card */}
            <div className="p-6 rounded-2xl border border-blue-100/50 bg-[#F4F8FF] dark:border-blue-955/20 dark:bg-blue-955/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 pt-2 shadow-xs">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1A73E8]/10 text-[#1A73E8] border border-[#1A73E8]/20 shrink-0">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">
                      {planTier === "PRO" ? "Pro Professional" : "Free Plan"}
                    </h4>
                    <span className="rounded-full bg-[#1A73E8] px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                      ACTIVE
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-550 dark:text-slate-400">
                    {planTier === "PRO"
                      ? "$29.00 billed monthly · Renews Dec 12, 2024"
                      : "Gratuito con limitaciones · Sube a Pro para habilitar recordatorios ilimitados."}
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => {
                  alert("Redirigiendo a pasarela de Stripe...");
                }}
                className="rounded-full border border-slate-250 bg-white px-5 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer shadow-sm"
              >
                Manage Subscription
              </button>
            </div>
          </div>
        )}

        {/* ACCOUNT TAB */}
        {activeTab === "account" && (
          <div className="space-y-8 animate-fade-in">
            {/* Password section */}
            <form onSubmit={handleUpdatePassword} className="space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800/60 pb-5">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-150">
                  Account safety
                </h3>
                <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                  Protege tu cuenta actualizando tus credenciales.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Mín. 6 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-[#fbf9f8]/40 px-4 py-3.5 text-sm font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-955/40 dark:text-slate-100 focus:outline-hidden focus:bg-white focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] transition-all shadow-inner"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Repite la contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-[#fbf9f8]/40 px-4 py-3.5 text-sm font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-955/40 dark:text-slate-100 focus:outline-hidden focus:bg-white focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] transition-all shadow-inner"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-xs font-semibold text-slate-400">
                  Last changed: 3 months ago
                </span>
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-full bg-[#1A73E8] px-6 py-3.5 text-xs font-bold text-white shadow-md shadow-blue-500/10 hover:bg-[#005bbf] transition-all disabled:opacity-50 cursor-pointer"
                >
                  Update
                </button>
              </div>
            </form>

            {/* Delete account safety */}
            <div className="border-t border-slate-100 dark:border-slate-800/60 pt-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-red-650">
                    Delete Account
                  </h4>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
                    Permanently remove your account and all booking data.
                  </p>
                </div>
                <button
                  onClick={() => setIsDeleteConfirmOpen(true)}
                  type="button"
                  className="rounded-full bg-red-50 text-red-600 hover:bg-red-100 px-5 py-3.5 text-xs font-bold transition-colors cursor-pointer shrink-0"
                >
                  Delete...
                </button>
              </div>
            </div>

            {/* DELETE ACCOUNT CONFIRM MODAL */}
            {isDeleteConfirmOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-4 backdrop-blur-md">
                <div className="w-full max-w-md border border-white/20 bg-white/95 p-8 shadow-frost dark:border-white/5 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl animate-scale-up">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-650 dark:bg-red-950/30 dark:text-red-400">
                    ⚠️
                  </div>
                  <h4 className="mt-4 text-lg font-bold text-slate-800 dark:text-slate-150">
                    ¿Eliminar tu cuenta?
                  </h4>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                    Esta acción es definitiva. Cerrarás la sesión y todos tus datos (citas, clientes y configuraciones) serán destruidos de forma irreversible.
                  </p>
                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      onClick={() => setIsDeleteConfirmOpen(false)}
                      type="button"
                      className="rounded-full border border-slate-200/80 bg-white/60 px-5 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-350 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleDeleteAccount}
                      disabled={pending}
                      className="rounded-full bg-red-600 px-6 py-3 text-xs font-bold text-white hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      Eliminar Cuenta
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
