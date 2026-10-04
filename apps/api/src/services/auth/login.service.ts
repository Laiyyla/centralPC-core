import { usersTable, eq } from "@central-pc/database";
import { LoginInput } from "@central-pc/schemas";
import { FastifyRequest, FastifyReply } from "fastify";
import "@fastify/cookie";
import bcrypt from "bcrypt";
import type { Database } from "../types.js";
import { checkRateLimit, resetRateLimit } from "../../utils/rate-limites.js";
import {
  TooManyRequestsError,
  UnauthorizedError,
} from "../../errors/domain.errors.js";

export class LoginService {
  constructor(
    private db: Database,
    private req: FastifyRequest,
    private res: FastifyReply,
  ) {}

  async execute(input: LoginInput) {
    const clientIp = this.req.ip || "unknown";
    const identifier = `${clientIp}: ${input.user_name}`;
    const { allowed } = checkRateLimit(identifier);

    if (!allowed) {
      throw new TooManyRequestsError(
        "Demasiados intentos fallidos, intente de nuevo en 15 minutos",
      );
    }
    const [user] = await this.db
      .select()
      .from(usersTable)
      .where(eq(usersTable.user_name, input.user_name));

    if (!user || !user.isActive) {
      throw new UnauthorizedError("Credenciales Inválidas");
    }
    const isValid = await bcrypt.compare(input.password, user.password_hash);

    if (!isValid) {
      throw new UnauthorizedError("Credenciales Inválidas");
    }
    resetRateLimit(identifier);

    const token = await this.res.jwtSign(
      {
        id: user.id,
        nombre: user.nombre,
        rol: user.rol,
      },
      { expiresIn: "7d" },
    );

    this.res.setCookie("token", token, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
    });

    return {
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        rol: user.rol,
      },
    };
  }
}
