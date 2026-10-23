import { describe, it, expect } from "vitest";
import {
  generateStaticParams,
  generateMetadata,
} from "../page";
import { getDollBySlug, getEffectiveDollStatus } from "@/lib/data/catalog";

describe("Doll detail page (/kukly/[slug])", () => {
  it("generateStaticParams generates slugs for all published dolls without drafts", async () => {
    const params = await generateStaticParams();
    expect(params.length).toBeGreaterThan(0);

    const slugs = params.map((p) => p.slug);
    expect(slugs).toContain("selesta");
    expect(slugs).toContain("mirabel");
    expect(slugs).not.toContain("chernovik-mastera");
  });

  it("generateMetadata generates rich Russian SEO metadata for published doll", async () => {
    const meta = await generateMetadata({
      params: Promise.resolve({ slug: "selesta" }),
    });

    expect(meta.title).toContain("Селеста · Фея незабудок");
    expect(meta.title).toContain("DollShop");
    expect(meta.description).toBeTruthy();
    expect(meta.openGraph?.title).toContain("Селеста");
  });

  it("generateMetadata handles not-found dolls gracefully", async () => {
    const meta = await generateMetadata({
      params: Promise.resolve({ slug: "non-existent-fairy" }),
    });

    expect(meta.title).toBe("Кукла не найдена | DollShop");
  });

  it("draft doll is hidden and returns null (triggering notFound)", async () => {
    const doll = await getDollBySlug("chernovik-mastera");
    expect(doll).toBeNull();
  });

  it("mock with expired reservation ('klarissa') resolves to available status", async () => {
    const doll = await getDollBySlug("klarissa");
    expect(doll).not.toBeNull();
    expect(doll?.status).toBe("reserved");
    // But effective status must be rolled back to available!
    const effective = getEffectiveDollStatus(doll!);
    expect(effective).toBe("available");
  });

  it("mock with active reservation ('beatris') keeps reserved status", async () => {
    const doll = await getDollBySlug("beatris");
    expect(doll).not.toBeNull();
    const effective = getEffectiveDollStatus(doll!);
    expect(effective).toBe("reserved");
  });

  it("mock with sold doll ('liza-v-lunnom-svete') keeps sold status", async () => {
    const doll = await getDollBySlug("liza-v-lunnom-svete");
    expect(doll).not.toBeNull();
    const effective = getEffectiveDollStatus(doll!);
    expect(effective).toBe("sold");
  });

  it("mock with in_progress doll ('noktyurn') keeps in_progress status", async () => {
    const doll = await getDollBySlug("noktyurn");
    expect(doll).not.toBeNull();
    const effective = getEffectiveDollStatus(doll!);
    expect(effective).toBe("in_progress");
  });
});
