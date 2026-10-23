import { describe, it, expect } from "vitest";
import { dollImageLoader } from "../loader";

describe("Doll Image Loader (Step 4.6)", () => {
  const s3OriginalUrl =
    "https://s3.hoster.by/dollshop-media/products/p1/m1/2000.webp";
  const localUploadUrl = "/uploads/products/p1/m1/2000.webp";

  it("выбирает 640.webp для мобильных экранов (width <= 640)", () => {
    const s3Res = dollImageLoader({ src: s3OriginalUrl, width: 375 });
    expect(s3Res).toBe(
      "https://s3.hoster.by/dollshop-media/products/p1/m1/640.webp"
    );

    const localRes = dollImageLoader({ src: localUploadUrl, width: 640 });
    expect(localRes).toBe("/uploads/products/p1/m1/640.webp");
  });

  it("выбирает 1280.webp для планшетов и стандартных десктопов (width <= 1280)", () => {
    const s3Res = dollImageLoader({ src: s3OriginalUrl, width: 1024 });
    expect(s3Res).toBe(
      "https://s3.hoster.by/dollshop-media/products/p1/m1/1280.webp"
    );

    const localRes = dollImageLoader({ src: localUploadUrl, width: 1280 });
    expect(localRes).toBe("/uploads/products/p1/m1/1280.webp");
  });

  it("выбирает 2000.webp для high-res экранов и зума (width > 1280)", () => {
    const s3Res = dollImageLoader({
      src: "https://s3.hoster.by/dollshop-media/products/p1/m1/640.webp",
      width: 1920,
    });
    expect(s3Res).toBe(
      "https://s3.hoster.by/dollshop-media/products/p1/m1/2000.webp"
    );
  });

  it("сохраняет URL без изменений для обычных статичных файлов и моков", () => {
    const mockRes = dollImageLoader({
      src: "/mock/dolls/fairy-blue-1.jpg",
      width: 640,
    });
    expect(mockRes).toBe("/mock/dolls/fairy-blue-1.jpg");
  });
});
