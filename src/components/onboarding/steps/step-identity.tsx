"use client";

import React, { useState, useEffect } from "react";
import { Globe, Check, AlertCircle, Sparkles } from "lucide-react";
import { normalizeSlug, isValidSlug } from "@/lib/slug";
import { checkSlugAvailability } from "@/actions/smart-onboarding";

interface StepIdentityProps {
  businessName: string;
  slug: string;
  userEmail: string;
  onChangeName: (name: string) => void;
  onChangeSlug: (slug: string) => void;
}

export function StepIdentity({
  businessName,
  slug,
  userEmail,
  onChangeName,
  onChangeSlug,
}: StepIdentityProps) {
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "unavailable" | "invalid">("idle");
  const [hasManuallyEditedSlug, setHasManuallyEditedSlug] = useState(false);

  // Auto-generate slug from name if not manually edited
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    onChangeName(newName);
    if (!hasManuallyEditedSlug && newName.length > 0) {
      const generatedSlug = normalizeSlug(newName);
      onChangeSlug(generatedSlug);
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasManuallyEditedSlug(true);
    const raw = e.target.value;
    const clean = normalizeSlug(raw);
    onChangeSlug(clean);
  };

  // Debounced check for slug availability
  useEffect(() => {
    if (!slug || slug.length < 3) {
      setSlugStatus(slug.length === 0 ? "idle" : "invalid");
      return;
    }

    if (!isValidSlug(slug)) {
      setSlugStatus("invalid");
      return;
    }

    setSlugStatus("checking");
    const timer = setTimeout(async () => {
      try {
        const res = await checkSlugAvailability(slug);
        if (res.available) {
          setSlugStatus("available");
        } else {
          setSlugStatus("unavailable");
        }
      } catch {
        setSlugStatus("available"); // fallback
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [slug]);

  return (
    <div className="space-y-6">
      {/* Business Name Field */}
      <div className="space-y-2">
        <label
          htmlFor="businessName"
          className="block text-sm font-semibold tracking-[-0.01em] text-[#1D1D1F]"
        >
          Nombre de tu negocio o marca profesional
        </label>
        <div className="relative">
          <input
            id="businessName"
            type="text"
            value={businessName}
            onChange={handleNameChange}
            placeholder="Ej. Clínica Dental Sonrisas, Dr. Juan Pérez, Barber Studio..."
            autoFocus
            className="w-full px-4 py-3.5 rounded-2xl bg-white border border-black/[0.12] text-[#1D1D1F] text-base placeholder-[#A1A1A6] shadow-sm transition-all focus:outline-none focus:border-[#007AFF] focus:ring-4 focus:ring-[#007AFF]/15"
          />
        </div>
        <p className="text-xs text-[#86868B]">
          Este nombre se mostrará a tus clientes en el portal de reservas y recordatorios.
        </p>
      </div>

      {/* Booking Slug / Link */}
      <div className="space-y-2">
        <label
          htmlFor="slug"
          className="block text-sm font-semibold tracking-[-0.01em] text-[#1D1D1F]"
        >
          Tu enlace de reservas personalizado
        </label>

        <div className="relative flex items-center">
          <div className="absolute left-4 flex items-center gap-1.5 text-xs font-medium text-[#86868B] select-none pointer-events-none">
            <Globe className="w-3.5 h-3.5 text-[#007AFF]" />
            <span>my-appointment.com/</span>
          </div>

          <input
            id="slug"
            type="text"
            value={slug}
            onChange={handleSlugChange}
            placeholder="tu-negocio"
            className="w-full pl-[160px] sm:pl-[170px] pr-10 py-3.5 rounded-2xl bg-white border border-black/[0.12] text-[#1D1D1F] font-mono text-sm shadow-sm transition-all focus:outline-none focus:border-[#007AFF] focus:ring-4 focus:ring-[#007AFF]/15"
          />

          <div className="absolute right-3.5 flex items-center">
            {slugStatus === "checking" && (
              <div className="w-4 h-4 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
            )}
            {slugStatus === "available" && (
              <span className="flex items-center gap-1 text-xs font-semibold text-[#34C759]">
                <Check className="w-4 h-4 stroke-[2.5]" />
              </span>
            )}
            {slugStatus === "unavailable" && (
              <span className="flex items-center gap-1 text-xs font-medium text-[#FF3B30]">
                <AlertCircle className="w-4 h-4" />
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs pt-1">
          {slugStatus === "available" && (
            <p className="text-[#34C759] font-medium flex items-center gap-1">
              ✓ Enlace disponible para tu negocio
            </p>
          )}
          {slugStatus === "unavailable" && (
            <p className="text-[#FF3B30] font-medium">
              ✕ Este enlace ya está en uso. Elige uno diferente.
            </p>
          )}
          {slugStatus === "invalid" && (
            <p className="text-[#FF9500] font-medium">
              Usa al menos 3 letras minúsculas, números o guiones.
            </p>
          )}
          {slugStatus === "idle" && (
            <p className="text-[#86868B]">
              Tus clientes podrán reservar 24/7 ingresando a este link.
            </p>
          )}
        </div>
      </div>

      {/* Account Info Pill */}
      <div className="p-4 rounded-2xl bg-black/[0.03] border border-black/[0.04] flex items-center justify-between text-xs text-[#6E6E73]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#34C759]" />
          <span>Cuenta vinculada: <strong className="text-[#1D1D1F] font-semibold">{userEmail}</strong></span>
        </div>
        <span className="text-[11px] text-[#86868B]">Propietario / Admin</span>
      </div>
    </div>
  );
}
