import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { trpc } from "@/trpc/client";
import { openOrderPdf } from "@/lib/api";
import { useAuthUser } from "@/context/auth-context";
import { useDebounce } from "@/hooks/use-debounce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  OrderStatusBadge,
  getStatusBadge,
} from "@/components/orders/OrderStatusBadge";
export { getStatusBadge };
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  PlusCircle,
  SearchIcon,
  MoreHorizontal,
  FileText,
  Eye,
  CalendarIcon,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export const Route = createFileRoute("/_authed/orders/")({
  component: RouteComponent,
  staticData: {
    title: "Órdenes de Servicio",
  },
});

function RouteComponent() {
  const { user } = useAuthUser();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 250);
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [techFilter, setTechFilter] = useState<string>("todos");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  const { data: usuarios } = trpc.auth.listUsers.useQuery();

  const { data, isLoading, isError, error } = trpc.orders.list.useQuery({
    limit: pageSize,
    offset: page * pageSize,
    estado: statusFilter !== "todos" ? (statusFilter as any) : undefined,
    solo_sin_asignar: techFilter === "sin_asignar" ? true : undefined,
    encargado_id:
      techFilter === "mis_ordenes"
        ? user?.id
        : techFilter !== "todos" && techFilter !== "sin_asignar"
          ? Number(techFilter)
          : undefined,
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = debouncedSearch
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
      (o) =>
        String(o.id).includes(q) ||
        String(o.correlativo ?? "")
          .toLowerCase()
          .includes(q) ||
        normalize(o.cliente?.nombre ?? "").includes(q) ||
        normalize(o.encargado?.nombre ?? "").includes(q),
    );
  }, [data, debouncedSearch]);

  async function handlePdf(ordenId: number) {
    try {
      await openOrderPdf(ordenId);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error(err);
      }
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Órdenes de Servicio
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestiona, asigna técnicos y monitorea el avance de atención técnica.
          </p>
        </div>
        <Link to="/orders/new">
          <Button>
            <PlusCircle />
            Nueva Orden
          </Button>
        </Link>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por ID, correlativo, cliente o técnico..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filtro por Estado */}
        <Select
          value={statusFilter}
          onValueChange={(val) => {
            setStatusFilter(val ?? "todos");
            setPage(0);
          }}
        >
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="Estado Operativo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los Estados</SelectItem>
            <SelectItem value="RECEPCIONADA">Recepcionada</SelectItem>
            <SelectItem value="EN_DIAGNOSTICO">En Diagnóstico</SelectItem>
            <SelectItem value="ESPERANDO_APROBACION">
              Esperando Aprobación
            </SelectItem>
            <SelectItem value="EN_REPARACION">En Reparación</SelectItem>
            <SelectItem value="COMPLETADA">Completada</SelectItem>
            <SelectItem value="ENTREGADA">Entregada</SelectItem>
            <SelectItem value="ANULADA">Anulada</SelectItem>
          </SelectContent>
        </Select>

        {/* Filtro por Técnico */}
        <Select
          value={techFilter}
          onValueChange={(val) => {
            setTechFilter(val ?? "todos");
            setPage(0);
          }}
        >
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="Encargado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los Encargados</SelectItem>
            {user && <SelectItem value="mis_ordenes">Mis Órdenes</SelectItem>}
            <SelectItem value="sin_asignar">
              Sin Asignar (Pendientes)
            </SelectItem>
            {usuarios
              ?.filter((u) => u.rol === "tecnico" || u.rol === "admin")
              .map((t) => (
                <SelectItem key={t.id} value={String(t.id)}>
                  {t.nombre}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {/* Error State */}
      {isError && (
        <Alert variant="destructive">
          <AlertDescription>{error?.message}</AlertDescription>
        </Alert>
      )}

      {/* Tabla con Skeleton Loader integrado */}
      {isLoading ? (
        <TableSkeleton
          rows={pageSize > 10 ? 8 : pageSize}
          headers={[
            "Orden / N°",
            "Estado Operativo",
            "Cliente",
            "Técnico Encargado",
            "Fecha Ingreso",
            "Total",
            "Acciones",
          ]}
        />
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Orden / N°</TableHead>
                <TableHead>Estado Operativo</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Técnico Encargado</TableHead>
                <TableHead>Fecha Ingreso</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={7} className="p-0">
                    <EmptyState
                      variant={search ? "search" : "orders"}
                      title={
                        search
                          ? "Sin coincidencias en la búsqueda"
                          : "Bandeja de órdenes limpia"
                      }
                      description={
                        search
                          ? `No encontramos órdenes para "${search}". ¿Seguro que el correlativo o cliente está bien escrito?`
                          : "No hay órdenes pendientes en este filtro. Todo el taller está al día (o alguien olvidó registrar la recepción)."
                      }
                      action={
                        search ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSearch("")}
                          >
                            Limpiar búsqueda
                          </Button>
                        ) : undefined
                      }
                    />
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
                          N° {orden.correlativo}
                        </p>
                      )}
                    </TableCell>

                    {/* Estado */}
                    <TableCell>
                      <OrderStatusBadge estado={orden.estado} />
                    </TableCell>

                    {/* Cliente */}
                    <TableCell className="font-medium">
                      {orden.cliente?.nombre ?? "—"}
                    </TableCell>

                    {/* Técnico Encargado */}
                    <TableCell>
                      {orden.encargado ? (
                        <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                          <UserCheck className="size-3.5 text-emerald-600" />
                          <span>{orden.encargado.nombre}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-amber-600 font-semibold bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded w-fit">
                          <UserX className="size-3" />
                          <span>Sin Asignar</span>
                        </div>
                      )}
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
                          <DropdownMenuItem
                            onClick={() =>
                              navigate({
                                to: "/orders/$orderId",
                                params: { orderId: String(orden.id) },
                              })
                            }
                          >
                            <Eye className="size-4 mr-2" />
                            Ver Detalle / Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handlePdf(orden.id)}>
                            <FileText className="size-4 mr-2" />
                            Imprimir PDF
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Footer de paginación */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>
                Página {page + 1} — {filtered.length} órdenes en vista
              </span>
              <div className="flex items-center gap-1.5 text-xs">
                <span>Por pág:</span>
                <select
                  aria-label="Órdenes por página"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(0);
                  }}
                  className="rounded border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

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
                disabled={!data || data.length < pageSize || isLoading}
              >
                Siguiente
                <ChevronRight className="size-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
