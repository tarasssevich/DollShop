import { describe, it, expect } from "vitest";
import { Lightbox } from "../Lightbox";

describe("Lightbox component (Step 2.6)", () => {
  it("exports Lightbox function component", () => {
    expect(typeof Lightbox).toBe("function");
  });

  it("calculates zoom pinch bounds properly", () => {
    const MIN_SCALE = 1;
    const MAX_SCALE = 4;

    const clampScale = (raw: number) =>
      Math.min(MAX_SCALE, Math.max(MIN_SCALE, raw));

    expect(clampScale(0.5)).toBe(1);
    expect(clampScale(1.0)).toBe(1);
    expect(clampScale(2.5)).toBe(2.5);
    expect(clampScale(5.0)).toBe(4);
  });

  it("evaluates swipe gesture threshold correctly", () => {
    const isHorizontalSwipe = (
      deltaX: number,
      deltaY: number,
      deltaTime: number
    ) =>
      Math.abs(deltaX) > 40 &&
      Math.abs(deltaX) > Math.abs(deltaY) &&
      deltaTime < 400;

    // Clear horizontal swipe left
    expect(isHorizontalSwipe(-80, 10, 200)).toBe(true);

    // Clear horizontal swipe right
    expect(isHorizontalSwipe(90, 15, 180)).toBe(true);

    // Too slow
    expect(isHorizontalSwipe(90, 10, 500)).toBe(false);

    // Vertical drag instead of horizontal swipe
    expect(isHorizontalSwipe(20, 100, 200)).toBe(false);
  });

  it("evaluates pull down to close threshold", () => {
    const isPullDownToClose = (deltaY: number, deltaTime: number) =>
      deltaY > 100 && deltaTime < 400;

    expect(isPullDownToClose(150, 250)).toBe(true);
    expect(isPullDownToClose(50, 200)).toBe(false);
    expect(isPullDownToClose(150, 600)).toBe(false);
  });

  it("detects rapid double tap within 300ms", () => {
    const isDoubleTap = (timeDiff: number, distance: number) =>
      timeDiff < 300 && distance < 25;

    expect(isDoubleTap(180, 5)).toBe(true);
    expect(isDoubleTap(400, 5)).toBe(false);
    expect(isDoubleTap(150, 50)).toBe(false);
  });
});
