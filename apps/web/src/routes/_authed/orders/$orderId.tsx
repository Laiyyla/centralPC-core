import { createFileRoute, useParams } from "@tanstack/react-router";
import { PaymentForm } from "@/components/payments/PaymentForm";
import { trpc } from "../../../trpc/client";

export const Route = createFileRoute("/_authed/orders/$orderId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { orderId } = useParams({
    from: "/_authed/orders/$orderId",
  });

  const id = Number(orderId);

  const { data, isLoading, isError } = trpc.orders.getById.useQuery({ id });

  if (isLoading) return <h2>Cargando informacion</h2>;
  if (isError) return <h2>Error al obtener la informacion</h2>;

  return (
    <div>
      <h2>{data?.correlativo}</h2>
      <div>
        {data?.cliente?.nombre}
        {data?.cliente?.telefono}
      </div>
      <div>
        <h2>Equipos ingresados</h2>
        {data?.equipos.map((eq) => (
          <div key={eq.id}>
            <ul>
              <li>{eq.tipo_equipo}</li>
              <li>{eq.descripcion}</li>
            </ul>
            {eq.detalle.map((de) => (
              <div key={de.id}>
                <ul>
                  <li>{de.nombre_snap}</li>
                  <li>{de.precio_unit_snap}</li>
                  <li>{de.cantidad}</li>
                  <li>{de.subtotal}</li>
                </ul>
              </div>
            ))}
          </div>
        ))}
      </div>
      <h3>{data?.total}</h3>
      <div>
        <h2>Registrar pago</h2>
        <PaymentForm orderId={orderId}></PaymentForm>
      </div>
    </div>
  );
}
