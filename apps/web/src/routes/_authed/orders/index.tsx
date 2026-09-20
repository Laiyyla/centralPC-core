import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { trpc } from "@/trpc/client";
import { openOrderPdf } from "@/lib/api";
import { useAuthUser } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  PlusCircle,
  SearchIcon,
  MoreHorizontal,
  FileText,
  Eye,
  XCircle,
  CalendarIcon,
} from "lucide-react";

export const Route = createFileRoute("/_authed/orders/")({
  component: RouteComponent,
  staticData: {
    title: "Órdenes",
  },
});

function RouteComponent() {
  const { user } = useAuthUser();
  const [search, setSearch] = useState("");
  const { data, isLoading, isError, error } = trpc.orders.list.useQuery({
    limit: 500,
    offset: 0,
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.toLowerCase().trim();
    if (!q) return data;
    return data.filter(
      (o) =>
        String(o.id).includes(q) ||
        String(o.correlativo ?? "")
          .toLowerCase()
          .includes(q) ||
        o.cliente?.nombre?.toLowerCase().includes(q),
    );
  }, [data, search]);

  async function handlePdf(ordenId: number) {
    try {
      await openOrderPdf(ordenId);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleAnular(ordenId: number) {
    // TODO: implementar mutación de anulación
    console.log("Anular orden", ordenId);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Cargando órdenes...
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error?.message}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Listado de Órdenes
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestiona y monitorea todas las órdenes de servicio de CentralPC.
          </p>
        </div>
        <Link to="/orders/new">
          <Button>
            <PlusCircle />
            Nueva Orden
          </Button>
        </Link>
      </div>

      {/* Búsqueda */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por ID, correlativo o cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Tabla */}
      <div className="rounded-lg border bg-surface overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Orden / ID</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Fecha de Ingreso</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground py-12"
                >
                  No se encontraron órdenes.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((orden) => (
                <TableRow key={orden.id}>
                  {/* Orden / ID */}
                  <TableCell>
                    <Link
                      to="/orders/$orderId"
                      params={{ orderId: String(orden.id) }}
                      className="font-semibold text-primary hover:underline"
                    >
                      #{String(orden.id).padStart(5, "0")}
                    </Link>
                    {orden.correlativo && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {orden.correlativo}
                      </p>
                    )}
                  </TableCell>

                  {/* Estado */}
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        orden.estado === "EMITIDA"
                          ? "border-primary text-primary"
                          : "border-destructive text-destructive"
                      }
                    >
                      {orden.estado === "EMITIDA" ? "EMITIDA" : "ANULADA"}
                    </Badge>
                  </TableCell>

                  {/* Cliente */}
                  <TableCell className="font-medium">
                    {orden.cliente?.nombre ?? "—"}
                  </TableCell>

                  {/* Fecha */}
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <CalendarIcon className="size-3.5" />
                      {new Date(orden.fecha_emision).toLocaleDateString(
                        "es-PE",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        },
                      )}
                    </div>
                  </TableCell>

                  {/* Total */}
                  <TableCell className="text-right font-semibold">
                    S/ {Number(orden.total).toFixed(2)}
                  </TableCell>

                  {/* Acciones */}
                  <TableCell className="text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link
                            to="/orders/$orderId"
                            params={{ orderId: String(orden.id) }}
                          >
                            <Eye className="size-4" />
                            Ver detalle
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handlePdf(orden.id)}>
                          <FileText className="size-4" />
                          Ver PDF
                        </DropdownMenuItem>
                        {user?.rol === "admin" && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleAnular(orden.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <XCircle className="size-4" />
                              Anular orden
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Footer de tabla */}
        {filtered.length > 0 && (
          <div className="px-4 py-3 border-t text-sm text-muted-foreground">
            Mostrando {filtered.length} de {data?.length ?? 0} órdenes
          </div>
        )}
      </div>
    </div>
  );
}
