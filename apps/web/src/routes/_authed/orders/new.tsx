import type { EquipoBase } from "@central-pc/schemas";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ClientSelector } from "@/components/orders/ClientSelector";
import { DeviceInput } from "@/components/orders/DeviceInput";
import { trpc } from "@/trpc/client";
import { openOrderPdf } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  ArrowRight,
  User,
  Monitor,
  FileText,
  Save,
  AlertCircle,
  Info,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authed/orders/new")({
  component: RouteComponent,
  staticData: {
    title: "Nueva Orden",
  },
});

type Step = 1 | 2 | 3;

const steps = [
  { number: 1, label: "Cliente", icon: User },
  { number: 2, label: "Equipos", icon: Monitor },
  { number: 3, label: "Observaciones", icon: FileText },
];

function RouteComponent() {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [clienteId, setClienteId] = useState<number | null>(null);
  const [equipos, setEquipos] = useState<EquipoBase[]>([]);
  const [observaciones, setObservaciones] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const navigate = useNavigate();

  const orderMutation = trpc.orders.create.useMutation({
    onSuccess: async (data) => {
      toast.success("Orden Creada!", {
        description: `Orden ${data.correlativo} registrada correctamente`,
      });
      try {
        await openOrderPdf(data.id);
      } catch (e) {
        console.error("Error al abrir PDF:", e);
        toast.warning("PDF no disponible", {
          description: "La orden fue registrada pero hay problemas con el PDF",
        });
      }
      navigate({
        to: "/orders/$orderId",
        params: { orderId: String(data.id) },
      });
    },
    onError: (error) => {
      toast.error("Error al crear la orden", { description: error.message });
      console.error("Error creando orden:", error.message);
    },
  });

  function validateStep(step: Step): boolean {
    setValidationError(null);

    if (step === 1 && !clienteId) {
      setValidationError("Debe seleccionar un cliente antes de continuar.");
      return false;
    }

    if (step === 2 && equipos.length === 0) {
      setValidationError("Debe agregar al menos un equipo.");
      return false;
    }

    return true;
  }

  function handleNext() {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 3) as Step);
    }
  }

  function handlePrevious() {
    setValidationError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1) as Step);
  }

  function handleSubmit() {
    if (!validateStep(1) || !validateStep(2)) {
      setCurrentStep(!clienteId ? 1 : 2);
      return;
    }

    orderMutation.mutate({
      cliente_id: clienteId!,
      equipos: equipos,
      observaciones: observaciones,
    });
  }

  const isLoading = orderMutation.isPending;

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            to="/orders"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            <ArrowLeft className="size-4" />
            Volver a Órdenes
          </Link>
          <h1 className="text-2xl font-bold text-foreground">
            Nueva Orden de Servicio
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Registre la información del cliente y los equipos para iniciar el
            proceso técnico.
          </p>
        </div>
        <Badge variant="outline" className="shrink-0">
          Orden Temporal: #TMP-{new Date().getFullYear()}
        </Badge>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-center gap-0 py-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = currentStep === step.number;
          const isCompleted = currentStep > step.number;

          return (
            <div key={step.number} className="flex items-center">
              {/* Step circle */}
              <div className="flex flex-col items-center">
                <div
                  className={`size-12 rounded-full flex items-center justify-center border-2 transition-colors ${
                    isActive
                      ? "bg-primary border-primary text-primary-foreground"
                      : isCompleted
                        ? "bg-success/10 border-success text-success"
                        : "bg-muted border-muted-foreground/30 text-muted-foreground"
                  }`}
                >
                  {isCompleted ? (
                    <svg
                      className="size-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    <Icon className="size-5" />
                  )}
                </div>
                <span
                  className={`text-xs font-medium mt-2 ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {step.label.toUpperCase()}
                </span>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={`w-24 md:w-32 h-0.5 mx-4 -mt-6 ${
                    isCompleted ? "bg-success" : "bg-muted"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Validation Error */}
      {validationError && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{validationError}</AlertDescription>
        </Alert>
      )}

      {/* Step 1: Cliente */}
      {currentStep === 1 && (
        <Card className="bg-surface">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <User className="size-5 text-primary" />
              <CardTitle className="text-lg text-primary">
                Información del Cliente
              </CardTitle>
            </div>
            <CardDescription>
              Seleccione un cliente existente o registre uno nuevo.
            </CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6">
            <ClientSelector onClientSelect={setClienteId} />
          </CardContent>
        </Card>
      )}

      {/* Step 2: Equipos */}
      {currentStep === 2 && (
        <Card className="bg-surface">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Monitor className="size-5 text-primary" />
              <CardTitle className="text-lg text-primary">
                Equipos a Reparar
              </CardTitle>
            </div>
            <CardDescription>
              Agregue los equipos que serán diagnosticados y reparados.
            </CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6">
            <DeviceInput onEquiposChange={setEquipos} />
          </CardContent>
        </Card>
      )}

      {/* Step 3: Observaciones */}
      {currentStep === 3 && (
        <Card className="bg-surface">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <FileText className="size-5 text-primary" />
              <CardTitle className="text-lg text-primary">
                Observaciones
              </CardTitle>
            </div>
            <CardDescription>
              Notas adicionales sobre la orden (opcional).
            </CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="observaciones">Observaciones del técnico</Label>
              <Textarea
                id="observaciones"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Ej: Cliente reporta que el equipo se apaga repentinamente. Revisar batería y ventilación."
                rows={4}
                disabled={isLoading}
              />
            </div>

            <Alert className="border-primary/20 bg-primary/5">
              <Info className="size-4 text-primary" />
              <AlertDescription className="text-sm text-muted-foreground">
                ¿Necesita piezas del catálogo? Puede agregarlas después de que
                el técnico realice el diagnóstico detallado.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Footer Navigation */}
      <div className="flex items-center justify-between pt-4">
        <div>
          {currentStep > 1 && (
            <Button
              type="button"
              variant="ghost"
              onClick={handlePrevious}
              disabled={isLoading}
            >
              <ArrowLeft className="size-4 mr-1" />
              Anterior
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {currentStep < 3 ? (
            <Button type="button" onClick={handleNext} disabled={isLoading}>
              Siguiente: {steps[currentStep].label}
              <ArrowRight className="size-4 ml-1" />
            </Button>
          ) : (
            <Button type="button" onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Creando...
                </>
              ) : (
                <>
                  <Save className="size-4 mr-1" />
                  Crear Orden
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Mutation Error */}
      {orderMutation.isError && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>
            Error al crear la orden: {orderMutation.error.message}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
