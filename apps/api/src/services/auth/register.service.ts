import { usersTable, eq } from "@central-pc/database";
import { RegisterInput } from "@central-pc/schemas";
import { Database } from "../types.js";
import bcrypt from "bcrypt";
import { ConflictError } from "../../errors/domain.errors.js";

export class RegisterService {
  constructor(private db: Database) {}

  async execute(input: RegisterInput) {
    const existingUser = await this.db
      .select()
      .from(usersTable)
      .where(eq(usersTable.user_name, input.user_name));

    if (existingUser.length > 0) {
      throw new ConflictError("El nombre de Usuario ya esta en uso");
    }

    const hashedPassword = await bcrypt.hash(input.password, 12);

    const [newUser] = await this.db
      .insert(usersTable)
      .values({
        nombre: input.nombre,
        user_name: input.user_name,
        password_hash: hashedPassword,
        rol: input.rol,
      })
      .returning();
    const { password_hash, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }
}
