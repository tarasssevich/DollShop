import { describe, it, expect } from "vitest";
import { buildDollStoryPrompt, BRAND_SYSTEM_PROMPT } from "../prompts";

describe("AI Brand Prompts & Guidelines (Step 4.7)", () => {
  it("содержит системный промпт с правилами тёплого голоса бренда", () => {
    expect(BRAND_SYSTEM_PROMPT).toContain("белорусского мастера");
    expect(BRAND_SYSTEM_PROMPT).toContain("ТАКТИЛЬНОСТЬ");
    expect(BRAND_SYSTEM_PROMPT).toContain("ГОЛОС БРЕНДА");
    expect(BRAND_SYSTEM_PROMPT).toContain("клише");
  });

  it("формирует пользовательский промпт со всеми характеристиками куклы", () => {
    const { userPrompt } = buildDollStoryPrompt({
      title: "Селеста · Фея незабудок",
      materials: ["Эко-хлопок макраме", "Резной бук", "Фатин с ромашками"],
      heightCm: 22,
      collection: "Времена года",
      notes: "Сделать акцент на весеннем утре",
    });

    expect(userPrompt).toContain("Селеста · Фея незабудок");
    expect(userPrompt).toContain("Эко-хлопок макраме");
    expect(userPrompt).toContain("22 см");
    expect(userPrompt).toContain("Времена года");
    expect(userPrompt).toContain("Сделать акцент на весеннем утре");
  });

  it("добавляет специальную инструкцию для режима «Короче» (shorter)", () => {
    const { userPrompt } = buildDollStoryPrompt({
      title: "Эмилия",
      mode: "shorter",
    });

    expect(userPrompt).toContain("лаконичной и ёмкой");
    expect(userPrompt).toContain("60–90 слов");
  });

  it("добавляет специальную инструкцию для режима «Теплее» (warmer)", () => {
    const { userPrompt } = buildDollStoryPrompt({
      title: "Эмилия",
      mode: "warmer",
    });

    expect(userPrompt).toContain("тёплой, нежной и сказочной");
    expect(userPrompt).toContain("домашнего тепла");
  });

  it("добавляет специальную инструкцию для режима «Ещё вариант» (alternative)", () => {
    const { userPrompt } = buildDollStoryPrompt({
      title: "Эмилия",
      mode: "alternative",
    });

    expect(userPrompt).toContain("совершенно другой образ");
  });
});
