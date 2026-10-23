import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ||
      "postgres://dollshop_app:dollshop_dev_password@localhost:5432/dollshop",
  },
  verbose: true,
  strict: true,
});
