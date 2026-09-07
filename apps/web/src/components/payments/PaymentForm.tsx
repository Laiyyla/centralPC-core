import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { createPaymentSchema } from "@central-pc/schemas";
import type { CreatePaymentInput } from "@central-pc/schemas";
import { metodoPagoEnum } from "@central-pc/schemas";
import { trpc } from "../../trpc/client";

type PaymentFormProps = {
  orderId: number;
};

export function PaymentForm({ orderId }: PaymentFormProps) {
  const form = useForm<CreatePaymentInput>({
    resolver: zodResolver(createPaymentSchema),
  });

  const queryClient = useQueryClient();

  const paymentMutation = trpc.payments.create.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries();
      form.reset();
    },
    onError: (error) => {
      console.error(error.message);
    },
  });

  function onSubmit(values: CreatePaymentInput) {
    paymentMutation.mutate({ ...values, order_id: orderId });
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
        {...form.register("monto")}
        type="number"
        placeholder="Ingrese el monto del Pago"
      ></input>
      <button type="submit">Registrar</button>
    </form>
  );
}
