import { describe, it, expect, afterEach } from "vitest";
import { NextRequest } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { PUT } from "../route";

describe("Local Upload Route Handler (Step 4.4)", () => {
  const uploadedFiles: string[] = [];

  afterEach(async () => {
    for (const f of uploadedFiles) {
      try {
        await fs.unlink(f);
      } catch {
        // ignore
      }
    }
    uploadedFiles.length = 0;
  });

  it("возвращает 400, если параметр key отсутствует", async () => {
    const req = new NextRequest("http://localhost:3000/api/storage/local-upload", {
      method: "PUT",
      body: Buffer.from("test"),
    });

    const res = await PUT(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/Параметр key обязателен/);
  });

  it("возвращает 400 при попытке path traversal (../)", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/storage/local-upload?key=../../etc/passwd",
      {
        method: "PUT",
        body: Buffer.from("test"),
      }
    );

    const res = await PUT(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/Недопустимый путь/);
  });

  it("успешно сохраняет бинарный поток файла на диск и возвращает 200 OK", async () => {
    const testKey = `test-uploads/doll-${Date.now()}.webp`;
    const fullPath = path.join(process.cwd(), "public", "uploads", testKey);
    uploadedFiles.push(fullPath);

    const fileContent = Buffer.from("fake-webp-binary-data");
    const req = new NextRequest(
      `http://localhost:3000/api/storage/local-upload?key=${encodeURIComponent(testKey)}`,
      {
        method: "PUT",
        body: fileContent,
      }
    );

    const res = await PUT(req);
    expect(res.status).toBe(200);

    const saved = await fs.readFile(fullPath);
    expect(saved.toString()).toBe("fake-webp-binary-data");
  });
});
