import { trpc } from "@/trpc/client";
import { useState } from "react";

type ItemInputProp = {
  onDetalleChange: (
    items: { item_id: number; cantidad: number; precio_unitario: number }[],
  ) => void;
};

type SelectedItem = {
  item_id: number;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
};

export function CatalogItemSelector({ onDetalleChange }: ItemInputProp) {
  const [items, setItems] = useState<SelectedItem[]>([]);
  const [search, setSearch] = useState("");

  const { data: resultados } = trpc.catalog.list.useQuery(
    {
      includeInactive: false,
    },
    { enabled: search.length >= 2 },
  );

  const catalogoFiltrado = resultados?.filter((item) =>
    item.nombre ? item.nombre.toLowerCase().includes(search.toLowerCase()) : false,
  );

  function notifyChange(newItems: SelectedItem[]) {
    setItems(newItems);
    onDetalleChange(
      newItems.map(({ item_id, cantidad, precio_unitario }) => ({
        item_id,
        cantidad,
        precio_unitario,
      })),
    );
  }

  function agregarItem(item: { id: number; nombre: string; precio_ref: string | number }) {
    const existe = items.find((i) => i.item_id === item.id);
    if (existe) {
      const updated = items.map((i) =>
        i.item_id === item.id ? { ...i, cantidad: i.cantidad + 1 } : i,
      );
      notifyChange(updated);
    } else {
      const nuevo = [
        ...items,
        {
          item_id: item.id,
          nombre: item.nombre,
          cantidad: 1,
          precio_unitario: Number(item.precio_ref ?? 0),
        },
      ];
      notifyChange(nuevo);
    }
  }

  function actualizarPrecio(item_id: number, nuevoPrecio: number) {
    const updated = items.map((i) =>
      i.item_id === item_id ? { ...i, precio_unitario: nuevoPrecio } : i,
    );
    notifyChange(updated);
  }

  function quitarItem(itemId: number) {
    const itemFiltrado = items.filter((i) => i.item_id !== itemId);
    notifyChange(itemFiltrado);
  }

  return (
    <div>
      <div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar repuesto / servicio..."
        />
        {search.length >= 2 && (
          <ul>
            {catalogoFiltrado?.map((item) => (
              <li
                key={item.id}
                onClick={() => agregarItem(item)}
                style={{ cursor: "pointer" }}
              >
                {item.nombre} - {item.tipo_item} - S/.{item.precio_ref}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <h4>Items seleccionados</h4>
        {items.map((item) => (
          <div key={item.item_id}>
            <span>{item.nombre}</span> - <span>x{item.cantidad}</span>
            <input
              type="number"
              step="0.01"
              value={item.precio_unitario}
              onChange={(e) =>
                actualizarPrecio(item.item_id, Number(e.target.value))
              }
            />
            <button type="button" onClick={() => quitarItem(item.item_id)}>
              Eliminar item
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
