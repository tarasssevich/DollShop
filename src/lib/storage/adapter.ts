/**
 * Интерфейс и типы универсального адаптера хранилища файлов DollShop.
 * Поддерживает как S3-совместимые хранилища (hoster.by, AWS S3, MinIO),
 * так и локальное файловое хранилище для разработки и тестирования.
 */

export interface UploadUrlResult {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  headers?: Record<string, string>;
}

export interface CreateUploadUrlOptions {
  key: string;
  contentType: string;
  expiresInSeconds?: number;
  cacheControl?: string;
}

export interface StorageAdapter {
  /**
   * Создает presigned URL (или локальный upload URL) для прямой загрузки файла методом PUT.
   */
  createUploadUrl(options: CreateUploadUrlOptions): Promise<UploadUrlResult>;

  /**
   * Возвращает публичный URL для доступа к объекту по его ключу.
   */
  getPublicUrl(key: string): string;

  /**
   * Удаляет объект из хранилища по ключу.
   */
  deleteObject(key: string): Promise<void>;

  /**
   * Возвращает тип активного драйвера хранилища.
   */
  getDriverName(): "s3" | "local";
}
