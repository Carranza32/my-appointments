"use client";

import { useMemo, useState, useTransition, useEffect } from "react";
import {
  getAppointmentsForMonth,
  updateAppointmentStatus,
  createAppointment,
  updateAppointmentMeetingUrl,
  type AppointmentDTO,
} from "@/actions/appointments";
import { AppointmentStatus } from "@prisma/client";
import Link from "next/link";
import { getLabels } from "@/lib/labels";
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Tag, 
  CheckCircle, 
  MoreHorizontal, 
  Search, 
  Plus, 
  X, 
  User, 
  Mail, 
  Phone,
  FileText,
  Calendar,
  Video,
  Copy,
  ExternalLink
} from "lucide-react";

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const WEEKDAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const WEEKDAY_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const STATUS_THEMES: Record<
  AppointmentStatus,
  {
    card: string;
    text: string;
    dot: string;
    bar: string;
    badgeBg: string;
    label: string;
  }
> = {
  PENDIENTE: {
    card: "bg-amber-500/[0.04] border-amber-500/20 hover:bg-amber-500/[0.07] shadow-sm border-l-4 border-l-[#FF9500]",
    text: "text-[#1D1D1F]",
    dot: "bg-[#FF9500]",
    bar: "bg-[#FF9500]",
    badgeBg: "bg-[#FF9500]/10 text-[#FF9500]",
    label: "Pendiente",
  },
  CONFIRMADA: {
    card: "bg-[#007AFF]/[0.04] border-[#007AFF]/20 hover:bg-[#007AFF]/[0.07] shadow-sm border-l-4 border-l-[#007AFF]",
    text: "text-[#1D1D1F]",
    dot: "bg-[#007AFF]",
    bar: "bg-[#007AFF]",
    badgeBg: "bg-[#007AFF]/10 text-[#007AFF]",
    label: "Confirmada",
  },
  CANCELADA: {
    card: "bg-[#86868B]/[0.04] border-[#86868B]/20 hover:bg-[#86868B]/[0.07] shadow-sm border-l-4 border-l-[#86868B] opacity-60",
    text: "text-[#86868B] line-through",
    dot: "bg-[#86868B]",
    bar: "bg-[#86868B]",
    badgeBg: "bg-[#86868B]/10 text-[#86868B]",
    label: "Cancelada",
  },
};

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// Unsplash profile pictures for default mockups
const mockAvatars: Record<string, string> = {
  "Sarah Connor": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
  "John Smith": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  "Sarah Jenkins": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80",
  "Adrian Thompson": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
  "Michael Ross": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
  "Dr. Elena Rodriguez": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"
};

type Props = {
  initialAppointments: AppointmentDTO[];
  initialYear: number;
  initialMonth: number;
  professionalSlug: string;
  rubro?: string;
};

const HOURS = Array.from({ length: 15 }, (_, i) => {
  const h = i + 8; // 8:00 AM to 10:00 PM
  const label = h < 12 ? `${String(h).padStart(2, "0")}:00 AM` : h === 12 ? `12:00 PM` : `${String(h - 12).padStart(2, "0")}:00 PM`;
  return { hour: h, label };
});

export function AppointmentsCalendar({
  initialAppointments,
  initialYear,
  initialMonth,
  professionalSlug,
  rubro,
}: Props) {
  const labels = getLabels(rubro || "GENERAL");
  const [view, setView] = useState<"day" | "week" | "month">("day");
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [appointments, setAppointments] = useState<AppointmentDTO[]>(initialAppointments);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentDTO | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  // Load state tracking
  const [loadedYear, setLoadedYear] = useState(initialYear);
  const [loadedMonth, setLoadedMonth] = useState(initialMonth);

  // Form states
  const [newClientName, setNewClientName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newDate, setNewDate] = useState(() => toDateKey(new Date()));
  const [newTime, setNewTime] = useState("10:00");
  const [newNotes, setNewNotes] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  // Video meeting states
  const [isEditingMeeting, setIsEditingMeeting] = useState(false);
  const [meetingInput, setMeetingInput] = useState("");
  const [isSavingMeeting, setIsSavingMeeting] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Time tracker
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const isTodaySelected = toDateKey(now) === toDateKey(currentDate);
  const showCurrentTimeLine = view === "day" && isTodaySelected && now.getHours() >= 8 && now.getHours() < 22;
  
  // Calculate vertical top position percentage (day starts at 8 AM and ends at 10 PM, i.e., 14 hours total)
  const timeLineTopPercent = showCurrentTimeLine
    ? ((now.getHours() - 8 + now.getMinutes() / 60) / 14) * 100
    : 0;

  // DB Sync when navigating month/year
  function checkAndLoadData(targetDate: Date) {
    const targetY = targetDate.getFullYear();
    const targetM = targetDate.getMonth();

    if (targetY !== loadedYear || targetM !== loadedMonth) {
      startTransition(async () => {
        try {
          const data = await getAppointmentsForMonth(targetY, targetM);
          setAppointments(data);
          setLoadedYear(targetY);
          setLoadedMonth(targetM);
        } catch (err) {
          console.warn("Prisma queries failed in dev sandbox environment.", err);
        }
      });
    }
  }

  // Navigation handlers
  const navigate = (direction: number) => {
    const next = new Date(currentDate);
    if (view === "day") {
      next.setDate(currentDate.getDate() + direction);
    } else if (view === "week") {
      next.setDate(currentDate.getDate() + direction * 7);
    } else if (view === "month") {
      next.setMonth(currentDate.getMonth() + direction);
    }
    setCurrentDate(next);
    checkAndLoadData(next);
  };

  const setToday = () => {
    const today = new Date();
    setCurrentDate(today);
    checkAndLoadData(today);
  };

  // Week days calculator
  const weekDays = useMemo(() => {
    const start = new Date(currentDate);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Monday start
    start.setDate(diff);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [currentDate]);

  // Filter query
  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) =>
      apt.clientName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [appointments, searchQuery]);

  // Day specific appointments
  const dayAppointments = useMemo(() => {
    const key = toDateKey(currentDate);
    return filteredAppointments
      .filter((a) => toDateKey(new Date(a.startTime)) === key)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [filteredAppointments, currentDate]);

  // Action status updater
  const handleStatusChange = (id: string, status: AppointmentStatus) => {
    startTransition(async () => {
      try {
        const res = await updateAppointmentStatus(id, status);
        if ("success" in res) {
          const data = await getAppointmentsForMonth(loadedYear, loadedMonth);
          setAppointments(data);
          setSelectedAppointment((prev) => (prev && prev.id === id ? { ...prev, status } : prev));
        }
      } catch (err) {
        console.warn("Status change update ignored in sandbox development.", err);
        // Toggle status locally for mockup usability
        setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
        setSelectedAppointment((prev) => (prev && prev.id === id ? { ...prev, status } : prev));
      }
    });
  };

  // Manual appointment creation
  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!newClientName || !newClientEmail || !newClientPhone) {
      setCreateError("Complete all required fields.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await createAppointment({
          slug: professionalSlug,
          date: newDate,
          time: newTime,
          clientName: newClientName,
          clientEmail: newClientEmail,
          clientPhone: newClientPhone,
          clientMetadata: newNotes ? { Reason: newNotes } : {},
        });

        if ("error" in res) {
          setCreateError(res.error);
          return;
        }

        const data = await getAppointmentsForMonth(loadedYear, loadedMonth);
        setAppointments(data);
        setIsCreateOpen(false);
      } catch (err) {
        console.warn("Create appointment ignored in offline sandbox.", err);
        // Create local mock item for immediate visual response
        const mockStart = new Date(`${newDate}T${newTime}:00`);
        const mockEnd = new Date(mockStart.getTime() + 60 * 60 * 1000); // +1 Hour
        const newItem: AppointmentDTO = {
          id: `mock-user-create-${Date.now()}`,
          googleEventId: null,
          startTime: mockStart.toISOString(),
          endTime: mockEnd.toISOString(),
          status: "PENDIENTE",
          clientName: newClientName,
          clientEmail: newClientEmail,
          clientPhone: newClientPhone,
          clientMetadata: { Reason: newNotes || "Consultation" },
        };
        setAppointments((prev) => [...prev, newItem]);
        setIsCreateOpen(false);
      }
      
      // Reset form
      setNewClientName("");
      setNewClientEmail("");
      setNewClientPhone("");
      setNewNotes("");
    });
  };

  // Month grid
  const monthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7; // Monday start

    const cells: (Date | null)[] = [
      ...Array(firstWeekday).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
    ];
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [currentDate]);

  // Dynamic Date Header Title
  const headerTitle = useMemo(() => {
    const raw = currentDate.toLocaleDateString("es-ES", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric"
    });
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }, [currentDate]);

  return (
    <div className="w-full space-y-6">
      
      {/* 1. Main Toolbar Header */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center border border-black/[0.06] bg-white/80 backdrop-blur-2xl p-4 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
        
        {/* Navigation & Title */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-xl border border-black/[0.08] bg-[#F2F2F7]/80 p-0.5">
            <button
              onClick={() => navigate(-1)}
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white text-[#86868B] hover:text-[#1D1D1F] active:scale-[0.95] transition-all cursor-pointer"
              title="Anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={setToday}
              type="button"
              className="px-3 py-1 text-xs font-semibold text-[#007AFF] hover:text-[#0056B3] active:scale-[0.97] transition-all cursor-pointer select-none"
            >
              Hoy
            </button>
            <button
              onClick={() => navigate(1)}
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white text-[#86868B] hover:text-[#1D1D1F] active:scale-[0.95] transition-all cursor-pointer"
              title="Siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <h2 className="text-lg font-bold text-[#1D1D1F] flex items-center gap-2 tracking-tight leading-none">
            {headerTitle}
            {pending && (
              <span className="h-2 w-2 rounded-full bg-[#007AFF] animate-pulse"></span>
            )}
          </h2>
        </div>

        {/* Action Controls & Toggles */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Month, Week, Day Switcher (iOS Segmented Control) */}
          <div className="flex rounded-xl border border-black/[0.08] bg-[#F2F2F7]/80 p-0.5">
            {(["day", "week", "month"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                type="button"
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all duration-150 cursor-pointer select-none ${
                  view === v
                    ? "bg-white text-[#1D1D1F] shadow-sm font-bold"
                    : "text-[#86868B] hover:text-[#1D1D1F]"
                }`}
              >
                {v === "day" ? "Día" : v === "week" ? "Semana" : "Mes"}
              </button>
            ))}
          </div>

          <div className="h-5 w-px bg-[#E5E5EA]"></div>

          {/* Quick Search */}
          <div className="relative w-44">
            <input
              type="text"
              placeholder="Buscar cita..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-black/[0.08] bg-white/70 py-2 pl-8 pr-3 text-xs font-medium text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-none focus:bg-white focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/10 transition-all shadow-xs"
            />
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#86868B]" />
          </div>

          {/* Add appointment */}
          <button
            onClick={() => setIsCreateOpen(true)}
            type="button"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#007AFF] hover:bg-[#0062CC] px-4 py-2 text-xs font-semibold text-white shadow-[0_2px_8px_rgba(0,122,255,0.25)] active:scale-[0.98] transition-all cursor-pointer select-none"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Nueva {labels.appointment}</span>
          </button>
        </div>

      </div>

      {/* 2. Main Calendar Workspace Grid */}
      <div className="bg-white/80 backdrop-blur-2xl border border-black/[0.06] rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] w-full overflow-hidden">
        
        {/* VIEW A: DAY VIEW TIMELINE */}
        {view === "day" && (
          <div className="relative flex flex-col divide-y divide-[#E5E5EA]/60 overflow-y-auto max-h-[640px] w-full">
            {/* Empty notice if no appointments on selected day */}
            {dayAppointments.length === 0 && (
              <div className="flex items-center justify-between px-6 py-3 bg-black/[0.015] border-b border-black/[0.04] text-xs text-[#86868B]">
                <span>No hay citas programadas para este día.</span>
                <button
                  onClick={() => {
                    setNewDate(toDateKey(currentDate));
                    setIsCreateOpen(true);
                  }}
                  className="font-medium text-[#007AFF] hover:underline cursor-pointer"
                >
                  + Agendar en esta fecha
                </button>
              </div>
            )}

            <div className="relative">
              {/* Glowing Red Current Time Line Indicator */}
              {showCurrentTimeLine && (
                <div
                  className="absolute left-24 right-0 z-10 flex items-center pointer-events-none transition-all duration-300"
                  style={{ top: `${timeLineTopPercent}%` }}
                >
                  <div className="-ml-1 h-2 w-2 rounded-full bg-[#FF3B30] shadow-sm animate-ping"></div>
                  <div className="-ml-2 absolute h-2 w-2 rounded-full bg-[#FF3B30] border border-white"></div>
                  <div className="h-px w-full bg-[#FF3B30]"></div>
                </div>
              )}

              {/* Hours Grid */}
              {HOURS.map(({ hour, label }) => {
                const hourApts = dayAppointments.filter((a) => {
                  const d = new Date(a.startTime);
                  return d.getHours() === hour;
                });

                return (
                  <div key={hour} className="flex min-h-[88px] items-stretch border-b border-[#E5E5EA]/40 group/hour">
                    {/* Time Label (left column) */}
                    <div className="flex w-24 shrink-0 items-start justify-end pr-5 pt-4 text-xs font-semibold text-[#86868B] border-r border-[#E5E5EA]/60 bg-[#F5F5F7]/30 select-none">
                      {label.split(" ")[0]}
                    </div>

                    {/* Timeline Grid Cell content */}
                    <div className="flex-1 p-3.5 flex flex-wrap gap-3.5 items-stretch relative">
                      {hourApts.map((apt) => {
                        const theme = STATUS_THEMES[apt.status];
                        const reason = (apt.clientMetadata as any)?.Reason || "Consulta";
                        const hasAvatar = mockAvatars[apt.clientName];

                        return (
                          <div
                            key={apt.id}
                            onClick={() => setSelectedAppointment(apt)}
                            className={`group/card relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4 flex-1 min-w-[280px] max-w-[500px] rounded-xl border pl-5 pr-4 py-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer select-none ${theme.card}`}
                          >
                            {/* Accent Vertical Bar */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${theme.bar}`} />

                            {/* Client Avatar, Name & Info details */}
                            <div className="flex items-center gap-3">
                              <div className="relative h-9 w-9 shrink-0 rounded-full overflow-hidden border border-black/[0.06] shadow-xs">
                                {hasAvatar ? (
                                  <img
                                    src={mockAvatars[apt.clientName]}
                                    alt={apt.clientName}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="h-full w-full bg-[#007AFF] flex items-center justify-center text-white text-xs font-bold font-heading">
                                    {getInitials(apt.clientName)}
                                  </div>
                                )}
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold text-[#1D1D1F] group-hover/card:text-[#007AFF] transition-colors leading-snug">
                                  {apt.clientName}
                                </h4>
                                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-[#86868B]">
                                  <span className="flex items-center gap-1 leading-none">
                                    <Clock className="h-3 w-3 text-[#86868B]" />
                                    <span>{formatTime(apt.startTime)} - {formatTime(apt.endTime)}</span>
                                  </span>
                                  <span className="flex items-center gap-1 leading-none">
                                    <Tag className="h-3 w-3 text-[#86868B]" />
                                    <span>{reason}</span>
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Badge state indicator */}
                            <div className="flex items-center gap-2.5 self-end md:self-center">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider ${theme.badgeBg}`}>
                                {apt.status === "CONFIRMADA" ? (
                                  <CheckCircle className="h-3 w-3 text-[#007AFF] shrink-0" />
                                ) : (
                                  <span className={`h-1.5 w-1.5 rounded-full ${theme.dot} shrink-0`}></span>
                                )}
                                <span>{theme.label}</span>
                              </span>
                              <button className="p-1 rounded-lg hover:bg-[#F2F2F7] text-[#86868B] hover:text-[#1D1D1F] transition-colors cursor-pointer">
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* VIEW B: WEEK VIEW */}
        {view === "week" && (
          <div className="grid grid-cols-7 divide-x divide-[#E5E5EA]/60 overflow-x-auto min-w-[800px] w-full">
            {weekDays.map((day) => {
              const key = toDateKey(day);
              const dayApts = appointments.filter((a) => toDateKey(new Date(a.startTime)) === key);
              const isToday = toDateKey(new Date()) === key;

              return (
                <div key={key} className="flex flex-col min-h-[500px] group/week w-full">
                  {/* Column Header */}
                  <div
                    onClick={() => {
                      setCurrentDate(day);
                      setView("day");
                    }}
                    className={`p-3.5 text-center border-b border-[#E5E5EA]/60 cursor-pointer select-none transition-colors ${
                      isToday 
                        ? "bg-[#007AFF]/[0.05]" 
                        : "hover:bg-[#F2F2F7]/50"
                    }`}
                  >
                    <p className={`text-[11px] font-semibold uppercase tracking-wider ${isToday ? "text-[#007AFF]" : "text-[#86868B]"}`}>
                      {WEEKDAY_SHORT[day.getDay()]}
                    </p>
                    <p className={`mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                      isToday
                        ? "bg-[#007AFF] text-white shadow-sm"
                        : "text-[#1D1D1F]"
                    }`}>
                      {day.getDate()}
                    </p>
                  </div>

                  {/* Column content */}
                  <div className="flex-1 p-2.5 space-y-2 bg-transparent group-hover/week:bg-[#F2F2F7]/30 transition-colors">
                    {dayApts.length === 0 ? (
                      <div className="h-full flex items-center justify-center py-20">
                        <span className="text-[11px] font-medium text-[#86868B]/60 select-none">Disponible</span>
                      </div>
                    ) : (
                      dayApts.map((apt) => {
                        const theme = STATUS_THEMES[apt.status];
                        return (
                          <div
                            key={apt.id}
                            onClick={() => setSelectedAppointment(apt)}
                            className={`group/card relative overflow-hidden flex flex-col justify-between rounded-xl border pl-3.5 pr-2.5 py-2.5 hover:-translate-y-0.5 hover:shadow-xs transition-all duration-200 cursor-pointer ${theme.card}`}
                          >
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${theme.bar}`} />
                            <div>
                              <div className="flex items-center justify-between gap-1">
                                <h4 className="text-xs font-semibold text-[#1D1D1F] truncate max-w-[85px] leading-tight group-hover/card:text-[#007AFF] transition-colors">
                                  {apt.clientName}
                                </h4>
                                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${theme.dot}`}></span>
                              </div>
                              <p className="mt-1 flex items-center gap-1 text-[10px] font-medium text-[#86868B] leading-none">
                                <Clock className="h-3 w-3 text-[#86868B]" />
                                <span>{formatTime(apt.startTime)}</span>
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* VIEW C: MONTH VIEW */}
        {view === "month" && (
          <div className="flex flex-col w-full">
            {/* Week labels */}
            <div className="grid grid-cols-7 border-b border-[#E5E5EA]/60 bg-[#F5F5F7]/50">
              {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
                <div key={d} className="p-3 text-center text-[11px] font-semibold uppercase tracking-wider text-[#86868B] select-none">
                  {d}
                </div>
              ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 divide-x divide-y divide-[#E5E5EA]/60">
              {monthDays.map((day, i) => {
                if (!day) return <div key={`empty-${i}`} className="min-h-[110px] bg-[#F9F9FA]/40" />;

                const key = toDateKey(day);
                const dayApts = appointments.filter((a) => toDateKey(new Date(a.startTime)) === key);
                const isToday = toDateKey(new Date()) === key;
                const isSelected = key === toDateKey(currentDate);

                return (
                  <div
                    key={key}
                    onClick={() => {
                      setCurrentDate(day);
                      setView("day");
                    }}
                    className={`min-h-[110px] p-2.5 flex flex-col items-stretch justify-between group/month cursor-pointer select-none transition-colors ${
                      isSelected 
                        ? "bg-[#007AFF]/[0.05]" 
                        : "hover:bg-[#F2F2F7]/40"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                        isToday
                          ? "bg-[#007AFF] text-white shadow-sm"
                          : "text-[#1D1D1F]"
                      }`}>
                        {day.getDate()}
                      </span>
                      {dayApts.length > 0 && (
                        <span className="rounded-full bg-[#007AFF]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#007AFF]">
                          {dayApts.length}
                        </span>
                      )}
                    </div>

                    {/* Small list details inside month cell */}
                    <div className="mt-2 space-y-1 flex-1 flex flex-col justify-end overflow-hidden">
                      {dayApts.slice(0, 2).map((apt) => (
                        <div
                          key={apt.id}
                          className="rounded-md bg-[#F2F2F7] text-[9px] font-medium py-0.5 px-1.5 text-[#1D1D1F] truncate text-left w-full pointer-events-none"
                        >
                          {formatTime(apt.startTime)} {apt.clientName}
                        </div>
                      ))}
                      {dayApts.length > 2 && (
                        <div className="text-[9px] font-medium text-[#86868B] text-center uppercase tracking-wider py-0.5">
                          + {dayApts.length - 2} más
                        </div>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* 3. MODAL: DETALLES DE CITA (Responsive Apple Design 3-Tier Layout) */}
      {selectedAppointment && (
        <div 
          onClick={() => setSelectedAppointment(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/40 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3.5rem)] flex flex-col overflow-hidden rounded-[28px] border border-black/[0.08] bg-white/95 backdrop-blur-2xl shadow-[0_24px_60px_rgba(0,0,0,0.16)] animate-in zoom-in-95 duration-200"
          >
            {/* 1. STICKY HEADER */}
            <div className="p-5 sm:p-6 pb-4 border-b border-black/[0.06] bg-white/80 backdrop-blur-xl shrink-0 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative h-11 w-11 shrink-0 rounded-full overflow-hidden border border-black/[0.06] shadow-xs bg-[#F5F5F7]">
                  {mockAvatars[selectedAppointment.clientName] ? (
                    <img
                      src={mockAvatars[selectedAppointment.clientName]}
                      alt={selectedAppointment.clientName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-[#007AFF] flex items-center justify-center text-white text-sm font-semibold font-heading">
                      {getInitials(selectedAppointment.clientName)}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-[#1D1D1F] leading-tight font-heading truncate">
                    {selectedAppointment.clientName}
                  </h3>
                  <div className="mt-1 flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                      selectedAppointment.status === "CONFIRMADA"
                        ? "bg-[#007AFF]/10 text-[#007AFF]"
                        : selectedAppointment.status === "PENDIENTE"
                        ? "bg-amber-500/10 text-[#FF9500]"
                        : "bg-[#86868B]/10 text-[#86868B]"
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        selectedAppointment.status === "CONFIRMADA"
                          ? "bg-[#007AFF]"
                          : selectedAppointment.status === "PENDIENTE"
                          ? "bg-[#FF9500]"
                          : "bg-[#86868B]"
                      }`} />
                      <span>{STATUS_THEMES[selectedAppointment.status].label}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setSelectedAppointment(null)}
                type="button"
                className="h-8 w-8 rounded-full bg-black/[0.04] hover:bg-black/[0.08] active:scale-95 flex items-center justify-center text-[#86868B] hover:text-[#1D1D1F] transition-all cursor-pointer shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* 2. SCROLLABLE BODY */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 overscroll-contain text-xs font-semibold">
              
              {/* Date & Time Grid Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Date Card */}
                <div className="p-3.5 rounded-2xl border border-black/[0.06] bg-[#F5F5F7]/80 flex flex-col justify-center items-center text-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#007AFF]/10 text-[#007AFF] mb-1.5">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#86868B]">Fecha</p>
                  <p className="mt-0.5 text-xs font-bold text-[#1D1D1F]">
                    {new Date(selectedAppointment.startTime).toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" })}
                  </p>
                </div>
                {/* Time Card */}
                <div className="p-3.5 rounded-2xl border border-black/[0.06] bg-[#F5F5F7]/80 flex flex-col justify-center items-center text-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#5856D6]/10 text-[#5856D6] mb-1.5">
                    <Clock className="h-4 w-4" />
                  </div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#86868B]">Horario</p>
                  <p className="mt-0.5 text-xs font-bold text-[#1D1D1F]">
                    {formatTime(selectedAppointment.startTime)} - {formatTime(selectedAppointment.endTime)}
                  </p>
                </div>
              </div>

              {/* Service & Specialist info card */}
              {(selectedAppointment.serviceName || selectedAppointment.staffName || selectedAppointment.price) && (
                <div className="p-3.5 rounded-2xl border border-[#007AFF]/15 bg-[#007AFF]/[0.03] space-y-2">
                  {selectedAppointment.serviceName && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[#86868B] text-[11px]">Servicio:</span>
                      <span className="font-semibold text-[#007AFF]">
                        {selectedAppointment.serviceName}{" "}
                        {selectedAppointment.serviceDuration ? `(${selectedAppointment.serviceDuration} min)` : ""}
                      </span>
                    </div>
                  )}
                  {selectedAppointment.staffName && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[#86868B] text-[11px]">Especialista:</span>
                      <span className="font-semibold text-[#1D1D1F]">{selectedAppointment.staffName}</span>
                    </div>
                  )}
                  {selectedAppointment.price !== undefined && selectedAppointment.price !== null && selectedAppointment.price > 0 && (
                    <div className="flex items-center justify-between text-xs border-t border-black/[0.04] pt-1.5">
                      <span className="font-medium text-[#86868B] text-[11px]">Precio:</span>
                      <span className="font-bold text-[#34C759]">${selectedAppointment.price} {selectedAppointment.currency || "USD"}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Contacts Row Layout */}
              <div className="space-y-2.5">
                {/* Email Row */}
                <div className="flex items-center justify-between p-3 rounded-2xl border border-black/[0.06] bg-[#F5F5F7]/50 hover:bg-[#F5F5F7] transition-all">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#86868B] shadow-xs">
                      <Mail className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-[#86868B]">Correo Electrónico</p>
                      <a href={`mailto:${selectedAppointment.clientEmail}`} className="text-xs font-semibold text-[#1D1D1F] hover:text-[#007AFF] transition-colors">{selectedAppointment.clientEmail}</a>
                    </div>
                  </div>
                </div>

                {/* Phone Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-2xl border border-black/[0.06] bg-[#F5F5F7]/50 hover:bg-[#F5F5F7] transition-all gap-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#86868B] shadow-xs">
                      <Phone className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-[#86868B]">Teléfono Móvil</p>
                      <a href={`tel:${selectedAppointment.clientPhone}`} className="text-xs font-semibold text-[#1D1D1F] hover:text-[#007AFF] transition-colors">{selectedAppointment.clientPhone}</a>
                    </div>
                  </div>
                  {(() => {
                    const cleanPhone = selectedAppointment.clientPhone.replace(/[\s\-()+]/g, "");
                    const origin = typeof window !== "undefined" ? window.location.origin : "";
                    const confirmUrl = `${origin}/citas/confirmar/${selectedAppointment.id}`;
                    const cancelUrl = `${origin}/citas/cancelar/${selectedAppointment.id}`;
                    const meetingUrl = (selectedAppointment.clientMetadata as any)?.meetingUrl;
                    const meetLine = meetingUrl ? `\n\n📹 Sala de Videollamada (Google Meet / Zoom):\n${meetingUrl}` : "";
                    const appDate = new Date(selectedAppointment.startTime).toLocaleDateString("es-ES", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    });
                    const timeStr = formatTime(selectedAppointment.startTime);
                    const msg = `¡Hola ${selectedAppointment.clientName}! 👋 Te recordamos tu cita para ${selectedAppointment.serviceName || "tu sesión"} programada para el ${appDate} a las ${timeStr} hs.${meetLine}\n\n✅ Por favor confirma tu asistencia en 1 clic aquí:\n${confirmUrl}\n\n❌ Si necesitas cancelar o reprogramar:\n${cancelUrl}`;
                    return (
                      <a
                        href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-[#34C759] bg-[#34C759]/10 rounded-xl hover:bg-[#34C759]/20 active:scale-[0.97] transition-all cursor-pointer shadow-xs shrink-0"
                        title="Enviar recordatorio con enlace de confirmación directa y videollamada"
                      >
                        <span>💬 Enviar Recordatorio</span>
                      </a>
                    );
                  })()}
                </div>

                {/* Video Meeting Section (Google Meet / Zoom) */}
                {(() => {
                  const meetingUrl = (selectedAppointment.clientMetadata as any)?.meetingUrl;
                  return (
                    <div className="p-3.5 rounded-2xl border border-[#007AFF]/20 bg-[#007AFF]/[0.04] space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#007AFF]/10 text-[#007AFF] shadow-xs">
                            <Video className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#86868B]">
                              Videollamada Online
                            </p>
                            <p className="text-xs font-semibold text-[#1D1D1F]">
                              {meetingUrl
                                ? meetingUrl.includes("meet.google")
                                  ? "Google Meet"
                                  : meetingUrl.includes("zoom")
                                  ? "Zoom Meeting"
                                  : "Sesión Virtual"
                                : "Sin enlace configurado"}
                            </p>
                          </div>
                        </div>

                        {!isEditingMeeting && (
                          <button
                            type="button"
                            onClick={() => {
                              setMeetingInput(meetingUrl || "");
                              setIsEditingMeeting(true);
                            }}
                            className="text-[11px] font-medium text-[#007AFF] hover:underline cursor-pointer"
                          >
                            {meetingUrl ? "Editar enlace" : "+ Agregar enlace"}
                          </button>
                        )}
                      </div>

                      {meetingUrl && !isEditingMeeting && (
                        <div className="flex items-center gap-2 pt-0.5">
                          <a
                            href={meetingUrl.startsWith("http") ? meetingUrl : `https://${meetingUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#007AFF] hover:bg-[#0062CC] text-white text-xs font-semibold shadow-xs active:scale-[0.98] transition-all cursor-pointer"
                          >
                            <Video className="h-3.5 w-3.5" />
                            <span>Entrar a Videollamada</span>
                            <ExternalLink className="h-3 w-3 opacity-80 ml-0.5" />
                          </a>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(meetingUrl);
                              setCopyFeedback(true);
                              setTimeout(() => setCopyFeedback(false), 2000);
                            }}
                            className="px-3 py-2 rounded-xl border border-black/[0.08] bg-white hover:bg-black/[0.03] text-xs font-medium text-[#1D1D1F] transition-all cursor-pointer"
                            title="Copiar enlace"
                          >
                            {copyFeedback ? "¡Copiado!" : <Copy className="h-3.5 w-3.5 text-[#86868B]" />}
                          </button>
                        </div>
                      )}

                      {isEditingMeeting && (
                        <div className="space-y-2 pt-1">
                          <input
                            type="url"
                            placeholder="https://meet.google.com/xxx-yyyy-zzz o Zoom"
                            value={meetingInput}
                            onChange={(e) => setMeetingInput(e.target.value)}
                            className="w-full rounded-xl border border-black/[0.08] bg-white px-3 py-2 text-xs font-medium text-[#1D1D1F] focus:outline-none focus:border-[#007AFF] shadow-xs"
                          />
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const randomSlug = `${Math.random().toString(36).substring(2, 5)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`;
                                setMeetingInput(`https://meet.google.com/${randomSlug}`);
                              }}
                              className="text-[10px] font-semibold text-[#007AFF] hover:underline cursor-pointer"
                            >
                              🪄 Generar enlace Google Meet
                            </button>
                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                onClick={() => setIsEditingMeeting(false)}
                                className="px-2.5 py-1 rounded-lg border border-black/[0.08] bg-white text-[11px] font-medium text-[#86868B] hover:bg-black/[0.03] cursor-pointer"
                              >
                                Cancelar
                              </button>
                              <button
                                type="button"
                                disabled={isSavingMeeting}
                                onClick={async () => {
                                  setIsSavingMeeting(true);
                                  try {
                                    const res = await updateAppointmentMeetingUrl(selectedAppointment.id, meetingInput);
                                    if (res.success) {
                                      const updatedMeta = {
                                        ...((selectedAppointment.clientMetadata as any) || {}),
                                        meetingUrl: meetingInput.trim(),
                                      };
                                      const updatedApp = {
                                        ...selectedAppointment,
                                        clientMetadata: updatedMeta,
                                      };
                                      setSelectedAppointment(updatedApp);
                                      setAppointments((prev) =>
                                        prev.map((a) => (a.id === updatedApp.id ? updatedApp : a))
                                      );
                                      setIsEditingMeeting(false);
                                    } else {
                                      alert(res.error || "Error al guardar enlace.");
                                    }
                                  } catch {
                                    alert("Error al guardar enlace.");
                                  } finally {
                                    setIsSavingMeeting(false);
                                  }
                                }}
                                className="px-3 py-1 rounded-lg bg-[#007AFF] hover:bg-[#0062CC] text-white text-[11px] font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
                              >
                                {isSavingMeeting ? "Guardando..." : "Guardar"}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Reason Row */}
                <div className="flex items-start gap-2.5 p-3 rounded-2xl border border-black/[0.06] bg-[#F5F5F7]/50 hover:bg-[#F5F5F7] transition-all">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#86868B] shadow-xs shrink-0">
                    <FileText className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-[#86868B]">Notas de Reserva</p>
                    <p className="mt-0.5 text-xs font-normal text-[#1D1D1F] leading-relaxed">
                      {(selectedAppointment.clientMetadata as any)?.Reason || "Consulta inicial"}
                    </p>
                  </div>
                </div>

                {/* Direct Expediente Shortcut */}
                {labels.enableClinicalRecords && (
                  <div className="pt-1">
                    <Link
                      href="/dashboard/clientes"
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#007AFF]/10 hover:bg-[#007AFF]/15 text-[#007AFF] text-xs font-semibold transition-all border border-[#007AFF]/20 active:scale-[0.98] cursor-pointer"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>Ver Expediente Clínico de {selectedAppointment.clientName}</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* 3. STICKY FOOTER */}
            <div className="p-4 sm:p-5 border-t border-black/[0.06] bg-white/80 backdrop-blur-xl shrink-0 flex flex-row gap-2.5 justify-end">
              <button
                type="button"
                onClick={() => setSelectedAppointment(null)}
                className="flex-1 rounded-xl border border-black/[0.08] bg-[#F2F2F7] hover:bg-[#E5E5EA] py-2.5 text-xs font-semibold text-[#1D1D1F] cursor-pointer active:scale-[0.98] transition-all text-center select-none"
              >
                Cerrar
              </button>
              {selectedAppointment.status === AppointmentStatus.PENDIENTE && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => handleStatusChange(selectedAppointment.id, AppointmentStatus.CONFIRMADA)}
                  className="flex-1 rounded-xl bg-[#007AFF] hover:bg-[#0062CC] py-2.5 text-xs font-semibold text-white shadow-[0_2px_8px_rgba(0,122,255,0.25)] active:scale-[0.98] transition-all cursor-pointer text-center select-none"
                >
                  Confirmar {labels.appointment}
                </button>
              )}
              {selectedAppointment.status !== AppointmentStatus.CANCELADA ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => handleStatusChange(selectedAppointment.id, AppointmentStatus.CANCELADA)}
                  className="flex-1 rounded-xl border border-[#FF3B30]/20 bg-[#FF3B30]/10 hover:bg-[#FF3B30]/20 py-2.5 text-xs font-semibold text-[#FF3B30] active:scale-[0.98] transition-all cursor-pointer text-center select-none"
                >
                  Cancelar {labels.appointment}
                </button>
              ) : (
                <div className="flex-1 flex items-center justify-center py-2 text-center text-xs font-medium text-[#86868B] italic select-none">
                  Esta {labels.appointment.toLowerCase()} ha sido cancelada
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* 4. MODAL: AGENDAR CITA RAPIDA FORM (Responsive Apple Design 3-Tier Layout) */}
      {isCreateOpen && (
        <div 
          onClick={() => setIsCreateOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/40 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3.5rem)] flex flex-col overflow-hidden rounded-[28px] border border-black/[0.08] bg-white/95 backdrop-blur-2xl shadow-[0_24px_60px_rgba(0,0,0,0.16)] animate-in zoom-in-95 duration-200"
          >
            {/* 1. STICKY HEADER */}
            <div className="p-5 sm:p-6 pb-4 border-b border-black/[0.06] bg-white/80 backdrop-blur-xl shrink-0 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#1D1D1F] leading-tight font-heading">
                  Nueva {labels.appointment}
                </h3>
                <p className="mt-0.5 text-xs text-[#86868B] font-medium">
                  Crea una reserva manual en tu agenda.
                </p>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setIsCreateOpen(false)}
                type="button"
                className="h-8 w-8 rounded-full bg-black/[0.04] hover:bg-black/[0.08] active:scale-95 flex items-center justify-center text-[#86868B] hover:text-[#1D1D1F] transition-all cursor-pointer shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form wrapper */}
            <form onSubmit={handleCreateAppointment} className="flex flex-col flex-1 overflow-hidden">
              {/* 2. SCROLLABLE BODY */}
              <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 overscroll-contain">
                {createError && (
                  <p className="rounded-2xl border border-red-200/60 bg-red-50/80 p-3.5 text-xs font-semibold text-[#FF3B30]">
                    {createError}
                  </p>
                )}

                {/* CARD 1: DATOS DEL PACIENTE */}
                <div className="p-4 sm:p-5 rounded-2xl border border-black/[0.06] bg-[#F5F5F7]/80 space-y-3.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#86868B]">
                    Información del Cliente
                  </p>

                  {/* Client Name */}
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#1D1D1F]">
                      Nombre del Cliente <span className="text-[#FF3B30]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Sofia Martínez"
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      className="w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 text-xs font-medium text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/10 transition-all shadow-xs"
                    />
                  </div>

                  {/* Contact Fields Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Email */}
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-[#1D1D1F]">
                        Correo Electrónico <span className="text-[#FF3B30]">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="sofia@example.com"
                        value={newClientEmail}
                        onChange={(e) => setNewClientEmail(e.target.value)}
                        className="w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 text-xs font-medium text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/10 transition-all shadow-xs"
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-[#1D1D1F]">
                        Teléfono Móvil <span className="text-[#FF3B30]">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="+52 55 1234 5678"
                        value={newClientPhone}
                        onChange={(e) => setNewClientPhone(e.target.value)}
                        className="w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 text-xs font-medium text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/10 transition-all shadow-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* CARD 2: DETALLES DE LA CITA */}
                <div className="p-4 sm:p-5 rounded-2xl border border-black/[0.06] bg-[#F5F5F7]/80 space-y-3.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#86868B]">
                    Fecha y Horario
                  </p>

                  {/* DateTime Selection Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Date */}
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-[#1D1D1F]">
                        Fecha <span className="text-[#FF3B30]">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                        className="w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 text-xs font-medium text-[#1D1D1F] focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/10 transition-all shadow-xs"
                      />
                    </div>

                    {/* Time */}
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-[#1D1D1F]">
                        Hora de Inicio <span className="text-[#FF3B30]">*</span>
                      </label>
                      <select
                        value={newTime}
                        onChange={(e) => setNewTime(e.target.value)}
                        className="w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 text-xs font-medium text-[#1D1D1F] focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/10 transition-all shadow-xs cursor-pointer"
                      >
                        {Array.from({ length: 24 }, (_, i) => {
                          const hour = Math.floor(i / 2) + 8;
                          const minutes = i % 2 === 0 ? "00" : "30";
                          const timeStr = `${String(hour).padStart(2, "0")}:${minutes}`;
                          return (
                            <option key={timeStr} value={timeStr} className="bg-white">
                              {timeStr}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#1D1D1F]">
                      Notas o Motivo de la Cita (Opcional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Instrucciones o motivo de la consulta..."
                      value={newNotes}
                      onChange={(e) => setNewNotes(e.target.value)}
                      className="w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 text-xs font-medium text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/10 transition-all shadow-xs resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* 3. STICKY FOOTER */}
              <div className="p-4 sm:p-5 border-t border-black/[0.06] bg-white/80 backdrop-blur-xl shrink-0 flex flex-row gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="flex-1 sm:flex-none sm:min-w-[120px] rounded-xl border border-black/[0.08] bg-[#F2F2F7] hover:bg-[#E5E5EA] py-2.5 px-5 text-xs font-semibold text-[#1D1D1F] cursor-pointer active:scale-[0.98] transition-all text-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="flex-1 sm:flex-none sm:min-w-[160px] rounded-xl bg-[#007AFF] hover:bg-[#0062CC] py-2.5 px-6 text-xs font-semibold text-white shadow-[0_2px_8px_rgba(0,122,255,0.25)] active:scale-[0.98] transition-all cursor-pointer select-none text-center"
                >
                  {pending ? "Guardando..." : "Guardar Cita"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
