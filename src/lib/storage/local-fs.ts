import fs from "node:fs/promises";
import path from "node:path";

/**
 * Возвращает упорядоченный список директорий для локального хранения загруженных медиафайлов.
 * Первым всегда идет абсолютный путь в корне репозитория проекта, что гарантирует сохранность
 * файлов при пересборках Next.js и очистке каталога .next/.
 */
export function getUploadDirs(): string[] {
  const dirs = new Set<string>();

  // 1. Абсолютный постоянный путь репозитория проекта
  dirs.add("/home/ofi/DollShop/public/uploads");

  // 2. Если процесс запущен внутри .next/standalone, корень проекта находится на 2 уровня выше
  if (process.cwd().includes(path.join(".next", "standalone"))) {
    dirs.add(path.resolve(process.cwd(), "..", "..", "public", "uploads"));
  }

  // 3. Текущая рабочая директория public/uploads
  dirs.add(path.resolve(process.cwd(), "public", "uploads"));

  // 4. Standalone директория (если существует)
  dirs.add(path.resolve(process.cwd(), ".next", "standalone", "public", "uploads"));
  dirs.add("/home/ofi/DollShop/.next/standalone/public/uploads");

  return Array.from(dirs);
}

/**
 * Сохраняет файл во ВСЕ доступные кандидатные директории (постоянный корень + standalone).
 * Это предотвращает потерю файлов при удалении/пересборке каталога .next.
 */
export async function saveUploadedFileLocally(
  relativeSubpath: string,
  buffer: Buffer
): Promise<void> {
  const cleanRelative = relativeSubpath.replace(/^\/+/, "");
  const candidateDirs = getUploadDirs();

  let savedCount = 0;
  for (const baseDir of candidateDirs) {
    try {
      const fullPath = path.resolve(baseDir, cleanRelative);
      // Защита от path traversal: целевой путь строго обязан оставаться внутри baseDir
      if (fullPath.startsWith(baseDir)) {
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, buffer);
        savedCount++;
      }
    } catch {
      // Игнорируем директории, к которым нет доступа
    }
  }

  if (savedCount === 0) {
    throw new Error("Не удалось сохранить файл ни в одну из директорий загрузки");
  }
}

/**
 * Ищет ранее сохраненный файл по относительному пути среди всех кандидатных директорий.
 */
export async function findUploadedFileLocally(
  relativeSubpath: string
): Promise<string | null> {
  const cleanRelative = relativeSubpath.replace(/^\/+/, "");
  const candidateDirs = getUploadDirs();

  for (const baseDir of candidateDirs) {
    const fullPath = path.resolve(baseDir, cleanRelative);
    if (!fullPath.startsWith(baseDir)) {
      continue;
    }
    try {
      const stat = await fs.stat(fullPath);
      if (stat.isFile()) {
        return fullPath;
      }
    } catch {
      // Файл не найден в данной директории, проверяем следующую
    }
  }

  return null;
}
