import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { adminProxy } from "@/proxy";
import { auth } from "../index";
import { requireAdminAction } from "../guard";

describe("Better Auth & Admin Route Protection (Step 4.1)", () => {
  it("adminProxy пропускает страницу логина /admin/login без редиректа", () => {
    const req = new NextRequest("http://localhost:3000/admin/login");
    const res = adminProxy(req);
    // NextResponse.next() возвращает статус 200
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("adminProxy редиректит неавторизованного пользователя с /admin на /admin/login", () => {
    const req = new NextRequest("http://localhost:3000/admin");
    const res = adminProxy(req);
    expect(res.status).toBe(307);
    const location = res.headers.get("location");
    expect(location).toContain("/admin/login");
  });

  it("adminProxy сохраняет returnUrl при попытке зайти в глубокий раздел /admin/kukly/new", () => {
    const req = new NextRequest("http://localhost:3000/admin/kukly/new");
    const res = adminProxy(req);
    expect(res.status).toBe(307);
    const location = res.headers.get("location");
    expect(location).toContain("/admin/login");
    expect(location).toContain("returnUrl=%2Fadmin%2Fkukly%2Fnew");
  });

  it("adminProxy пропускает запрос в /admin при наличии валидной сессионной куки", () => {
    const req = new NextRequest("http://localhost:3000/admin/kukly", {
      headers: {
        cookie: "better-auth.session_token=test_session_token_12345",
      },
    });
    const res = adminProxy(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("requireAdminAction выбрасывает ошибку при отсутствии сессии", async () => {
    await expect(requireAdminAction()).rejects.toThrowError(
      /Доступ запрещен: требуется авторизация мастера/i
    );
  });

  it("авторизует мастера с валидным паролем через auth.api.signInEmail", async () => {
    const res = await auth.api.signInEmail({
      body: {
        email: "master@dollshop.by",
        password: "DollMaster2026!",
      },
    });

    expect(res).toBeDefined();
    expect(res.user).toBeDefined();
    expect(res.user.email).toBe("master@dollshop.by");
    expect(res.token).toBeTruthy();
  });

  it("отклоняет попытку входа с неверным паролем", async () => {
    await expect(
      auth.api.signInEmail({
        body: {
          email: "master@dollshop.by",
          password: "WrongAttackerPassword!123",
        },
      })
    ).rejects.toThrow();
  });

  it("блокирует публичную регистрацию новых пользователей (disableSignUp: true)", async () => {
    await expect(
      auth.api.signUpEmail({
        body: {
          name: "Злоумышленник",
          email: "attacker@test.com",
          password: "Password123!",
        },
      })
    ).rejects.toThrow();
  });
});
