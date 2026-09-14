import { createFileRoute, useParams } from "@tanstack/react-router";
import { PaymentForm } from "@/components/payments/PaymentForm";
import { trpc } from "@/trpc/client";

export const Route = createFileRoute("/_authed/orders/$orderId")({
  component: RouteComponent,
  staticData: {
    title: "Detalle de Orden",
  },
});

function RouteComponent() {
  const { orderId } = useParams({
    from: "/_authed/orders/$orderId",
  });

  const id = Number(orderId);
  const isValidId = !isNaN(id) && id > 0;

  const { data, isLoading, isError } = trpc.orders.getById.useQuery(
    { id: isValidId ? id : 0 },
    { enabled: isValidId },
  );

  if (!isValidId) return <h2>ID de orden inválido</h2>;
  if (isLoading) return <h2>Cargando información...</h2>;
  if (isError || !data)
    return <h2>Error al obtener la información de la orden</h2>;

  return (
    <div>
      <h2>Correlativo: {data.correlativo}</h2>
      <div>
        <strong>Cliente:</strong> {data.cliente?.nombre} -{" "}
        {data.cliente?.telefono}
      </div>
      <div>
        <h2>Equipos ingresados</h2>
        {data.equipos?.map((eq) => (
          <div key={eq.id}>
            <ul>
              <li>
                <strong>Tipo:</strong> {eq.tipo_equipo}
              </li>
              <li>
                <strong>Descripción:</strong> {eq.descripcion}
              </li>
            </ul>
            {eq.detalle?.map((de) => (
              <div key={de.id}>
                <ul>
                  <li>Item: {de.nombre_snap}</li>
                  <li>Precio Unit: {de.precio_unit_snap}</li>
                  <li>Cantidad: {de.cantidad}</li>
                  <li>Subtotal: {de.subtotal}</li>
                </ul>
              </div>
            ))}
          </div>
        ))}
      </div>
      <h3>Total: {data.total}</h3>
      <div>
        <h2>Registrar pago</h2>
        <PaymentForm orderId={id} />
      </div>
    </div>
  );
}
