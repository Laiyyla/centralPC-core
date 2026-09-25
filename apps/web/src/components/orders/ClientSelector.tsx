import { useState } from "react";
import { trpc } from "@/trpc/client";
import {
  createClientSchema,
  type CreateClientInput,
} from "@central-pc/schemas";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Search, Plus, X, User, Phone } from "lucide-react";

type ClientSelectorProps = {
  onClientSelect: (id: number | null) => void;
};

type ClienteResumen = {
  id: number;
  nombre: string;
  telefono: string;
};

export function ClientSelector({ onClientSelect }: ClientSelectorProps) {
  const [query, setQuery] = useState("");
  const [clienteSeleccionado, setClienteSeleccionado] =
    useState<ClienteResumen | null>(null);
  const [modoCrear, setModoCrear] = useState(false);

  const createClientForm = useForm<CreateClientInput>({
    resolver: zodResolver(createClientSchema),
  });

  const { data: resultados, isLoading } = trpc.clients.search.useQuery(
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

  function seleccionarCliente(cliente: ClienteResumen) {
    setClienteSeleccionado(cliente);
    onClientSelect(cliente.id);
    setQuery("");
  }

  function onSubmit(values: CreateClientInput) {
    crearCliente.mutate(values);
  }

  // Estado: Cliente seleccionado
  if (clienteSeleccionado !== null) {
    return (
      <div className="rounded-lg border bg-surface p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="size-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">
                {clienteSeleccionado.nombre}
              </p>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Phone className="size-3" />
                {clienteSeleccionado.telefono}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setClienteSeleccionado(null);
              onClientSelect(null);
            }}
          >
            <X className="size-4 mr-1" />
            Cambiar
          </Button>
        </div>
      </div>
    );
  }

  // Estado: Creando nuevo cliente
  if (modoCrear) {
    return (
      <div className="rounded-lg border bg-surface p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-foreground">Crear Nuevo Cliente</h4>
          <Button variant="ghost" size="sm" onClick={() => setModoCrear(false)}>
            <X className="size-4" />
          </Button>
        </div>
        <form
          onSubmit={createClientForm.handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre completo *</Label>
              <Input
                id="nombre"
                {...createClientForm.register("nombre")}
                placeholder="Ej: Juan Pérez"
                disabled={crearCliente.isPending}
              />
              {createClientForm.formState.errors.nombre && (
                <p className="text-sm text-error">
                  {createClientForm.formState.errors.nombre.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono *</Label>
              <Input
                id="telefono"
                {...createClientForm.register("telefono")}
                placeholder="Ej: 987654321"
                disabled={crearCliente.isPending}
              />
              {createClientForm.formState.errors.telefono && (
                <p className="text-sm text-error">
                  {createClientForm.formState.errors.telefono.message}
                </p>
              )}
            </div>
          </div>
          {crearCliente.isError && (
            <p className="text-sm text-error">{crearCliente.error.message}</p>
          )}
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setModoCrear(false)}
              disabled={crearCliente.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={crearCliente.isPending}>
              {crearCliente.isPending ? "Guardando..." : "Guardar Cliente"}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  // Estado: Buscando
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Buscar Cliente (DNI/Nombre)</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ej: 123456789 o Juan Pérez"
              className="pl-9"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setModoCrear(true)}
          >
            <Plus className="size-4 mr-1" />
            Nuevo Cliente
          </Button>
        </div>
      </div>

      {query.length >= 2 && (
        <div className="rounded-md border bg-surface max-h-48 overflow-y-auto">
          {isLoading ? (
            <p className="p-3 text-sm text-muted-foreground text-center">
              Buscando...
            </p>
          ) : resultados?.length === 0 ? (
            <div className="p-3 text-center">
              <p className="text-sm text-muted-foreground">
                No se encontraron clientes.
              </p>
              <Button
                variant="link"
                size="sm"
                onClick={() => setModoCrear(true)}
                className="mt-1"
              >
                Crear nuevo cliente
              </Button>
            </div>
          ) : (
            <ul className="divide-y">
              {resultados?.map((cliente) => (
                <li
                  key={cliente.id}
                  onClick={() => seleccionarCliente(cliente)}
                  className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <div className="size-8 rounded-full bg-muted flex items-center justify-center">
                    <User className="size-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{cliente.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {cliente.telefono}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
