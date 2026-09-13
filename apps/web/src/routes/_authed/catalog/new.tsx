import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createItemSchema } from "@central-pc/schemas";
import type { CreateItemInput } from "@central-pc/schemas";
import { trpc } from "@/trpc/client";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { itemTypeEnum } from "@central-pc/schemas";

export const Route = createFileRoute("/_authed/catalog/new")({
  component: NewItem,
});

function NewItem() {
  const navigate = useNavigate();

  const form = useForm<CreateItemInput>({
    resolver: zodResolver(createItemSchema),
  });

  const itemMutation = trpc.catalog.create.useMutation({
    onSuccess: (data) => {
      navigate({ to: "/catalog" });
    },
    onError: (error) => {
      console.error(error.message);
    },
  });

  function onSubmit(values: CreateItemInput) {
    itemMutation.mutate(values);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input
        {...form.register("nombre")}
        type="text"
        placeholder="Ingresa el Nombre del Item"
      />
      <input
        {...form.register("precio_referencial")}
        type="number"
        placeholder="Ingresa el valor"
      />
      <select {...form.register("tipo")}>
        {itemTypeEnum.options.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
      <button type="submit">Guardar</button>
    </form>
  );
}
