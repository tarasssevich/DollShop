import { describe, it, expect, afterEach } from "vitest";
import { NextRequest } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { GET, HEAD } from "../route";

describe("Uploads Static Route Handler", () => {
  const cleanupFiles: string[] = [];

  afterEach(async () => {
    for (const f of cleanupFiles) {
      try {
        await fs.unlink(f);
      } catch {
        // ignore
      }
    }
    cleanupFiles.length = 0;
  });

  it("успешно отдает существующий WebP файл с правильными заголовками кэширования", async () => {
    const testFileName = `test-serve-${Date.now()}.webp`;
    const uploadsDir = path.resolve(process.cwd(), "public", "uploads", "test-uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    const filePath = path.join(uploadsDir, testFileName);
    cleanupFiles.push(filePath);

    const testBuffer = Buffer.from("RIFFtestWEBPdata");
    await fs.writeFile(filePath, testBuffer);

    const req = new NextRequest(`http://localhost:3000/uploads/test-uploads/${testFileName}`);
    const res = await GET(req, {
      params: Promise.resolve({ path: ["test-uploads", testFileName] }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/webp");
    expect(res.headers.get("Cache-Control")).toContain("immutable");
    expect(res.headers.get("ETag")).toBeTruthy();

    const arrayBuffer = await res.arrayBuffer();
    expect(Buffer.from(arrayBuffer)).toEqual(testBuffer);
  });

  it("возвращает 304 Not Modified при совпадении If-None-Match", async () => {
    const testFileName = `test-etag-${Date.now()}.webp`;
    const uploadsDir = path.resolve(process.cwd(), "public", "uploads", "test-uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    const filePath = path.join(uploadsDir, testFileName);
    cleanupFiles.push(filePath);
    await fs.writeFile(filePath, Buffer.from("test"));

    const stat = await fs.stat(filePath);
    const etag = `W/"${stat.size}-${Math.floor(stat.mtimeMs)}"`;

    const req = new NextRequest(`http://localhost:3000/uploads/test-uploads/${testFileName}`, {
      headers: { "if-none-match": etag },
    });
    const res = await GET(req, {
      params: Promise.resolve({ path: ["test-uploads", testFileName] }),
    });

    expect(res.status).toBe(304);
  });

  it("отклоняет попытки path traversal со статусом 400", async () => {
    const req = new NextRequest("http://localhost:3000/uploads/../etc/passwd");
    const res = await GET(req, {
      params: Promise.resolve({ path: ["..", "etc", "passwd"] }),
    });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/Недопустимый путь/);
  });

  it("возвращает 404, если запрашиваемый файл отсутствует", async () => {
    const req = new NextRequest("http://localhost:3000/uploads/non-existent-image.webp");
    const res = await GET(req, {
      params: Promise.resolve({ path: ["non-existent-image.webp"] }),
    });

    expect(res.status).toBe(404);
  });

  it("возвращает 400 для неподдерживаемых расширений файлов", async () => {
    const req = new NextRequest("http://localhost:3000/uploads/script.js");
    const res = await GET(req, {
      params: Promise.resolve({ path: ["script.js"] }),
    });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/Неподдерживаемый тип файла/);
  });

  it("корректно отвечает на HEAD запрос без тела", async () => {
    const testFileName = `test-head-${Date.now()}.png`;
    const uploadsDir = path.resolve(process.cwd(), "public", "uploads", "test-uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    const filePath = path.join(uploadsDir, testFileName);
    cleanupFiles.push(filePath);
    await fs.writeFile(filePath, Buffer.from("png-data"));

    const req = new NextRequest(`http://localhost:3000/uploads/test-uploads/${testFileName}`, {
      method: "HEAD",
    });
    const res = await HEAD(req, {
      params: Promise.resolve({ path: ["test-uploads", testFileName] }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/png");
  });
});
