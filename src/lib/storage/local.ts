import fs from "node:fs/promises";
import path from "node:path";
import type {
  StorageAdapter,
  CreateUploadUrlOptions,
  UploadUrlResult,
} from "./adapter";

export interface LocalStorageConfig {
  uploadsDir?: string;
  baseUrl?: string;
}

export class LocalStorageAdapter implements StorageAdapter {
  private readonly uploadsDir: string;
  private readonly baseUrl: string;

  constructor(config: LocalStorageConfig = {}) {
    this.uploadsDir =
      config.uploadsDir || path.join(process.cwd(), "public", "uploads");
    this.baseUrl = config.baseUrl || "";
  }

  async createUploadUrl(
    options: CreateUploadUrlOptions
  ): Promise<UploadUrlResult> {
    const { key, contentType } = options;
    const cleanKey = key.replace(/^\/+/, "");

    // Эмуляция presigned URL: локальный эндпоинт загрузки
    const uploadUrl = `/api/storage/local-upload?key=${encodeURIComponent(cleanKey)}`;

    return {
      uploadUrl,
      publicUrl: this.getPublicUrl(cleanKey),
      key: cleanKey,
      headers: {
        "Content-Type": contentType,
      },
    };
  }

  getPublicUrl(key: string): string {
    const cleanKey = key.replace(/^\/+/, "");
    return `${this.baseUrl}/uploads/${cleanKey}`;
  }

  async deleteObject(key: string): Promise<void> {
    const cleanKey = key.replace(/^\/+/, "");
    const filePath = path.join(this.uploadsDir, cleanKey);
    try {
      await fs.unlink(filePath);
    } catch {
      // Игнорируем, если файл уже не существует
    }
  }

  getDriverName(): "local" | "s3" {
    return "local";
  }

  getUploadsDir(): string {
    return this.uploadsDir;
  }
}
