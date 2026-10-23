import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Охранный прокси маршрутов админки.
 * Защищает раздел /admin от неавторизованного доступа на уровне HTTP-запроса.
 */
export function adminProxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Исключаем страницу логина и публичные статические файлы
  if (pathname === "/admin/login" || pathname.startsWith("/admin/login/")) {
    return NextResponse.next();
  }

  // Проверяем наличие сессионной куки Better Auth
  const sessionCookie =
    req.cookies.get("better-auth.session_token") ||
    req.cookies.get("__Secure-better-auth.session_token");

  if (!sessionCookie?.value) {
    const loginUrl = new URL("/admin/login", req.url);
    if (pathname !== "/admin") {
      loginUrl.searchParams.set("returnUrl", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}
