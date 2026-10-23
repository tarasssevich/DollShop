import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createUploadUrlsAction,
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_IMAGE_SIZE_BYTES,
} from "../media";
import * as guardModule from "@/lib/auth/guard";

describe("Admin Media Server Actions (Step 4.4)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("createUploadUrlsAction", () => {
    it("отклоняет вызов без авторизации администратора", async () => {
      vi.spyOn(guardModule, "requireAdminAction").mockRejectedValueOnce(
        new Error("Доступ запрещен: требуется сессия мастера")
      );

      await expect(
        createUploadUrlsAction({
          productId: "a0000000-0000-0000-0000-000000000001",
          files: [{ filename: "doll.jpg", contentType: "image/jpeg", size: 1000 }],
        })
      ).rejects.toThrow(/Доступ запрещен/);
    });

    it("отклоняет некорректный UUID куклы", async () => {
      vi.spyOn(guardModule, "requireAdminAction").mockResolvedValue({
        user: { id: "admin-id", email: "master@dollshop.by", role: "admin" },
        session: { id: "session-id", userId: "admin-id" },
      } as unknown as Awaited<ReturnType<typeof guardModule.requireAdminAction>>);

      const res = await createUploadUrlsAction({
        productId: "invalid-uuid",
        files: [{ filename: "doll.jpg", contentType: "image/jpeg", size: 1000 }],
      });

      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toMatch(/Некорректный идентификатор/);
      }
    });

    it("отклоняет неподдерживаемые форматы файлов (например PDF или исполняемые)", async () => {
      vi.spyOn(guardModule, "requireAdminAction").mockResolvedValue({
        user: { id: "admin-id", email: "master@dollshop.by", role: "admin" },
        session: { id: "session-id", userId: "admin-id" },
      } as unknown as Awaited<ReturnType<typeof guardModule.requireAdminAction>>);

      const res = await createUploadUrlsAction({
        productId: "a0000000-0000-0000-0000-000000000001",
        files: [
          {
            filename: "contract.pdf",
            contentType: "application/pdf" as unknown as typeof ALLOWED_IMAGE_MIME_TYPES[number],
            size: 1000,
          },
        ],
      });

      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toMatch(/Поддерживаются только изображения/);
      }
    });

    it("отклоняет файлы, превышающие лимит 15 МБ", async () => {
      vi.spyOn(guardModule, "requireAdminAction").mockResolvedValue({
        user: { id: "admin-id", email: "master@dollshop.by", role: "admin" },
        session: { id: "session-id", userId: "admin-id" },
      } as unknown as Awaited<ReturnType<typeof guardModule.requireAdminAction>>);

      const res = await createUploadUrlsAction({
        productId: "a0000000-0000-0000-0000-000000000001",
        files: [
          {
            filename: "huge.jpg",
            contentType: "image/jpeg",
            size: MAX_IMAGE_SIZE_BYTES + 1024,
          },
        ],
      });

      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toMatch(/не должен превышать 15 МБ/);
      }
    });

    it("успешно генерирует 3 WebP-варианта (2000, 1280, 640) для валидного файла", async () => {
      vi.spyOn(guardModule, "requireAdminAction").mockResolvedValue({
        user: { id: "admin-id", email: "master@dollshop.by", role: "admin" },
        session: { id: "session-id", userId: "admin-id" },
      } as unknown as Awaited<ReturnType<typeof guardModule.requireAdminAction>>);

      const res = await createUploadUrlsAction({
        productId: "a0000000-0000-0000-0000-000000000001",
        files: [
          {
            filename: "fairy.webp",
            contentType: "image/webp",
            size: 2 * 1024 * 1024,
          },
        ],
      });

      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.items).toHaveLength(1);
        const item = res.items[0]!;
        expect(item.mediaId).toBeDefined();

        expect(item.variants["2000"].key).toContain(
          `products/a0000000-0000-0000-0000-000000000001/${item.mediaId}/2000.webp`
        );
        expect(item.variants["1280"].key).toContain(
          `products/a0000000-0000-0000-0000-000000000001/${item.mediaId}/1280.webp`
        );
        expect(item.variants["640"].key).toContain(
          `products/a0000000-0000-0000-0000-000000000001/${item.mediaId}/640.webp`
        );

        expect(item.variants["2000"].uploadUrl).toBeDefined();
        expect(item.variants["2000"].publicUrl).toBeDefined();
      }
    });
  });
});
