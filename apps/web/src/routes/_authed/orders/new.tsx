import type { EquipoBase } from "@central-pc/schemas";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ClientSelector } from "@/components/orders/ClientSelector";
import { DeviceInput } from "@/components/orders/DeviceInput";
import { trpc } from "@/trpc/client";
import { openOrderPdf } from "@/lib/api";

export const Route = createFileRoute("/_authed/orders/new")({
  component: RouteComponent,
  staticData: {
    title: "Nueva Orden",
  },
});

function RouteComponent() {
  const [clienteId, setClienteId] = useState<number | null>(null);
  const [equipos, setEquipos] = useState<EquipoBase[]>([]);
  const [observaciones, setObservaciones] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const navigate = useNavigate();

  const orderMutation = trpc.orders.create.useMutation({
    onSuccess: async (data) => {
      try {
        await openOrderPdf(data.id);
      } catch (e) {
        console.error("Error al abrir PDF:", e);
      }
      navigate({
        to: "/orders/$orderId",
        params: { orderId: String(data.id) },
      });
    },
    onError: (error) => {
      console.error("Error creando orden:", error.message);
    },
  });

  function handleSubmit() {
    setValidationError(null);
    if (!clienteId) {
      setValidationError(
        "Debe seleccionar un cliente antes de crear la orden.",
      );
      return;
    }
    if (equipos.length === 0) {
      setValidationError("Debe agregar al menos un equipo.");
      return;
    }

    orderMutation.mutate({
      cliente_id: clienteId,
      equipos: equipos,
      observaciones: observaciones,
    });
  }

  return (
    <div>
      <ClientSelector onClientSelect={setClienteId} />
      <DeviceInput onEquiposChange={setEquipos} />
      <div>
        <label>Observaciones:</label>
        <input
          type="text"
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
        />
      </div>
      {validationError && <p style={{ color: "red" }}>{validationError}</p>}
      {orderMutation.isError && (
        <p style={{ color: "red" }}>{orderMutation.error.message}</p>
      )}
      <button
        type="button"
        disabled={orderMutation.isPending}
        onClick={handleSubmit}
      >
        {orderMutation.isPending ? "Creando..." : "Crear Orden"}
      </button>
    </div>
  );
}
