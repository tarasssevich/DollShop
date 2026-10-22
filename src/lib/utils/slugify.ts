const cyrillicMap: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "yo",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "h",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "sch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
  // Belarusian specific letters
  і: "i",
  ў: "u",
};

export function slugify(text: string): string {
  if (!text) return "";

  return text
    .toLowerCase()
    .trim()
    .split("")
    .map((char) => cyrillicMap[char] ?? char)
    .join("")
    .replace(/[^\w\s-]/g, "") // remove non-word characters (except space & dash)
    .replace(/[\s_]+/g, "-") // replace spaces and underscores with a single dash
    .replace(/-+/g, "-") // collapse multiple dashes
    .replace(/^-+|-+$/g, ""); // trim leading/trailing dashes
}
