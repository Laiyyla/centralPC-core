import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { trpc } from "@/trpc/client";

export const Route = createFileRoute("/_authed/catalog/")({
  component: CatalogPage,
  staticData: {
    title: "Catálogo",
  },
});

function CatalogPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading, isError } = trpc.catalog.list.useQuery();

  const datosFiltrados = data?.filter((item) =>
    item.nombre
      ? item.nombre.toLowerCase().includes(search.toLowerCase())
      : false,
  );

  if (isLoading) return <p>Cargando catálogo...</p>;
  if (isError) return <p>Error al obtener catálogo</p>;

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
