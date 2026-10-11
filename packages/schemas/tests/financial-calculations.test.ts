import { describe, it, expect } from "vitest";

describe("Financial and Order Calculations", () => {
  it("debe calcular con precisión el costo total combinando equipos y detalle_suelto", () => {
    const orden = {
      equipos: [
        {
          descripcion: "Laptop Dell Inspiron",
          detalle: [
            { precio_unitario: 120.0, cantidad: 1 },
            { precio_unitario: 35.5, cantidad: 2 },
          ],
        },
        {
          descripcion: "PC Torre Oficina",
          detalle: [{ precio_unitario: 50.0, cantidad: 1 }],
        },
      ],
      detalle_suelto: [
        { precio_unitario: 25.0, cantidad: 1 },
        { precio_unitario: 15.0, cantidad: 3 },
      ],
    };

    const subtotalEquipos = orden.equipos.reduce(
      (acc, eq) =>
        acc +
        eq.detalle.reduce(
          (sub, item) => sub + item.precio_unitario * item.cantidad,
          0,
        ),
      0,
    );
    expect(subtotalEquipos).toBe(120 + 71 + 50); // 241

    const subtotalSuelto = orden.detalle_suelto.reduce(
      (acc, item) => acc + item.precio_unitario * item.cantidad,
      0,
    );
    expect(subtotalSuelto).toBe(25 + 45); // 70

    const totalCalculado = subtotalEquipos + subtotalSuelto;
    expect(totalCalculado).toBe(311.0);
  });

  it("debe calcular exactamente el saldo pendiente considerando pagos acumulados", () => {
    const totalOrden = 311.0;
    const pagos = [
      { monto: 100.0, anulado: false },
      { monto: 50.0, anulado: false },
      { monto: 20.0, anulado: true }, // Pago anulado no debe computar
    ];

    const totalPagado = pagos
      .filter((p) => !p.anulado)
      .reduce((acc, p) => acc + p.monto, 0);

    expect(totalPagado).toBe(150.0);

    const saldoPendiente = Math.max(0, totalOrden - totalPagado);
    expect(saldoPendiente).toBe(161.0);
  });

  it("debe reportar saldo pendiente en 0 cuando la orden está totalmente pagada", () => {
    const totalOrden = 100.0;
    const pagos = [
      { monto: 60.0, anulado: false },
      { monto: 40.0, anulado: false },
    ];

    const totalPagado = pagos.reduce((acc, p) => acc + p.monto, 0);
    const saldoPendiente = Math.max(0, totalOrden - totalPagado);

    expect(saldoPendiente).toBe(0);
  });
});
