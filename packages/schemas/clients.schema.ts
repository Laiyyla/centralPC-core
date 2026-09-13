import { z } from "zod";

export const createClientSchema = z.object({
  nombre: z.string().min(1).max(255),
  telefono: z.string().min(1).max(20),
  dni: z.string().optional(),
  ruc: z.string().optional(),
});

export const searchClientSchema = z.object({
  query: z.string().min(1),
  limit: z.number().min(1).max(50).default(10),
});

export const getClientByIdSchema = z.object({
  id: z.number(),
});

export const listClientsSchema = z
  .object({
    limit: z.number().min(1).max(100).default(50).optional(),
    offset: z.number().min(0).default(0).optional(),
  })
  .optional();

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type SearchClientInput = z.infer<typeof searchClientSchema>;
export type ListClientsInput = z.infer<typeof listClientsSchema>;

