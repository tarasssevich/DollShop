import { z } from "zod";

export const dollStatusSchema = z.enum([
  "available",
  "reserved",
  "sold",
  "in_progress",
]);

export const dollCategorySchema = z.enum([
  "fairies",
  "angels",
  "miniatures",
  "seasonal",
]);

export const dollImageSchema = z.object({
  id: z.string().min(1),
  url: z.string().min(1),
  blurDataUrl: z.string().min(1),
  alt: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  isCover: z.boolean().optional(),
});

export const dollDetailsSchema = z.object({
  wingMaterial: z.string().min(1),
  hairMaterial: z.string().min(1),
  dressMaterial: z.string().min(1),
  bouquetDetails: z.string().min(1),
  hangingLoopIncluded: z.boolean(),
  boxIncluded: z.boolean(),
  certificateIncluded: z.boolean(),
});

export const dollSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  category: dollCategorySchema,
  collection: z.string().optional(),
  priceByn: z.number().int().positive(),
  status: dollStatusSchema,
  reservedUntil: z.string().datetime().nullable(),
  heightCm: z.number().positive(),
  year: z.number().int().positive(),
  materials: z.array(z.string()).min(1),
  description: z.string().min(1),
  story: z.string().min(1),
  details: dollDetailsSchema,
  images: z.array(dollImageSchema).min(1),
  isFeatured: z.boolean().optional(),
  isDraft: z.boolean().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type DollSchema = z.infer<typeof dollSchema>;
