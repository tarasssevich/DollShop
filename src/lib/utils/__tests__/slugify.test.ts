import { describe, it, expect } from "vitest";
import { slugify } from "../slugify";

describe("slugify utility", () => {
  it("converts 'Лиза в лунном свете' to 'liza-v-lunnom-svete'", () => {
    expect(slugify("Лиза в лунном свете")).toBe("liza-v-lunnom-svete");
  });

  it("handles single-word Russian names like 'Селеста'", () => {
    expect(slugify("Селеста")).toBe("selesta");
  });

  it("strips special symbols and brackets", () => {
    expect(slugify("Элеонора (OOAK №1)")).toBe("eleonora-ooak-1");
  });

  it("collapses multiple spaces and dashes", () => {
    expect(slugify("  Шепот   осеннего---леса  ")).toBe("shepot-osennego-lesa");
  });

  it("handles empty or whitespace strings", () => {
    expect(slugify("")).toBe("");
    expect(slugify("   ")).toBe("");
  });
});
