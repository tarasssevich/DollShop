import { z } from "zod";
import { isValidBelarusPhone } from "@/lib/utils/phone";

export const customRequestSchema = z.object({
  customerName: z
    .string({ required_error: "Введите ваше имя" })
    .trim()
    .min(2, "Имя должно содержать минимум 2 символа")
    .max(100, "Слишком длинное имя"),

  customerPhone: z
    .string({ required_error: "Введите номер телефона" })
    .trim()
    .refine(isValidBelarusPhone, {
      message: "Введите корректный номер телефона Беларуси (+375...)",
    }),

  contactChannel: z.enum(["telegram", "viber", "call"], {
    required_error: "Укажите удобный канал для связи",
  }),

  customerContact: z.string().max(80).optional().nullable(),
  referenceSlug: z.string().optional().nullable(),
  referenceProductId: z.string().uuid().optional().nullable(),

  wishes: z
    .string({ required_error: "Опишите ваши пожелания к образу куклы" })
    .trim()
    .min(5, "Пожалуйста, опишите пожелания чуть подробнее (от 5 символов)")
    .max(1000, "Текст слишком длинный (максимум 1000 символов)"),

  pdConsent: z.boolean().refine((val) => val === true, {
    message: "Необходимо согласие на обработку персональных данных",
  }),

  referencePhotoUrls: z
    .array(
      z
        .string()
        .regex(
          /^\/uploads\/requests\/[0-9a-f-]{36}\.(jpg|png|webp)$/,
          "Некорректная ссылка на фото"
        )
    )
    .max(3, "Можно прикрепить не более 3 фото")
    .optional(),

  honeypot: z.string().optional(),
});
