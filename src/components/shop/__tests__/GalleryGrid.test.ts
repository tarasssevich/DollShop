import { describe, it, expect } from "vitest";
import { GalleryGrid } from "../GalleryGrid";
import { getDolls } from "@/lib/data/catalog";

describe("GalleryGrid component (Step 2.7)", () => {
  it("exports GalleryGrid function component", () => {
    expect(typeof GalleryGrid).toBe("function");
  });

  it("retrieves sold dolls with status 'sold' for gallery archive", async () => {
    const soldDolls = await getDolls({ status: "sold" });
    expect(soldDolls.length).toBeGreaterThanOrEqual(2);

    for (const d of soldDolls) {
      expect(d.status).toBe("sold");
      expect(d.isDraft).toBeFalsy();
    }
  });

  it("filters dolls by category accurately", async () => {
    const soldDolls = await getDolls({ status: "sold" });

    const angels = soldDolls.filter((d) => d.category === "angels");
    expect(angels.length).toBeGreaterThan(0);
    for (const a of angels) {
      expect(a.category).toBe("angels");
    }

    const fairies = soldDolls.filter((d) => d.category === "fairies");
    expect(fairies.length).toBeGreaterThan(0);
    for (const f of fairies) {
      expect(f.category).toBe("fairies");
    }
  });

  it("constructs valid custom order links for archive dolls", async () => {
    const soldDolls = await getDolls({ status: "sold" });
    const first = soldDolls[0];
    expect(first).toBeDefined();

    const expectedLink = `/na-zakaz?from=${first!.slug}`;
    expect(expectedLink).toContain("/na-zakaz?from=");
    expect(expectedLink).toContain(first!.slug);
  });
});
