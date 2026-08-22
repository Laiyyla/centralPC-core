import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { trpc } from "../../../trpc/client";

export const Route = createFileRoute("/_authed/catalog/")({
  component: CatalogPage,
});

function CatalogPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading, isError } = trpc.catalog.list.useQuery();

  const datosFiltrados = data?.filter((item) =>
    item.nombre.toLowerCase().includes(search.toLowerCase()),
  );

  if (isLoading) return <p>Cargando</p>;
  if (isError) return <p>Error al obtener catalogo</p>;

  return (
    <div>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Busca por nombre"
      />
      <ul>
        {datosFiltrados?.map((item) => (
          <li key={item.id}>
            {item.nombre} - {item.precio_ref} {item.tipo_item}
          </li>
        ))}
      </ul>
    </div>
  );
}
