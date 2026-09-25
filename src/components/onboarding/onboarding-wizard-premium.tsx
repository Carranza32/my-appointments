"use client";

import { useState, useCallback, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Check,
  CheckCircle,
  Copy,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Phone,
  MapPin,
  AlertCircle
} from "lucide-react";

const DAYS = [
  { key: "monday", label: "Lunes" },
  { key: "tuesday", label: "Martes" },
  { key: "wednesday", label: "Miércoles" },
  { key: "thursday", label: "Jueves" },
  { key: "friday", label: "Viernes" },
  { key: "saturday", label: "Sábado" },
  { key: "sunday", label: "Domingo" },
];

const RUBROS = [
  { value: "SALUD", label: "Salud y Medicina", icon: "🩺" },
  { value: "BELLEZA", label: "Belleza y Estética", icon: "💇" },
  { value: "CONSULTORIA", label: "Consultoría y Coaching", icon: "💼" },
  { value: "FITNESS", label: "Fitness y Deporte", icon: "🏋️" },
  { value: "EDUCACION", label: "Educación y Tutorías", icon: "🎓" },
  { value: "VETERINARIA", label: "Veterinaria", icon: "🐾" },
  { value: "LEGAL", label: "Servicios Legales", icon: "⚖️" },
  { value: "GENERAL", label: "General / Otro", icon: "🗓️" },
];

const DURATIONS = [15, 30, 45, 60, 90, 120];
const BUFFERS = [0, 5, 10, 15, 30];

const DEFAULT_WEEKLY_HOURS = {
  monday: { enabled: true, ranges: [{ start: "09:00", end: "17:00" }] },
  tuesday: { enabled: true, ranges: [{ start: "09:00", end: "17:00" }] },
  wednesday: { enabled: true, ranges: [{ start: "09:00", end: "17:00" }] },
  thursday: { enabled: true, ranges: [{ start: "09:00", end: "17:00" }] },
  friday: { enabled: true, ranges: [{ start: "09:00", end: "17:00" }] },
  saturday: { enabled: false, ranges: [{ start: "09:00", end: "13:00" }] },
  sunday: { enabled: false, ranges: [{ start: "09:00", end: "13:00" }] },
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 40);
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

type Props = {
  userEmail: string;
};

export function OnboardingWizardPremium({ userEmail }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [publicUrl, setPublicUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const [profile, setProfile] = useState({
    displayName: "",
    slug: "",
    slugManual: false,
    rubro: "",
    bio: "",
    phone: "",
    location: "",
  });

  const [schedule, setSchedule] = useState({
    weeklyHours: DEFAULT_WEEKLY_HOURS,
  });

  const [slot, setSlot] = useState({
    duration: 30,
    buffer: 0,
  });

  const updateProfile = (key: string, val: any) => setProfile((p) => ({ ...p, [key]: val }));
  const updateSchedule = (key: string, val: any) => setSchedule((s) => ({ ...s, [key]: val }));
  const updateSlot = (key: string, val: any) => setSlot((s) => ({ ...s, [key]: val }));

  // Slug checking in real-time
  const [slugStatus, setSlugStatus] = useState<"checking" | "available" | "taken" | null>(null);
  const debouncedSlug = useDebounce(profile.slug, 500);

  useEffect(() => {
    if (!debouncedSlug || debouncedSlug.length < 3) {
      setSlugStatus(null);
      return;
    }
    setSlugStatus("checking");
    fetch(`/api/onboarding?slug=${debouncedSlug}`)
      .then((r) => r.json())
      .then((d) => setSlugStatus(d.available ? "available" : "taken"))
      .catch(() => setSlugStatus(null));
  }, [debouncedSlug]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    updateProfile("displayName", val);
    if (!profile.slugManual) {
      updateProfile("slug", slugify(val));
    }
  };

  const toggleDay = (dayKey: string) => {
    const day = schedule.weeklyHours[dayKey as keyof typeof schedule.weeklyHours];
    updateSchedule("weeklyHours", {
      ...schedule.weeklyHours,
      [dayKey]: {
        ...day,
        enabled: !day.enabled,
      },
    });
  };

  const updateRange = (dayKey: string, rangeIdx: number, field: "start" | "end", value: string) => {
    const updated = { ...schedule.weeklyHours };
    const day = updated[dayKey as keyof typeof schedule.weeklyHours];
    const ranges = [...day.ranges];
    ranges[rangeIdx] = { ...ranges[rangeIdx], [field]: value };
    updated[dayKey as keyof typeof schedule.weeklyHours] = { ...day, ranges };
    updateSchedule("weeklyHours", updated);
  };

  const addRange = (dayKey: string) => {
    const updated = { ...schedule.weeklyHours };
    const day = updated[dayKey as keyof typeof schedule.weeklyHours];
    updated[dayKey as keyof typeof schedule.weeklyHours] = {
      ...day,
      ranges: [...day.ranges, { start: "15:00", end: "19:00" }],
    };
    updateSchedule("weeklyHours", updated);
  };

  const removeRange = (dayKey: string, rangeIdx: number) => {
    const updated = { ...schedule.weeklyHours };
    const day = updated[dayKey as keyof typeof schedule.weeklyHours];
    updated[dayKey as keyof typeof schedule.weeklyHours] = {
      ...day,
      ranges: day.ranges.filter((_, i) => i !== rangeIdx),
    };
    updateSchedule("weeklyHours", updated);
  };

  const canAdvance = () => {
    if (step === 0) {
      return (
        profile.displayName.trim().length >= 2 &&
        profile.slug.trim().length >= 3 &&
        slugStatus === "available" &&
        profile.rubro !== ""
      );
    }
    if (step === 1) {
      return DAYS.some((d) => schedule.weeklyHours[d.key as keyof typeof schedule.weeklyHours]?.enabled);
    }
    return true;
  };

  const handleNext = () => {
    setError(null);
    if (step < 2) {
      setStep((s) => s + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/onboarding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile, schedule, slot }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Ocurrió un error. Intenta de nuevo.");
          return;
        }
        setPublicUrl(data.publicUrl);
        setDone(true);
      } catch {
        setError("Sin conexión. Verifica tu internet e intenta de nuevo.");
      }
    });
  };

  const copyLink = async () => {
    const fullLink = `${window.location.origin}${publicUrl}`;
    await navigator.clipboard.writeText(fullLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const durationLabel = (min: number) => {
    if (min < 60) return `${min} min`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m ? `${h}h ${m}min` : `${h}h`;
  };

  const stepsList = ["Perfil", "Horario", "Listo"];

  if (done) {
    const fullLink = typeof window !== "undefined" ? `${window.location.origin}${publicUrl}` : publicUrl;
    return (
      <div className="max-w-md w-full rounded-3xl border border-slate-200/85 bg-white p-8 text-center shadow-frost    backdrop-blur-md animate-in zoom-in-95 duration-350">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-3xl font-bold shadow-md shadow-emerald-500/20 animate-bounce">
          <CheckCircle className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-800  font-heading">
          ¡Tu perfil está listo!
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600 ">
          Tu portal de reservas ya está activo. Comparte este enlace con tus clientes para comenzar a agendar citas.
        </p>

        <div className="my-6 flex items-center rounded-2xl border border-slate-205 bg-slate-50   overflow-hidden">
          <span className="flex-1 px-4 py-3 text-xs font-mono text-left text-[#007AFF] [#007AFF] truncate">
            {fullLink}
          </span>
          <button
            onClick={copyLink}
            type="button"
            className="px-4.5 py-3 bg-[#007AFF] hover:bg-[#005cbf] text-white text-xs font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? "Copiado" : "Copiar"}</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-extrabold text-slate-700 hover:bg-slate-50     transition-all text-center"
          >
            Ver Portal Público
          </a>
          <button
            onClick={() => {
              router.push("/dashboard");
              router.refresh();
            }}
            className="flex-1 inline-flex items-center justify-center rounded-xl bg-[#007AFF] py-3 text-sm font-extrabold text-white hover:bg-[#005cbf] shadow-md shadow-[#007AFF]/10 active:scale-[0.98] transition-all cursor-pointer text-center"
          >
            Ir al Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl flex flex-col items-center">
      {/* Top Branding Bar */}
      <div className="w-full flex justify-between items-center py-4 px-1 text-xs text-slate-500 font-semibold mb-2">
        <span className="font-extrabold text-[#007AFF] [#007AFF] font-heading text-base tracking-tight">
          My Appointment
        </span>
        <span className="text-slate-400 ">{userEmail}</span>
      </div>

      {/* Main Container Card */}
      <div className="w-full rounded-2xl border border-white/75 bg-white/65 p-7 md:p-9 shadow-xl backdrop-blur-xl space-y-7" style={{ boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.95), 0 4px 20px rgba(0, 0, 0, 0.02)' }}>
        {/* Descriptive Connecting Progress Steps */}
        <div className="flex items-center justify-between w-full border-b border-slate-100  pb-6">
          {stepsList.map((label, i) => {
            const isCompleted = i < step;
            const isActive = i === step;
            return (
              <div key={i} className="flex items-center gap-2 flex-1 last:flex-initial">
                <div
                  className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs border transition-all duration-300 ${
                    isCompleted || isActive
                      ? "bg-[#007AFF] border-[#007AFF] text-white shadow-sm shadow-[#007AFF]/10"
                      : "bg-slate-100 border-slate-200 text-slate-400  "
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-4.5 w-4.5 stroke-[3.5]" />
                  ) : (
                    <span>{i + 1}</span>
                  )}
                </div>
                <span
                  className={`text-xs font-bold transition-colors ${
                    isActive || isCompleted
                      ? "text-slate-850 "
                      : "text-slate-400 "
                  }`}
                >
                  {label}
                </span>
                {i < stepsList.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 rounded-full mx-2 hidden sm:block ${
                      isCompleted ? "bg-[#007AFF]" : "bg-slate-200 "
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Step Header */}
        <div className="text-center flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#007AFF]/10  text-2xl shadow-inner mb-3.5">
            {step === 0 && "👤"}
            {step === 1 && "📅"}
            {step === 2 && "⚙️"}
          </div>
          <h2 className="text-xl font-black tracking-tight text-slate-850  font-heading">
            {step === 0 && "Tu perfil público"}
            {step === 1 && "Tu disponibilidad semanal"}
            {step === 2 && "Duración de tus citas"}
          </h2>
          <p className="mt-1.5 text-xs text-slate-500  max-w-md leading-relaxed font-semibold">
            {step === 0 && "Así te verán tus clientes cuando visiten tu portal de reservas."}
            {step === 1 && "Define en qué días y horarios recibes citas. Puedes editarlo después."}
            {step === 2 && "Configura cuánto dura cada cita y si necesitas tiempo entre ellas."}
          </p>
        </div>

        {/* Step Body */}
        <div className="min-h-[300px]">
          {/* STEP 0: PROFILE */}
          {step === 0 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Display Name */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-450 ">
                    Nombre o Nombre Comercial *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={profile.displayName}
                      onChange={handleNameChange}
                      placeholder="Ej. Dra. Ana García o Clínica Bienestar"
                      className="w-full rounded-xl border border-slate-205 bg-slate-50 pl-3.5 pr-10 py-2.5 text-xs font-bold text-slate-700 outline-hidden focus:border-[#007AFF] focus:ring-4 focus:ring-[#007AFF]/10   "
                    />
                    <User className="absolute right-3.5 top-3 h-4.5 w-4.5 text-slate-450  pointer-events-none" />
                  </div>
                </div>

                {/* Slug / URL Link */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-450 ">
                    Tu Enlace de Reservas *
                  </label>
                  <div className="flex items-center rounded-xl border border-slate-205 bg-slate-50 overflow-hidden focus-within:border-[#007AFF] focus-within:ring-4 focus-within:ring-[#007AFF]/10  ">
                    <span className="pl-3.5 text-xs font-semibold text-slate-400 select-none">
                      myappointment.app/
                    </span>
                    <input
                      type="text"
                      value={profile.slug}
                      onChange={(e) => {
                        updateProfile("slug", slugify(e.target.value));
                        updateProfile("slugManual", true);
                      }}
                      placeholder="mi-nombre"
                      className="flex-1 bg-transparent border-0 px-1 py-2.5 text-xs font-bold text-slate-700 outline-hidden "
                    />
                    <div className="pr-3.5 flex items-center justify-center">
                      {slugStatus === "checking" && (
                        <svg className="animate-spin h-3.5 w-3.5 text-amber-500" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      )}
                      {slugStatus === "available" && <Check className="h-4 w-4 text-emerald-500" />}
                      {slugStatus === "taken" && <span className="text-red-500 text-xs font-bold">✗</span>}
                    </div>
                  </div>
                  {slugStatus === "taken" && (
                    <p className="text-[10px] text-red-550 font-bold">Este enlace ya está en uso. Prueba con otro.</p>
                  )}
                  {slugStatus === "available" && (
                    <p className="text-[10px] text-emerald-600 font-bold">¡Disponible! Este será tu enlace único.</p>
                  )}
                </div>
              </div>

              {/* Rubro selection emoji grid */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-450 ">
                  ¿A qué te dedicas? *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {RUBROS.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => updateProfile("rubro", r.value)}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer gap-1.5 ${
                        profile.rubro === r.value
                          ? "border-[#007AFF] bg-[#007AFF]/10/50 text-[#007AFF]   [#007AFF]/25"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300    "
                      }`}
                    >
                      <span className="text-xl">{r.icon}</span>
                      <span className="text-[10px] font-bold text-center leading-tight">
                        {r.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Bio description */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-450 ">
                  Descripción Breve <span className="font-semibold text-slate-400 lowercase">(opcional)</span>
                </label>
                <textarea
                  rows={3}
                  value={profile.bio}
                  onChange={(e) => updateProfile("bio", e.target.value)}
                  placeholder="Ej. Médico especialista en medicina general con 10 años de experiencia. Atención personalizada y cálida."
                  className="w-full rounded-xl border border-slate-205 bg-slate-55 px-3.5 py-2.5 text-xs font-bold text-slate-700 outline-hidden focus:border-[#007AFF] focus:ring-4 focus:ring-[#007AFF]/10    resize-none"
                  maxLength={300}
                />
                <p className="text-[9px] text-right text-slate-400 ">
                  {profile.bio.length} / 300
                </p>
              </div>

              {/* Phone + Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-450 ">
                    Teléfono <span className="font-semibold text-slate-400 lowercase">(opcional)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => updateProfile("phone", e.target.value)}
                      placeholder="+503 7000 0000"
                      className="w-full rounded-xl border border-slate-205 bg-slate-55 pl-3.5 pr-10 py-2.5 text-xs font-bold text-slate-700 outline-hidden focus:border-[#007AFF] focus:ring-4 focus:ring-[#007AFF]/10   "
                    />
                    <Phone className="absolute right-3.5 top-3 h-4.5 w-4.5 text-slate-400  pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-450 ">
                    Ciudad / Ubicación <span className="font-semibold text-slate-400 lowercase">(opcional)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={profile.location}
                      onChange={(e) => updateProfile("location", e.target.value)}
                      placeholder="San Salvador, El Salvador"
                      className="w-full rounded-xl border border-slate-205 bg-slate-55 pl-3.5 pr-10 py-2.5 text-xs font-bold text-slate-700 outline-hidden focus:border-[#007AFF] focus:ring-4 focus:ring-[#007AFF]/10   "
                    />
                    <MapPin className="absolute right-3.5 top-3 h-4.5 w-4.5 text-slate-400  pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 1: WEEKLY HOURS */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-3">
                {DAYS.map(({ key, label }) => {
                  const day = schedule.weeklyHours[key as keyof typeof schedule.weeklyHours];
                  const enabled = day.enabled;

                  return (
                    <div
                      key={key}
                      className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-4.5 rounded-2xl border transition-all duration-300 ${
                        enabled
                          ? "border-slate-200 bg-white   border-l-4 border-l-[#007AFF]"
                          : "border-slate-200/50 bg-slate-50/70   opacity-70"
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <button
                          onClick={() => toggleDay(key)}
                          type="button"
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 focus:outline-hidden ${
                            enabled ? "bg-[#007AFF]" : "bg-slate-200 "
                          }`}
                          aria-label={`${enabled ? "Deshabilitar" : "Habilitar"} ${label}`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-300 ease-in-out ${
                              enabled ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                        <span className="text-sm font-extrabold text-slate-855  w-20">
                          {label}
                        </span>
                      </div>

                      <div className="flex-1 flex flex-col gap-2 md:items-end">
                        {enabled ? (
                          <div className="space-y-2">
                            {day.ranges.map((range, ri) => (
                              <div key={ri} className="flex items-center gap-2">
                                <input
                                  type="time"
                                  value={range.start}
                                  onChange={(e) => updateRange(key, ri, "start", e.target.value)}
                                  className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-800 outline-hidden   "
                                />
                                <span className="text-xs text-slate-400">—</span>
                                <input
                                  type="time"
                                  value={range.end}
                                  onChange={(e) => updateRange(key, ri, "end", e.target.value)}
                                  className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-800 outline-hidden   "
                                />

                                {day.ranges.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeRange(key, ri)}
                                    className="h-7 w-7 inline-flex items-center justify-center rounded-lg border border-red-500/10 bg-red-500/5 text-red-650 hover:bg-red-500/15 cursor-pointer"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                            ))}

                            {day.ranges.length < 2 && (
                              <button
                                type="button"
                                onClick={() => addRange(key)}
                                className="text-3xs font-black uppercase tracking-wider text-[#007AFF] hover:text-[#005cbf] bg-[#007AFF]/10 px-2.5 py-1.5 rounded-lg border border-[#007AFF]/20/50 cursor-pointer block md:ml-auto"
                              >
                                + Agregar pausa de almuerzo
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs font-semibold text-slate-400  italic">
                            No disponible
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: SLOTS AND CONFIRMATION */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Duration choice pills */}
              <div className="space-y-2.5">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-450 ">
                  ¿Cuánto dura cada cita?
                </label>
                <div className="flex flex-wrap gap-2">
                  {DURATIONS.map((min) => (
                    <button
                      key={min}
                      type="button"
                      onClick={() => updateSlot("duration", min)}
                      className={`px-4.5 py-2.5 rounded-xl border text-xs font-extrabold transition-all cursor-pointer ${
                        slot.duration === min
                          ? "border-[#007AFF] bg-[#007AFF]/10/50 text-[#007AFF]   [#007AFF]/25 font-bold"
                          : "border-slate-205 bg-white text-slate-700 hover:border-slate-300    "
                      }`}
                    >
                      {durationLabel(min)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Buffer rest choice pills */}
              <div className="space-y-2.5">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-450 ">
                  Tiempo de descanso entre citas
                </label>
                <p className="text-[10px] text-slate-400 ">
                  Tiempo para prepararte o tomar notas antes de la siguiente cita.
                </p>
                <div className="flex flex-wrap gap-2">
                  {BUFFERS.map((min) => (
                    <button
                      key={min}
                      type="button"
                      onClick={() => updateSlot("buffer", min)}
                      className={`px-4.5 py-2.5 rounded-xl border text-xs font-extrabold transition-all cursor-pointer ${
                        slot.buffer === min
                          ? "border-[#007AFF] bg-[#007AFF]/10/50 text-[#007AFF]   [#007AFF]/25 font-bold"
                          : "border-slate-205 bg-white text-slate-700 hover:border-slate-300    "
                      }`}
                    >
                      {min === 0 ? "Sin pausa" : `${min} min`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview Resumen Card */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5   space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#007AFF] [#007AFF]">
                  Resumen de tu configuración
                </p>

                <div className="grid grid-cols-1 gap-2.5 text-xs">
                  <div className="flex justify-between items-baseline gap-4">
                    <span className="text-slate-450  shrink-0">Portal público:</span>
                    <span className="font-semibold text-slate-800  truncate">
                      myappointment.app/<strong>{profile.slug || "tu-nombre"}</strong>
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline gap-4">
                    <span className="text-slate-450  shrink-0">Nombre:</span>
                    <span className="font-semibold text-slate-800 ">{profile.displayName || "—"}</span>
                  </div>
                  <div className="flex justify-between items-baseline gap-4">
                    <span className="text-slate-450  shrink-0">Rubro:</span>
                    <span className="font-semibold text-slate-800 ">
                      {RUBROS.find((r) => r.value === profile.rubro)?.label ?? "—"}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline gap-4">
                    <span className="text-slate-450  shrink-0">Días activos:</span>
                    <span className="font-semibold text-slate-850  text-right leading-tight">
                      {DAYS.filter((d) => schedule.weeklyHours[d.key as keyof typeof schedule.weeklyHours]?.enabled)
                        .map((d) => d.label)
                        .join(", ") || "Ninguno"}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline gap-4">
                    <span className="text-slate-450  shrink-0">Duración de cita:</span>
                    <span className="font-semibold text-slate-800 ">{durationLabel(slot.duration)}</span>
                  </div>
                  <div className="flex justify-between items-baseline gap-4">
                    <span className="text-slate-450  shrink-0">Pausa entre citas:</span>
                    <span className="font-semibold text-slate-800 ">
                      {slot.buffer === 0 ? "Sin pausa" : `${slot.buffer} min`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Global error banner */}
        {error && (
          <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-800   ">
            <AlertCircle className="h-4.5 w-4.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Navigation Actions Bar */}
        <div className="flex items-center justify-between border-t border-slate-100  pt-5">
          {step > 0 ? (
            <button
              onClick={() => setStep((s) => s - 1)}
              disabled={loading}
              type="button"
              className="inline-flex items-center gap-1 text-xs font-extrabold text-slate-500 hover:text-slate-700   transition-colors cursor-pointer disabled:opacity-50"
            >
              <span>← Atrás</span>
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={handleNext}
            disabled={!canAdvance() || loading}
            type="button"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#007AFF] px-6 py-3 text-xs font-extrabold text-white shadow-md shadow-[#007AFF]/10 hover:bg-[#005cbf] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <span>{loading ? "Guardando..." : step === 2 ? "Finalizar y activar mi portal" : "Continuar →"}</span>
          </button>
        </div>

        {step === 0 && (
          <p className="text-center text-[10px] text-slate-400  mt-4 leading-none font-semibold">
            Puedes modificar toda esta información desde tu dashboard en cualquier momento.
          </p>
        )}
      </div>
    </div>
  );
}
