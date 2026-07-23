import { z } from "zod";

export const itemTypeEnum = z.enum(["servicio", "producto", "combo"]);

export const createItemSchema = z.object({
  tipo: itemTypeEnum,
  nombre: z.string().min(1).max(255),
  precio_referencial: z.string().min(1),
  // Lo de activo, en la bd esta defaulteado a true
});

export const updateItemSchema = z.object({
  id: z.number(),
  nombre: z.string().min(1).max(255).optional(),
  precio_referencial: z.string().optional(),
  activo: z.boolean().optional(),
});

export const listItemsSchema = z
  .object({
    tipo: itemTypeEnum.optional(),
    includeInactive: z.boolean().default(false),
  })
  .optional();

export const getByIdSchema = z.object({
  id: z.number(),
});

export const toggleActiveSchema = z.object({
  id: z.number(),
  activo: z.boolean(),
});

export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
export type ListItemsInput = z.infer<typeof listItemsSchema>;
export type GetByIdInput = z.infer<typeof getByIdSchema>;
export type ToggleActiveInput = z.infer<typeof toggleActiveSchema>;
