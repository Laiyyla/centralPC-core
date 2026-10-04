import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { trpc } from "@/trpc/client";
import { openOrderPdf } from "@/lib/api";
import { useAuthUser } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  UserCheck,
  UserX,
} from "lucide-react";

export const Route = createFileRoute("/_authed/orders/")({
  component: RouteComponent,
  staticData: {
    title: "Órdenes de Servicio",
  },
});

export function getStatusBadge(estado: string) {
  switch (estado) {
    case "RECEPCIONADA":
      return (
        <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-200">
          RECEPCIONADA
        </Badge>
      );
    case "EN_DIAGNOSTICO":
      return (
        <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-200">
          EN DIAGNÓSTICO
        </Badge>
      );
    case "ESPERANDO_APROBACION":
      return (
        <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-200">
          ESPERANDO APROBACIÓN
        </Badge>
      );
    case "EN_REPARACION":
      return (
        <Badge className="bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-200">
          EN REPARACIÓN
        </Badge>
      );
    case "COMPLETADA":
      return (
        <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200">
          COMPLETADA
        </Badge>
      );
    case "ENTREGADA":
      return (
        <Badge className="bg-green-600/15 text-green-700 dark:text-green-400 border-green-200">
          ENTREGADA
        </Badge>
      );
    case "ANULADA":
      return (
        <Badge className="bg-red-500/15 text-red-700 dark:text-red-400 border-red-200">
          ANULADA
        </Badge>
      );
    default:
      return <Badge variant="outline">{estado}</Badge>;
  }
}

function RouteComponent() {
  const { user } = useAuthUser();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [techFilter, setTechFilter] = useState<string>("todos");

  const { data: usuarios } = trpc.auth.listUsers.useQuery();

  const { data, isLoading, isError, error } = trpc.orders.list.useQuery({
    limit: 500,
    offset: 0,
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
      (o) =>
        String(o.id).includes(q) ||
        String(o.correlativo ?? "")
          .toLowerCase()
          .includes(q) ||
        normalize(o.cliente?.nombre ?? "").includes(q) ||
        normalize(o.encargado?.nombre ?? "").includes(q),
    );
  }, [data, search]);

  async function handlePdf(ordenId: number) {
    try {
      await openOrderPdf(ordenId);
    } catch (err) {
      console.error(err);
    }
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
          onValueChange={(val) => setStatusFilter(val ?? "todos")}
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
          onValueChange={(val) => setTechFilter(val ?? "todos")}
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

      {/* Tabla */}
      <div className="rounded-lg border bg-surface overflow-hidden">
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
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground py-12"
                >
                  No se encontraron órdenes con los criterios especificados.
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
                  <TableCell>{getStatusBadge(orden.estado)}</TableCell>

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
