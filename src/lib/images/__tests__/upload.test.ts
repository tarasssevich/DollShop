import { describe, it, expect, vi, beforeEach } from "vitest";
import { uploadWithRetry, uploadDollImage } from "../upload";
import * as compressModule from "../compress";
import * as mediaActions from "@/actions/admin/media";

describe("Upload Coordinator (Step 4.5)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("uploadWithRetry", () => {
    it("возвращает ответ с первой попытки при успешном статусе 200 OK", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
      } as Response);
      vi.stubGlobal("fetch", mockFetch);

      const blob = new Blob(["dummy"]);
      const res = await uploadWithRetry("http://localhost/upload", blob);

      expect(res.ok).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("повторяет запрос при временном сбое 500 и успешно завершается со второй попытки", async () => {
      const mockFetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
        } as Response);
      vi.stubGlobal("fetch", mockFetch);

      const blob = new Blob(["dummy"]);
      const res = await uploadWithRetry("http://localhost/upload", blob, {}, 3);

      expect(res.ok).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("мгновенно прекращает попытки при 4xx ошибке (например 403 Forbidden)", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
      } as Response);
      vi.stubGlobal("fetch", mockFetch);

      const blob = new Blob(["dummy"]);
      await expect(
        uploadWithRetry("http://localhost/upload", blob, {}, 3)
      ).rejects.toThrow(/статус 403/);

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("uploadDollImage validation & flow", () => {
    it("отклоняет файл размером более 15 МБ с понятным сообщением на русском", async () => {
      const hugeFile = new File(["dummy"], "large.jpg", {
        type: "image/jpeg",
      });
      Object.defineProperty(hugeFile, "size", {
        value: 16 * 1024 * 1024,
      });

      await expect(
        uploadDollImage({
          file: hugeFile,
          productId: "a0000000-0000-0000-0000-000000000001",
        })
      ).rejects.toThrow(/слишком большой/);
    });

    it("отклоняет неподдерживаемый MIME-тип файла", async () => {
      const textFile = new File(["dummy text"], "document.txt", {
        type: "text/plain",
      });

      await expect(
        uploadDollImage({
          file: textFile,
          productId: "a0000000-0000-0000-0000-000000000001",
        })
      ).rejects.toThrow(/Неподдерживаемый формат/);
    });

    it("успешно выполняет полный цикл подготовки, получения ссылок и сохранения с прогрессом", async () => {
      const testFile = new File(["image-bytes"], "fairy.jpg", {
        type: "image/jpeg",
      });

      // Мокаем сжатие
      vi.spyOn(compressModule, "processDollImage").mockResolvedValue({
        originalWidth: 2000,
        originalHeight: 2000,
        blurDataUrl: "data:image/svg+xml;dummy",
        variants: {
          "2000": {
            blob: new Blob(["variant2000"]),
            width: 2000,
            height: 2000,
            size: 200000,
          },
          "1280": {
            blob: new Blob(["variant1280"]),
            width: 1280,
            height: 1280,
            size: 100000,
          },
          "640": {
            blob: new Blob(["variant640"]),
            width: 640,
            height: 640,
            size: 50000,
          },
        },
      });

      // Мокаем получение presigned URL
      vi.spyOn(mediaActions, "createUploadUrlsAction").mockResolvedValue({
        success: true,
        items: [
          {
            mediaId: "m0000000-0000-0000-0000-000000000001",
            variants: {
              "2000": {
                uploadUrl: "http://localhost/upload/2000",
                publicUrl: "http://localhost/media/2000.webp",
                key: "products/p1/m1/2000.webp",
              },
              "1280": {
                uploadUrl: "http://localhost/upload/1280",
                publicUrl: "http://localhost/media/1280.webp",
                key: "products/p1/m1/1280.webp",
              },
              "640": {
                uploadUrl: "http://localhost/upload/640",
                publicUrl: "http://localhost/media/640.webp",
                key: "products/p1/m1/640.webp",
              },
            },
          },
        ],
      });

      // Мокаем fetch для PUT загрузки
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
        })
      );

      // Мокаем сохранение в БД
      vi.spyOn(mediaActions, "saveProductMediaAction").mockResolvedValue({
        success: true,
        media: {
          id: "m0000000-0000-0000-0000-000000000001",
          productId: "p0000000-0000-0000-0000-000000000001",
          url: "http://localhost/media/2000.webp",
          mediaType: "image",
          displayOrder: 0,
          blurDataUrl: "data:image/svg+xml;dummy",
          storageKey: "products/p1/m1/2000.webp",
          width: 2000,
          height: 2000,
          alt: "fairy",
          createdAt: new Date(),
        },
      });

      const stages: string[] = [];
      const result = await uploadDollImage({
        file: testFile,
        productId: "p0000000-0000-0000-0000-000000000001",
        onProgress: (ev) => stages.push(ev.stage),
      });

      expect(result.id).toBe("m0000000-0000-0000-0000-000000000001");
      expect(result.url).toBe("http://localhost/media/2000.webp");
      expect(stages).toContain("validating");
      expect(stages).toContain("compressing");
      expect(stages).toContain("requesting_urls");
      expect(stages).toContain("uploading");
      expect(stages).toContain("saving");
      expect(stages).toContain("completed");
    });
  });
});
