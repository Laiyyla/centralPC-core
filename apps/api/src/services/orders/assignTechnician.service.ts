import { AssignTechnicianInput } from "@central-pc/schemas";
import type { Database } from "../types.js";
import { orderTable, orderHistoryTable, usersTable, eq } from "@central-pc/database";
import { BadRequestError, NotFoundError } from "../../errors/domain.errors.js";

interface AssignTechnicianContext {
  userId: number;
  userRole?: string;
}

export class AssignTechnicianService {
  constructor(private db: Database) {}

  async execute(input: AssignTechnicianInput, ctx: AssignTechnicianContext) {
    const [orden] = await this.db
      .select()
      .from(orderTable)
      .where(eq(orderTable.id, input.id));

    if (!orden) {
      throw new NotFoundError("Orden no encontrada");
    }

    // Validación de roles:
    const isAdmin = ctx.userRole === "admin";
    if (!isAdmin) {
      // Si no es admin, solo puede asignarse a sí mismo
      if (input.encargado_id !== ctx.userId) {
        throw new BadRequestError(
          "Solo los administradores pueden asignar o reasignar órdenes a otros usuarios",
        );
      }
      // Si la orden ya está asignada a otra persona, no la puede quitar
      if (orden.encargado_id !== null && orden.encargado_id !== ctx.userId) {
        throw new BadRequestError(
          "La orden ya tiene un técnico asignado. Solo un administrador puede reasignarla.",
        );
      }
    }

    let encargadoNombre: string | null = null;
    if (input.encargado_id !== null) {
      const [usuarioEncargado] = await this.db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, input.encargado_id));

      if (!usuarioEncargado) {
        throw new NotFoundError("Técnico/Encargado no encontrado");
      }
      encargadoNombre = usuarioEncargado.nombre;
    }


    return await this.db.transaction(async (tx) => {
      const [ordenActualizada] = await tx
        .update(orderTable)
        .set({
          encargado_id: input.encargado_id,
        })
        .where(eq(orderTable.id, orden.id))
        .returning();

      const notasAudit = input.notas ?? (
        input.encargado_id
          ? `Técnico encargado asignado: ${encargadoNombre}`
          : "Técnico desencargado de la orden"
      );

      await tx.insert(orderHistoryTable).values({
        order_id: orden.id,
        user_id: ctx.userId,
        accion: "REASIGNACION_TECNICO",
        estado_anterior: orden.estado,
        estado_nuevo: orden.estado,
        notas: notasAudit,
      });

      return ordenActualizada;
    });
  }
}
