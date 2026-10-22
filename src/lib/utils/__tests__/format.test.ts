import { describe, it, expect } from "vitest";
import { formatPrice, formatHeight, formatYear } from "../format";

describe("format utility", () => {
  it("formats 350 to '350 BYN'", () => {
    expect(formatPrice(350)).toBe("350 BYN");
  });

  it("formats prices with thousands separator cleanly", () => {
    // 1200 BYN with non-breaking space or regular space depending on locale
    const formatted = formatPrice(1200);
    expect(formatted.replace(/\s+/g, " ")).toBe("1 200 BYN");
  });

  it("formats prices without currency suffix when requested", () => {
    expect(formatPrice(420, { showCurrency: false })).toBe("420");
  });

  it("formats height in centimeters", () => {
    expect(formatHeight(36)).toBe("36 см");
  });

  it("formats year with 'г.' suffix", () => {
    expect(formatYear(2026)).toBe("2026 г.");
  });
});
