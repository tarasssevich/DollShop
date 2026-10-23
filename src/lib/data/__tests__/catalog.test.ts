import { describe, it, expect } from "vitest";
import {
  getDolls,
  getDollBySlug,
  getDollById,
  getFeaturedDolls,
  getEffectiveDollStatus,
} from "../catalog";

describe("catalog repository layer", () => {
  it("never includes drafts in public getDolls() queries", async () => {
    const dolls = await getDolls();
    expect(dolls.length).toBeGreaterThan(0);
    const draft = dolls.find((d) => d.isDraft);
    expect(draft).toBeUndefined();
    const draftById = dolls.find((d) => d.id === "doll-draft");
    expect(draftById).toBeUndefined();
  });

  it("finds a published doll by slug ('selesta')", async () => {
    const doll = await getDollBySlug("selesta");
    expect(doll).not.toBeNull();
    expect(doll?.name).toBe("Селеста · Фея незабудок");
    expect(doll?.priceByn).toBe(55);
  });

  it("returns null when searching for draft slug without permission", async () => {
    const draftDoll = await getDollBySlug("chernovik-mastera");
    expect(draftDoll).toBeNull();
  });

  it("returns draft when includeDrafts is explicitly true", async () => {
    const draftDoll = await getDollBySlug("chernovik-mastera", {
      includeDrafts: true,
    });
    expect(draftDoll).not.toBeNull();
    expect(draftDoll?.id).toBe("doll-draft");
  });

  it("finds a doll by id", async () => {
    const doll = await getDollById("doll-001");
    expect(doll).not.toBeNull();
    expect(doll?.slug).toBe("selesta");
  });

  it("returns only featured dolls in getFeaturedDolls()", async () => {
    const featured = await getFeaturedDolls();
    expect(featured.length).toBeGreaterThan(0);
    for (const d of featured) {
      expect(d.isFeatured).toBe(true);
      expect(d.isDraft).toBeFalsy();
    }
  });

  it("rolls back expired reservation to 'available' status", () => {
    // 10 minutes in past
    const past = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const effectivePast = getEffectiveDollStatus({
      status: "reserved",
      reservedUntil: past,
    });
    expect(effectivePast).toBe("available");

    // 10 minutes in future
    const future = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const effectiveFuture = getEffectiveDollStatus({
      status: "reserved",
      reservedUntil: future,
    });
    expect(effectiveFuture).toBe("reserved");
  });
});
