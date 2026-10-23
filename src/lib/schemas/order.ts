import { z } from "zod";
import { normalizeBelarusPhone, isValidBelarusPhone } from "@/lib/utils/phone";

export const fulfillmentMethodSchema = z.enum(["postal", "pickup"]);

export const orderCustomerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Укажите имя и фамилию (минимум 2 символа)")
    .max(100, "Имя слишком длинное"),
  phone: z
    .string()
    .trim()
    .refine(
      (val) => isValidBelarusPhone(val),
      "Укажите корректный белорусский номер телефона (+375...)"
    )
    .transform((val) => normalizeBelarusPhone(val) ?? val),
  email: z
    .string()
    .trim()
    .email("Укажите корректный адрес электронной почты")
    .optional()
    .or(z.literal("")),
  comment: z.string().trim().max(500, "Комментарий до 500 символов").optional(),
});

export const orderReceivingSchema = z
  .object({
    method: fulfillmentMethodSchema,
    city: z.string().trim().optional(),
    postalAddress: z.string().trim().optional(),
    costByn: z.number().int().nonnegative(),
  })
  .refine(
    (data) => {
      if (data.method === "postal") {
        return Boolean(
          data.city &&
            data.city.length >= 2 &&
            data.postalAddress &&
            data.postalAddress.length > 0
        );
      }
      return true;
    },
    {
      message:
        "Для отправки почтой укажите населенный пункт и адрес почтового отделения / индекс",
      path: ["method"],
    }
  );

export const createOrderSchema = z.object({
  dollId: z.string().min(1, "Идентификатор куклы обязателен"),
  customer: orderCustomerSchema,
  receiving: orderReceivingSchema,
  termsAccepted: z.literal(true, {
    message:
      "Необходимо согласиться с условиями публичной оферты и политики конфиденциальности РБ",
  }),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
