import { trpc } from "../../../trpc/client";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/_authed/clients/")({
  component: ClientsPage,
});

function ClientsPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading, isError } = trpc.clients.list.useQuery();

  const clientesFiltrados = data?.filter(
    (cliente) =>
      cliente.nombre.toLowerCase().includes(search.toLowerCase()) ||
      cliente.telefono.includes(search),
  );

  if (isLoading) return <p>Cargando</p>;
  if (isError) return <p>Error al cargar los clientes</p>;
  return (
    <div>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Busca por nombre o numero de telefono :D"
      />
      <ul>
        {clientesFiltrados?.map((item) => (
          <li key={item.id}>
            {item.nombre} - {item.telefono} - {item.dni}
          </li>
        ))}
      </ul>
    </div>
  );
}
