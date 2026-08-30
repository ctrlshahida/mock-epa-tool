import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

// Neon Postgres provisioned via the Vercel Marketplace (`vercel install neon`);
// DATABASE_URL is injected by the integration (and lives in .env.local for dev).
export function hasDb(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not set. Provision Neon via the Vercel Marketplace and pull env vars (vercel env pull .env.local).",
    );
  }
  if (!_db) {
    _db = drizzle(neon(process.env.DATABASE_URL), { schema });
  }
  return _db;
}
