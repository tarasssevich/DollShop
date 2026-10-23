import { z } from "zod";
import { isValidBelarusPhone } from "@/lib/utils/phone";

export const orderFormSchema = z
  .object({
    productId: z.string().uuid("Некорректный идентификатор товара"),
    slug: z.string().min(1, "Слаг куклы обязателен"),
    dollName: z.string().min(1, "Название куклы обязательно"),
    dollPriceByn: z.number().positive("Стоимость должна быть положительной"),

    customerName: z
      .string({ required_error: "Введите ваше имя и фамилию" })
      .trim()
      .min(3, "Укажите имя и фамилию (минимум 3 символа)")
      .max(120, "Слишком длинное имя"),

    customerPhone: z
      .string({ required_error: "Введите номер телефона" })
      .trim()
      .refine(isValidBelarusPhone, {
        message: "Введите корректный номер телефона Беларуси (+375...)",
      }),

    contactChannel: z.enum(["telegram", "viber", "call"], {
      required_error: "Выберите предпочтительный канал связи",
    }),

    customerContact: z.string().max(80).optional().nullable(),

    deliveryType: z.enum(["postal", "pickup"], {
      required_error: "Выберите способ получения (почта или самовывоз)",
    }),

    deliveryCity: z.string().max(100).optional(),
    deliveryBranch: z.string().max(200).optional(),

    paymentMethod: z.enum(
      ["erip_invoice", "bank_transfer", "cod", "online_card", "online_erip"],
      {
        required_error: "Выберите способ оплаты",
      }
    ),

    comment: z.string().max(500, "Комментарий слишком длинный").optional().nullable(),

    pdConsent: z.boolean().refine((val) => val === true, {
      message: "Необходимо согласие на обработку персональных данных",
    }),

    offerConsent: z.boolean().refine((val) => val === true, {
      message: "Необходимо принять условия публичной оферты",
    }),

    honeypot: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.deliveryType === "postal") {
      if (!data.deliveryCity || data.deliveryCity.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Укажите населённый пункт для отправки почтой",
          path: ["deliveryCity"],
        });
      }
      if (!data.deliveryBranch || data.deliveryBranch.trim().length < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Укажите номер почтового отделения (ОПС) или индекс",
          path: ["deliveryBranch"],
        });
      }
    }
  });
