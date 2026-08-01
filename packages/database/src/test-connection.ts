import { getDb } from "./db.js";
import { branchTable } from "./schema/index.js";

async function test() {
  const db = getDb();
  try {
    const [newBranch] = await db
      .insert(branchTable)
      .values({
        nombre: "test1",
        serie: "0001",
        RUC: "12345678911",
      })
      .returning();

    console.log("sucursal creada con exito", newBranch);
    console.log("obteniendo sucursales");
    const branches = await db.select().from(branchTable);
    console.log("Sucurales obtenidas: ", branches);
    process.exit(0);
  } catch (err) {
    console.log("ERROR EN TEST DE CONEXION", err);
    process.exit(1);
  }
}

test();
