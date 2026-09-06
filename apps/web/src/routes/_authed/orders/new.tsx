import { EquipoBase } from "@central-pc/schemas";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ClientSelector } from "@/components/orders/ClientSelector";
import { DeviceInput } from "@/components/orders/DeviceInput";
import { trpc } from "../../../trpc/client";

export const Route = createFileRoute("/_authed/orders/new")({
  component: RouteComponent,
});

function RouteComponent() {
  const [clienteId, setClienteId] = useState<number | null>(null);
  const [equipos, setEquipos] = useState<EquipoBase[]>([]);
  const [observaciones, setObservaciones] = useState("");
  const navigate = useNavigate();
  const orderMutation = trpc.orders.create.useMutation({
    onSuccess: (data) => {
      const token = localStorage.getItem("token");
      window.open(
        `http://localhost:3000/api/orders/${data.id}/pdf?token=${token}`,
        "_blank",
      );
      navigate({
        to: "/orders/$orderId",
        params: { orderId: String(data.id) },
      });
    },
    onError: (error) => {
      console.error(error.message);
    },
  });
  return (
    <div>
      <ClientSelector onClientSelect={setClienteId} />
      <DeviceInput onEquiposChange={setEquipos}></DeviceInput>
      <input
        type="text"
        value={observaciones}
        onChange={(e) => setObservaciones(e.target.value)}
      />
      <button
        type="button"
        onClick={() =>
          orderMutation.mutate({
            cliente_id: clienteId ?? undefined,
            equipos: equipos,
            observaciones: observaciones,
          })
        }
      >
        Crear Orden
      </button>
    </div>
  );
}
