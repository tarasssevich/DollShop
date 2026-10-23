import { describe, it, expect } from "vitest";
import NotFound from "../not-found";
import RootLoading from "../loading";
import ShopLoading from "../(shop)/loading";
import { metadata, viewport } from "../layout";

describe("Vitrine Polish (Step 2.10)", () => {
  it("exports NotFound component", () => {
    expect(typeof NotFound).toBe("function");
  });

  it("exports RootLoading and ShopLoading components", () => {
    expect(typeof RootLoading).toBe("function");
    expect(typeof ShopLoading).toBe("function");
  });

  it("provides comprehensive OpenGraph metadata with ru_BY locale", () => {
    expect(metadata.openGraph?.locale).toBe("ru_BY");
    expect(metadata.openGraph?.siteName).toBe("DollShop");
    expect(metadata.metadataBase?.toString()).toContain("https://dollshop.by");
  });

  it("configures mobile viewport and themeColor properly", () => {
    expect(viewport.themeColor).toBe("#FAF8F5");
    expect(viewport.width).toBe("device-width");
  });
});
