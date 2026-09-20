import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createPaymentSchema } from "@central-pc/schemas";
import type { CreatePaymentInput } from "@central-pc/schemas";
import { metodoPagoEnum } from "@central-pc/schemas";
import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import {
  BanknoteIcon,
  SmartphoneIcon,
  ArrowRightLeftIcon,
  CreditCardIcon,
} from "lucide-react";

type PaymentFormProps = {
  orderId: number;
  montoPendiente?: number;
};

const metodoConfig: Record<string, { label: string; icon: React.ReactNode }> = {
  efectivo: { label: "Efectivo", icon: <BanknoteIcon className="size-4" /> },
  yape: { label: "Yape", icon: <SmartphoneIcon className="size-4" /> },
  plin: { label: "Plin", icon: <SmartphoneIcon className="size-4" /> },
  transferencia: {
    label: "Transferencia",
    icon: <ArrowRightLeftIcon className="size-4" />,
  },
  tarjeta: { label: "Tarjeta", icon: <CreditCardIcon className="size-4" /> },
};

export function PaymentForm({ orderId, montoPendiente }: PaymentFormProps) {
  const form = useForm<CreatePaymentInput>({
    resolver: zodResolver(createPaymentSchema),
    defaultValues: {
      order_id: orderId,
      metodo: metodoPagoEnum.options[0],
      monto: montoPendiente ?? 0,
    },
  });

  const selectedMetodo = form.watch("metodo");
  const utils = trpc.useUtils();

  const paymentMutation = trpc.payments.create.useMutation({
    onSuccess: () => {
      utils.orders.getById.invalidate({ id: orderId });
      utils.orders.list.invalidate();
      form.reset({
        order_id: orderId,
        metodo: metodoPagoEnum.options[0],
      });
    },
    onError: (error) => {
      console.error("Error registrando pago:", error.message);
    },
  });

  function onSubmit(values: CreatePaymentInput) {
    paymentMutation.mutate({
      ...values,
      order_id: Number(orderId),
      monto: Number(values.monto),
    });
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col gap-4"
    >
      {/* Método de pago */}
      <div className="flex flex-col gap-2">
        <Label className="text-xs uppercase tracking-widest text-muted-foreground">
          Método de Pago
        </Label>
        <div className="flex flex-wrap gap-2">
          {metodoPagoEnum.options.map((metodo) => {
            const config = metodoConfig[metodo];
            const isSelected = selectedMetodo === metodo;
            return (
              <button
                key={metodo}
                type="button"
                onClick={() => form.setValue("metodo", metodo)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                  isSelected
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground",
                )}
              >
                {config?.icon}
                {config?.label ?? metodo}
              </button>
            );
          })}
        </div>
      </div>

      {/* Monto */}
      <div className="flex flex-col gap-2">
        <Label className="text-xs uppercase tracking-widest text-muted-foreground">
          Monto a Registrar (S/)
        </Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            S/
          </span>
          <Input
            {...form.register("monto", { valueAsNumber: true })}
            type="number"
            step="0.01"
            placeholder="0.00"
            className="pl-8"
          />
        </div>
        {form.formState.errors.monto && (
          <p className="text-xs text-destructive">
            {form.formState.errors.monto.message}
          </p>
        )}
      </div>

      {/* Error mutation */}
      {paymentMutation.isError && (
        <Alert variant="destructive">
          <AlertDescription>{paymentMutation.error.message}</AlertDescription>
        </Alert>
      )}

      {/* Submit */}
      <Button
        type="submit"
        disabled={paymentMutation.isPending}
        className="w-full"
      >
        {paymentMutation.isPending
          ? "Registrando..."
          : "Confirmar y Registrar Pago"}
      </Button>
    </form>
  );
}
