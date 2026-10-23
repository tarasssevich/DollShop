/**
 * In-memory sliding-window rate limiter для защиты публичных форм (Step 5.4).
 * Защищает от ботов, спама и перебора запросов без внешних зависимостей (Redis).
 */

interface RateLimitRecord {
  timestamps: number[];
}

const store = new Map<string, RateLimitRecord>();

// Периодическая очистка устаревших записей памяти каждые 5 минут
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < 3600 * 1000);
      if (record.timestamps.length === 0) {
        store.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref?.();
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Проверка лимита запросов по ключу (например, IP или ID сессии).
 * @param key Уникальный идентификатор клиента
 * @param maxRequests Максимальное количество запросов за окно
 * @param windowMs Размер скользящего окна в миллисекундах (по умолчанию 10 минут)
 */
export function checkRateLimit(
  key: string,
  maxRequests: number = 3,
  windowMs: number = 10 * 60 * 1000
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;

  let record = store.get(key);
  if (!record) {
    record = { timestamps: [] };
    store.set(key, record);
  }

  // Удаляем отметки старше текущего окна
  record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

  if (record.timestamps.length >= maxRequests) {
    const oldest = record.timestamps[0] || now;
    const resetAt = oldest + windowMs;
    return {
      allowed: false,
      remaining: 0,
      resetAt,
    };
  }

  record.timestamps.push(now);
  return {
    allowed: true,
    remaining: maxRequests - record.timestamps.length,
    resetAt: now + windowMs,
  };
}

/**
 * Сброс счетчика для конкретного ключа (используется в тестах).
 */
export function resetRateLimit(key?: string): void {
  if (key) {
    store.delete(key);
  } else {
    store.clear();
  }
}
