import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { trpc } from "@/trpc/client";
import { openOrderPdf } from "@/lib/api";

export const Route = createFileRoute("/_authed/orders/")({
  component: RouteComponent,
});

function RouteComponent() {
  const [open, setOpen] = useState<number | null>(null);
  const { data, isLoading, isError, error } = trpc.orders.list.useQuery();

  async function handleOrdenPdf(ordenId: number) {
    try {
      await openOrderPdf(ordenId);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Error al obtener PDF");
    }
  }

  if (isLoading) return <h2>Cargando Órdenes...</h2>;
  if (isError) return <h2>Error al cargar las Órdenes: {error?.message}</h2>;

  return (
    <div>
      <ul>
        {data?.map((orden) => (
          <li key={orden.id}>
            {orden.id} - {orden.estado} - {orden.cliente?.nombre}
            <button type="button" onClick={() => handleOrdenPdf(orden.id)}>
              Ver PDF
            </button>
            <button
              type="button"
              onClick={() => setOpen(open === orden.id ? null : orden.id)}
            >
              {open === orden.id ? "Ocultar Detalles" : "Ver Detalles"}
            </button>
            {open === orden.id && (
              <div>
                <h3>Total: {orden.total}</h3>
                <h3>
                  Fecha: {new Date(orden.fecha_emision).toLocaleDateString("es-PE")}
                </h3>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
