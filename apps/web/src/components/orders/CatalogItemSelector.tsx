import { trpc } from "../../trpc/client";
import { useState } from "react";
type ItemInputProp = {
  onDetalleChange: (
    items: { item_id: number; cantidad: number; precio_unitario: number }[],
  ) => void;
};
export function CatalogItemSelector({ onDetalleChange }: ItemInputProp) {
  const [items, setItems] = useState<
    { item_id: number; cantidad: number; precio_unitario: number }[]
  >([]);
  const [search, setSearch] = useState("");
  const { data: resultados } = trpc.catalog.list.useQuery(
    {
      includeInactive: false,
    },
    { enabled: search.length >= 2 },
  );
  const catalogoFiltrado = resultados?.filter((item) =>
    item.nombre.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
  );
  function agregarItem(item: { id: number }) {
    const existe = items.find((i) => i.item_id === item.id);
    if (existe) {
      const updated = items.map((i) =>
        i.item_id === item.id ? { ...i, cantidad: i.cantidad + 1 } : i,
      );
      setItems(updated);
      onDetalleChange(updated);
    } else {
      const itemCatalogo = resultados?.find((r) => r.id === item.id);
      const nuevo = [
        ...items,
        {
          item_id: item.id,
          cantidad: 1,
          precio_unitario: Number(itemCatalogo?.precio_ref ?? 0),
        },
      ];
      setItems(nuevo);
      onDetalleChange(nuevo);
    }
  }
  function actualizarPrecio(item_id: number, nuevoPrecio: number) {
    const updated = items.map((i) =>
      i.item_id === item_id ? { ...i, precio_unitario: nuevoPrecio } : i,
    );
    setItems(updated);
    onDetalleChange(updated);
  }
  function quitarItem(index: number) {
    const itemFiltrado = items.filter((_, i) => i !== index);
    setItems(itemFiltrado);
    onDetalleChange(itemFiltrado);
  }

  return (
    <div>
      <div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search.length >= 2 && (
          <ul>
            {catalogoFiltrado?.map((item) => (
              <li key={item.id} onClick={() => agregarItem(item)}>
                {item.nombre} - {item.tipo_item} - {item.precio_ref}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <h2>Items seleccionados</h2>
        {items.map((item, i) => {
          const catalogo = resultados?.find((r) => r.id === item.item_id);
          return (
            <div key={i}>
              <h3>{catalogo?.nombre}</h3>
              <h3>{item.cantidad}</h3>
              <input
                type="number"
                value={item.precio_unitario}
                onChange={(e) =>
                  actualizarPrecio(item.item_id, Number(e.target.value))
                }
              />
              <button type="button" onClick={() => quitarItem(i)}>
                Eliminar item
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
