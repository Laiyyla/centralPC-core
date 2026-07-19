import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres"
import * as schema from "./schema/index.js"

let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (!dbInstance) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL no esta definido, que fue?")
    }

    const queryClient = postgres(connectionString);
    dbInstance = drizzle(queryClient, {schema})
  }

  return dbInstance;
}
