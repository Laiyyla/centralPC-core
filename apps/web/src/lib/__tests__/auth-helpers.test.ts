import { describe, it, expect } from "vitest";

function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return true;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = Buffer.from(base64, "base64").toString("utf-8");
    const payload = JSON.parse(jsonPayload);
    if (!payload.exp) return false;
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
}

describe("Authentication Token Helpers", () => {
  it("debe considerar expirado un token con formato inválido o corrupto", () => {
    expect(isTokenExpired("")).toBe(true);
    expect(isTokenExpired("invalid-token")).toBe(true);
    expect(isTokenExpired("part1.part2")).toBe(true);
  });

  it("debe detectar un token que ya expiró", () => {
    const header = Buffer.from(JSON.stringify({ alg: "HS256" })).toString("base64url");
    const payloadExpired = Buffer.from(
      JSON.stringify({
        id: 1,
        exp: Math.floor(Date.now() / 1000) - 3600, // expiró hace 1 hora
      }),
    ).toString("base64url");
    const token = `${header}.${payloadExpired}.signature`;

    expect(isTokenExpired(token)).toBe(true);
  });

  it("debe validar un token con fecha de expiración vigente en el futuro", () => {
    const header = Buffer.from(JSON.stringify({ alg: "HS256" })).toString("base64url");
    const payloadValid = Buffer.from(
      JSON.stringify({
        id: 1,
        exp: Math.floor(Date.now() / 1000) + 7200, // vigente por 2 horas más
      }),
    ).toString("base64url");
    const token = `${header}.${payloadValid}.signature`;

    expect(isTokenExpired(token)).toBe(false);
  });
});
