import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type Db = PostgresJsDatabase<typeof schema>;

let _sql: ReturnType<typeof postgres> | undefined;
let _db: Db | undefined;

// Lazy singleton so importing the package never requires DATABASE_URL at build time.
export function getDb(): Db {
  if (!_db) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    _sql = postgres(url, { max: 10 });
    _db = drizzle(_sql, { schema });
  }
  return _db;
}

export async function closeDb(): Promise<void> {
  if (_sql) {
    await _sql.end();
    _sql = undefined;
    _db = undefined;
  }
}
