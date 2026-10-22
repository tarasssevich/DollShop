import { z } from "zod";
import { normalizeBelarusPhone, isValidBelarusPhone } from "@/lib/utils/phone";

export const deliveryMethodSchema = z.enum(["europost", "courier"]);

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

export const orderDeliverySchema = z
  .object({
    method: deliveryMethodSchema,
    city: z.string().trim().min(2, "Укажите населенный пункт"),
    europostOfficeId: z.string().trim().optional(),
    courierAddress: z.string().trim().optional(),
    costByn: z.number().int().nonnegative(),
  })
  .refine(
    (data) => {
      if (data.method === "europost") {
        return Boolean(data.europostOfficeId && data.europostOfficeId.length > 0);
      }
      if (data.method === "courier") {
        return Boolean(data.courierAddress && data.courierAddress.length > 5);
      }
      return true;
    },
    {
      message:
        "Заполните адресные данные для выбранного способа доставки",
      path: ["method"],
    }
  );

export const createOrderSchema = z.object({
  dollId: z.string().min(1, "Идентификатор куклы обязателен"),
  customer: orderCustomerSchema,
  delivery: orderDeliverySchema,
  termsAccepted: z.literal(true, {
    message:
      "Необходимо согласиться с условиями публичной оферты и политики конфиденциальности РБ",
  }),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
