import { sql, relations } from "drizzle-orm";
import {
  pgTable,
  text,
  integer,
  boolean,
  numeric,
  timestamp,
  jsonb,
  uuid,
  serial,
  pgEnum,
  index,
  check,
} from "drizzle-orm/pg-core";

// ==========================================
// ENUMS
// ==========================================

export const productStatusEnum = pgEnum("product_status", [
  "draft",
  "available",
  "reserved",
  "sold",
  "made_to_order",
]);

export const mediaTypeEnum = pgEnum("media_type", ["image", "video"]);

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "paid",
  "cancelled",
  "completed",
]);

export const contactChannelEnum = pgEnum("contact_channel", [
  "telegram",
  "viber",
  "call",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "erip_invoice",
  "bank_transfer",
  "cod",
  "online_card",
  "online_erip",
]);

export const requestStatusEnum = pgEnum("request_status", [
  "new",
  "in_discussion",
  "accepted",
  "declined",
]);

// ==========================================
// SPECIFICATIONS JSON TYPE
// ==========================================

export interface ProductSpecs {
  height_cm: number;
  materials: string[];
  category?: string;
  collection?: string;
  wing_type?: string;
  hair_color?: string;
  dress_color?: string;
  bouquet?: string;
  year?: number;
  details?: {
    wingMaterial?: string;
    hairMaterial?: string;
    dressMaterial?: string;
    bouquetDetails?: string;
    hangingLoopIncluded?: boolean;
    boxIncluded?: boolean;
    certificateIncluded?: boolean;
    [key: string]: unknown;
  };
  extra?: Array<{ label: string; value: string }>;
}

// ==========================================
// TABLES
// ==========================================

/**
 * Таблица кукол (основной каталог магазина).
 */
export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    story: text("story").notNull(),
    specs: jsonb("specs").$type<ProductSpecs>().notNull(),
    price: numeric("price", { precision: 10, scale: 2 }).notNull(),
    currency: text("currency").notNull().default("BYN"),
    status: productStatusEnum("status").notNull().default("draft"),
    reservedUntil: timestamp("reserved_until", { withTimezone: true }),
    isFeatured: boolean("is_featured").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("products_slug_idx").on(table.slug),
    index("products_status_idx").on(table.status),
    index("products_is_featured_idx").on(table.isFeatured),
    index("products_sort_order_idx").on(table.sortOrder),
    check("product_price_non_negative", sql`${table.price} >= 0`),
    check("product_currency_byn", sql`${table.currency} = 'BYN'`),
  ]
);

/**
 * Медиа-файлы кукол (фото и видео).
 */
export const productMedia = pgTable(
  "product_media",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    mediaType: mediaTypeEnum("media_type").notNull().default("image"),
    displayOrder: integer("display_order").notNull().default(0),
    blurDataUrl: text("blur_data_url"),
    storageKey: text("storage_key"),
    width: integer("width"),
    height: integer("height"),
    alt: text("alt"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("product_media_product_id_idx").on(table.productId),
    index("product_media_display_order_idx").on(table.displayOrder),
  ]
);

/**
 * Активные брони кукол.
 * Изолированное хранилище токена покупателя (токен не утекает на витрину).
 */
export const reservations = pgTable(
  "reservations",
  {
    productId: uuid("product_id")
      .primaryKey()
      .references(() => products.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("reservations_expires_at_idx").on(table.expiresAt)]
);

/**
 * Заказы покупателей: отправка почтой по Беларуси или самовывоз в Минске.
 */
export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderNumber: serial("order_number").notNull(),
    publicToken: uuid("public_token").notNull().defaultRandom().unique(),
    customerName: text("customer_name").notNull(),
    customerPhone: text("customer_phone").notNull(),
    customerContact: text("customer_contact"),
    contactChannel: contactChannelEnum("contact_channel")
      .notNull()
      .default("telegram"),
    deliveryCity: text("delivery_city").notNull(),
    deliveryBranch: text("delivery_branch").notNull(),
    comment: text("comment"),
    totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
    status: orderStatusEnum("status").notNull().default("pending"),
    paymentMethod: paymentMethodEnum("payment_method")
      .notNull()
      .default("erip_invoice"),
    trackingNumber: text("tracking_number"),
    paymentId: text("payment_id"),
    pdConsentAt: timestamp("pd_consent_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("orders_public_token_idx").on(table.publicToken),
    index("orders_status_idx").on(table.status),
    index("orders_created_at_idx").on(table.createdAt),
    check("order_total_amount_non_negative", sql`${table.totalAmount} >= 0`),
  ]
);

/**
 * Позиции заказа (кукла и зафиксированная на момент покупки цена).
 */
export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    priceAtPurchase: numeric("price_at_purchase", {
      precision: 10,
      scale: 2,
    }).notNull(),
  },
  (table) => [
    index("order_items_order_id_idx").on(table.orderId),
    index("order_items_product_id_idx").on(table.productId),
    check("item_price_non_negative", sql`${table.priceAtPurchase} >= 0`),
  ]
);

/**
 * Заявки на индивидуальный заказ «Хочу похожую».
 */
export const customRequests = pgTable(
  "custom_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    referenceProductId: uuid("reference_product_id").references(
      () => products.id,
      { onDelete: "set null" }
    ),
    customerName: text("customer_name").notNull(),
    customerPhone: text("customer_phone").notNull(),
    customerContact: text("customer_contact"),
    contactChannel: contactChannelEnum("contact_channel")
      .notNull()
      .default("telegram"),
    wishes: text("wishes"),
    status: requestStatusEnum("status").notNull().default("new"),
    pdConsentAt: timestamp("pd_consent_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("custom_requests_reference_product_id_idx").on(table.referenceProductId),
    index("custom_requests_status_idx").on(table.status),
    index("custom_requests_created_at_idx").on(table.createdAt),
  ]
);

/**
 * Настройки магазина (синглтон id=1).
 */
export const siteSettings = pgTable("site_settings", {
  id: integer("id").primaryKey().default(1),
  checkoutMode: text("checkout_mode").notNull().default("standard"),
  allowedPaymentMethods: jsonb("allowed_payment_methods")
    .$type<string[]>()
    .notNull()
    .default(sql`'["erip_invoice", "bank_transfer", "cod"]'::jsonb`),
  reservationTtlMinutes: integer("reservation_ttl_minutes")
    .notNull()
    .default(15),
  eripHoldHours: integer("erip_hold_hours").notNull().default(24),
  deliveryCostBranch: numeric("delivery_cost_branch", {
    precision: 10,
    scale: 2,
  })
    .notNull()
    .default("3.50"),
  deliveryCostCourier: numeric("delivery_cost_courier", {
    precision: 10,
    scale: 2,
  })
    .notNull()
    .default("5.50"),
  freeDeliveryThreshold: numeric("free_delivery_threshold", {
    precision: 10,
    scale: 2,
  })
    .notNull()
    .default("120.00"),
  legalSellerName: text("legal_seller_name")
    .notNull()
    .default("ИП Прокопенко А. В."),
  legalUnp: text("legal_unp").notNull().default("193758204"),
  legalTradeRegistryNum: text("legal_trade_registry_num")
    .notNull()
    .default("584920"),
  legalAddress: text("legal_address")
    .notNull()
    .default("г. Минск, ул. Немига, 5"),
  contactEmail: text("contact_email")
    .notNull()
    .default("master@dollshop.by"),
  contactPhone: text("contact_phone")
    .notNull()
    .default("+375 (29) 123-45-67"),
  telegramChannel: text("telegram_channel").default(
    "https://t.me/dollshop_by"
  ),
  instagramProfile: text("instagram_profile").default(
    "https://instagram.com/dollshop.by"
  ),
  aboutMasterText: text("about_master_text"),
  paymentInstructionsErip: text("payment_instructions_erip"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Ограничение частоты запросов без внешнего Redis.
 */
export const rateLimits = pgTable(
  "rate_limits",
  {
    key: text("key").primaryKey(),
    windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
    count: integer("count").notNull().default(1),
  },
  (table) => [index("rate_limits_window_start_idx").on(table.windowStart)]
);

// ==========================================
// BETTER AUTH TABLES (Step 4.1)
// ==========================================

/**
 * Пользователи (Better Auth: мастер/администратор магазина).
 */
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  role: text("role").notNull().default("viewer"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Сессии (Better Auth: httpOnly сессионные токены мастера).
 */
export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

/**
 * Учетные данные и аккаунты (Better Auth: пароли и провайдеры).
 */
export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", {
    withTimezone: true,
  }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
    withTimezone: true,
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Верификации и одноразовые токены (Better Auth).
 */
export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

// ==========================================
// RELATIONS
// ==========================================

export const productsRelations = relations(products, ({ many, one }) => ({
  media: many(productMedia),
  orderItems: many(orderItems),
  customRequests: many(customRequests),
  reservation: one(reservations, {
    fields: [products.id],
    references: [reservations.productId],
  }),
}));

export const productMediaRelations = relations(productMedia, ({ one }) => ({
  product: one(products, {
    fields: [productMedia.productId],
    references: [products.id],
  }),
}));

export const reservationsRelations = relations(reservations, ({ one }) => ({
  product: one(products, {
    fields: [reservations.productId],
    references: [products.id],
  }),
}));

export const ordersRelations = relations(orders, ({ many }) => ({
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const customRequestsRelations = relations(customRequests, ({ one }) => ({
  referenceProduct: one(products, {
    fields: [customRequests.referenceProductId],
    references: [products.id],
  }),
}));

// ==========================================
// EXPORT TYPES
// ==========================================

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

export type ProductMediaItem = typeof productMedia.$inferSelect;
export type NewProductMediaItem = typeof productMedia.$inferInsert;

export type Reservation = typeof reservations.$inferSelect;
export type NewReservation = typeof reservations.$inferInsert;

export type OrderRecord = typeof orders.$inferSelect;
export type NewOrderRecord = typeof orders.$inferInsert;

export type OrderItemRecord = typeof orderItems.$inferSelect;
export type NewOrderItemRecord = typeof orderItems.$inferInsert;

export type CustomRequestRecord = typeof customRequests.$inferSelect;
export type NewCustomRequestRecord = typeof customRequests.$inferInsert;

export type SiteSettingsRecord = typeof siteSettings.$inferSelect;
export type NewSiteSettingsRecord = typeof siteSettings.$inferInsert;

export type RateLimitRecord = typeof rateLimits.$inferSelect;
export type NewRateLimitRecord = typeof rateLimits.$inferInsert;

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;

export type Session = typeof session.$inferSelect;
export type NewSession = typeof session.$inferInsert;

export type Account = typeof account.$inferSelect;
export type NewAccount = typeof account.$inferInsert;

export type Verification = typeof verification.$inferSelect;
export type NewVerification = typeof verification.$inferInsert;
