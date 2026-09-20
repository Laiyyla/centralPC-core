import { trpc } from "@/trpc/client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Search, Plus, Trash2, Package } from "lucide-react";

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

const tipoConfig: Record<string, { label: string; className: string }> = {
  servicio: { label: "Servicio", className: "border-primary text-primary" },
  producto: { label: "Producto", className: "border-success text-success" },
  combo: { label: "Combo", className: "border-accent text-accent" },
};

export function CatalogItemSelector({ onDetalleChange }: ItemInputProp) {
  const [items, setItems] = useState<SelectedItem[]>([]);
  const [search, setSearch] = useState("");

  const { data: resultados, isLoading } = trpc.catalog.list.useQuery(
    { includeInactive: false },
    { enabled: search.length >= 2 },
  );

  const catalogoFiltrado = resultados?.filter((item) =>
    item.nombre?.toLowerCase().includes(search.toLowerCase()),
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

  function agregarItem(item: {
    id: number;
    nombre: string;
    tipo_item: string;
    precio_ref: string | number;
  }) {
    const existe = items.find((i) => i.item_id === item.id);
    if (existe) {
      const updated = items.map((i) =>
        i.item_id === item.id ? { ...i, cantidad: i.cantidad + 1 } : i,
      );
      notifyChange(updated);
    } else {
      notifyChange([
        ...items,
        {
          item_id: item.id,
          nombre: item.nombre,
          cantidad: 1,
          precio_unitario: Number(item.precio_ref ?? 0),
        },
      ]);
    }
  }

  function actualizarPrecio(item_id: number, nuevoPrecio: number) {
    notifyChange(
      items.map((i) =>
        i.item_id === item_id ? { ...i, precio_unitario: nuevoPrecio } : i,
      ),
    );
  }

  function quitarItem(itemId: number) {
    notifyChange(items.filter((i) => i.item_id !== itemId));
  }

  return (
    <div className="space-y-4">
      {/* Búsqueda */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Agregar Ítems del Catálogo
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar repuesto o servicio..."
            className="pl-9"
          />
        </div>
        {search.length >= 2 && (
          <div className="rounded-md border bg-surface max-h-48 overflow-y-auto">
            {isLoading ? (
              <p className="p-3 text-sm text-muted-foreground text-center">
                Buscando...
              </p>
            ) : catalogoFiltrado?.length === 0 ? (
              <p className="p-3 text-sm text-muted-foreground text-center">
                No se encontraron ítems.
              </p>
            ) : (
              <ul className="divide-y">
                {catalogoFiltrado?.map((item) => {
                  const config = tipoConfig[item.tipo_item];
                  return (
                    <li
                      key={item.id}
                      onClick={() => agregarItem(item)}
                      className="flex items-center justify-between p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Package className="size-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{item.nombre}</p>
                          <Badge
                            variant="outline"
                            className={`text-xs mt-1 ${config?.className}`}
                          >
                            {config?.label ?? item.tipo_item}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">
                          S/ {Number(item.precio_ref).toFixed(2)}
                        </span>
                        <Button size="icon" variant="ghost" className="size-7">
                          <Plus className="size-4" />
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Items seleccionados */}
      {items.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Ítems seleccionados ({items.length})
          </Label>
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.item_id}
                className="flex items-center gap-3 rounded-md border bg-surface p-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    Cantidad: {item.cantidad}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">S/</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.precio_unitario}
                    onChange={(e) =>
                      actualizarPrecio(item.item_id, Number(e.target.value))
                    }
                    className="w-24 h-8 text-right"
                  />
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => quitarItem(item.item_id)}
                  className="size-8 text-muted-foreground hover:text-error"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
