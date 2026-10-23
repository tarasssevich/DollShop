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
  baseURL:
    process.env.NODE_ENV === "production" ? env.BETTER_AUTH_URL : undefined,
  trustedOrigins: (request) => {
    const list: Array<string | undefined | null> = [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:3001",
      "https://dollshop.by",
      env.NEXT_PUBLIC_APP_URL,
      env.BETTER_AUTH_URL,
    ];

    const origin =
      request?.headers.get("origin") || request?.headers.get("referer");
    if (origin) {
      try {
        const parsed = new URL(origin);
        if (
          process.env.NODE_ENV !== "production" ||
          parsed.hostname === "localhost" ||
          parsed.hostname === "127.0.0.1" ||
          parsed.hostname.startsWith("192.168.") ||
          parsed.hostname.startsWith("10.") ||
          parsed.hostname === "dollshop.by" ||
          parsed.hostname.endsWith(".dollshop.by")
        ) {
          list.push(parsed.origin);
        }
      } catch {
        // ignore
      }
    }

    return list;
  },
});

export type Auth = typeof auth;
