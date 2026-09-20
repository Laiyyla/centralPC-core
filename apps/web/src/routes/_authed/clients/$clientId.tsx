import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { trpc } from "@/trpc/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  UserIcon,
  PhoneIcon,
  CreditCardIcon,
  BuildingIcon,
  CalendarIcon,
  EyeIcon,
} from "lucide-react";

export const Route = createFileRoute("/_authed/clients/$clientId")({
  component: RouteComponent,
  staticData: {
    title: "Detalle de Cliente",
  },
});

function RouteComponent() {
  const { clientId } = useParams({ from: "/_authed/clients/$clientId" });

  const id = Number(clientId);
  const isValid = !isNaN(id) && id > 0;

  const { data, isLoading, isError } = trpc.clients.getById.useQuery(
    { id: isValid ? id : 0 },
    { enabled: isValid },
  );

  if (!isValid)
    return (
      <Alert variant="destructive">
        <AlertDescription>ID de cliente inválido.</AlertDescription>
      </Alert>
    );

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Cargando cliente...
      </div>
    );

  if (isError || !data)
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Error al obtener la información del cliente.
        </AlertDescription>
      </Alert>
    );

  const ordenes = data.orders ?? [];
  const ordenesEmitidas = ordenes.filter((o) => o.estado !== "ANULADA");

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/clients">
          <Button variant="ghost" size="icon">
            <ArrowLeftIcon className="size-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{data.nombre}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {ordenesEmitidas.length} orden
            {ordenesEmitidas.length !== 1 ? "es" : ""} activa
            {ordenesEmitidas.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Columna izquierda — info */}
        <div className="col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                <UserIcon className="size-4" />
                Información del Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <PhoneIcon className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs uppercase text-muted-foreground mb-0.5">
                    Teléfono
                  </p>
                  <p className="font-medium">{data.telefono}</p>
                </div>
              </div>

              {data.dni && (
                <div className="flex items-start gap-3">
                  <CreditCardIcon className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs uppercase text-muted-foreground mb-0.5">
                      DNI
                    </p>
                    <p className="font-medium">{data.dni}</p>
                  </div>
                </div>
              )}

              {data.ruc && (
                <div className="flex items-start gap-3">
                  <BuildingIcon className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs uppercase text-muted-foreground mb-0.5">
                      RUC
                    </p>
                    <p className="font-medium">{data.ruc}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Columna derecha — historial */}
        <div className="col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                Historial de Órdenes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Orden</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-center">Ver</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ordenes.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center text-muted-foreground py-12"
                      >
                        Este cliente no tiene órdenes registradas.
                      </TableCell>
                    </TableRow>
                  ) : (
                    ordenes.map((orden) => (
                      <TableRow key={orden.id}>
                        <TableCell>
                          <span className="font-semibold text-primary">
                            #{String(orden.id).padStart(5, "0")}
                          </span>
                          {orden.correlativo && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {orden.correlativo}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              orden.estado === "ANULADA"
                                ? "border-destructive text-destructive"
                                : "border-primary text-primary"
                            }
                          >
                            {orden.estado === "ANULADA" ? "Anulada" : "Emitida"}
                          </Badge>
                        </TableCell>
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
                        <TableCell className="text-right font-semibold">
                          S/ {Number(orden.total).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Link
                            to="/orders/$orderId"
                            params={{ orderId: String(orden.id) }}
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
