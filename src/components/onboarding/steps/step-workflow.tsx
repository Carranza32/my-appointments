"use client";

import React from "react";
import { User, Users, MapPin, Building, ShieldCheck, Box, Video, Globe } from "lucide-react";
import { ChoiceCard } from "@/components/onboarding/cards/choice-card";
import type { OnboardingAnswers, PresetRecommendation } from "@/lib/onboarding/types";

interface StepWorkflowProps {
  answers: OnboardingAnswers;
  preset?: PresetRecommendation;
  onChangeTeamStructure: (val: "solo" | "team_selectable" | "team_assigned") => void;
  onChangeLocationType: (val: "single" | "multiple" | "none_online" | "none_domicilio") => void;
  onChangeModality: (val: "presencial" | "online" | "domicilio" | "hybrid") => void;
  onChangeUsesResources: (val: "yes" | "no") => void;
}

export function StepWorkflow({
  answers,
  preset,
  onChangeTeamStructure,
  onChangeLocationType,
  onChangeModality,
  onChangeUsesResources,
}: StepWorkflowProps) {
  const isSpaceBooking = answers.bookingItemType === "space" || answers.category === "espacios";
  const isOnlineOnly = answers.locationType === "none_online" && answers.modality === "online";

  const term = preset?.defaultTerminology || {
    client: "Cliente",
    appointment: "Cita",
    service: "Servicio",
    staff: "Especialista",
    location: "Consultorio / Sede",
  };

  const staffTerm = term.staff.toLowerCase();
  const clientTerm = term.client.toLowerCase();
  const appointmentTerm = term.appointment.toLowerCase();
  const locationTerm = term.location.toLowerCase();

  const handleSelectLocationOption = (
    locType: "single" | "multiple" | "none_online",
    modality: "presencial" | "online" | "hybrid"
  ) => {
    onChangeLocationType(locType);
    onChangeModality(modality);
    // If online only, automatically set physical resources to "no"
    if (locType === "none_online") {
      onChangeUsesResources("no");
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Team / Staff Structure */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold tracking-[-0.01em] text-[#1D1D1F]">
          {isSpaceBooking
            ? "1. ¿Cómo se gestiona la atención en tus instalaciones?"
            : `1. ¿Cómo está conformado tu equipo de trabajo?`}
        </label>

        <div className="grid grid-cols-1 gap-3">
          <ChoiceCard
            id="team-solo"
            title={
              isSpaceBooking
                ? "Reserva directa de las instalaciones (sin personal)"
                : "Trabajo por mi cuenta (solo yo)"
            }
            description={
              isSpaceBooking
                ? "Los clientes reservan directamente el espacio o cancha disponible sin requerir personal asignado."
                : `Soy el único ${staffTerm}. Todas las ${appointmentTerm}s y reservas son directamente conmigo.`
            }
            icon={<User className="w-5 h-5" />}
            isSelected={answers.teamStructure === "solo"}
            onClick={() => onChangeTeamStructure("solo")}
          />

          <ChoiceCard
            id="team-selectable"
            title={`Equipo con elección de ${staffTerm}`}
            description={`Tengo varios ${staffTerm}s y el ${clientTerm} puede elegir con quién agendar su ${appointmentTerm}.`}
            icon={<Users className="w-5 h-5" />}
            badge="Más popular"
            isSelected={answers.teamStructure === "team_selectable"}
            onClick={() => onChangeTeamStructure("team_selectable")}
          />

          <ChoiceCard
            id="team-assigned"
            title="Equipo con asignación automática o interna"
            description={`El ${clientTerm} reserva el servicio y el negocio asigna el ${staffTerm} disponible automáticamente.`}
            icon={<ShieldCheck className="w-5 h-5" />}
            isSelected={answers.teamStructure === "team_assigned"}
            onClick={() => onChangeTeamStructure("team_assigned")}
          />
        </div>
      </div>

      {/* 2. Locations / Modalidad de Atención */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold tracking-[-0.01em] text-[#1D1D1F]">
          {`2. ¿Dónde y cómo atiendes a tus ${clientTerm}s?`}
        </label>

        <div className="grid grid-cols-1 gap-3">
          <ChoiceCard
            id="loc-single"
            title={`Presencial en un ${locationTerm}`}
            description={`Tengo una ubicación física fija a donde acuden los ${clientTerm}s a recibir su ${appointmentTerm}.`}
            icon={<MapPin className="w-5 h-5" />}
            isSelected={answers.locationType === "single" && answers.modality === "presencial"}
            onClick={() => handleSelectLocationOption("single", "presencial")}
          />

          <ChoiceCard
            id="loc-hybrid"
            title="Presencial y por Videollamada (Modalidad Híbrida)"
            description={`Atiendo en mi ${locationTerm} físico y también ofrezco ${appointmentTerm}s virtuales por videollamada.`}
            icon={<Video className="w-5 h-5" />}
            badge="Híbrido"
            isSelected={answers.locationType === "single" && answers.modality === "hybrid"}
            onClick={() => handleSelectLocationOption("single", "hybrid")}
          />

          <ChoiceCard
            id="loc-multiple"
            title={`En múltiples ${locationTerm}s físicas`}
            description={`Cuento con 2 o más ubicaciones físicas y el ${clientTerm} puede elegir a cuál asistir.`}
            icon={<Building className="w-5 h-5" />}
            isSelected={answers.locationType === "multiple"}
            onClick={() => handleSelectLocationOption("multiple", "presencial")}
          />

          <ChoiceCard
            id="loc-remote"
            title="Exclusivamente Online o a Domicilio"
            description={`Sin local físico fijo; atención por videollamada o visita en el domicilio del ${clientTerm}.`}
            icon={<Globe className="w-5 h-5" />}
            isSelected={answers.locationType === "none_online" || answers.locationType === "none_domicilio"}
            onClick={() => handleSelectLocationOption("none_online", "online")}
          />
        </div>
      </div>

      {/* 3. Physical Resources (Progressive disclosure: hidden if 100% online) */}
      {!isOnlineOnly && (
        <div className="space-y-3 pt-2 animate-in fade-in duration-200">
          <label className="block text-sm font-semibold tracking-[-0.01em] text-[#1D1D1F]">
            3. ¿Necesitas gestionar recursos o espacios limitados?
          </label>
          <p className="text-xs text-[#86868B]">
            {preset?.category === "salud"
              ? "Por ejemplo: Consultorios específicos, salas de procedimiento, sillones de exploración o aparatología médica."
              : "Por ejemplo: Canchas de pádel, cabinas de spa/masaje, salas de juntas, sillones dentales o aparatología especializada."}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ChoiceCard
              id="res-no"
              title="No requiero recursos"
              description="La disponibilidad depende únicamente del horario del personal o negocio."
              isSelected={answers.usesPhysicalResources === "no"}
              onClick={() => onChangeUsesResources("no")}
            />

            <ChoiceCard
              id="res-yes"
              title="Sí, requiero controlar recursos"
              description="Se debe bloquear el espacio o equipo físico para evitar doble reserva."
              badge={isSpaceBooking ? "Recomendado" : undefined}
              isSelected={answers.usesPhysicalResources === "yes"}
              onClick={() => onChangeUsesResources("yes")}
            />
          </div>
        </div>
      )}
    </div>
  );
}
