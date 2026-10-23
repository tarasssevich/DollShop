import { z } from "zod";

export const productFormSchema = z.object({
  id: z.string().uuid().optional(),
  title: z
    .string({ required_error: "Введите название куклы" })
    .min(2, "Название куклы должно быть не короче 2 символов")
    .max(120, "Название слишком длинное (максимум 120 символов)"),
  story: z
    .string({ required_error: "Напишите историю или описание куклы" })
    .min(5, "Описание куклы должно быть не короче 5 символов"),
  price: z
    .number({ required_error: "Укажите цену в белорусских рублях" })
    .positive("Цена должна быть больше нуля")
    .max(10000, "Цена не может превышать 10 000 BYN"),
  heightCm: z
    .number({ required_error: "Укажите рост куклы в сантиметрах" })
    .int("Рост должен быть целым числом")
    .min(5, "Рост должен быть не менее 5 см")
    .max(150, "Рост не может превышать 150 см"),
  collection: z.string().max(80).optional().default("Авторская серия"),
  materials: z.array(z.string().min(1)).min(1, "Добавьте хотя бы один материал"),
  status: z.enum(["available", "sold", "made_to_order", "draft"]),
  isFeatured: z.boolean().default(false),
  isCustomOrder: z.boolean().default(false),
  customRequestId: z.string().uuid().optional().nullable(),
  details: z
    .object({
      wingMaterial: z.string().optional(),
      hairMaterial: z.string().optional(),
      dressMaterial: z.string().optional(),
      bouquetDetails: z.string().optional(),
      hangingLoopIncluded: z.boolean().default(true),
      boxIncluded: z.boolean().default(true),
      certificateIncluded: z.boolean().default(true),
    })
    .optional(),
});
