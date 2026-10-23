import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { LocalStorageAdapter } from "../local";
import { S3StorageAdapter } from "../s3";
import { getStorageAdapter, setCustomStorageAdapter } from "../index";

describe("StorageAdapter (Step 4.4)", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "dollshop-storage-test-"));
    setCustomStorageAdapter(null);
  });

  afterEach(async () => {
    setCustomStorageAdapter(null);
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  describe("LocalStorageAdapter", () => {
    it("создает корректные uploadUrl и publicUrl для локального хранилища", async () => {
      const adapter = new LocalStorageAdapter({
        uploadsDir: tempDir,
        baseUrl: "http://localhost:3000",
      });

      const res = await adapter.createUploadUrl({
        key: "products/123/456/2000.webp",
        contentType: "image/webp",
      });

      expect(res.uploadUrl).toBe(
        "/api/storage/local-upload?key=products%2F123%2F456%2F2000.webp"
      );
      expect(res.publicUrl).toBe(
        "http://localhost:3000/uploads/products/123/456/2000.webp"
      );
      expect(res.key).toBe("products/123/456/2000.webp");
      expect(adapter.getDriverName()).toBe("local");
    });

    it("удаляет существующий локальный файл и не падает, если файл отсутствует", async () => {
      const adapter = new LocalStorageAdapter({ uploadsDir: tempDir });
      const testFile = path.join(tempDir, "test.txt");
      await fs.writeFile(testFile, "hello");

      expect(await fs.stat(testFile)).toBeDefined();

      await adapter.deleteObject("test.txt");

      await expect(fs.stat(testFile)).rejects.toThrow();

      // Повторный вызов не должен выбрасывать ошибку
      await expect(adapter.deleteObject("test.txt")).resolves.not.toThrow();
    });
  });

  describe("S3StorageAdapter", () => {
    it("корректно формирует публичные URL с path-style и custom publicUrl", () => {
      const adapterPathStyle = new S3StorageAdapter({
        endpoint: "https://s3.hoster.by",
        region: "auto",
        accessKeyId: "test-key",
        secretAccessKey: "test-secret",
        bucket: "dollshop-media",
        forcePathStyle: true,
      });

      expect(
        adapterPathStyle.getPublicUrl("products/123/photo.webp")
      ).toBe("https://s3.hoster.by/dollshop-media/products/123/photo.webp");

      const adapterCdn = new S3StorageAdapter({
        endpoint: "https://s3.hoster.by",
        region: "auto",
        accessKeyId: "test-key",
        secretAccessKey: "test-secret",
        bucket: "dollshop-media",
        publicUrl: "https://media.dollshop.by",
      });

      expect(adapterCdn.getPublicUrl("products/123/photo.webp")).toBe(
        "https://media.dollshop.by/products/123/photo.webp"
      );
      expect(adapterCdn.getDriverName()).toBe("s3");
    });
  });

  describe("getStorageAdapter & customAdapter override", () => {
    it("позволяет временно переопределять адаптер для изолированного тестирования", () => {
      const mockAdapter = {
        createUploadUrl: vi.fn(),
        getPublicUrl: vi.fn().mockReturnValue("https://custom.url/photo.webp"),
        deleteObject: vi.fn(),
        getDriverName: vi.fn().mockReturnValue("local" as const),
      };

      setCustomStorageAdapter(mockAdapter);
      const adapter = getStorageAdapter();

      expect(adapter.getPublicUrl("any")).toBe("https://custom.url/photo.webp");
    });
  });
});
