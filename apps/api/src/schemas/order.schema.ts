import { z } from "zod";

export const tipoEquipoEnum = z.enum([
  "PC",
  "LAPTOP",
  "IMPRESORA",
  "CELULAR",
  "OTROS",
]);

export const estadoOrderEnum = z.enum(["EMITIDA", "ANULADA"]);

export const detalleItemSchema = z.object({
  item_id: z.number().optional(),
  nombre_personalizado: z.string().optional(),
  precio_unitario: z.number().positive(),
  cantidad: z.number().min(1),
});

export const equipoSchema = z.object({
  tipo_equipo: tipoEquipoEnum,
  descripcion: z.string().min(1),
  observaciones: z.string().optional(),
  detalle: z
    .array(detalleItemSchema)
    .min(1, "Cada equipo debe tener almenos un item"),
});

export const createOrderSchema = z
  .object({
    cliente_id: z.number().optional(),
    observaciones: z.string().optional(),
    equipos: z.array(equipoSchema),
    detalle_suelto: z.array(detalleItemSchema).optional(),
  })
  .refine(
    (data) => {
      return data.equipos.length > 0 || (data.detalle_suelto?.length ?? 0) > 0;
    },
    {
      message: "La orden debe tener almenos 1 equipo o 1 detalle suelto",
    },
  );

export const listOrdersSchema = z
  .object({
    estado: estadoOrderEnum.optional(),
    cliente_id: z.number().optional(),
    fecha_desde: z.iso.datetime().optional(),
    fecha_hasta: z.iso.datetime().optional(),
    limit: z.number().min(1).max(100).default(20),
    offset: z.number().min(0).default(0),
  })
  .optional();

export const getOrderByIdSchema = z.object({
  id: z.number(),
});

export const anularOrderSchema = z.object({
  id: z.number(),
  motivo: z.string().min(1, "El motivo de anulacion es obligatorio"),
});

export type ListOrdersInput = z.infer<typeof listOrdersSchema>;
export type GetOrderByIdInput = z.infer<typeof getOrderByIdSchema>;
export type anularOrdenInput = z.infer<typeof anularOrderSchema>;
