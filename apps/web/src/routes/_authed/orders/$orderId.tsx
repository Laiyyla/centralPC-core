import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PaymentForm } from "@/components/payments/PaymentForm";
import { trpc } from "@/trpc/client";
import { useAuthUser } from "@/context/auth-context";
import { openOrderPdf } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeftIcon,
  PrinterIcon,
  DownloadIcon,
  XCircleIcon,
  UserIcon,
  MonitorIcon,
  ReceiptIcon,
  EditIcon,
  UserCheckIcon,
  HistoryIcon,
  ClockIcon,
  FileTextIcon,
  CheckCircle2Icon,
} from "lucide-react";
import { toast } from "sonner";
import { EditOrderModal } from "@/components/orders/EditOrderModal";
import { getStatusBadge } from "./index";

export const Route = createFileRoute("/_authed/orders/$orderId")({
  component: RouteComponent,
  staticData: {
    title: "Detalle de Orden",
  },
});

function RouteComponent() {
  const { orderId } = useParams({ from: "/_authed/orders/$orderId" });
  const { user } = useAuthUser();

  const id = Number(orderId);
  const isValidId = !isNaN(id) && id > 0;

  const [anularOpen, setAnularOpen] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedTechId, setSelectedTechId] = useState<string>("");

  const { data, isLoading, isError } = trpc.orders.getById.useQuery(
    { id: isValidId ? id : 0 },
    { enabled: isValidId },
  );

  const { data: usuarios } = trpc.auth.listUsers.useQuery();

  const utils = trpc.useUtils();
  const anularMutation = trpc.orders.anular.useMutation({
    onSuccess: () => {
      utils.orders.getById.invalidate({ id });
      utils.orders.list.invalidate();
      setAnularOpen(false);
      setMotivo("");
      toast.success("Orden anulada correctamente");
    },
  });

  const changeStatusMutation = trpc.orders.changeStatus.useMutation({
    onSuccess: () => {
      utils.orders.getById.invalidate({ id });
      utils.orders.list.invalidate();
      toast.success("Estado operativo actualizado");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const assignTechMutation = trpc.orders.assignTechnician.useMutation({
    onSuccess: () => {
      utils.orders.getById.invalidate({ id });
      utils.orders.list.invalidate();
      setAssignModalOpen(false);
      toast.success("Técnico asignado correctamente");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  async function handlePdf() {
    try {
      await openOrderPdf(id);
    } catch (err) {
      console.error(err);
    }
  }

  function handleAnularSubmit() {
    if (!motivo.trim()) return;
    anularMutation.mutate({ id, motivo });
  }

  function handleAssignSubmit() {
    assignTechMutation.mutate({
      id,
      encargado_id:
        selectedTechId === "ninguno" ? null : Number(selectedTechId),
    });
  }

  if (!isValidId)
    return (
      <Alert variant="destructive">
        <AlertDescription>ID de orden inválido.</AlertDescription>
      </Alert>
    );
  if (isLoading)
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Cargando orden...
      </div>
    );
  if (isError || !data)
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Error al obtener la información de la orden.
        </AlertDescription>
      </Alert>
    );

  const isAnulada = data.estado === "ANULADA";
  const isEstadoFinal = isAnulada || data.estado === "ENTREGADA";
  const isAdmin = user?.rol === "admin";
  const isEncargado = Boolean(data.encargado && data.encargado.id === user?.id);
  const canManageOrder = isAdmin || isEncargado;

  const estadosEditables = [
    "RECEPCIONADA",
    "EN_DIAGNOSTICO",
    "ESPERANDO_APROBACION",
    "EN_REPARACION",
  ];
  const canEdit = estadosEditables.includes(data.estado) && canManageOrder;
  const canChangeStatus = !isEstadoFinal && canManageOrder;

  const totalPagado =
    data.pagos
      ?.filter((p) => p.estado === "ACTIVO")
      .reduce((acc, p) => acc + Number(p.monto), 0) ?? 0;

  const totalOrden = Number(data.total);
  const montoPendiente = Math.max(totalOrden - totalPagado, 0);

  return (
    <>
      {/* Modal Editar */}
      {canEdit && (
        <EditOrderModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          order={data as any}
        />
      )}

      {/* Modal Asignar Técnico (Solo Administradores) */}
      {user?.rol === "admin" && (
        <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Asignar Técnico Encargado</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-2">
              <Label>Seleccionar Técnico Responsable</Label>
              <Select
                value={selectedTechId}
                onValueChange={(val) => setSelectedTechId(val ?? "ninguno")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un técnico..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ninguno">
                    Sin asignar (Liberar orden)
                  </SelectItem>
                  {usuarios
                    ?.filter((u) => u.rol === "tecnico" || u.rol === "admin")
                    .map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>
                        {t.nombre} ({t.rol})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setAssignModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                disabled={assignTechMutation.isPending}
                onClick={handleAssignSubmit}
              >
                {assignTechMutation.isPending
                  ? "Guardando..."
                  : "Guardar Asignación"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal anular */}
      <Dialog open={anularOpen} onOpenChange={setAnularOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Anular Orden</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <Label>Motivo de anulación</Label>
            <Textarea
              placeholder="Describe el motivo de la anulación..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
            />
            {anularMutation.isError && (
              <Alert variant="destructive">
                <AlertDescription>
                  {anularMutation.error.message}
                </AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAnularOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={!motivo.trim() || anularMutation.isPending}
              onClick={handleAnularSubmit}
            >
              {anularMutation.isPending ? "Anulando..." : "Confirmar anulación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/orders">
              <Button variant="ghost" size="icon">
                <ArrowLeftIcon className="size-4" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground">
                  Orden #{String(data.id).padStart(5, "0")}
                </h1>
                {data.correlativo && (
                  <span className="text-muted-foreground text-sm font-medium">
                    (N° {data.correlativo})
                  </span>
                )}
                {getStatusBadge(data.estado)}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Registrada el{" "}
                {new Date(data.fecha_emision).toLocaleDateString("es-PE", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canEdit && (
              <Button variant="default" onClick={() => setEditModalOpen(true)}>
                <EditIcon className="size-4 mr-1" />
                Editar Orden
              </Button>
            )}
            <Button variant="outline" onClick={handlePdf}>
              <PrinterIcon className="size-4 mr-1" />
              Imprimir
            </Button>
            <Button variant="outline" onClick={handlePdf}>
              <DownloadIcon className="size-4 mr-1" />
              PDF
            </Button>
            {user?.rol === "admin" && !isAnulada && (
              <Button variant="destructive" onClick={() => setAnularOpen(true)}>
                <XCircleIcon className="size-4 mr-1" />
                Anular
              </Button>
            )}
          </div>
        </div>

        {/* Banner de Control Operativo: Estado y Técnico Encargado */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Cambio de Estado Operativo */}
          <Card className="bg-surface border-l-4 border-l-primary">
            <CardHeader className="py-3">
              <CardTitle className="text-xs uppercase font-semibold text-muted-foreground flex items-center justify-between">
                <span>Estado Operativo de la Orden</span>
                <ClockIcon className="size-4 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 flex items-center gap-3">
              <Select
                value={data.estado}
                disabled={!canChangeStatus || changeStatusMutation.isPending}
                onValueChange={(val) => {
                  if (val && val !== data.estado) {
                    changeStatusMutation.mutate({
                      id: data.id,
                      estado: val as any,
                    });
                  }
                }}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RECEPCIONADA">1. RECEPCIONADA</SelectItem>
                  <SelectItem value="EN_DIAGNOSTICO">
                    2. EN DIAGNÓSTICO
                  </SelectItem>
                  <SelectItem value="ESPERANDO_APROBACION">
                    3. ESPERANDO APROBACIÓN
                  </SelectItem>
                  <SelectItem value="EN_REPARACION">
                    4. EN REPARACIÓN
                  </SelectItem>
                  <SelectItem value="COMPLETADA">5. COMPLETADA</SelectItem>
                  <SelectItem value="ENTREGADA">6. ENTREGADA</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Técnico Encargado */}
          <Card className="bg-surface border-l-4 border-l-emerald-500">
            <CardHeader className="py-3">
              <CardTitle className="text-xs uppercase font-semibold text-muted-foreground flex items-center justify-between">
                <span>Técnico Responsable Encargado</span>
                <UserCheckIcon className="size-4 text-emerald-500" />
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 flex items-center justify-between gap-3">
              <div>
                {data.encargado ? (
                  <p className="font-semibold text-foreground">
                    {data.encargado.nombre}
                  </p>
                ) : (
                  <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                    Sin Técnico Asignado
                  </p>
                )}
              </div>
              {!isAnulada && (
                <>
                  {user?.rol === "admin" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedTechId(
                          data.encargado
                            ? String(data.encargado.id)
                            : "ninguno",
                        );
                        setAssignModalOpen(true);
                      }}
                    >
                      {data.encargado ? "Cambiar" : "Asignar Técnico"}
                    </Button>
                  )}
                  {user?.rol !== "admin" && !data.encargado && user?.id && (
                    <Button
                      size="sm"
                      variant="default"
                      disabled={assignTechMutation.isPending}
                      onClick={() => {
                        assignTechMutation.mutate({
                          id,
                          encargado_id: user.id,
                        });
                      }}
                    >
                      {assignTechMutation.isPending
                        ? "Asignando..."
                        : "Tomar Orden"}
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna izquierda: Info cliente, Observaciones, Equipos */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Info cliente */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                  <UserIcon className="size-4" />
                  Información del Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs uppercase text-muted-foreground mb-1">
                    Nombre completo
                  </p>
                  <p className="font-medium">{data.cliente?.nombre ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground mb-1">
                    Teléfono de contacto
                  </p>
                  <p className="font-medium">{data.cliente?.telefono ?? "—"}</p>
                </div>
                {data.cliente?.dni && (
                  <div>
                    <p className="text-xs uppercase text-muted-foreground mb-1">
                      DNI
                    </p>
                    <p className="font-medium">{data.cliente.dni}</p>
                  </div>
                )}
                {data.cliente?.ruc && (
                  <div>
                    <p className="text-xs uppercase text-muted-foreground mb-1">
                      RUC
                    </p>
                    <p className="font-medium">{data.cliente.ruc}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Observaciones generales */}
            {data.observaciones && (
              <Card className="bg-amber-500/5 border-amber-200">
                <CardHeader className="py-3">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-2">
                    <FileTextIcon className="size-4" />
                    Observaciones Generales de Recepción
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 text-sm text-foreground">
                  <p className="whitespace-pre-line">{data.observaciones}</p>
                </CardContent>
              </Card>
            )}

            {/* Equipos y servicios */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                  <MonitorIcon className="size-4" />
                  Equipos y Servicios
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
                {data.equipos?.map((eq) => (
                  <div
                    key={eq.id}
                    className="flex flex-col gap-3 p-3 rounded-lg border bg-surface/50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold uppercase text-primary">
                          {eq.tipo_equipo}
                        </span>
                        {eq.descripcion && (
                          <span className="text-sm font-medium text-foreground">
                            — {eq.descripcion}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Observaciones específicas por equipo */}
                    {eq.observaciones && (
                      <p className="text-xs bg-muted/60 px-3 py-1.5 rounded text-muted-foreground italic">
                        <strong>Notas del equipo:</strong> {eq.observaciones}
                      </p>
                    )}

                    {eq.detalle && eq.detalle.length > 0 && (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Descripción / Repuesto</TableHead>
                            <TableHead className="text-center">
                              Cantidad
                            </TableHead>
                            <TableHead className="text-right">
                              Precio Unit.
                            </TableHead>
                            <TableHead className="text-right">
                              Subtotal
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {eq.detalle.map((de) => (
                            <TableRow key={de.id}>
                              <TableCell className="font-medium">
                                {de.nombre_snap}
                              </TableCell>
                              <TableCell className="text-center">
                                {de.cantidad}
                              </TableCell>
                              <TableCell className="text-right">
                                S/ {Number(de.precio_unit_snap).toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right font-semibold">
                                S/ {Number(de.subtotal).toFixed(2)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                ))}

                {/* Detalle suelto */}
                {data.detalle_suelto && data.detalle_suelto.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <span className="text-sm font-semibold text-muted-foreground">
                      Ítems adicionales
                    </span>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Descripción</TableHead>
                          <TableHead className="text-center">
                            Cantidad
                          </TableHead>
                          <TableHead className="text-right">
                            Precio Unit.
                          </TableHead>
                          <TableHead className="text-right">Subtotal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.detalle_suelto.map((de) => (
                          <TableRow key={de.id}>
                            <TableCell>{de.nombre_snap}</TableCell>
                            <TableCell className="text-center">
                              {de.cantidad}
                            </TableCell>
                            <TableCell className="text-right">
                              S/ {Number(de.precio_unit_snap).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              S/ {Number(de.subtotal).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Timeline / Historial de Auditoría */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                  <HistoryIcon className="size-4" />
                  Historial de Auditoría y Trazabilidad
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!data.historial || data.historial.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No hay registros de cambios aun.
                  </p>
                ) : (
                  <div className="relative border-l border-muted pl-4 space-y-4">
                    {data.historial.map((log: any) => (
                      <div
                        key={log.id}
                        className="relative flex flex-col gap-1"
                      >
                        <div className="absolute -left-[21px] top-1 size-2.5 rounded-full bg-primary" />
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="font-semibold text-foreground">
                            {log.user?.nombre ?? `Usuario #${log.user_id}`}
                          </span>
                          <span>
                            {new Date(log.fecha_registro).toLocaleString(
                              "es-PE",
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Badge variant="outline" className="text-xs">
                            {log.accion}
                          </Badge>
                          {log.estado_anterior &&
                            log.estado_nuevo &&
                            log.estado_anterior !== log.estado_nuevo && (
                              <span className="text-xs text-muted-foreground">
                                {log.estado_anterior} ➔{" "}
                                <strong>{log.estado_nuevo}</strong>
                              </span>
                            )}
                        </div>
                        {log.notas && (
                          <p className="text-xs text-muted-foreground bg-muted/30 p-2 rounded mt-1">
                            {log.notas}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Columna derecha */}
          <div className="flex flex-col gap-6">
            {/* Resumen de costos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                  <ReceiptIcon className="size-4" />
                  Resumen de Costos
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total orden</span>
                  <span className="font-medium">
                    S/ {totalOrden.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total pagado</span>
                  <span className="font-medium text-emerald-600">
                    S/ {totalPagado.toFixed(2)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="font-semibold">Pendiente</span>
                  <span
                    className={cn(
                      "font-bold text-base",
                      montoPendiente === 0
                        ? "text-emerald-600"
                        : "text-primary",
                    )}
                  >
                    S/ {montoPendiente.toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Registro de pago */}
            {!isAnulada && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                    Registro de Pago
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PaymentForm orderId={id} montoPendiente={montoPendiente} />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
