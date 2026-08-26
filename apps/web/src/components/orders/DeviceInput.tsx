import { useState } from "react";
import { tipoEquipoEnum } from "@central-pc/schemas";
import type { EquipoBase, TipoEquipo } from "@central-pc/schemas";

type DeviceInputProps = {
  onEquiposChange: (equipos: EquipoBase[]) => void;
};

export function DeviceInput({ onEquiposChange }: DeviceInputProps) {
  const [equipos, setEquipos] = useState<EquipoBase[]>([]);
  const [nuevoEquipo, setNuevoEquipo] = useState({
    tipo_equipo: tipoEquipoEnum.options[0],
    descripcion: "",
  });

  function agregarEquipo() {
    if (nuevoEquipo.descripcion === "") {
      return;
    }
    const equipoAdded = [...equipos, nuevoEquipo];
    setEquipos(equipoAdded);
    onEquiposChange(equipoAdded);
    setNuevoEquipo({ tipo_equipo: tipoEquipoEnum.options[0], descripcion: "" });
  }
  function quitarEquipo(index: number) {
    const equipoFiltrados = equipos.filter((_, i) => i !== index);
    setEquipos(equipoFiltrados);
    onEquiposChange(equipoFiltrados);
  }
  return (
    <div>
      <form>
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
          placeholder="Descripcion del Equipo"
        ></input>
        <button type="button" onClick={() => agregarEquipo()}>
          Agregar Equipo
        </button>
      </form>
      <div>
        {equipos.map((equipo, index) => (
          <div key={index}>
            <h2>{equipo.tipo_equipo}</h2>
            <h4>{equipo.descripcion}</h4>
            <button onClick={() => quitarEquipo(index)}>Quitar</button>
          </div>
        ))}
      </div>
    </div>
  );
}
