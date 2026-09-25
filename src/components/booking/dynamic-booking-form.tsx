"use client";

import { useState, useTransition, useMemo } from "react";
import { createAppointment } from "@/actions/appointments";
import type { FormFieldDef } from "@/lib/form-fields";
import { formatDateLabel } from "@/lib/booking";

type Props = {
  slug: string;
  date: string;
  time: string;
  slotDuration: number;
  formFields: FormFieldDef[];
  onSuccess: (appointmentId: string) => void;
  onBack: () => void;
  serviceId?: string | null;
  serviceName?: string | null;
  servicePrice?: number | null;
  serviceCurrency?: string | null;
  staffId?: string | null;
  locationId?: string | null;
  resourceId?: string | null;
};

const STANDARD_KEYS = new Set([
  "name",
  "nombre",
  "nombre_completo",
  "client_name",
  "clientname",
  "email",
  "correo",
  "correo_electronico",
  "client_email",
  "clientemail",
  "phone",
  "telefono",
  "celular",
  "whatsapp",
  "client_phone",
  "clientphone",
]);

export function DynamicBookingForm({
  slug,
  date,
  time,
  slotDuration,
  formFields,
  onSuccess,
  onBack,
  serviceId,
  serviceName,
  servicePrice,
  serviceCurrency = "USD",
  staffId,
  locationId,
  resourceId,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [metadata, setMetadata] = useState<Record<string, string>>({});
  const [consentAccepted, setConsentAccepted] = useState(false);

  // Filter out standard fields from formFields to avoid duplicate inputs
  const additionalFields = useMemo(() => {
    return formFields.filter(
      (f) => !STANDARD_KEYS.has(f.name.toLowerCase().trim())
    );
  }, [formFields]);

  function setMetaField(name: string, value: string) {
    setMetadata((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validate additional required fields (e.g. booleans)
    for (const f of additionalFields) {
      if (f.required && !metadata[f.name]?.trim()) {
        setError(`Por favor responde «${f.label}».`);
        return;
      }
    }

    if (!consentAccepted) {
      setError("Debes aceptar el Aviso de Privacidad para continuar.");
      return;
    }

    startTransition(async () => {
      // Map standard fields into metadata as well to satisfy backend validators
      const fullMetadata = {
        ...metadata,
        name: clientName,
        nombre: clientName,
        email: clientEmail,
        correo: clientEmail,
        phone: clientPhone,
        telefono: clientPhone,
      };

      const result = await createAppointment({
        slug,
        date,
        time,
        clientName,
        clientEmail,
        clientPhone,
        clientMetadata: fullMetadata,
        serviceId: serviceId || null,
        staffId: staffId || null,
        locationId: locationId || null,
        resourceId: resourceId || null,
      });

      if ("error" in result) {
        setError(result.error);
        return;
      }

      onSuccess(result.appointmentId);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Apple Studio Summary Banner */}
      <div className="rounded-2xl border border-black/[0.06] bg-[#FBFBFD] p-4 flex items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white border border-black/[0.06] shadow-xs text-xl select-none">
            🗓️
          </div>
          <div className="min-w-0">
            {serviceName && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#007AFF] block truncate">
                {serviceName}
              </span>
            )}
            <p className="font-bold text-sm text-[#1D1D1F] capitalize truncate">
              {formatDateLabel(date)}
            </p>
            <p className="text-xs text-[#86868B] font-medium mt-0.5">
              {time} hs · ({slotDuration} minutos)
            </p>
          </div>
        </div>
        {servicePrice !== undefined && servicePrice !== null && servicePrice > 0 && (
          <div className="shrink-0 text-right bg-white border border-black/[0.06] rounded-xl px-3 py-1.5 shadow-2xs">
            <span className="text-[10px] font-bold text-[#86868B] block uppercase tracking-wider">Precio</span>
            <span className="text-sm font-bold text-[#34C759]">
              ${servicePrice} {serviceCurrency}
            </span>
          </div>
        )}
      </div>

      {/* Primary Contact Details */}
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-bold text-[#1D1D1F]">
            Nombre completo <span className="text-[#FF3B30]">*</span>
          </label>
          <input
            required
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Ej. Juan Pérez"
            className="w-full rounded-xl border border-black/[0.1] bg-white px-3.5 py-2.5 text-sm text-[#1D1D1F] placeholder:text-[#86868B]/40 outline-none transition-all focus:border-[#007AFF] focus:ring-4 focus:ring-[#007AFF]/12"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold text-[#1D1D1F]">
            Correo electrónico <span className="text-[#FF3B30]">*</span>
          </label>
          <input
            type="email"
            required
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            placeholder="juan@ejemplo.com"
            className="w-full rounded-xl border border-black/[0.1] bg-white px-3.5 py-2.5 text-sm text-[#1D1D1F] placeholder:text-[#86868B]/40 outline-none transition-all focus:border-[#007AFF] focus:ring-4 focus:ring-[#007AFF]/12"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold text-[#1D1D1F]">
            Teléfono celular / WhatsApp <span className="text-[#FF3B30]">*</span>
          </label>
          <input
            type="tel"
            required
            minLength={8}
            value={clientPhone}
            onChange={(e) => setClientPhone(e.target.value)}
            placeholder="Ej. 55 1234 5678"
            className="w-full rounded-xl border border-black/[0.1] bg-white px-3.5 py-2.5 text-sm text-[#1D1D1F] placeholder:text-[#86868B]/40 outline-none transition-all focus:border-[#007AFF] focus:ring-4 focus:ring-[#007AFF]/12"
          />
        </div>
      </div>

      {/* Additional Questions from Smart Onboarding */}
      {additionalFields.length > 0 && (
        <div className="pt-3 border-t border-black/[0.06] space-y-4">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#007AFF]" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#86868B]">
              Información para tu consulta
            </h4>
          </div>

          {additionalFields.map((field) => (
            <div key={field.name}>
              <label className="mb-1.5 block text-xs font-bold text-[#1D1D1F]">
                {field.label}
                {field.required ? <span className="text-[#FF3B30]"> *</span> : ""}
              </label>

              {field.type === "boolean" ? (
                <div className="flex gap-2.5">
                  {["Sí", "No"].map((opt) => {
                    const isSelected = metadata[field.name] === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setMetaField(field.name, opt)}
                        className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all duration-150 active:scale-[0.98] ${
                          isSelected
                            ? "bg-[#007AFF] text-white shadow-sm ring-2 ring-[#007AFF]/25 font-bold"
                            : "bg-[#F2F2F7] text-[#1D1D1F] hover:bg-[#E5E5EA] border border-black/[0.04]"
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              ) : field.type === "textarea" ? (
                <textarea
                  required={field.required}
                  rows={3}
                  value={metadata[field.name] ?? ""}
                  onChange={(e) => setMetaField(field.name, e.target.value)}
                  placeholder="Escribe brevemente aquí..."
                  className="w-full rounded-xl border border-black/[0.1] bg-white px-3.5 py-2.5 text-sm text-[#1D1D1F] placeholder:text-[#86868B]/40 outline-none transition-all focus:border-[#007AFF] focus:ring-4 focus:ring-[#007AFF]/12 resize-none"
                />
              ) : field.type === "select" ? (
                <select
                  required={field.required}
                  value={metadata[field.name] ?? ""}
                  onChange={(e) => setMetaField(field.name, e.target.value)}
                  className="w-full rounded-xl border border-black/[0.1] bg-white px-3.5 py-2.5 text-sm text-[#1D1D1F] outline-none transition-all focus:border-[#007AFF] focus:ring-4 focus:ring-[#007AFF]/12 appearance-none cursor-pointer"
                >
                  <option value="">Selecciona una opción…</option>
                  {field.options?.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type === "number" ? "number" : "text"}
                  required={field.required}
                  value={metadata[field.name] ?? ""}
                  onChange={(e) => setMetaField(field.name, e.target.value)}
                  className="w-full rounded-xl border border-black/[0.1] bg-white px-3.5 py-2.5 text-sm text-[#1D1D1F] outline-none transition-all focus:border-[#007AFF] focus:ring-4 focus:ring-[#007AFF]/12"
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Privacy and Consent Checkbox */}
      <div className="flex items-start gap-2.5 py-1">
        <input
          id="privacy-consent"
          type="checkbox"
          required
          checked={consentAccepted}
          onChange={(e) => setConsentAccepted(e.target.checked)}
          className="mt-0.5 h-4.5 w-4.5 rounded border-[#E5E5EA] bg-[#F2F2F7] text-[#007AFF] focus:ring-[#007AFF]/10 cursor-pointer"
        />
        <label
          htmlFor="privacy-consent"
          className="text-xs font-medium text-[#48484A] leading-normal select-none cursor-pointer"
        >
          Acepto el{" "}
          <a
            href="/privacy-notice.html"
            target="_blank"
            className="text-[#007AFF] font-bold hover:underline"
          >
            Aviso de Privacidad
          </a>{" "}
          y el tratamiento de mis datos de contacto para la gestión de esta cita.
        </label>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-[#FF3B30]/20 bg-[#FF3B30]/10 p-3 text-xs font-semibold text-[#FF3B30] animate-in fade-in duration-200">
          <span className="shrink-0 text-sm select-none">⚠️</span>
          <span className="leading-relaxed">{error}</span>
        </div>
      )}

      <div className="flex gap-3 pt-3 border-t border-black/[0.06]">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 inline-flex items-center justify-center rounded-xl border border-black/[0.08] bg-white py-3 text-xs font-bold text-[#1D1D1F] hover:bg-black/[0.03] cursor-pointer active:scale-[0.98] transition-all shadow-2xs"
        >
          Atrás
        </button>
        <button
          type="submit"
          disabled={pending}
          className="flex-1 inline-flex items-center justify-center rounded-xl bg-[#007AFF] py-3 text-xs font-bold text-white hover:bg-[#0062cc] disabled:opacity-50 cursor-pointer active:scale-[0.98] transition-all shadow-md shadow-[#007AFF]/25"
        >
          {pending ? (
            <>
              <svg className="mr-2 h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Reservando…
            </>
          ) : (
            "Confirmar Cita"
          )}
        </button>
      </div>
    </form>
  );
}
