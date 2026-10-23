import { describe, it, expect } from "vitest";
import manifest from "../manifest";

describe("PWA Web App Manifest (Step 4.8)", () => {
  it("возвращает корректный манифест с точкой входа в админку и цветами бренда", () => {
    const data = manifest();

    expect(data.name).toBe("DollShop · Кабинет мастера");
    expect(data.short_name).toBe("DollShop");
    expect(data.start_url).toBe("/admin");
    expect(data.display).toBe("standalone");
    expect(data.theme_color).toBe("#9A5B42");
    expect(data.background_color).toBe("#FAF8F5");
    expect(data.orientation).toBe("portrait");

    expect(data.icons).toBeDefined();
    expect(data.icons?.length).toBeGreaterThanOrEqual(3);

    const icon192 = data.icons?.find((i) => i.sizes === "192x192");
    expect(icon192).toBeDefined();
    expect(icon192?.src).toBe("/icons/icon-192.png");

    const icon512 = data.icons?.find((i) => i.sizes === "512x512");
    expect(icon512).toBeDefined();
    expect(icon512?.src).toBe("/icons/icon-512.png");
  });
});
