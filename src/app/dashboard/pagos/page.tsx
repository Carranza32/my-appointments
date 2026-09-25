import { getPendingBankTransfers } from "@/actions/payments";
import { PaymentsClient } from "@/components/dashboard/payments-client";

export const dynamic = "force-dynamic";

export default async function PagosPage() {
  const appointments = await getPendingBankTransfers();

  return (
    <div className="relative mx-auto max-w-7xl pb-12">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-tight text-[#1D1D1F]">
          Verificación de Pagos
        </h2>
        <p className="mt-1 text-sm text-[#86868B]">
          Revisa y valida los comprobantes de transferencia bancaria subidos por tus pacientes para confirmar sus sesiones.
        </p>
      </div>

      <PaymentsClient initialAppointments={appointments} />
    </div>
  );
}
