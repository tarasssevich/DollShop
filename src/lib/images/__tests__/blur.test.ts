import { describe, it, expect } from "vitest";
import { generateBlurDataUrl, DEFAULT_BLUR_DATA_URL } from "../blur";

describe("Micro-blur placeholder generator (Step 4.5)", () => {
  it("возвращает валидный fallback dataUrl при серверном окружении или отсутствии DOM", async () => {
    const dummyBlob = new Blob(["dummy-image"], { type: "image/jpeg" });
    const blur = await generateBlurDataUrl(dummyBlob);

    expect(blur).toBe(DEFAULT_BLUR_DATA_URL);
    expect(blur.startsWith("data:image/")).toBe(true);
  });
});
