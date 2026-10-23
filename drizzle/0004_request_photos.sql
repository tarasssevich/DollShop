ALTER TABLE "custom_requests" ADD COLUMN IF NOT EXISTS "reference_photo_urls" text[] DEFAULT '{}'::text[] NOT NULL;
