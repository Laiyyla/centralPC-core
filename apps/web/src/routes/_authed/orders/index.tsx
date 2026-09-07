import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { trpc } from "../../../trpc/client";

export const Route = createFileRoute("/_authed/orders/")({
  component: RouteComponent,
});

function RouteComponent() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<number | null>(null);
  const { data, isLoading, isError } = trpc.orders.list.useQuery();

  function ordenPdf(ordenId: number) {
    const token = localStorage.getItem("token");
    window.open(
      `http://localhost:3000/api/orders/${ordenId}/pdf?token=${token}`,
      "_blank",
    );

    if (isLoading) return <h2>Cargando Ordenes..</h2>;
    if (isError) return <h2>Error al cargar las Ordenes</h2>;
  }
  return (
    <div>
      <ul>
        {data?.map((orden) => (
          <li key={orden.id}>
            {orden.id} - {orden.estado} - {orden.cliente?.nombre}
            <button type="button" onClick={() => ordenPdf(orden.id)}>
              OÑO
            </button>
            <button
              onClick={() => setOpen(open === orden.id ? null : orden.id)}
            >
              dameCLickPuto
            </button>
            {open === orden.id && (
              <div>
                <h3>{orden.total}</h3>
                <h3>
                  {new Date(orden.fecha_emision).toLocaleDateString("es-PE")}
                </h3>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
