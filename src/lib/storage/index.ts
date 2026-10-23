import { env } from "@/lib/env";
import type { StorageAdapter } from "./adapter";
import { S3StorageAdapter } from "./s3";
import { LocalStorageAdapter } from "./local";

export * from "./adapter";
export * from "./s3";
export * from "./local";

let customAdapter: StorageAdapter | null = null;

export function setCustomStorageAdapter(adapter: StorageAdapter | null): void {
  customAdapter = adapter;
}

export function getStorageAdapter(): StorageAdapter {
  if (customAdapter) {
    return customAdapter;
  }

  // Если явно указан s3 или заданы S3 ключи, используем S3-адаптер
  const hasS3Config =
    Boolean(env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY) ||
    env.STORAGE_DRIVER === "s3";

  if (hasS3Config && env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY) {
    return new S3StorageAdapter({
      endpoint: env.S3_ENDPOINT,
      region: env.S3_REGION,
      accessKeyId: env.S3_ACCESS_KEY_ID,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY,
      bucket: env.S3_BUCKET_MEDIA,
      publicUrl: env.S3_PUBLIC_URL,
      forcePathStyle: env.S3_FORCE_PATH_STYLE,
    });
  }

  // По умолчанию для локальной разработки и тестов: LocalStorageAdapter
  return new LocalStorageAdapter();
}
