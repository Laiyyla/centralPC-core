import { useState } from "react";
import { keepPreviousData } from "@tanstack/react-query";
import { trpc } from "@/trpc/client";
import { useDebounce } from "@/hooks/use-debounce";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Trash2,
  Package,
  Wrench,
  X,
  Loader2,
  Sparkles,
} from "lucide-react";

export type DetalleItemInput = {
  item_id?: number;
  nombre_personalizado?: string;
  cantidad: number;
  precio_unitario: number;
};

type ItemInputProp = {
  onDetalleChange: (items: DetalleItemInput[]) => void;
};

type SelectedItem = {
  temp_id: string;
  item_id?: number;
  nombre: string;
  tipo_item?: string;
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
  const debouncedSearch = useDebounce(search, 300);

  // Estado para creación rápida
  const [modoCrear, setModoCrear] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoTipo, setNuevoTipo] = useState<"servicio" | "producto">("servicio");
  const [nuevoPrecio, setNuevoPrecio] = useState("");
  const [guardarEnCatalogo, setGuardarEnCatalogo] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const utils = trpc.useUtils();

  const { data: resultados, isLoading } = trpc.catalog.list.useQuery(
    {
      search: debouncedSearch.trim(),
      limit: 50,
      includeInactive: false,
    },
    {
      enabled: debouncedSearch.trim().length >= 2,
      placeholderData: keepPreviousData,
    },
  );

  const crearItemCatalogo = trpc.catalog.create.useMutation({
    onSuccess: (data) => {
      toast.success("Ítem registrado en catálogo");
      utils.catalog.list.invalidate();
      const newItem: SelectedItem = {
        temp_id: `cat_${data.id}_${Date.now()}`,
        item_id: data.id,
        nombre: data.nombre,
        tipo_item: data.tipo_item,
        cantidad: 1,
        precio_unitario: Number(data.precio_ref),
      };
      notifyChange([...items, newItem]);
      resetForm();
    },
    onError: (err) => {
      toast.error("Error al crear ítem en catálogo", {
        description: err.message,
      });
    },
  });

  function notifyChange(newItems: SelectedItem[]) {
    setItems(newItems);
    onDetalleChange(
      newItems.map((item) =>
        item.item_id
          ? {
              item_id: item.item_id,
              cantidad: item.cantidad,
              precio_unitario: item.precio_unitario,
            }
          : {
              nombre_personalizado: item.nombre,
              cantidad: item.cantidad,
              precio_unitario: item.precio_unitario,
            },
      ),
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
          temp_id: `cat_${item.id}_${Date.now()}`,
          item_id: item.id,
          nombre: item.nombre,
          tipo_item: item.tipo_item,
          cantidad: 1,
          precio_unitario: Number(item.precio_ref ?? 0),
        },
      ]);
    }
    setSearch("");
  }

  function abrirCrear(nombreInicial = "") {
    setNuevoNombre(nombreInicial || search.trim());
    setNuevoTipo("servicio");
    setNuevoPrecio("");
    setGuardarEnCatalogo(false);
    setFormError(null);
    setModoCrear(true);
  }

  function resetForm() {
    setModoCrear(false);
    setNuevoNombre("");
    setNuevoPrecio("");
    setGuardarEnCatalogo(false);
    setFormError(null);
    setSearch("");
  }

  function handleGuardarNuevoItem(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setFormError(null);

    const nombreTrim = nuevoNombre.trim();
    if (!nombreTrim) {
      setFormError("El nombre del ítem es requerido.");
      return;
    }
    const precioNum = Number(nuevoPrecio);
    if (nuevoPrecio === "" || isNaN(precioNum) || precioNum < 0) {
      setFormError("Ingrese un precio válido (mayor o igual a 0).");
      return;
    }

    if (guardarEnCatalogo) {
      crearItemCatalogo.mutate({
        nombre: nombreTrim,
        tipo: nuevoTipo,
        precio_referencial: precioNum.toFixed(2),
      });
    } else {
      const newItem: SelectedItem = {
        temp_id: `custom_${Date.now()}`,
        nombre: nombreTrim,
        tipo_item: nuevoTipo,
        cantidad: 1,
        precio_unitario: precioNum,
      };
      notifyChange([...items, newItem]);
      toast.success("Ítem agregado al equipo");
      resetForm();
    }
  }

  function actualizarPrecio(tempId: string, nuevoPrecio: number) {
    notifyChange(
      items.map((i) =>
        i.temp_id === tempId ? { ...i, precio_unitario: Math.max(0, nuevoPrecio) } : i,
      ),
    );
  }

  function actualizarCantidad(tempId: string, delta: number) {
    const updated = items
      .map((i) => {
        if (i.temp_id === tempId) {
          const nuevaCant = i.cantidad + delta;
          return nuevaCant > 0 ? { ...i, cantidad: nuevaCant } : null;
        }
        return i;
      })
      .filter(Boolean) as SelectedItem[];
    notifyChange(updated);
  }

  function quitarItem(tempId: string) {
    notifyChange(items.filter((i) => i.temp_id !== tempId));
  }

  return (
    <div className="space-y-4">
      {/* Sección Búsqueda / Modo Crear */}
      {!modoCrear ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              Agregar Ítems / Trabajos
            </Label>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar repuesto o servicio..."
                className="pl-9"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => abrirCrear()}
              className="shrink-0"
            >
              <Plus className="size-4 mr-1" />
              <span className="hidden sm:inline">Nuevo Ítem</span>
              <span className="sm:hidden">Nuevo</span>
            </Button>
          </div>

          {/* Desplegable de Resultados de Búsqueda */}
          {debouncedSearch.trim().length >= 2 && (
            <div className="rounded-md border bg-surface max-h-56 overflow-y-auto shadow-sm">
              {isLoading ? (
                <div className="flex items-center justify-center p-4 text-sm text-muted-foreground gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Buscando en catálogo...
                </div>
              ) : !resultados || resultados.length === 0 ? (
                <div className="p-4 text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    No se encontraron ítems para "{debouncedSearch}".
                  </p>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    onClick={() => abrirCrear(debouncedSearch)}
                    className="text-primary gap-1"
                  >
                    <Plus className="size-4" />
                    Crear "{debouncedSearch}" como nuevo ítem
                  </Button>
                </div>
              ) : (
                <ul className="divide-y">
                  {resultados.map((item) => {
                    const config = tipoConfig[item.tipo_item];
                    return (
                      <li
                        key={item.id}
                        onClick={() => agregarItem(item)}
                        className="flex items-center justify-between p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          {item.tipo_item === "servicio" ? (
                            <Wrench className="size-4 text-primary shrink-0" />
                          ) : (
                            <Package className="size-4 text-success shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">
                              {item.nombre}
                            </p>
                            <Badge
                              variant="outline"
                              className={`text-[10px] mt-0.5 px-1.5 py-0 ${config?.className}`}
                            >
                              {config?.label ?? item.tipo_item}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-sm font-semibold whitespace-nowrap">
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
      ) : (
        /* Formulario de Creación Rápida Inline */
        <div className="rounded-lg border bg-surface p-4 space-y-4 shadow-sm animate-in fade-in-50 duration-200">
          <div className="flex items-center justify-between pb-1 border-b">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <h4 className="font-medium text-foreground text-sm sm:text-base">
                Nuevo Ítem / Trabajo
              </h4>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={resetForm}
              disabled={crearItemCatalogo.isPending}
            >
              <X className="size-4" />
            </Button>
          </div>

          <form onSubmit={handleGuardarNuevoItem} className="space-y-4">
            {/* Campo Nombre */}
            <div className="space-y-1.5">
              <Label htmlFor="nuevoItemNombre" className="text-xs font-medium">
                Nombre del ítem o trabajo *
              </Label>
              <Input
                id="nuevoItemNombre"
                value={nuevoNombre}
                onChange={(e) => setNuevoNombre(e.target.value)}
                placeholder="Ej: Cambio de pantalla LED, Mantenimiento..."
                autoFocus
                disabled={crearItemCatalogo.isPending}
              />
            </div>

            {/* Tipo y Precio */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Tipo *</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={nuevoTipo === "servicio" ? "default" : "outline"}
                    className="w-full text-xs"
                    onClick={() => setNuevoTipo("servicio")}
                    disabled={crearItemCatalogo.isPending}
                  >
                    <Wrench className="size-3.5 mr-1" />
                    Servicio
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={nuevoTipo === "producto" ? "default" : "outline"}
                    className="w-full text-xs"
                    onClick={() => setNuevoTipo("producto")}
                    disabled={crearItemCatalogo.isPending}
                  >
                    <Package className="size-3.5 mr-1" />
                    Producto
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="nuevoItemPrecio" className="text-xs font-medium">
                  Precio Unitario (S/) *
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    S/
                  </span>
                  <Input
                    id="nuevoItemPrecio"
                    type="number"
                    step="0.01"
                    min="0"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={nuevoPrecio}
                    onChange={(e) => setNuevoPrecio(e.target.value)}
                    className="pl-9"
                    disabled={crearItemCatalogo.isPending}
                  />
                </div>
              </div>
            </div>

            {/* Switch Híbrido: Guardar en Catálogo */}
            <div className="flex items-center justify-between rounded-lg border bg-muted/20 p-3">
              <div className="space-y-0.5 pr-2">
                <Label
                  htmlFor="switch-guardar-catalogo"
                  className="text-xs sm:text-sm font-medium cursor-pointer"
                >
                  Guardar en el catálogo para futuras órdenes
                </Label>
                <p className="text-[11px] sm:text-xs text-muted-foreground">
                  {guardarEnCatalogo
                    ? "Se guardará permanentemente en el catálogo general."
                    : "Solo se usará para esta orden (ítem personalizado)."}
                </p>
              </div>
              <Switch
                id="switch-guardar-catalogo"
                checked={guardarEnCatalogo}
                onCheckedChange={setGuardarEnCatalogo}
                disabled={crearItemCatalogo.isPending}
              />
            </div>

            {formError && (
              <p className="text-xs text-error font-medium">{formError}</p>
            )}

            {/* Acciones */}
            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetForm}
                disabled={crearItemCatalogo.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={crearItemCatalogo.isPending}
              >
                {crearItemCatalogo.isPending ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin mr-1.5" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Plus className="size-3.5 mr-1.5" />
                    Agregar al Equipo
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de Ítems Seleccionados para este Equipo */}
      {items.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground">
            Ítems seleccionados ({items.length})
          </Label>
          <div className="space-y-2">
            {items.map((item) => {
              const config = tipoConfig[item.tipo_item ?? "servicio"];
              return (
                <div
                  key={item.temp_id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border bg-surface p-3 transition-colors"
                >
                  {/* Fila superior / izquierda: Nombre y Badges */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {item.nombre}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 ${config?.className}`}
                      >
                        {config?.label ?? item.tipo_item}
                      </Badge>
                      {!item.item_id && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0 text-muted-foreground"
                        >
                          Personalizado
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Fila inferior / derecha: Cantidad, Precio y Eliminar */}
                  <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0">
                    {/* Cantidad (+ / -) */}
                    <div className="flex items-center border rounded-md bg-background">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => actualizarCantidad(item.temp_id, -1)}
                        className="size-7 text-muted-foreground"
                      >
                        -
                      </Button>
                      <span className="w-7 text-center text-xs font-semibold">
                        {item.cantidad}
                      </span>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => actualizarCantidad(item.temp_id, 1)}
                        className="size-7 text-muted-foreground"
                      >
                        +
                      </Button>
                    </div>

                    {/* Precio Unitario */}
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">S/</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        inputMode="decimal"
                        value={item.precio_unitario}
                        onChange={(e) =>
                          actualizarPrecio(
                            item.temp_id,
                            Number(e.target.value) || 0,
                          )
                        }
                        className="w-20 h-7 text-xs text-right px-2"
                      />
                    </div>

                    {/* Botón Eliminar */}
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => quitarItem(item.temp_id)}
                      className="size-7 text-muted-foreground hover:text-error"
                      aria-label="Quitar ítem"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
