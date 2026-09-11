import { trpc } from "@/trpc/client";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/_authed/clients/")({
  component: ClientsPage,
});

function ClientsPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading, isError } = trpc.clients.list.useQuery();

  const clientesFiltrados = data?.filter((cliente) => {
    const searchLower = search.toLowerCase();
    const nombreMatches = cliente.nombre ? cliente.nombre.toLowerCase().includes(searchLower) : false;
    const telefonoMatches = cliente.telefono ? cliente.telefono.includes(search) : false;
    return nombreMatches || telefonoMatches;
  });

  if (isLoading) return <p>Cargando clientes...</p>;
  if (isError) return <p>Error al cargar los clientes</p>;

  return (
    <div>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Busca por nombre o número de teléfono"
      />
      <ul>
        {clientesFiltrados?.map((item) => (
          <li key={item.id}>
            {item.nombre} - {item.telefono} - {item.dni ?? "Sin DNI"}
          </li>
        ))}
      </ul>
    </div>
  );
}
