/**
 * Единая точка доступа к каталогу кукол DollShop.
 * Перенаправляет запросы к репозиторию на Drizzle ORM с кэшированием ISR по тегам.
 */
export * from "./drizzle/catalog";
