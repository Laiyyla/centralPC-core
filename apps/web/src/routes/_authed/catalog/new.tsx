import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createItemSchema, itemTypeEnum } from "@central-pc/schemas";
import type { CreateItemInput } from "@central-pc/schemas";
import { trpc } from "@/trpc/client";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  Save,
  Package,
  Info,
  Layers,
  Calculator,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authed/catalog/new")({
  component: NewItem,
  staticData: {
    title: "Crear Item",
  },
});

const tipoLabels: Record<string, string> = {
  servicio: "Servicio",
  producto: "Producto",
  combo: "Combo",
};

function NewItem() {
  const navigate = useNavigate();

  const form = useForm<CreateItemInput>({
    resolver: zodResolver(createItemSchema),
    defaultValues: {
      tipo: "servicio",
      precio_referencial: undefined,
    },
  });

  const itemMutation = trpc.catalog.create.useMutation({
    onSuccess: () => {
      toast.success("Item Creado", {
        description: "El item se agregó al catálogo correctamente",
      });
      navigate({ to: "/catalog" });
    },
    onError: (error) => {
      toast.error("Error al crear ítem", { description: error.message });
      console.error(error.message);
    },
  });

  function onSubmit(values: CreateItemInput) {
    itemMutation.mutate({
      ...values,
      // isActive se maneja en backend por defecto como true
    });
  }

  const isLoading = itemMutation.isPending;

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <Link
          to="/catalog"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
        >
          <ArrowLeft className="size-4" />
          Volver al Catálogo
        </Link>
        <h1 className="text-2xl font-bold text-foreground">
          Nuevo Ítem de Catálogo
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Registra un nuevo servicio, producto o combo para usar en órdenes de
          servicio.
        </p>
      </div>

      {/* Form Card */}
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card className="bg-surface">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Package className="size-5 text-primary" />
              <CardTitle className="text-lg text-primary">
                Información del Ítem
              </CardTitle>
            </div>
            <CardDescription>
              Complete los detalles básicos para la identificación y tarifación
              del ítem.
            </CardDescription>
          </CardHeader>

          <Separator />

          <CardContent className="pt-6 space-y-6">
            {/* Nombre */}
            <div className="space-y-2">
              <Label
                htmlFor="nombre"
                className="text-sm font-semibold uppercase tracking-wide"
              >
                Nombre del Ítem
              </Label>
              <Input
                id="nombre"
                {...form.register("nombre")}
                placeholder="Ej: Mantenimiento Preventivo Advanced o Memoria RAM 16GB"
                className="h-11"
                disabled={isLoading}
              />
              {form.formState.errors.nombre && (
                <p className="text-sm text-error">
                  {form.formState.errors.nombre.message}
                </p>
              )}
            </div>

            {/* Tipo + Precio */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tipo */}
              <div className="space-y-2">
                <Label
                  htmlFor="tipo"
                  className="text-sm font-semibold uppercase tracking-wide"
                >
                  Tipo de Ítem
                </Label>
                <Select
                  value={form.watch("tipo")}
                  onValueChange={(value) =>
                    form.setValue("tipo", value as CreateItemInput["tipo"])
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger id="tipo" className="h-11">
                    <SelectValue placeholder="Seleccione el tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {itemTypeEnum.options.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>
                        {tipoLabels[tipo] ?? tipo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.tipo && (
                  <p className="text-sm text-error">
                    {form.formState.errors.tipo.message}
                  </p>
                )}
              </div>

              {/* Precio */}
              <div className="space-y-2">
                <Label
                  htmlFor="precio_referencial"
                  className="text-sm font-semibold uppercase tracking-wide"
                >
                  Precio Referencial
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
                    S/
                  </span>
                  <Input
                    id="precio_referencial"
                    {...form.register("precio_referencial")}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="h-11 pl-10"
                    disabled={isLoading}
                  />
                </div>
                {form.formState.errors.precio_referencial && (
                  <p className="text-sm text-error">
                    {form.formState.errors.precio_referencial.message}
                  </p>
                )}
              </div>
            </div>

            {/* Estado Toggle */}
            <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/30">
              <div className="space-y-0.5">
                <Label htmlFor="activo" className="text-sm font-medium">
                  Estado del Ítem
                </Label>
                <p className="text-xs text-muted-foreground">
                  Define si el ítem estará visible al crear nuevas órdenes.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-primary">
                  ACTIVO
                </span>
                <Switch id="activo" checked={true} disabled aria-readonly />
              </div>
            </div>

            {/* Info Alert */}
            <Alert className="border-primary/20 bg-primary/5">
              <Info className="size-4 text-primary" />
              <AlertTitle className="text-primary font-semibold">
                Sobre los Precios
              </AlertTitle>
              <AlertDescription className="text-muted-foreground text-sm">
                El precio ingresado es una base sugerida. Podrá ser ajustado
                manualmente durante la emisión de una orden si el técnico lo
                considera necesario.
              </AlertDescription>
            </Alert>

            {/* Actions */}
            <Separator />
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate({ to: "/catalog" })}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="size-4" />
                    Guardar Ítem
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-surface border-dashed">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Layers className="size-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground text-sm">
                  Uso en Combos
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Los servicios marcados como "Combo" permiten agrupar múltiples
                  repuestos bajo un solo concepto de mano de obra.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-surface border-dashed">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Calculator className="size-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground text-sm">
                  Impuestos
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Todos los precios del catálogo deben ingresarse incluyendo el
                  IGV correspondiente (18%) para facilitar el cálculo final.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
