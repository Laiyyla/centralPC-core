import { createFileRoute, useParams } from "@tanstack/react-router";
import { trpc } from "@/trpc/client";

export const Route = createFileRoute("/_authed/clients/$clientId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { clientId } = useParams({
    from: "/_authed/clients/$clientId",
  });

  const id = Number(clientId);
  const isValid = !isNaN(id) && id > 0;

  const { data, isLoading, isError } = trpc.clients.getById.useQuery(
    { id: isValid ? id : 0 },
    { enabled: isValid },
  );

  if (!isValid) return <h2>Id de cliente Invalido</h2>;
  if (isLoading) return <h2>Cargando Informacion de Cliente</h2>;
  if (isError || !data) return <h2>Error al Obtener la Info del Cliente</h2>;

  return (
    <div>
      <h2>
        <strong>Cliente: </strong>
        {data.nombre}
      </h2>
      <div>
        <h3>Datos</h3>
        {data.telefono}
      </div>
    </div>
  );
}
