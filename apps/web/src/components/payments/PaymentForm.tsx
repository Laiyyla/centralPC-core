import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createPaymentSchema } from "@central-pc/schemas";
import type { CreatePaymentInput } from "@central-pc/schemas";
import { metodoPagoEnum } from "@central-pc/schemas";
import { trpc } from "@/trpc/client";

type PaymentFormProps = {
  orderId: number;
};

export function PaymentForm({ orderId }: PaymentFormProps) {
  const form = useForm<CreatePaymentInput>({
    resolver: zodResolver(createPaymentSchema),
    defaultValues: {
      order_id: orderId,
      metodo: metodoPagoEnum.options[0],
    },
  });

  const utils = trpc.useUtils();

  const paymentMutation = trpc.payments.create.useMutation({
    onSuccess: () => {
      utils.orders.getById.invalidate({ id: orderId });
      utils.orders.list.invalidate();
      form.reset();
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
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <select {...form.register("metodo")}>
        {metodoPagoEnum.options.map((me) => (
          <option key={me} value={me}>
            {me}
          </option>
        ))}
      </select>
      <input
        {...form.register("monto", { valueAsNumber: true })}
        type="number"
        step="0.01"
        placeholder="Ingrese el monto del Pago"
      />
      {form.formState.errors.monto && (
        <p style={{ color: "red" }}>{form.formState.errors.monto.message}</p>
      )}
      {paymentMutation.isError && (
        <p style={{ color: "red" }}>{paymentMutation.error.message}</p>
      )}
      <button type="submit" disabled={paymentMutation.isPending}>
        {paymentMutation.isPending ? "Registrando..." : "Registrar"}
      </button>
    </form>
  );
}
