import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db/client";
import * as schema from "@/db/schema";
import { env } from "@/lib/env";

/**
 * Серверная конфигурация Better Auth для DollShop.
 * Одна учетная запись мастера, публичная регистрация закрыта.
 */
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 дней
    updateAge: 60 * 60 * 24, // 1 день
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
});

export type Auth = typeof auth;
