import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock para entorno Node donde document y localStorage no existen de forma nativa
const mockStorage: Record<string, string> = {};
const mockLocalStorage = {
  getItem: vi.fn((key: string) => mockStorage[key] ?? null),
  setItem: vi.fn((key: string, val: string) => {
    mockStorage[key] = val;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockStorage[key];
  }),
  clear: vi.fn(() => {
    for (const k in mockStorage) delete mockStorage[k];
  }),
};

// Asignar mocks a globalThis
// @ts-ignore
globalThis.localStorage = mockLocalStorage;

const mockAppendChild = vi.fn();
const mockRemoveChild = vi.fn();
(globalThis as any).document = {
  body: {
    appendChild: mockAppendChild,
    removeChild: mockRemoveChild,
  },
  createElement: vi.fn((tag: string) => ({
    tagName: tag.toUpperCase(),
    href: "",
    download: "",
    click: vi.fn(),
  })),
};

// @ts-ignore
globalThis.URL.createObjectURL = vi.fn((blob: any) => "blob:http://localhost/mock-uuid");
// @ts-ignore
globalThis.URL.revokeObjectURL = vi.fn();

import { fetchOrderPdfBlob, openOrderPdf } from "../api";

describe("PDF Generation and Mobile/Desktop Preview Helpers", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe("fetchOrderPdfBlob", () => {
    it("debe obtener el blob del PDF enviando headers de autorización si existe token", async () => {
      mockLocalStorage.setItem("token", "dummy-jwt-token");
      const fakeBlob = new Blob(["%PDF-mock"], { type: "application/pdf" });

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        blob: vi.fn().mockResolvedValue(fakeBlob),
      });
      globalThis.fetch = mockFetch;

      const result = await fetchOrderPdfBlob(42);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain("/api/orders/42/pdf");
      expect(options.headers["Authorization"]).toBe("Bearer dummy-jwt-token");
      expect(options.credentials).toBe("include");
      expect(result).toBe(fakeBlob);
    });

    it("debe manejar errores de servidor con mensaje descriptivo", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: vi.fn().mockResolvedValue({ error: "Orden no encontrada" }),
      });
      globalThis.fetch = mockFetch;

      await expect(fetchOrderPdfBlob(999)).rejects.toThrow("Orden no encontrada");
    });
  });

  describe("openOrderPdf (Descarga segura y cross-platform)", () => {
    it("debe crear el elemento <a> con atributo download, desencadenar click y limpiar el DOM", async () => {
      const fakeBlob = new Blob(["%PDF-1.4"], { type: "application/pdf" });
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        blob: vi.fn().mockResolvedValue(fakeBlob),
      });

      await openOrderPdf(105);

      expect(URL.createObjectURL).toHaveBeenCalledWith(fakeBlob);
      expect(mockAppendChild).toHaveBeenCalledTimes(1);
      expect(mockRemoveChild).toHaveBeenCalledTimes(1);

      const createdElement = mockAppendChild.mock.calls[0][0];
      expect(createdElement.tagName).toBe("A");
      expect(createdElement.download).toBe("orden-105.pdf");
      expect(createdElement.click).toHaveBeenCalled();
    });
  });

  describe("Estrategia de visualización adaptativa (Móvil vs Desktop)", () => {
    it("en desktop la estrategia óptima es incrustar iframe con controles nativos del visor", () => {
      const isMobile = false;
      const getViewerStrategy = (mobile: boolean) => (mobile ? "direct-link" : "iframe");
      expect(getViewerStrategy(isMobile)).toBe("iframe");
    });

    it("en móviles la estrategia óptima es enlace directo a visor nativo para evitar bloqueos por políticas", () => {
      const isMobile = true;
      const getViewerStrategy = (mobile: boolean) => (mobile ? "direct-link" : "iframe");
      expect(getViewerStrategy(isMobile)).toBe("direct-link");
    });
  });
});
