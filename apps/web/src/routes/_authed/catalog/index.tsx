import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { trpc } from "@/trpc/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchIcon, PlusCircle } from "lucide-react";

const tipoConfig: Record<string, { label: string; className: string }> = {
  servicio: {
    label: "Servicio",
    className: "border-primary text-primary",
  },
  producto: {
    label: "Producto",
    className: "border-success text-success",
  },
  combo: {
    label: "Combo",
    className: "border-accent text-accent",
  },
};

export const Route = createFileRoute("/_authed/catalog/")({
  component: CatalogPage,
  staticData: {
    title: "Catálogo",
  },
});

function CatalogPage() {
  const [search, setSearch] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState<string>("todos");

  const { data, isLoading, isError } = trpc.catalog.list.useQuery({
    includeInactive: false,
  });

  const normalize = (str: string) =>
    str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const filtrados = useMemo(() => {
    if (!data) return [];
    const q = normalize(search.trim());
    return data.filter((item) => {
      const matchSearch =
        !q ||
        normalize(item.nombre).includes(q) ||
        normalize(item.tipo_item).includes(q);
      const matchTipo = tipoFiltro === "todos" || item.tipo_item === tipoFiltro;
      return matchSearch && matchTipo;
    });
  }, [data, search, tipoFiltro]);

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Cargando catálogo...
      </div>
    );

  if (isError)
    return (
      <Alert variant="destructive">
        <AlertDescription>Error al obtener el catálogo.</AlertDescription>
      </Alert>
    );

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Catálogo de Componentes
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestión centralizada de precios y componentes para servicios de
            reparación.
          </p>
        </div>
        <Link to="/catalog/new">
          <Button>
            <PlusCircle />
            Nuevo Ítem
          </Button>
        </Link>
      </div>

      {/* Búsqueda + filtro */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o categoría..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="servicio">Servicio</SelectItem>
            <SelectItem value="producto">Producto</SelectItem>
            <SelectItem value="combo">Combo</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground shrink-0">
          {filtrados.length} ítem{filtrados.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Tabla */}
      <div className="rounded-lg border bg-surface overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Precio Ref.</TableHead>
              <TableHead className="text-center">Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtrados.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-muted-foreground py-12"
                >
                  No se encontraron ítems.
                </TableCell>
              </TableRow>
            ) : (
              filtrados.map((item) => {
                const config = tipoConfig[item.tipo_item];
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.nombre}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={config?.className}>
                        {config?.label ?? item.tipo_item}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      S/ {Number(item.precio_ref).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={
                          item.isActive
                            ? "border-success text-success"
                            : "border-muted-foreground text-muted-foreground"
                        }
                      >
                        {item.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {filtrados.length > 0 && (
          <div className="px-4 py-3 border-t text-sm text-muted-foreground">
            Mostrando {filtrados.length} de {data?.length ?? 0} ítems
          </div>
        )}
      </div>
    </div>
  );
}
