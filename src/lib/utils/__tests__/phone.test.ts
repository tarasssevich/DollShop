import { describe, it, expect } from "vitest";
import {
  normalizeBelarusPhone,
  isValidBelarusPhone,
  formatBelarusPhone,
} from "../phone";

describe("phone utility for Belarus (+375)", () => {
  it("normalizes '8029 123-45-67' to '+375291234567'", () => {
    expect(normalizeBelarusPhone("8029 123-45-67")).toBe("+375291234567");
  });

  it("normalizes '+375 (29) 123-45-67' to '+375291234567'", () => {
    expect(normalizeBelarusPhone("+375 (29) 123-45-67")).toBe("+375291234567");
  });

  it("normalizes '8 (044) 987-65-43' to '+375449876543'", () => {
    expect(normalizeBelarusPhone("8 (044) 987-65-43")).toBe("+375449876543");
  });

  it("normalizes 9-digit local input '291234567' to '+375291234567'", () => {
    expect(normalizeBelarusPhone("291234567")).toBe("+375291234567");
  });

  it("rejects invalid country codes or lengths", () => {
    expect(normalizeBelarusPhone("12345")).toBeNull();
    expect(normalizeBelarusPhone("+79991234567")).toBeNull(); // Russia
    expect(normalizeBelarusPhone("+380501234567")).toBeNull(); // Ukraine
  });

  it("validates valid Belarusian phone numbers", () => {
    expect(isValidBelarusPhone("+375291234567")).toBe(true);
    expect(isValidBelarusPhone("8033 654-32-10")).toBe(true);
    expect(isValidBelarusPhone("invalid-text")).toBe(false);
  });

  it("formats phone for display: +375 (29) 123-45-67", () => {
    expect(formatBelarusPhone("+375291234567")).toBe("+375 (29) 123-45-67");
    expect(formatBelarusPhone("80447654321")).toBe("+375 (44) 765-43-21");
  });
});
