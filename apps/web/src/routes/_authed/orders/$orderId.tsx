import {
  createFileRoute,
  useNavigate,
  useParams,
  Link,
} from "@tanstack/react-router";
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
} from "lucide-react";

export const Route = createFileRoute("/_authed/orders/$orderId")({
  component: RouteComponent,
  staticData: {
    title: "Detalle de Orden",
  },
});

function RouteComponent() {
  const { orderId } = useParams({ from: "/_authed/orders/$orderId" });
  const navigate = useNavigate();
  const { user } = useAuthUser();

  const id = Number(orderId);
  const isValidId = !isNaN(id) && id > 0;

  const [anularOpen, setAnularOpen] = useState(false);
  const [motivo, setMotivo] = useState("");

  const { data, isLoading, isError } = trpc.orders.getById.useQuery(
    { id: isValidId ? id : 0 },
    { enabled: isValidId },
  );

  const utils = trpc.useUtils();
  const anularMutation = trpc.orders.anular.useMutation({
    onSuccess: () => {
      utils.orders.getById.invalidate({ id });
      utils.orders.list.invalidate();
      setAnularOpen(false);
      setMotivo("");
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

  const totalPagado =
    data.pagos
      ?.filter((p) => p.estado === "ACTIVO")
      .reduce((acc, p) => acc + Number(p.monto), 0) ?? 0;

  const totalOrden = Number(data.total);
  const montoPendiente = Math.max(totalOrden - totalPagado, 0);

  return (
    <>
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
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Link to="/orders">
              <Button variant="ghost" size="icon">
                <ArrowLeftIcon className="size-4" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground">
                  Orden {data.correlativo}
                </h1>
                <Badge
                  variant="outline"
                  className={
                    isAnulada
                      ? "border-destructive text-destructive"
                      : "border-primary text-primary"
                  }
                >
                  {isAnulada ? "Anulada" : "Emitida"}
                </Badge>
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

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handlePdf}>
              <PrinterIcon />
              Imprimir
            </Button>
            <Button variant="outline" onClick={handlePdf}>
              <DownloadIcon />
              Descargar PDF
            </Button>
            {user?.rol === "admin" && !isAnulada && (
              <Button variant="destructive" onClick={() => setAnularOpen(true)}>
                <XCircleIcon />
                Anular Orden
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Columna izquierda */}
          <div className="col-span-2 flex flex-col gap-6">
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
                  <div key={eq.id} className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold capitalize">
                        {eq.tipo_equipo}
                      </span>
                      {eq.descripcion && (
                        <span className="text-sm text-muted-foreground">
                          — {eq.descripcion}
                        </span>
                      )}
                    </div>
                    {eq.detalle && eq.detalle.length > 0 && (
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
                            <TableHead className="text-right">
                              Subtotal
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {eq.detalle.map((de) => (
                            <TableRow key={de.id}>
                              <TableCell>{de.nombre_snap}</TableCell>
                              <TableCell className="text-center">
                                {de.cantidad}
                              </TableCell>
                              <TableCell className="text-right">
                                S/ {Number(de.precio_unit_snap).toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right">
                                S/ {Number(de.subtotal).toFixed(2)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                    <Separator />
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
                            <TableCell className="text-right">
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
                  <span className="font-medium text-success">
                    S/ {totalPagado.toFixed(2)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="font-semibold">Pendiente</span>
                  <span
                    className={cn(
                      "font-bold text-base",
                      montoPendiente === 0 ? "text-success" : "text-primary",
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
