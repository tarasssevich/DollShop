export interface DollStoryPromptInput {
  title: string;
  materials?: string[];
  heightCm?: number;
  collection?: string;
  notes?: string;
  mode?: "default" | "shorter" | "warmer" | "alternative";
  currentStory?: string;
}

export const BRAND_SYSTEM_PROMPT = `Ты — чуткий сказочник и соавтор белорусского мастера авторских интерьерных кукол ручной работы.
Твоя задача — создавать поэтичные, живые, душевные художественные истории для кукол, которые выставляются на витрине уютной авторской мастерской.

ПРАВИЛА И СТИЛЬ:
1. ГОЛОС БРЕНДА: Тёплый, созерцательный, интимный, сказочный. Полный отказ от рекламных клише («Идеальный подарок!», «Спешите заказать!», «Уникальное предложение!») и канцелярита.
2. ЯЗЫК: Безупречный литературный русский язык с богатыми метафорами, нежностью и глубоким уважением к ручному труду.
3. ТАКТИЛЬНОСТЬ: Обязательно вплетай осязаемые детали: фактуру резного бука, мягкость хлопковой макраме-пряжи, невесомость фатина с ромашками, крошечные цветы ручной работы.
4. СТРУКТУРА: 2–3 небольших абзаца (100–180 слов). История должна читаться как страница из дорогой иллюстрированной книги сказок, создавая ощущение, что у куклы есть душа, характер и маленькая тайна.`;

export function buildDollStoryPrompt(input: DollStoryPromptInput): {
  systemPrompt: string;
  userPrompt: string;
} {
  const {
    title,
    materials = [],
    heightCm,
    collection,
    notes,
    mode = "default",
    currentStory,
  } = input;

  const parts: string[] = [];

  parts.push(`Название куклы: «${title}»`);

  if (collection) {
    parts.push(`Коллекция: ${collection}`);
  }

  if (heightCm) {
    parts.push(`Рост куклы: ${heightCm} см`);
  }

  if (materials.length > 0) {
    parts.push(`Материалы и детали: ${materials.join(", ")}`);
  }

  if (notes && notes.trim()) {
    parts.push(`Заметки и пожелания мастера: ${notes.trim()}`);
  }

  if (currentStory && currentStory.trim()) {
    parts.push(`Текущий черновик описания:\n"${currentStory.trim()}"`);
  }

  let instruction = "Сочини законченную художественную историю для этой куклы.";

  if (mode === "shorter") {
    instruction =
      "Сделай историю более лаконичной и ёмкой (60–90 слов), сохранив всю теплоту и поэтичность образа.";
  } else if (mode === "warmer") {
    instruction =
      "Сделай историю ещё более тёплой, нежной и сказочной, добавив больше уюта, домашнего тепла и душевности.";
  } else if (mode === "alternative") {
    instruction =
      "Придумай совершенно другой образ и новую метафору для этой же куклы, предложив свежий сюжетный взгляд.";
  }

  parts.push(`\nЗАДАЧА: ${instruction}\nОтвечай только художественным текстом истории, без вступительных и заключительных фраз.`);

  return {
    systemPrompt: BRAND_SYSTEM_PROMPT,
    userPrompt: parts.join("\n"),
  };
}
