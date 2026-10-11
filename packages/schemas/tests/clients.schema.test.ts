import { describe, it, expect } from "vitest";
import {
  createClientSchema,
  searchClientSchema,
  listClientsSchema,
} from "../clients.schema.js";

describe("Clients Schemas Validation", () => {
  describe("createClientSchema", () => {
    it("debe aceptar un cliente con nombre y teléfono", () => {
      const payload = {
        nombre: "Juan Pérez",
        telefono: "987654321",
        dni: "12345678",
      };

      expect(createClientSchema.safeParse(payload).success).toBe(true);
    });

    it("debe rechazar cliente sin nombre o sin teléfono", () => {
      expect(
        createClientSchema.safeParse({ nombre: "", telefono: "987654321" })
          .success,
      ).toBe(false);

      expect(
        createClientSchema.safeParse({ nombre: "Juan Pérez", telefono: "" })
          .success,
      ).toBe(false);
    });
  });

  describe("searchClientSchema", () => {
    it("debe exigir al menos 1 carácter en la consulta de búsqueda", () => {
      expect(searchClientSchema.safeParse({ query: "Ju" }).success).toBe(true);
      expect(searchClientSchema.safeParse({ query: "" }).success).toBe(false);
    });

    it("debe asignar límite por defecto de 10", () => {
      const parsed = searchClientSchema.parse({ query: "Pedro" });
      expect(parsed.limit).toBe(10);
    });
  });

  describe("listClientsSchema", () => {
    it("debe asignar valores por defecto en paginación", () => {
      const parsed = listClientsSchema.parse({});
      expect(parsed?.limit).toBe(50);
      expect(parsed?.offset).toBe(0);
    });
  });
});
