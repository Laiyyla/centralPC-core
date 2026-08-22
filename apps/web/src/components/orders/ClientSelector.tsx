import { useState } from "react";
import { trpc } from "../../trpc/client";
import { createClientSchema, CreateClientInput } from "@central-pc/schemas";
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
    {
      query,
    },
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
        <p>Cliente: {clienteSeleccionado.nombre}</p>
        <button
          onClick={() => {
            setClienteSeleccionado(null);
            onClientSelect(null);
          }}
        >
          Cambiar
        </button>
      </div>
    );
  }

  if (modoCrear === true) {
    return (
      <form onSubmit={createClientForm.handleSubmit(onSubmit)}>
        <input
          {...createClientForm.register("nombre")}
          placeholder="Nombre de Cliente"
        />
        <input
          {...createClientForm.register("telefono")}
          placeholder="Telefono de Cliente"
        />
        <button type="submit">Guardar</button>
      </form>
    );
  }
  return (
    <div>
      <div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <ul>
          {resultados?.map((item) => (
            <li key={item.id} onClick={() => seleccionarCliente(item)}>
              {item.nombre} - {item.telefono}
            </li>
          ))}
        </ul>
        {query.length >= 2 && resultados?.length === 0 && (
          <button onClick={() => setModoCrear(true)}>
            + Crear Nuevo Cliente
          </button>
        )}
      </div>
    </div>
  );
}
