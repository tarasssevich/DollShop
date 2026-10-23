import { z } from "zod";

export const siteSettingsSchema = z.object({
  legalSellerName: z.string().min(2, "Укажите имя продавца / ИП"),
  legalUnp: z.string().min(9, "УНП должен содержать 9 цифр"),
  legalTradeRegistryNum: z.string().min(1, "Укажите номер в Торговом реестре"),
  legalAddress: z.string().min(3, "Укажите юридический адрес"),
  contactPhone: z.string().min(7, "Укажите контактный телефон"),
  contactEmail: z.string().email("Некорректный email"),
  deliveryCostBranch: z.number().min(0, "Стоимость не может быть отрицательной"),
  freeDeliveryThreshold: z.number().min(0, "Порог не может быть отрицательным"),
  allowedPaymentMethods: z.array(z.string()).min(1, "Выберите хотя бы один способ оплаты"),
});
