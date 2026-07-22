import { z } from "zod"

export const createClientSchema = z.object({
  nombre: z.string().min(1).max(255),
  telefono: z.string().min(1).max(20),
  dni: z.string().optional(),
  ruc: z.string().optional()
});

export const searchClientSchema = z.object({
  query: z.string().min(1),
  limit: z.number().min(1).max(50).default(10)
});

export const getByIdSchema = z.object({
  id: z.number()
})

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type SearchClientInput = z.infer<typeof searchClientSchema>;
