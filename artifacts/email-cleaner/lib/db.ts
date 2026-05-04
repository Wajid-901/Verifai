import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { emailUploadsTable } from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set.");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const db = drizzle(pool, { schema: { emailUploadsTable } });
