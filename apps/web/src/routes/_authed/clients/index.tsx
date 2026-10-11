import { trpc } from "@/trpc/client";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
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
import { SearchIcon, EyeIcon, ChevronLeft, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/_authed/clients/")({
  component: ClientsPage,
  staticData: {
    title: "Clientes",
  },
});

function ClientsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const debouncedSearch = useDebounce(search, 300);
  const isSearching = debouncedSearch.trim().length >= 2;

  const listQuery = trpc.clients.list.useQuery(
    { limit: pageSize, offset: page * pageSize },
    { enabled: !isSearching },
  );

  const searchQuery = trpc.clients.search.useQuery(
    { query: debouncedSearch.trim(), limit: 50 },
    { enabled: isSearching },
  );

  const clientes = isSearching ? searchQuery.data : listQuery.data;
  const isLoading = isSearching ? searchQuery.isLoading : listQuery.isLoading;
  const isError = isSearching ? searchQuery.isError : listQuery.isError;

  if (isLoading && !clientes)
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
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="pl-9"
          />
        </div>
        <span className="text-sm text-muted-foreground shrink-0">
          {isSearching
            ? `Resultados: ${clientes?.length ?? 0}`
            : `Página ${page + 1}`}
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
            {!clientes || clientes.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground py-12"
                >
                  {isSearching
                    ? `No se encontraron clientes para "${debouncedSearch.trim()}".`
                    : "No hay clientes registrados en esta página."}
                </TableCell>
              </TableRow>
            ) : (
              clientes.map((cliente) => (
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

        {/* Paginación y resumen */}
        <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-muted-foreground">
          {isSearching ? (
            <span>Búsqueda en servidor: {clientes?.length ?? 0} resultados</span>
          ) : (
            <span>
              Página {page + 1} — {clientes?.length ?? 0} clientes cargados
            </span>
          )}

          {!isSearching && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0 || isLoading}
              >
                <ChevronLeft className="size-4 mr-1" />
                Anterior
              </Button>
              <span className="text-xs font-semibold px-2">
                Pág. {page + 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={!clientes || clientes.length < pageSize || isLoading}
              >
                Siguiente
                <ChevronRight className="size-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
