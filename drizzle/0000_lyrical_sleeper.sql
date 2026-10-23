CREATE TYPE "public"."contact_channel" AS ENUM('telegram', 'viber', 'call');--> statement-breakpoint
CREATE TYPE "public"."media_type" AS ENUM('image', 'video');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending', 'paid', 'cancelled', 'completed');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('erip_invoice', 'bank_transfer', 'cod', 'online_card', 'online_erip');--> statement-breakpoint
CREATE TYPE "public"."product_status" AS ENUM('draft', 'available', 'reserved', 'sold', 'made_to_order');--> statement-breakpoint
CREATE TYPE "public"."request_status" AS ENUM('new', 'in_discussion', 'accepted', 'declined');--> statement-breakpoint
CREATE TABLE "custom_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference_product_id" uuid,
	"customer_name" text NOT NULL,
	"customer_phone" text NOT NULL,
	"customer_contact" text,
	"contact_channel" "contact_channel" DEFAULT 'telegram' NOT NULL,
	"wishes" text,
	"status" "request_status" DEFAULT 'new' NOT NULL,
	"pd_consent_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"price_at_purchase" numeric(10, 2) NOT NULL,
	CONSTRAINT "item_price_non_negative" CHECK ("order_items"."price_at_purchase" >= 0)
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" serial NOT NULL,
	"public_token" uuid DEFAULT gen_random_uuid() NOT NULL,
	"customer_name" text NOT NULL,
	"customer_phone" text NOT NULL,
	"customer_contact" text,
	"contact_channel" "contact_channel" DEFAULT 'telegram' NOT NULL,
	"delivery_city" text NOT NULL,
	"delivery_branch" text NOT NULL,
	"comment" text,
	"total_amount" numeric(10, 2) NOT NULL,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"payment_method" "payment_method" DEFAULT 'erip_invoice' NOT NULL,
	"tracking_number" text,
	"payment_id" text,
	"pd_consent_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_public_token_unique" UNIQUE("public_token"),
	CONSTRAINT "order_total_amount_non_negative" CHECK ("orders"."total_amount" >= 0)
);
--> statement-breakpoint
CREATE TABLE "product_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"url" text NOT NULL,
	"media_type" "media_type" DEFAULT 'image' NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"blur_data_url" text,
	"storage_key" text,
	"width" integer,
	"height" integer,
	"alt" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"story" text NOT NULL,
	"specs" jsonb NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'BYN' NOT NULL,
	"status" "product_status" DEFAULT 'draft' NOT NULL,
	"reserved_until" timestamp with time zone,
	"is_featured" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_slug_unique" UNIQUE("slug"),
	CONSTRAINT "product_price_non_negative" CHECK ("products"."price" >= 0),
	CONSTRAINT "product_currency_byn" CHECK ("products"."currency" = 'BYN')
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"key" text PRIMARY KEY NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"count" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reservations" (
	"product_id" uuid PRIMARY KEY NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"checkout_mode" text DEFAULT 'standard' NOT NULL,
	"allowed_payment_methods" jsonb DEFAULT '["erip_invoice", "bank_transfer", "cod"]'::jsonb NOT NULL,
	"reservation_ttl_minutes" integer DEFAULT 15 NOT NULL,
	"erip_hold_hours" integer DEFAULT 24 NOT NULL,
	"delivery_cost_branch" numeric(10, 2) DEFAULT '3.50' NOT NULL,
	"delivery_cost_courier" numeric(10, 2) DEFAULT '5.50' NOT NULL,
	"free_delivery_threshold" numeric(10, 2) DEFAULT '120.00' NOT NULL,
	"legal_seller_name" text DEFAULT 'ИП Прокопенко А. В.' NOT NULL,
	"legal_unp" text DEFAULT '193758204' NOT NULL,
	"legal_trade_registry_num" text DEFAULT '584920' NOT NULL,
	"legal_address" text DEFAULT 'г. Минск, ул. Немига, 5' NOT NULL,
	"contact_email" text DEFAULT 'master@dollshop.by' NOT NULL,
	"contact_phone" text DEFAULT '+375 (29) 123-45-67' NOT NULL,
	"telegram_channel" text DEFAULT 'https://t.me/dollshop_by',
	"instagram_profile" text DEFAULT 'https://instagram.com/dollshop.by',
	"about_master_text" text,
	"payment_instructions_erip" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "custom_requests" ADD CONSTRAINT "custom_requests_reference_product_id_products_id_fk" FOREIGN KEY ("reference_product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_media" ADD CONSTRAINT "product_media_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "custom_requests_status_idx" ON "custom_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "custom_requests_created_at_idx" ON "custom_requests" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "order_items_order_id_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_items_product_id_idx" ON "order_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "orders_public_token_idx" ON "orders" USING btree ("public_token");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "orders_created_at_idx" ON "orders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "product_media_product_id_idx" ON "product_media" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_media_display_order_idx" ON "product_media" USING btree ("display_order");--> statement-breakpoint
CREATE INDEX "products_slug_idx" ON "products" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "products_status_idx" ON "products" USING btree ("status");--> statement-breakpoint
CREATE INDEX "products_is_featured_idx" ON "products" USING btree ("is_featured");--> statement-breakpoint
CREATE INDEX "products_sort_order_idx" ON "products" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "rate_limits_window_start_idx" ON "rate_limits" USING btree ("window_start");--> statement-breakpoint
CREATE INDEX "reservations_expires_at_idx" ON "reservations" USING btree ("expires_at");--> statement-breakpoint
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';--> statement-breakpoint
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON "products" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();--> statement-breakpoint
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON "orders" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();--> statement-breakpoint
CREATE TRIGGER update_custom_requests_updated_at BEFORE UPDATE ON "custom_requests" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();--> statement-breakpoint
CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON "site_settings" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
