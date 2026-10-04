import { useState, useEffect } from "react";
import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Trash2,
  Monitor,
  Laptop,
  Printer,
  Smartphone,
  HelpCircle,
  Search,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import { tipoEquipoEnum } from "@central-pc/schemas";
import type { TipoEquipo } from "@central-pc/schemas";

interface ItemDetalleForm {
  item_id?: number;
  nombre_personalizado?: string;
  precio_unitario: number;
  cantidad: number;
}

interface EquipoForm {
  tipo_equipo: TipoEquipo;
  descripcion: string;
  observaciones?: string;
  detalle: ItemDetalleForm[];
}

interface EditOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: {
    id: number;
    observaciones?: string | null;
    equipos?: Array<{
      id: number;
      tipo_equipo: string;
      descripcion: string;
      observaciones?: string | null;
      detalle?: Array<{
        id: number;
        item_id?: number | null;
        nombre_snap: string;
        precio_unit_snap: string;
        cantidad: number;
      }>;
    }>;
    detalle_suelto?: Array<{
      id: number;
      item_id?: number | null;
      nombre_snap: string;
      precio_unit_snap: string;
      cantidad: number;
    }>;
  };
}

const tipoEquipoConfig: Record<
  TipoEquipo,
  { label: string; icon: React.ReactNode }
> = {
  PC: { label: "PC", icon: <Monitor className="size-4" /> },
  LAPTOP: { label: "Laptop", icon: <Laptop className="size-4" /> },
  IMPRESORA: { label: "Impresora", icon: <Printer className="size-4" /> },
  CELULAR: { label: "Celular", icon: <Smartphone className="size-4" /> },
  OTROS: { label: "Otros", icon: <HelpCircle className="size-4" /> },
};

const tipoItemBadgeConfig: Record<
  string,
  { label: string; className: string }
> = {
  servicio: { label: "Servicio", className: "border-primary text-primary" },
  producto: {
    label: "Producto",
    className: "border-emerald-600 text-emerald-600",
  },
  combo: { label: "Combo", className: "border-purple-600 text-purple-600" },
};

export function EditOrderModal({
  open,
  onOpenChange,
  order,
}: EditOrderModalProps) {
  const [observaciones, setObservaciones] = useState(order.observaciones ?? "");
  const [equipos, setEquipos] = useState<EquipoForm[]>([]);
  const [searches, setSearches] = useState<Record<number, string>>({});

  const { data: catalogoItems } = trpc.catalog.list.useQuery(
    { includeInactive: false },
    { enabled: open },
  );

  useEffect(() => {
    if (order) {
      setObservaciones(order.observaciones ?? "");
      setEquipos(
        order.equipos?.map((eq) => ({
          tipo_equipo: (eq.tipo_equipo as TipoEquipo) ?? "OTROS",
          descripcion: eq.descripcion ?? "",
          observaciones: eq.observaciones ?? "",
          detalle:
            eq.detalle?.map((d) => ({
              item_id: d.item_id ?? undefined,
              nombre_personalizado: d.nombre_snap,
              precio_unitario: Number(d.precio_unit_snap) || 0,
              cantidad: d.cantidad,
            })) ?? [],
        })) ?? [],
      );
      setSearches({});
    }
  }, [order, open]);

  const utils = trpc.useUtils();
  const updateMutation = trpc.orders.update.useMutation({
    onSuccess: () => {
      utils.orders.getById.invalidate({ id: order.id });
      utils.orders.list.invalidate();
      toast.success("Orden actualizada correctamente");
      onOpenChange(false);
    },
  });

  function handleAgregarEquipo() {
    setEquipos((prev) => [
      ...prev,
      {
        tipo_equipo: "PC",
        descripcion: "",
        observaciones: "",
        detalle: [],
      },
    ]);
  }

  function handleQuitarEquipo(index: number) {
    setEquipos((prev) => prev.filter((_, i) => i !== index));
  }

  function handleAgregarItemCatalogo(
    equipoIndex: number,
    item: { id: number; nombre: string; precio_ref: string | number },
  ) {
    setEquipos((prev) => {
      return prev.map((equipo, idx) => {
        if (idx !== equipoIndex) return equipo;

        const existing = equipo.detalle.find((d) => d.item_id === item.id);
        if (existing) {
          const newDetail = equipo.detalle.map((d) => {
            if (d.item_id === item.id) {
              return { ...d, cantidad: d.cantidad + 1 };
            } else {
              return d;
            }
          });
          return { ...equipo, detalle: newDetail };
        } else {
          const newDetail = [
            ...equipo.detalle,
            {
              item_id: item.id,
              nombre_personalizado: item.nombre,
              precio_unitario: Number(item.precio_ref) || 0,
              cantidad: 1,
            },
          ];
          return { ...equipo, detalle: newDetail };
        }
      });
    });

    // Limpiar buscador del equipo
    setSearches((prev) => ({ ...prev, [equipoIndex]: "" }));
  }

  function handleAgregarItemPersonalizado(equipoIndex: number) {
    setEquipos((prev) => {
      return prev.map((equipo, idx) => {
        if (idx !== equipoIndex) return equipo;
        return {
          ...equipo,
          detalle: [
            ...equipo.detalle,
            {
              nombre_personalizado: "",
              precio_unitario: 0,
              cantidad: 1,
            },
          ],
        };
      });
    });
  }

  function handleQuitarItem(equipoIndex: number, itemIndex: number) {
    setEquipos((prev) => {
      return prev.map((equipo, idx) => {
        if (idx !== equipoIndex) return equipo;
        return {
          ...equipo,
          detalle: equipo.detalle.filter((_, i) => i !== itemIndex),
        };
      });
    });
  }

  function handleSave() {
    if (equipos.length === 0) {
      toast.error("Debe ingresar al menos un equipo");
      return;
    }
    for (const eq of equipos) {
      if (!eq.descripcion.trim()) {
        toast.error("Todos los equipos deben tener una descripción");
        return;
      }
      if (eq.detalle.length === 0) {
        toast.error(
          `El equipo "${eq.descripcion}" debe tener al menos un ítem o servicio`,
        );
        return;
      }
      for (const item of eq.detalle) {
        if (!item.nombre_personalizado?.trim()) {
          toast.error(
            `Debe especificar el nombre para todos los ítems del equipo "${eq.descripcion}"`,
          );
          return;
        }
      }
    }

    updateMutation.mutate({
      id: order.id,
      observaciones,
      equipos,
    });
  }

  // Recálculo del total
  const totalCalculado = equipos.reduce(
    (accEq, eq) =>
      accEq +
      eq.detalle.reduce(
        (accItem, item) => accItem + item.precio_unitario * item.cantidad,
        0,
      ),
    0,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-5xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Editar Orden #{order.id}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-3">
          {/* Observaciones generales */}
          <div className="space-y-2">
            <Label className="font-semibold">Observaciones Generales</Label>
            <Textarea
              placeholder="Falla manifestada por el cliente, notas de recepción..."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={2}
            />
          </div>

          {/* Equipos */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="font-semibold text-base">
                Equipos y Servicios ({equipos.length})
              </Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleAgregarEquipo}
              >
                <Plus className="size-4 mr-1" />
                Agregar Equipo
              </Button>
            </div>

            {equipos.map((equipo, eqIdx) => {
              const currentSearch = searches[eqIdx] ?? "";
              const catalogoFiltrado =
                currentSearch.trim().length >= 2
                  ? catalogoItems?.filter((item) =>
                      item.nombre
                        ?.toLowerCase()
                        .includes(currentSearch.toLowerCase()),
                    )
                  : [];

              return (
                <Card key={eqIdx} className="bg-surface border">
                  <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      {tipoEquipoConfig[equipo.tipo_equipo]?.icon}
                      Equipo #{eqIdx + 1}
                    </CardTitle>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleQuitarEquipo(eqIdx)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Tipo de Equipo</Label>
                        <Select
                          value={equipo.tipo_equipo}
                          onValueChange={(val) => {
                            const updated = [...equipos];
                            updated[eqIdx].tipo_equipo = val as TipoEquipo;
                            setEquipos(updated);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {tipoEquipoEnum.options.map((tipo) => (
                              <SelectItem key={tipo} value={tipo}>
                                {tipoEquipoConfig[tipo]?.label ?? tipo}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Descripción / Modelo</Label>
                        <Input
                          value={equipo.descripcion}
                          onChange={(e) => {
                            const updated = [...equipos];
                            updated[eqIdx].descripcion = e.target.value;
                            setEquipos(updated);
                          }}
                          placeholder="Ej: Laptop ASUS VivoBook"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">
                        Observaciones / Notas del Equipo
                      </Label>
                      <Input
                        value={equipo.observaciones ?? ""}
                        onChange={(e) => {
                          const updated = [...equipos];
                          updated[eqIdx].observaciones = e.target.value;
                          setEquipos(updated);
                        }}
                        placeholder="Ej: Contraseña, rayones en tapa, sin cargador"
                      />
                    </div>

                    <Separator />

                    {/* Buscador de catálogo para este equipo */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase">
                          Buscar en Catálogo de Productos y Servicios
                        </Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-xs text-primary h-7"
                          onClick={() => handleAgregarItemPersonalizado(eqIdx)}
                        >
                          <Plus className="size-3 mr-1" />
                          Ítem Personalizado
                        </Button>
                      </div>

                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                          value={currentSearch}
                          onChange={(e) =>
                            setSearches((prev) => ({
                              ...prev,
                              [eqIdx]: e.target.value,
                            }))
                          }
                          placeholder="Escribe al menos 2 letras para buscar repuestos o servicios del catálogo..."
                          className="pl-9 text-sm"
                        />
                      </div>

                      {/* Resultados de búsqueda */}
                      {currentSearch.trim().length >= 2 && (
                        <div className="rounded-md border bg-muted/20 max-h-44 overflow-y-auto">
                          {catalogoFiltrado?.length === 0 ? (
                            <p className="p-2.5 text-xs text-muted-foreground text-center">
                              No se encontraron ítems en el catálogo con "
                              {currentSearch}".
                            </p>
                          ) : (
                            <ul className="divide-y text-sm">
                              {catalogoFiltrado?.map((catItem) => {
                                const badgeCfg =
                                  tipoItemBadgeConfig[catItem.tipo_item];
                                return (
                                  <li
                                    key={catItem.id}
                                    onClick={() =>
                                      handleAgregarItemCatalogo(eqIdx, catItem)
                                    }
                                    className="flex items-center justify-between p-2 hover:bg-primary/10 cursor-pointer transition-colors"
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <Package className="size-3.5 text-muted-foreground shrink-0" />
                                      <span className="font-medium text-xs truncate">
                                        {catItem.nombre}
                                      </span>
                                      <Badge
                                        variant="outline"
                                        className={`text-[10px] px-1 py-0 ${badgeCfg?.className}`}
                                      >
                                        {badgeCfg?.label ?? catItem.tipo_item}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <span className="text-xs font-bold text-primary">
                                        S/{" "}
                                        {Number(catItem.precio_ref).toFixed(2)}
                                      </span>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="size-6"
                                      >
                                        <Plus className="size-3.5" />
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

                    {/* Lista de ítems/servicios del equipo */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-foreground">
                          Ítems asignados a este equipo ({equipo.detalle.length}
                          )
                        </span>
                      </div>

                      {equipo.detalle.length === 0 ? (
                        <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 p-2 rounded border border-amber-200">
                          Este equipo no tiene repuestos ni servicios agregados
                          todavía. Busca uno en el catálogo arriba o agrega un
                          ítem personalizado.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {equipo.detalle.map((item, itemIdx) => (
                            <div
                              key={itemIdx}
                              className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-2 min-w-0 bg-muted/10 p-1.5 rounded border"
                            >
                              <Input
                                className="text-sm min-w-0 bg-background"
                                placeholder="Nombre o servicio"
                                disabled={!!item.item_id}
                                value={item.nombre_personalizado ?? ""}
                                onChange={(e) => {
                                  const updated = [...equipos];
                                  updated[eqIdx].detalle[
                                    itemIdx
                                  ].nombre_personalizado = e.target.value;
                                  setEquipos(updated);
                                }}
                              />
                              <Input
                                type="number"
                                className="w-16 text-sm bg-background"
                                placeholder="Cant."
                                min={1}
                                value={item.cantidad}
                                onChange={(e) => {
                                  const updated = [...equipos];
                                  updated[eqIdx].detalle[itemIdx].cantidad =
                                    Number(e.target.value) || 1;
                                  setEquipos(updated);
                                }}
                              />
                              <Input
                                type="number"
                                step="0.50"
                                className="w-24 text-sm bg-background"
                                placeholder="S/ Precio"
                                value={item.precio_unitario}
                                onChange={(e) => {
                                  const updated = [...equipos];
                                  updated[eqIdx].detalle[
                                    itemIdx
                                  ].precio_unitario =
                                    Number(e.target.value) || 0;
                                  setEquipos(updated);
                                }}
                              />
                              <span className="text-sm font-semibold w-20 text-right whitespace-nowrap text-foreground">
                                S/{" "}
                                {(item.precio_unitario * item.cantidad).toFixed(
                                  2,
                                )}
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-8 text-muted-foreground hover:text-destructive shrink-0"
                                onClick={() => handleQuitarItem(eqIdx, itemIdx)}
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Resumen Total */}
          <div className="flex items-center justify-between bg-muted/40 p-4 rounded-lg border">
            <span className="font-semibold text-foreground">
              Nuevo Total Calculado:
            </span>
            <span className="text-xl font-bold text-primary">
              S/ {totalCalculado.toFixed(2)}
            </span>
          </div>

          {updateMutation.isError && (
            <Alert variant="destructive">
              <AlertDescription>
                {updateMutation.error.message}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button disabled={updateMutation.isPending} onClick={handleSave}>
            {updateMutation.isPending ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
