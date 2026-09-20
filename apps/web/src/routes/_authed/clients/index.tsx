import { trpc } from "@/trpc/client";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { SearchIcon, EyeIcon } from "lucide-react";

export const Route = createFileRoute("/_authed/clients/")({
  component: ClientsPage,
  staticData: {
    title: "Clientes",
  },
});

function ClientsPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading, isError } = trpc.clients.list.useQuery({});

  const filtrados = useMemo(() => {
    if (!data) return [];
    const q = search
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    if (!q) return data;
    const normalize = (str: string) =>
      str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
    return data.filter(
      (c) =>
        normalize(c.nombre).includes(q) ||
        c.telefono.includes(q) ||
        normalize(c.dni ?? "").includes(q) ||
        normalize(c.ruc ?? "").includes(q),
    );
  }, [data, search]);

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Cargando clientes...
      </div>
    );

  if (isError)
    return (
      <Alert variant="destructive">
        <AlertDescription>Error al cargar los clientes.</AlertDescription>
      </Alert>
    );

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Gestión de Clientes
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Administra la base de datos de clientes de CentralPC.
          </p>
        </div>
      </div>

      {/* Búsqueda + contador */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, teléfono, DNI o RUC..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <span className="text-sm text-muted-foreground shrink-0">
          Mostrando {filtrados.length} cliente
          {filtrados.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Tabla */}
      <div className="rounded-lg border bg-surface overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>DNI</TableHead>
              <TableHead>RUC</TableHead>
              <TableHead className="text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtrados.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground py-12"
                >
                  No se encontraron clientes.
                </TableCell>
              </TableRow>
            ) : (
              filtrados.map((cliente) => (
                <TableRow key={cliente.id}>
                  <TableCell className="font-medium">
                    {cliente.nombre}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {cliente.telefono}
                  </TableCell>
                  <TableCell>
                    {cliente.dni ? (
                      <Badge variant="outline">{cliente.dni}</Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {cliente.ruc ? (
                      <Badge variant="outline">{cliente.ruc}</Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Link
                      to="/clients/$clientId"
                      params={{ clientId: String(cliente.id) }}
                    >
                      <Button variant="ghost" size="icon">
                        <EyeIcon className="size-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {filtrados.length > 0 && (
          <div className="px-4 py-3 border-t text-sm text-muted-foreground">
            Mostrando {filtrados.length} de {data?.length ?? 0} clientes
          </div>
        )}
      </div>
    </div>
  );
}
