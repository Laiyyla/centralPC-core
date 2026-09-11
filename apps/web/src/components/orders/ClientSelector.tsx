import { useState } from "react";
import { trpc } from "@/trpc/client";
import { createClientSchema, type CreateClientInput } from "@central-pc/schemas";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

type ClientSelectorProps = {
  onClientSelect: (id: number | null) => void;
};

export function ClientSelector({ onClientSelect }: ClientSelectorProps) {
  const [query, setQuery] = useState("");
  const [clienteSeleccionado, setClienteSeleccionado] = useState<{
    id: number;
    nombre: string;
    telefono: string;
  } | null>(null);
  const [modoCrear, setModoCrear] = useState(false);
  const createClientForm = useForm<CreateClientInput>({
    resolver: zodResolver(createClientSchema),
  });

  const { data: resultados } = trpc.clients.search.useQuery(
    { query },
    { enabled: query.length >= 2 },
  );

  const crearCliente = trpc.clients.create.useMutation({
    onSuccess: (data) => {
      setClienteSeleccionado({
        id: data.id,
        nombre: data.nombre,
        telefono: data.telefono,
      });
      onClientSelect(data.id);
      setModoCrear(false);
      createClientForm.reset();
    },
    onError: (error) => {
      console.error("Error creando cliente:", error.message);
    },
  });

  function seleccionarCliente(cliente: {
    id: number;
    nombre: string;
    telefono: string;
  }) {
    setClienteSeleccionado(cliente);
    onClientSelect(cliente.id);
    setQuery("");
  }

  function onSubmit(values: CreateClientInput) {
    crearCliente.mutate(values);
  }

  if (clienteSeleccionado !== null) {
    return (
      <div>
        <p>Cliente seleccionado: <strong>{clienteSeleccionado.nombre}</strong> ({clienteSeleccionado.telefono})</p>
        <button
          type="button"
          onClick={() => {
            setClienteSeleccionado(null);
            onClientSelect(null);
          }}
        >
          Cambiar Cliente
        </button>
      </div>
    );
  }

  if (modoCrear) {
    return (
      <form onSubmit={createClientForm.handleSubmit(onSubmit)}>
        <h4>Crear Nuevo Cliente</h4>
        <input
          {...createClientForm.register("nombre")}
          placeholder="Nombre completo"
        />
        {createClientForm.formState.errors.nombre && (
          <p style={{ color: "red" }}>{createClientForm.formState.errors.nombre.message}</p>
        )}
        <input
          {...createClientForm.register("telefono")}
          placeholder="Teléfono"
        />
        {createClientForm.formState.errors.telefono && (
          <p style={{ color: "red" }}>{createClientForm.formState.errors.telefono.message}</p>
        )}
        {crearCliente.isError && (
          <p style={{ color: "red" }}>{crearCliente.error.message}</p>
        )}
        <button type="submit" disabled={crearCliente.isPending}>
          {crearCliente.isPending ? "Guardando..." : "Guardar Cliente"}
        </button>
        <button type="button" onClick={() => setModoCrear(false)}>
          Cancelar
        </button>
      </form>
    );
  }

  return (
    <div>
      <div>
        <label>Buscar Cliente:</label>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre o teléfono..."
        />
        <ul>
          {resultados?.map((item) => (
            <li
              key={item.id}
              onClick={() => seleccionarCliente(item)}
              style={{ cursor: "pointer" }}
            >
              {item.nombre} - {item.telefono}
            </li>
          ))}
        </ul>
        <button type="button" onClick={() => setModoCrear(true)}>
          + Crear Nuevo Cliente
        </button>
      </div>
    </div>
  );
}
