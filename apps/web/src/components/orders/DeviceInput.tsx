import { useState } from "react";
import { CatalogItemSelector } from "./CatalogItemSelector";
import { tipoEquipoEnum } from "@central-pc/schemas";
import type { EquipoBase, TipoEquipo } from "@central-pc/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Trash2,
  Monitor,
  Laptop,
  Printer,
  Smartphone,
  HelpCircle,
} from "lucide-react";

type DeviceInputProps = {
  onEquiposChange: (equipos: EquipoBase[]) => void;
};

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

export function DeviceInput({ onEquiposChange }: DeviceInputProps) {
  const [equipos, setEquipos] = useState<EquipoBase[]>([]);
  const [selectorKey, setSelectorKey] = useState(0);
  const [nuevoEquipo, setNuevoEquipo] = useState<{
    tipo_equipo: TipoEquipo;
    descripcion: string;
    detalle: { item_id: number; cantidad: number; precio_unitario: number }[];
  }>({
    tipo_equipo: tipoEquipoEnum.options[0],
    descripcion: "",
    detalle: [],
  });

  function agregarEquipo() {
    if (!nuevoEquipo.descripcion.trim()) {
      return;
    }
    const equipoAdded = [...equipos, nuevoEquipo];
    setEquipos(equipoAdded);
    onEquiposChange(equipoAdded);

    setNuevoEquipo({
      tipo_equipo: tipoEquipoEnum.options[0],
      descripcion: "",
      detalle: [],
    });
    setSelectorKey((prev) => prev + 1);
  }

  function quitarEquipo(index: number) {
    const equipoFiltrados = equipos.filter((_, i) => i !== index);
    setEquipos(equipoFiltrados);
    onEquiposChange(equipoFiltrados);
  }

  return (
    <div className="space-y-6">
      {/* Formulario nuevo equipo */}
      <Card className="bg-surface">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Plus className="size-4 text-primary" />
            Agregar Equipo
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Equipo</Label>
              <Select
                value={nuevoEquipo.tipo_equipo}
                onValueChange={(value) =>
                  setNuevoEquipo({
                    ...nuevoEquipo,
                    tipo_equipo: value as TipoEquipo,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tipoEquipoEnum.options.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>
                      <div className="flex items-center gap-2">
                        {tipoEquipoConfig[tipo]?.icon}
                        {tipoEquipoConfig[tipo]?.label ?? tipo}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Descripción / Marca / Modelo</Label>
              <Input
                value={nuevoEquipo.descripcion}
                onChange={(e) =>
                  setNuevoEquipo({
                    ...nuevoEquipo,
                    descripcion: e.target.value,
                  })
                }
                placeholder="Ej: HP Pavilion 15, pantalla rota"
              />
            </div>
          </div>

          <CatalogItemSelector
            key={selectorKey}
            onDetalleChange={(items) =>
              setNuevoEquipo((prev) => ({ ...prev, detalle: items }))
            }
          />

          <div className="flex justify-end pt-2">
            <Button
              type="button"
              onClick={agregarEquipo}
              disabled={!nuevoEquipo.descripcion.trim()}
            >
              <Plus className="size-4 mr-1" />
              Agregar Equipo
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de equipos agregados */}
      {equipos.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-foreground">
            Equipos agregados ({equipos.length})
          </h4>
          <div className="space-y-3">
            {equipos.map((equipo, index) => {
              const config = tipoEquipoConfig[equipo.tipo_equipo];
              return (
                <Card key={index} className="bg-surface">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          {config?.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {config?.label ?? equipo.tipo_equipo}
                            </Badge>
                          </div>
                          <p className="font-medium text-foreground mt-1">
                            {equipo.descripcion}
                          </p>
                          {equipo.detalle.length > 0 && (
                            <ul className="mt-2 space-y-1">
                              {equipo.detalle.map((d, i) => (
                                <li
                                  key={i}
                                  className="text-sm text-muted-foreground flex items-center gap-2"
                                >
                                  <span className="size-1.5 rounded-full bg-muted-foreground" />
                                  Item ID {d.item_id} - x{d.cantidad} - S/.
                                  {d.precio_unitario.toFixed(2)}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => quitarEquipo(index)}
                        className="text-muted-foreground hover:text-error"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
