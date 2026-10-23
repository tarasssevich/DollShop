-- Step 5.6 Extension: Custom Request Response Doll
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "is_custom_order" boolean DEFAULT false NOT NULL;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "custom_request_id" uuid;
ALTER TABLE "custom_requests" ADD COLUMN IF NOT EXISTS "response_product_id" uuid;
ALTER TABLE "custom_requests" ADD COLUMN IF NOT EXISTS "public_token" uuid DEFAULT gen_random_uuid() NOT NULL;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_custom_request_id_fkey'
  ) THEN
    ALTER TABLE "products" ADD CONSTRAINT "products_custom_request_id_fkey"
      FOREIGN KEY ("custom_request_id") REFERENCES "custom_requests"("id") ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'custom_requests_response_product_id_fkey'
  ) THEN
    ALTER TABLE "custom_requests" ADD CONSTRAINT "custom_requests_response_product_id_fkey"
      FOREIGN KEY ("response_product_id") REFERENCES "products"("id") ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "products_is_custom_order_idx" ON "products" ("is_custom_order");
CREATE INDEX IF NOT EXISTS "products_custom_request_id_idx" ON "products" ("custom_request_id");
CREATE INDEX IF NOT EXISTS "custom_requests_response_product_id_idx" ON "custom_requests" ("response_product_id");
CREATE INDEX IF NOT EXISTS "custom_requests_public_token_idx" ON "custom_requests" ("public_token");
