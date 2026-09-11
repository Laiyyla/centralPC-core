import { useState } from "react";
import { CatalogItemSelector } from "./CatalogItemSelector";
import { tipoEquipoEnum } from "@central-pc/schemas";
import type { EquipoBase, TipoEquipo } from "@central-pc/schemas";

type DeviceInputProps = {
  onEquiposChange: (equipos: EquipoBase[]) => void;
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
      alert("Por favor ingrese la descripción del equipo.");
      return;
    }
    const equipoAdded = [...equipos, nuevoEquipo];
    setEquipos(equipoAdded);
    onEquiposChange(equipoAdded);

    // Reset input fields and force CatalogItemSelector to re-mount with a fresh state key
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
    <div>
      <div style={{ border: "1px solid #ccc", padding: "12px", marginBottom: "12px" }}>
        <h4>Agregar Equipo a la Orden</h4>
        <select
          value={nuevoEquipo.tipo_equipo}
          onChange={(e) =>
            setNuevoEquipo({
              ...nuevoEquipo,
              tipo_equipo: e.target.value as TipoEquipo,
            })
          }
        >
          {tipoEquipoEnum.options.map((tipo) => (
            <option key={tipo} value={tipo}>
              {tipo}
            </option>
          ))}
        </select>
        <input
          value={nuevoEquipo.descripcion}
          onChange={(e) =>
            setNuevoEquipo({ ...nuevoEquipo, descripcion: e.target.value })
          }
          placeholder="Descripción / Marca / Modelo del Equipo"
        />
        <CatalogItemSelector
          key={selectorKey}
          onDetalleChange={(items) =>
            setNuevoEquipo((prev) => ({ ...prev, detalle: items }))
          }
        />
        <button type="button" onClick={agregarEquipo}>
          + Agregar Equipo
        </button>
      </div>

      <div>
        <h4>Equipos agregados ({equipos.length})</h4>
        {equipos.map((equipo, index) => (
          <div key={index} style={{ borderBottom: "1px dashed #aaa", paddingBottom: "6px" }}>
            <strong>{equipo.tipo_equipo}</strong> - {equipo.descripcion}
            {equipo.detalle.map((d, i) => (
              <p key={i} style={{ margin: "2px 0 2px 12px", fontSize: "0.9em" }}>
                Item ID {d.item_id} - x{d.cantidad} - S/.{d.precio_unitario}
              </p>
            ))}
            <button type="button" onClick={() => quitarEquipo(index)}>
              Quitar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
