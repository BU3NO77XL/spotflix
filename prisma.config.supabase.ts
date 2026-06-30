import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.supabase.prisma",
  migrations: {
    path: "prisma/migrations.supabase",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
