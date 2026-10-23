import { describe, it, expect } from "vitest";
import { saveProductAction } from "../products";
import { productFormSchema } from "@/lib/schemas/product-form";
import { slugify } from "@/lib/utils/slugify";

describe("Admin Product Actions & Schema (Step 4.3 - Zero-IT UX)", () => {
  it("productFormSchema успешно валидирует корректные данные куклы", () => {
    const valid = {
      title: "Аврора · Утренняя фея",
      story: "Нежная фея рассвета с прозрачными крылышками и ароматом полевых трав.",
      price: 55.0,
      heightCm: 22,
      collection: "Времена года",
      materials: ["Эко-хлопок макраме", "Резное дерево", "Фатин"],
      status: "available",
      isFeatured: true,
    };

    const res = productFormSchema.safeParse(valid);
    expect(res.success).toBe(true);
  });

  it("productFormSchema отклоняет отрицательную или нулевую стоимость", () => {
    const invalid = {
      title: "Аврора",
      story: "Описание",
      price: -10,
      heightCm: 20,
      materials: ["Хлопок"],
      status: "available",
    };

    const res = productFormSchema.safeParse(invalid);
    expect(res.success).toBe(false);
  });

  it("productFormSchema требует хотя бы один материал", () => {
    const invalid = {
      title: "Аврора",
      story: "Описание куклы",
      price: 50,
      heightCm: 20,
      materials: [],
      status: "available",
    };

    const res = productFormSchema.safeParse(invalid);
    expect(res.success).toBe(false);
  });

  it("slugify корректно транслитерирует белорусские и русские названия", () => {
    expect(slugify("Селеста · Фея незабудок")).toBe("selesta-feya-nezabudok");
    expect(slugify("Зорка ў небе")).toBe("zorka-u-nebe");
    expect(slugify("Кукла №1 (2026)")).toBe("kukla-1-2026");
  });

  it("saveProductAction отклоняет неавторизованные запросы", async () => {
    const res = await saveProductAction({
      title: "Неавторизованная кукла",
      story: "Попытка сохранить без сессии",
      price: 50,
      heightCm: 20,
      materials: ["Хлопок"],
      status: "available",
    });

    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toMatch(/Доступ запрещен/i);
    }
  });
});
