"use client";

import React from "react";
import { CreditCard, DollarSign, Shuffle, CheckCircle } from "lucide-react";
import { ChoiceCard } from "@/components/onboarding/cards/choice-card";

interface StepPaymentsProps {
  paymentPreference: "upfront" | "later" | "both" | "none";
  onChangePaymentPreference: (val: "upfront" | "later" | "both" | "none") => void;
}

export function StepPayments({
  paymentPreference,
  onChangePaymentPreference,
}: StepPaymentsProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-sm text-[#6E6E73]">
          Elige cómo prefieres gestionar los cobros de tus servicios y citas.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <ChoiceCard
          id="pay-later"
          title="Pago presencial / al terminar el servicio"
          description="Los clientes reservan sin pagar online. Pagan en efectivo, terminal física o transferencia al momento de su cita."
          icon={<DollarSign className="w-5 h-5" />}
          badge="Recomendado para empezar"
          isSelected={paymentPreference === "later"}
          onClick={() => onChangePaymentPreference("later")}
        />

        <ChoiceCard
          id="pay-upfront"
          title="Pago o anticipo obligatorio online"
          description="Para asegurar la cita, el cliente debe realizar el pago mediante pasarela (Wompi, tarjeta) o transferencia bancaria."
          icon={<CreditCard className="w-5 h-5" />}
          isSelected={paymentPreference === "upfront"}
          onClick={() => onChangePaymentPreference("upfront")}
        />

        <ChoiceCard
          id="pay-both"
          title="Modalidad mixta / flexible"
          description="El cliente puede elegir si desea pagar de inmediato en línea o pagar en persona al asistir."
          icon={<Shuffle className="w-5 h-5" />}
          isSelected={paymentPreference === "both"}
          onClick={() => onChangePaymentPreference("both")}
        />

        <ChoiceCard
          id="pay-none"
          title="Sin cobros / Servicios gratuitos o de valoración"
          description="No se solicita ningún método de pago ni se muestran precios obligatorios."
          icon={<CheckCircle className="w-5 h-5" />}
          isSelected={paymentPreference === "none"}
          onClick={() => onChangePaymentPreference("none")}
        />
      </div>
    </div>
  );
}
