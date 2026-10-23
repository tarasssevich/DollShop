import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./index";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface AdminSession {
  user: AdminUser;
  session: {
    id: string;
    expiresAt: Date;
    token: string;
    userId: string;
  };
}

/**
 * Получение текущей сессии администратора на сервере без принудительного редиректа.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  try {
    const reqHeaders = await headers();
    const sessionData = await auth.api.getSession({
      headers: reqHeaders,
    });

    if (!sessionData?.user || !sessionData?.session) {
      return null;
    }

    const userRole = (sessionData.user as { role?: string }).role;
    if (userRole !== "admin") {
      return null;
    }

    return {
      user: {
        id: sessionData.user.id,
        name: sessionData.user.name,
        email: sessionData.user.email,
        role: "admin",
      },
      session: {
        id: sessionData.session.id,
        expiresAt: new Date(sessionData.session.expiresAt),
        token: sessionData.session.token,
        userId: sessionData.session.userId,
      },
    };
  } catch {
    return null;
  }
}

/**
 * Охранный шлюз для Server Components: редиректит на /admin/login при отсутствии сессии.
 */
export async function requireAdminPage(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }
  return session;
}

/**
 * Охранный шлюз для Server Actions: выбрасывает ошибку при отсутствии прав.
 */
export async function requireAdminAction(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) {
    throw new Error("Доступ запрещен: требуется авторизация мастера");
  }
  return session;
}
