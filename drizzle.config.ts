import "dotenv/config";
import { defineConfig } from "drizzle-kit";
import path from "path";

export default defineConfig({
  schema: "./lib/db/src/schema",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
