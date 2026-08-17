import { getDb } from "./db.js";
import { branchTable } from "./schema/index.js";

async function test() {
  const db = getDb();
  try {
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
