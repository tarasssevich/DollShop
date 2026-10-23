import { describe, it, expect, afterEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import {
  getUploadDirs,
  saveUploadedFileLocally,
  findUploadedFileLocally,
} from "../local-fs";

describe("Local File Storage Manager (Multi-directory persistence)", () => {
  const cleanupPaths: string[] = [];

  afterEach(async () => {
    for (const p of cleanupPaths) {
      try {
        await fs.unlink(p);
      } catch {
        // ignore
      }
    }
    cleanupPaths.length = 0;
  });

  it("getUploadDirs возвращает абсолютные пути проекта с приоритетом постоянного каталога", () => {
    const dirs = getUploadDirs();
    expect(dirs.length).toBeGreaterThan(0);
    expect(dirs).toContain("/home/ofi/DollShop/public/uploads");
  });

  it("saveUploadedFileLocally сохраняет файл и findUploadedFileLocally находит его", async () => {
    const testFileName = `test-ref-${Date.now()}.jpg`;
    const relativeSubpath = `requests/${testFileName}`;
    const testBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);

    await saveUploadedFileLocally(relativeSubpath, testBuffer);

    // Запоминаем пути для очистки
    const dirs = getUploadDirs();
    for (const d of dirs) {
      cleanupPaths.push(path.join(d, relativeSubpath));
    }

    const foundPath = await findUploadedFileLocally(relativeSubpath);
    expect(foundPath).toBeTruthy();
    expect(foundPath).toContain(testFileName);

    const readBuffer = await fs.readFile(foundPath!);
    expect(readBuffer).toEqual(testBuffer);
  });

  it("findUploadedFileLocally возвращает null для несуществующего файла", async () => {
    const notFound = await findUploadedFileLocally("requests/non-existent-file-xyz.jpg");
    expect(notFound).toBeNull();
  });
});
