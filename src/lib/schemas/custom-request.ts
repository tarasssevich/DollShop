import { z } from "zod";
import { isValidBelarusPhone, normalizeBelarusPhone } from "@/lib/utils/phone";

export const contactChannelSchema = z.enum(["telegram", "viber", "call"]);
export type ContactChannel = z.infer<typeof contactChannelSchema>;

export const customRequestSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Укажите ваше имя (минимум 2 символа)")
    .max(100, "Имя слишком длинное"),
  phone: z
    .string()
    .trim()
    .refine(
      (val) => isValidBelarusPhone(val),
      "Укажите корректный белорусский номер телефона (+375...)"
    )
    .transform((val) => normalizeBelarusPhone(val) ?? val),
  preferredChannel: contactChannelSchema.default("telegram"),
  wishes: z
    .string()
    .trim()
    .max(1000, "Пожелания не должны превышать 1000 символов")
    .optional()
    .or(z.literal("")),
  fromDollSlug: z.string().trim().optional(),
  fromDollName: z.string().trim().optional(),
  pdConsent: z.boolean().refine((val) => val === true, {
    message: "Необходимо дать согласие на обработку персональных данных",
  }),
  // Anti-bot honeypot field (must remain empty for human users)
  honeypot: z
    .string()
    .max(0, "Спам-проверка не пройдена")
    .optional()
    .or(z.literal("")),
});

export type CustomRequestInput = z.infer<typeof customRequestSchema>;
