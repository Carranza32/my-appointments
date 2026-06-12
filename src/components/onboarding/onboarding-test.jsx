"use client";

// app/onboarding/_components/OnboardingWizard.jsx
import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// ─── Constantes ───────────────────────────────────────────────────────────────
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
    { value: "medico", label: "Médico / Clínica", icon: "🩺" },
    { value: "psicologo", label: "Psicólogo / Terapeuta", icon: "🧠" },
    { value: "nutricionista", label: "Nutricionista", icon: "🥗" },
    { value: "dentista", label: "Dentista", icon: "🦷" },
    { value: "fisioterapeuta", label: "Fisioterapeuta", icon: "💪" },
    { value: "coach", label: "Coach / Consultor", icon: "📊" },
    { value: "abogado", label: "Abogado / Legal", icon: "⚖️" },
    { value: "estetica", label: "Estética / Belleza", icon: "💅" },
    { value: "entrenador", label: "Entrenador personal", icon: "🏋️" },
    { value: "otro", label: "Otro", icon: "✨" },
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

// ─── Utilidades ───────────────────────────────────────────────────────────────
function slugify(text) {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .slice(0, 40);
}

function useDebounce(value, delay) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return debounced;
}

// ─── Subcomponentes ──────────────────────────────────────────────────────────

// Barra de progreso superior
function ProgressBar({ step }) {
    const steps = ["Perfil", "Horario", "Listo"];
    return (
        <div style={styles.progressWrap}>
            {steps.map((label, i) => {
                const isCompleted = i < step;
                const isActive = i === step;
                return (
                    <div key={i} style={styles.progressStep}>
                        <div style={{
                            ...styles.progressDot,
                            ...(isCompleted ? styles.progressDotDone : {}),
                            ...(isActive ? styles.progressDotActive : {}),
                        }}>
                            {isCompleted ? (
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                    <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            ) : (
                                <span style={{ fontSize: 11, fontWeight: 600, color: isActive ? "#fff" : "#94a3b8" }}>
                                    {i + 1}
                                </span>
                            )}
                        </div>
                        <span style={{
                            ...styles.progressLabel,
                            color: isActive || isCompleted ? "#0f172a" : "#94a3b8",
                            fontWeight: isActive ? 600 : 400,
                        }}>
                            {label}
                        </span>
                        {i < steps.length - 1 && (
                            <div style={{ ...styles.progressLine, background: isCompleted ? "#6366f1" : "#e2e8f0" }} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ── Paso 1: Perfil ────────────────────────────────────────────────────────────
function StepProfile({ data, onChange }) {
    const [slugStatus, setSlugStatus] = useState(null); // null | "checking" | "available" | "taken"
    const debouncedSlug = useDebounce(data.slug, 500);
    const nameRef = useRef(null);

    useEffect(() => { nameRef.current?.focus(); }, []);

    // Auto-generar slug desde el nombre
    const handleNameChange = (e) => {
        const val = e.target.value;
        onChange("displayName", val);
        if (!data.slugManual) {
            onChange("slug", slugify(val));
        }
    };

    // Verificar disponibilidad del slug en tiempo real
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

    const slugColor = {
        checking: "#f59e0b",
        available: "#10b981",
        taken: "#ef4444",
    }[slugStatus] ?? "#94a3b8";

    const slugIcon = {
        checking: "⏳",
        available: "✓",
        taken: "✗",
    }[slugStatus] ?? "";

    return (
        <div style={styles.stepWrap}>
            <div style={styles.stepHeader}>
                <div style={styles.stepIconWrap}>
                    <span style={{ fontSize: 28 }}>👤</span>
                </div>
                <h2 style={styles.stepTitle}>Tu perfil público</h2>
                <p style={styles.stepSub}>
                    Así te verán tus clientes cuando visiten tu portal de reservas.
                </p>
            </div>

            {/* Nombre comercial */}
            <div style={styles.field}>
                <label style={styles.label}>Nombre o nombre comercial <span style={styles.required}>*</span></label>
                <input
                    ref={nameRef}
                    style={styles.input}
                    value={data.displayName}
                    onChange={handleNameChange}
                    placeholder="Ej. Dra. Ana García o Clínica Bienestar"
                    maxLength={60}
                />
            </div>

            {/* Slug / URL pública */}
            <div style={styles.field}>
                <label style={styles.label}>Tu enlace de reservas <span style={styles.required}>*</span></label>
                <div style={styles.slugWrap}>
                    <span style={styles.slugPrefix}>myappointment.app/</span>
                    <input
                        style={{ ...styles.input, ...styles.slugInput }}
                        value={data.slug}
                        onChange={(e) => {
                            onChange("slug", slugify(e.target.value));
                            onChange("slugManual", true);
                        }}
                        placeholder="mi-nombre"
                        maxLength={40}
                    />
                    <span style={{ fontSize: 16, marginLeft: 8, color: slugColor }}>
                        {slugIcon}
                    </span>
                </div>
                {slugStatus === "taken" && (
                    <p style={{ ...styles.hint, color: "#ef4444" }}>
                        Este enlace ya está en uso. Prueba con otro.
                    </p>
                )}
                {slugStatus === "available" && (
                    <p style={{ ...styles.hint, color: "#10b981" }}>
                        ¡Disponible! Este será tu enlace único.
                    </p>
                )}
                {!slugStatus && data.slug && (
                    <p style={styles.hint}>Mínimo 3 caracteres. Solo letras, números y guiones.</p>
                )}
            </div>

            {/* Rubro */}
            <div style={styles.field}>
                <label style={styles.label}>¿A qué te dedicas? <span style={styles.required}>*</span></label>
                <div style={styles.rubroGrid}>
                    {RUBROS.map((r) => (
                        <button
                            key={r.value}
                            type="button"
                            onClick={() => onChange("rubro", r.value)}
                            style={{
                                ...styles.rubroBtn,
                                ...(data.rubro === r.value ? styles.rubroBtnActive : {}),
                            }}
                        >
                            <span style={{ fontSize: 20 }}>{r.icon}</span>
                            <span style={{ fontSize: 12, marginTop: 4, lineHeight: 1.2 }}>{r.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Bio */}
            <div style={styles.field}>
                <label style={styles.label}>Descripción breve <span style={styles.optional}>(opcional)</span></label>
                <textarea
                    style={styles.textarea}
                    value={data.bio}
                    onChange={(e) => onChange("bio", e.target.value)}
                    placeholder="Ej. Médico especialista en medicina general con 10 años de experiencia. Atención personalizada y cálida."
                    rows={3}
                    maxLength={300}
                />
                <p style={styles.charCount}>{data.bio?.length ?? 0} / 300</p>
            </div>

            {/* Fila: teléfono + ubicación */}
            <div style={styles.row2}>
                <div style={styles.field}>
                    <label style={styles.label}>Teléfono <span style={styles.optional}>(opcional)</span></label>
                    <input
                        style={styles.input}
                        value={data.phone}
                        onChange={(e) => onChange("phone", e.target.value)}
                        placeholder="+503 7000 0000"
                        type="tel"
                    />
                </div>
                <div style={styles.field}>
                    <label style={styles.label}>Ciudad / Ubicación <span style={styles.optional}>(opcional)</span></label>
                    <input
                        style={styles.input}
                        value={data.location}
                        onChange={(e) => onChange("location", e.target.value)}
                        placeholder="San Salvador, El Salvador"
                    />
                </div>
            </div>
        </div>
    );
}

// ── Paso 2: Horario semanal ───────────────────────────────────────────────────
function StepSchedule({ data, onChange }) {
    const toggleDay = (dayKey) => {
        onChange("weeklyHours", {
            ...data.weeklyHours,
            [dayKey]: {
                ...data.weeklyHours[dayKey],
                enabled: !data.weeklyHours[dayKey].enabled,
            },
        });
    };

    const updateRange = (dayKey, rangeIdx, field, value) => {
        const updated = { ...data.weeklyHours };
        updated[dayKey] = { ...updated[dayKey] };
        updated[dayKey].ranges = [...updated[dayKey].ranges];
        updated[dayKey].ranges[rangeIdx] = { ...updated[dayKey].ranges[rangeIdx], [field]: value };
        onChange("weeklyHours", updated);
    };

    const addRange = (dayKey) => {
        const updated = { ...data.weeklyHours };
        updated[dayKey] = {
            ...updated[dayKey],
            ranges: [...updated[dayKey].ranges, { start: "15:00", end: "19:00" }],
        };
        onChange("weeklyHours", updated);
    };

    const removeRange = (dayKey, rangeIdx) => {
        const updated = { ...data.weeklyHours };
        updated[dayKey] = {
            ...updated[dayKey],
            ranges: updated[dayKey].ranges.filter((_, i) => i !== rangeIdx),
        };
        onChange("weeklyHours", updated);
    };

    return (
        <div style={styles.stepWrap}>
            <div style={styles.stepHeader}>
                <div style={styles.stepIconWrap}>
                    <span style={{ fontSize: 28 }}>📅</span>
                </div>
                <h2 style={styles.stepTitle}>Tu disponibilidad semanal</h2>
                <p style={styles.stepSub}>
                    Define en qué días y horarios recibes citas. Puedes editarlo después.
                </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {DAYS.map(({ key, label }) => {
                    const day = data.weeklyHours[key];
                    return (
                        <div
                            key={key}
                            style={{
                                ...styles.dayRow,
                                opacity: day.enabled ? 1 : 0.55,
                            }}
                        >
                            {/* Toggle del día */}
                            <div style={styles.dayLeft}>
                                <button
                                    type="button"
                                    onClick={() => toggleDay(key)}
                                    style={{
                                        ...styles.toggle,
                                        background: day.enabled ? "#6366f1" : "#e2e8f0",
                                    }}
                                    aria-label={`${day.enabled ? "Deshabilitar" : "Habilitar"} ${label}`}
                                >
                                    <div style={{
                                        ...styles.toggleThumb,
                                        transform: day.enabled ? "translateX(18px)" : "translateX(2px)",
                                    }} />
                                </button>
                                <span style={styles.dayLabel}>{label}</span>
                            </div>

                            {/* Rangos de horario */}
                            <div style={styles.dayRanges}>
                                {day.enabled ? (
                                    <>
                                        {day.ranges.map((range, ri) => (
                                            <div key={ri} style={styles.rangeRow}>
                                                <input
                                                    type="time"
                                                    style={styles.timeInput}
                                                    value={range.start}
                                                    onChange={(e) => updateRange(key, ri, "start", e.target.value)}
                                                />
                                                <span style={styles.timeSep}>—</span>
                                                <input
                                                    type="time"
                                                    style={styles.timeInput}
                                                    value={range.end}
                                                    onChange={(e) => updateRange(key, ri, "end", e.target.value)}
                                                />
                                                {day.ranges.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeRange(key, ri)}
                                                        style={styles.removeRangeBtn}
                                                        aria-label="Eliminar rango"
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
                                                style={styles.addRangeBtn}
                                            >
                                                + Agregar pausa de almuerzo
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <span style={{ fontSize: 13, color: "#94a3b8" }}>No disponible</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ── Paso 3: Configuración de slot + confirmación ──────────────────────────────
function StepSlot({ data, onChange, profile, schedule }) {
    const enabledDays = DAYS.filter((d) => schedule.weeklyHours[d.key]?.enabled);

    const durationLabel = (min) => {
        if (min < 60) return `${min} min`;
        const h = Math.floor(min / 60);
        const m = min % 60;
        return m ? `${h}h ${m}min` : `${h}h`;
    };

    return (
        <div style={styles.stepWrap}>
            <div style={styles.stepHeader}>
                <div style={styles.stepIconWrap}>
                    <span style={{ fontSize: 28 }}>⚙️</span>
                </div>
                <h2 style={styles.stepTitle}>Duración de tus citas</h2>
                <p style={styles.stepSub}>
                    Configura cuánto dura cada cita y si necesitas tiempo entre ellas.
                </p>
            </div>

            {/* Duración */}
            <div style={styles.field}>
                <label style={styles.label}>¿Cuánto dura cada cita?</label>
                <div style={styles.pillRow}>
                    {DURATIONS.map((min) => (
                        <button
                            key={min}
                            type="button"
                            onClick={() => onChange("duration", min)}
                            style={{
                                ...styles.pill,
                                ...(data.duration === min ? styles.pillActive : {}),
                            }}
                        >
                            {durationLabel(min)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Buffer */}
            <div style={styles.field}>
                <label style={styles.label}>Tiempo de descanso entre citas</label>
                <p style={{ ...styles.hint, marginBottom: 10 }}>
                    Tiempo para prepararte o tomar notas antes de la siguiente cita.
                </p>
                <div style={styles.pillRow}>
                    {BUFFERS.map((min) => (
                        <button
                            key={min}
                            type="button"
                            onClick={() => onChange("buffer", min)}
                            style={{
                                ...styles.pill,
                                ...(data.buffer === min ? styles.pillActive : {}),
                            }}
                        >
                            {min === 0 ? "Sin pausa" : `${min} min`}
                        </button>
                    ))}
                </div>
            </div>

            {/* Preview del resumen */}
            <div style={styles.previewCard}>
                <p style={styles.previewTitle}>Resumen de tu configuración</p>
                <div style={styles.previewGrid}>
                    <div style={styles.previewItem}>
                        <span style={styles.previewItemLabel}>Portal público</span>
                        <span style={styles.previewItemValue}>
                            myappointment.app/<strong>{profile.slug || "tu-nombre"}</strong>
                        </span>
                    </div>
                    <div style={styles.previewItem}>
                        <span style={styles.previewItemLabel}>Nombre</span>
                        <span style={styles.previewItemValue}>{profile.displayName || "—"}</span>
                    </div>
                    <div style={styles.previewItem}>
                        <span style={styles.previewItemLabel}>Rubro</span>
                        <span style={styles.previewItemValue}>
                            {RUBROS.find((r) => r.value === profile.rubro)?.label ?? "—"}
                        </span>
                    </div>
                    <div style={styles.previewItem}>
                        <span style={styles.previewItemLabel}>Días activos</span>
                        <span style={styles.previewItemValue}>
                            {enabledDays.length > 0
                                ? enabledDays.map((d) => d.label).join(", ")
                                : "Ninguno"}
                        </span>
                    </div>
                    <div style={styles.previewItem}>
                        <span style={styles.previewItemLabel}>Duración de cita</span>
                        <span style={styles.previewItemValue}>{durationLabel(data.duration)}</span>
                    </div>
                    <div style={styles.previewItem}>
                        <span style={styles.previewItemLabel}>Pausa entre citas</span>
                        <span style={styles.previewItemValue}>
                            {data.buffer === 0 ? "Sin pausa" : `${data.buffer} min`}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Pantalla de éxito ─────────────────────────────────────────────────────────
function SuccessScreen({ publicUrl, slug }) {
    const [copied, setCopied] = useState(false);

    const copyLink = async () => {
        await navigator.clipboard.writeText(publicUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div style={styles.successWrap}>
            <div style={styles.successIcon}>🎉</div>
            <h2 style={styles.successTitle}>¡Tu perfil está listo!</h2>
            <p style={styles.successSub}>
                Tu portal de reservas ya está activo. Comparte este enlace con tus clientes.
            </p>
            <div style={styles.successLinkBox}>
                <span style={styles.successLink}>{publicUrl}</span>
                <button type="button" onClick={copyLink} style={styles.copyBtn}>
                    {copied ? "✓ Copiado" : "Copiar"}
                </button>
            </div>
            <div style={styles.successActions}>
                <a href={publicUrl} target="_blank" rel="noopener noreferrer" style={styles.btnOutline}>
                    Ver mi portal →
                </a>
                <a href="/dashboard" style={styles.btnPrimary}>
                    Ir al dashboard
                </a>
            </div>
            <p style={styles.successHint}>
                También puedes agregar Google Calendar desde tu dashboard para sincronizar tu disponibilidad automáticamente.
            </p>
        </div>
    );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function OnboardingWizard({ userEmail, userId }) {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [done, setDone] = useState(false);
    const [publicUrl, setPublicUrl] = useState("");

    const [profile, setProfile] = useState({
        displayName: "",
        slug: "",
        slugManual: false,
        rubro: "",
        bio: "",
        phone: "",
        location: "",
        photoUrl: "",
    });

    const [schedule, setSchedule] = useState({
        weeklyHours: DEFAULT_WEEKLY_HOURS,
    });

    const [slot, setSlot] = useState({
        duration: 30,
        buffer: 0,
    });

    const updateProfile = useCallback((key, val) => setProfile((p) => ({ ...p, [key]: val })), []);
    const updateSchedule = useCallback((key, val) => setSchedule((s) => ({ ...s, [key]: val })), []);
    const updateSlot = useCallback((key, val) => setSlot((s) => ({ ...s, [key]: val })), []);

    // Validación por paso
    const canAdvance = () => {
        if (step === 0) {
            return (
                profile.displayName.trim().length >= 2 &&
                profile.slug.trim().length >= 3 &&
                profile.rubro
            );
        }
        if (step === 1) {
            const hasEnabledDay = DAYS.some((d) => schedule.weeklyHours[d.key]?.enabled);
            return hasEnabledDay;
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

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/onboarding", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ profile, schedule, slot }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error ?? "Ocurrió un error. Intenta de nuevo.");
                setLoading(false);
                return;
            }
            setPublicUrl(data.publicUrl);
            setDone(true);
        } catch {
            setError("Sin conexión. Verifica tu internet e intenta de nuevo.");
        } finally {
            setLoading(false);
        }
    };

    if (done) {
        return (
            <div style={styles.page}>
                <div style={styles.card}>
                    <SuccessScreen publicUrl={publicUrl} slug={profile.slug} />
                </div>
            </div>
        );
    }

    return (
        <div style={styles.page}>
            {/* Encabezado del wizard */}
            <div style={styles.topBar}>
                <span style={styles.brand}>My Appointment</span>
                <span style={styles.userEmail}>{userEmail}</span>
            </div>

            <div style={styles.card}>
                <ProgressBar step={step} />

                {/* Contenido del paso actual */}
                <div style={styles.stepContent}>
                    {step === 0 && (
                        <StepProfile data={profile} onChange={updateProfile} />
                    )}
                    {step === 1 && (
                        <StepSchedule data={schedule} onChange={updateSchedule} />
                    )}
                    {step === 2 && (
                        <StepSlot
                            data={slot}
                            onChange={updateSlot}
                            profile={profile}
                            schedule={schedule}
                        />
                    )}
                </div>

                {/* Error global */}
                {error && (
                    <div style={styles.errorBox}>
                        <span style={{ fontSize: 16 }}>⚠️</span> {error}
                    </div>
                )}

                {/* Navegación */}
                <div style={styles.nav}>
                    {step > 0 ? (
                        <button
                            type="button"
                            onClick={() => setStep((s) => s - 1)}
                            style={styles.btnBack}
                            disabled={loading}
                        >
                            ← Atrás
                        </button>
                    ) : (
                        <div />
                    )}
                    <button
                        type="button"
                        onClick={handleNext}
                        disabled={!canAdvance() || loading}
                        style={{
                            ...styles.btnNext,
                            opacity: !canAdvance() || loading ? 0.5 : 1,
                            cursor: !canAdvance() || loading ? "not-allowed" : "pointer",
                        }}
                    >
                        {loading ? "Guardando..." : step === 2 ? "Finalizar y activar mi portal" : "Continuar →"}
                    </button>
                </div>

                {step === 0 && (
                    <p style={styles.footerNote}>
                        Puedes modificar toda esta información desde tu dashboard en cualquier momento.
                    </p>
                )}
            </div>
        </div>
    );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = {
    page: {
        minHeight: "100vh",
        background: "#f8fafc",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "0 16px 40px",
    },
    topBar: {
        width: "100%",
        maxWidth: 680,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "20px 0 16px",
    },
    brand: {
        fontSize: 17,
        fontWeight: 700,
        color: "#4f46e5",
        letterSpacing: "-0.3px",
    },
    userEmail: {
        fontSize: 13,
        color: "#64748b",
    },
    card: {
        width: "100%",
        maxWidth: 680,
        background: "#ffffff",
        borderRadius: 20,
        border: "1px solid #e2e8f0",
        padding: "32px 36px 28px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 24px rgba(99,102,241,0.06)",
    },

    // Progress bar
    progressWrap: {
        display: "flex",
        alignItems: "center",
        marginBottom: 36,
    },
    progressStep: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        flex: 1,
    },
    progressDot: {
        width: 32,
        height: 32,
        borderRadius: "50%",
        background: "#f1f5f9",
        border: "2px solid #e2e8f0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        transition: "all 0.25s ease",
    },
    progressDotActive: {
        background: "#6366f1",
        border: "2px solid #6366f1",
    },
    progressDotDone: {
        background: "#6366f1",
        border: "2px solid #6366f1",
    },
    progressLabel: {
        fontSize: 13,
        whiteSpace: "nowrap",
    },
    progressLine: {
        flex: 1,
        height: 2,
        borderRadius: 1,
        marginLeft: 8,
        transition: "background 0.3s ease",
    },

    // Paso
    stepContent: { minHeight: 380 },
    stepWrap: { display: "flex", flexDirection: "column", gap: 0 },
    stepHeader: { textAlign: "center", marginBottom: 28 },
    stepIconWrap: {
        width: 56, height: 56, borderRadius: 16,
        background: "#eef2ff",
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 12px",
    },
    stepTitle: { fontSize: 22, fontWeight: 700, color: "#0f172a", margin: 0, letterSpacing: "-0.4px" },
    stepSub: { fontSize: 14, color: "#64748b", marginTop: 6, lineHeight: 1.6 },

    // Campos
    field: { marginBottom: 20 },
    label: { display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 7 },
    required: { color: "#6366f1" },
    optional: { fontWeight: 400, color: "#94a3b8", fontSize: 12 },
    input: {
        width: "100%",
        height: 42,
        border: "1.5px solid #e2e8f0",
        borderRadius: 10,
        padding: "0 14px",
        fontSize: 14,
        color: "#0f172a",
        background: "#fff",
        outline: "none",
        boxSizing: "border-box",
        transition: "border-color 0.15s",
    },
    textarea: {
        width: "100%",
        border: "1.5px solid #e2e8f0",
        borderRadius: 10,
        padding: "10px 14px",
        fontSize: 14,
        color: "#0f172a",
        background: "#fff",
        outline: "none",
        resize: "vertical",
        boxSizing: "border-box",
        fontFamily: "inherit",
        lineHeight: 1.6,
    },
    charCount: { textAlign: "right", fontSize: 11, color: "#94a3b8", marginTop: 4 },
    hint: { fontSize: 12, color: "#94a3b8", marginTop: 5 },
    row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },

    // Slug
    slugWrap: { display: "flex", alignItems: "center" },
    slugPrefix: {
        height: 42, display: "flex", alignItems: "center",
        padding: "0 12px", background: "#f8fafc",
        border: "1.5px solid #e2e8f0", borderRight: "none",
        borderRadius: "10px 0 0 10px",
        fontSize: 13, color: "#64748b", whiteSpace: "nowrap", flexShrink: 0,
    },
    slugInput: {
        borderRadius: "0 10px 10px 0",
        flex: 1,
    },

    // Rubros
    rubroGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
        gap: 8,
    },
    rubroBtn: {
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "10px 8px",
        border: "1.5px solid #e2e8f0", borderRadius: 12,
        background: "#fff", cursor: "pointer",
        fontSize: 13, color: "#374151",
        transition: "all 0.15s",
        gap: 4,
        textAlign: "center",
    },
    rubroBtnActive: {
        border: "1.5px solid #6366f1",
        background: "#eef2ff",
        color: "#4f46e5",
    },

    // Horario
    dayRow: {
        display: "flex",
        alignItems: "flex-start",
        gap: 16,
        padding: "12px 14px",
        border: "1px solid #f1f5f9",
        borderRadius: 12,
        background: "#fafafa",
        transition: "opacity 0.2s",
    },
    dayLeft: { display: "flex", alignItems: "center", gap: 10, width: 110, flexShrink: 0 },
    toggle: {
        width: 40, height: 22, borderRadius: 11,
        border: "none", cursor: "pointer",
        position: "relative", padding: 0,
        transition: "background 0.2s",
        flexShrink: 0,
    },
    toggleThumb: {
        position: "absolute", top: 2,
        width: 18, height: 18, borderRadius: "50%",
        background: "#fff",
        transition: "transform 0.2s",
    },
    dayLabel: { fontSize: 13, fontWeight: 500, color: "#374151", width: 70 },
    dayRanges: { flex: 1, display: "flex", flexDirection: "column", gap: 6 },
    rangeRow: { display: "flex", alignItems: "center", gap: 8 },
    timeInput: {
        height: 34, border: "1.5px solid #e2e8f0", borderRadius: 8,
        padding: "0 10px", fontSize: 13, color: "#0f172a",
        background: "#fff", outline: "none", width: 105,
    },
    timeSep: { color: "#94a3b8", fontSize: 14 },
    removeRangeBtn: {
        width: 28, height: 28, border: "1px solid #fca5a5",
        borderRadius: 6, background: "#fff5f5", color: "#ef4444",
        cursor: "pointer", fontSize: 11, display: "flex",
        alignItems: "center", justifyContent: "center",
    },
    addRangeBtn: {
        fontSize: 12, color: "#6366f1", background: "none",
        border: "1px dashed #c7d2fe", borderRadius: 8,
        padding: "5px 12px", cursor: "pointer", width: "fit-content",
    },

    // Slots
    pillRow: { display: "flex", flexWrap: "wrap", gap: 8 },
    pill: {
        padding: "8px 16px", borderRadius: 10,
        border: "1.5px solid #e2e8f0", background: "#fff",
        fontSize: 13, color: "#374151", cursor: "pointer",
        transition: "all 0.15s",
    },
    pillActive: {
        border: "1.5px solid #6366f1",
        background: "#eef2ff",
        color: "#4f46e5",
        fontWeight: 600,
    },

    // Preview resumen
    previewCard: {
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: 14,
        padding: "18px 20px",
        marginTop: 8,
    },
    previewTitle: { fontSize: 12, fontWeight: 600, color: "#6366f1", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.05em" },
    previewGrid: { display: "flex", flexDirection: "column", gap: 10 },
    previewItem: { display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 },
    previewItemLabel: { fontSize: 13, color: "#64748b", flexShrink: 0 },
    previewItemValue: { fontSize: 13, color: "#0f172a", textAlign: "right" },

    // Navegación
    nav: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 28,
        paddingTop: 20,
        borderTop: "1px solid #f1f5f9",
    },
    btnBack: {
        fontSize: 14, color: "#64748b", background: "none",
        border: "none", cursor: "pointer", padding: "10px 0",
    },
    btnNext: {
        padding: "12px 28px",
        background: "#6366f1", color: "#fff",
        border: "none", borderRadius: 12,
        fontSize: 15, fontWeight: 600,
        cursor: "pointer",
        transition: "opacity 0.15s",
        letterSpacing: "-0.2px",
    },
    footerNote: {
        textAlign: "center", fontSize: 12, color: "#94a3b8", marginTop: 14,
    },

    // Error
    errorBox: {
        display: "flex", alignItems: "center", gap: 8,
        padding: "12px 16px",
        background: "#fef2f2",
        border: "1px solid #fca5a5",
        borderRadius: 10,
        fontSize: 13, color: "#dc2626",
        marginTop: 16,
    },

    // Éxito
    successWrap: { textAlign: "center", padding: "24px 0 8px" },
    successIcon: { fontSize: 52, marginBottom: 16 },
    successTitle: { fontSize: 26, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.5px", margin: 0 },
    successSub: { fontSize: 15, color: "#64748b", marginTop: 10, lineHeight: 1.6 },
    successLinkBox: {
        display: "flex", alignItems: "center",
        background: "#f8fafc",
        border: "1.5px solid #e2e8f0",
        borderRadius: 12, overflow: "hidden",
        margin: "24px 0 20px",
    },
    successLink: {
        flex: 1, padding: "12px 16px",
        fontSize: 14, color: "#4f46e5",
        fontFamily: "monospace", textAlign: "left",
        wordBreak: "break-all",
    },
    copyBtn: {
        padding: "12px 18px",
        background: "#6366f1", color: "#fff",
        border: "none", cursor: "pointer",
        fontSize: 13, fontWeight: 600, flexShrink: 0,
    },
    successActions: { display: "flex", gap: 12, justifyContent: "center", marginBottom: 20 },
    btnPrimary: {
        padding: "12px 24px",
        background: "#6366f1", color: "#fff",
        borderRadius: 12, textDecoration: "none",
        fontSize: 14, fontWeight: 600,
    },
    btnOutline: {
        padding: "12px 24px",
        background: "#fff", color: "#6366f1",
        border: "1.5px solid #c7d2fe",
        borderRadius: 12, textDecoration: "none",
        fontSize: 14, fontWeight: 600,
    },
    successHint: { fontSize: 13, color: "#94a3b8", lineHeight: 1.6, marginTop: 8 },
};