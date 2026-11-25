import { describe, it, expect } from "vitest";
import { listItemsSchema, createItemSchema } from "../catalog.schema.js";

describe("Catalog Schemas Validation", () => {
  describe("listItemsSchema", () => {
    it("debe aceptar búsqueda opcional y asignar valores por defecto", () => {
      const parsed = listItemsSchema?.parse({ search: "pantalla" });
      expect(parsed?.search).toBe("pantalla");
      expect(parsed?.limit).toBe(50);
      expect(parsed?.offset).toBe(0);
      expect(parsed?.includeInactive).toBe(false);
    });

    it("debe rechazar search mayor a 100 caracteres", () => {
      const longSearch = "a".repeat(101);
      expect(listItemsSchema?.safeParse({ search: longSearch }).success).toBe(
        false,
      );
    });
  });

  describe("createItemSchema", () => {
    it("debe aceptar un ítem válido de tipo servicio o producto", () => {
      expect(
        createItemSchema.safeParse({
          tipo: "servicio",
          nombre: "Mantenimiento preventivo",
          precio_referencial: "50.00",
        }).success,
      ).toBe(true);

      expect(
        createItemSchema.safeParse({
          tipo: "producto",
          nombre: "Pasta térmica Arctic MX-4",
          precio_referencial: "35.50",
        }).success,
      ).toBe(true);
    });
  });
});
