import type { Doll, DollStatus, DollCategory } from "@/types/domain";
import { MOCK_DOLLS } from "./mock/dolls";

export interface GetDollsFilter {
  status?: DollStatus;
  category?: DollCategory;
  featured?: boolean;
  limit?: number;
  offset?: number;
  includeDrafts?: boolean;
}

/**
 * Calculates the effective real-time status of a doll.
 * If a doll is marked 'reserved', but reservedUntil has passed,
 * its effective status automatically rolls back to 'available'.
 */
export function getEffectiveDollStatus(
  doll: Pick<Doll, "status" | "reservedUntil">,
  now: Date = new Date()
): DollStatus {
  if (doll.status === "reserved" && doll.reservedUntil) {
    const expiresAt = new Date(doll.reservedUntil);
    if (expiresAt.getTime() <= now.getTime()) {
      return "available";
    }
  }
  return doll.status;
}

/**
 * Returns public or admin list of dolls from mock data repository.
 */
export async function getDolls(filter: GetDollsFilter = {}): Promise<Doll[]> {
  const {
    status,
    category,
    featured,
    limit,
    offset = 0,
    includeDrafts = false,
  } = filter;

  const now = new Date();

  let list = MOCK_DOLLS.filter((doll) => {
    // Exclude drafts unless explicitly requested (e.g. inside admin area)
    if (!includeDrafts && doll.isDraft) {
      return false;
    }

    if (category && doll.category !== category) {
      return false;
    }

    if (featured !== undefined && doll.isFeatured !== featured) {
      return false;
    }

    if (status) {
      const effectiveStatus = getEffectiveDollStatus(doll, now);
      if (effectiveStatus !== status) {
        return false;
      }
    }

    return true;
  });

  if (offset > 0) {
    list = list.slice(offset);
  }

  if (limit !== undefined && limit > 0) {
    list = list.slice(0, limit);
  }

  return list;
}

/**
 * Finds a doll by its URL slug.
 */
export async function getDollBySlug(
  slug: string,
  options: { includeDrafts?: boolean } = {}
): Promise<Doll | null> {
  const { includeDrafts = false } = options;

  const doll = MOCK_DOLLS.find((d) => d.slug === slug);
  if (!doll) return null;

  if (!includeDrafts && doll.isDraft) {
    return null;
  }

  return doll;
}

/**
 * Finds a doll by ID.
 */
export async function getDollById(
  id: string,
  options: { includeDrafts?: boolean } = {}
): Promise<Doll | null> {
  const { includeDrafts = false } = options;

  const doll = MOCK_DOLLS.find((d) => d.id === id);
  if (!doll) return null;

  if (!includeDrafts && doll.isDraft) {
    return null;
  }

  return doll;
}

/**
 * Returns featured dolls for the Hero and showcase blocks.
 */
export async function getFeaturedDolls(limit = 4): Promise<Doll[]> {
  return getDolls({ featured: true, limit });
}

/**
 * Returns dolls by status (e.g. available, reserved, sold, in_progress).
 */
export async function getDollsByStatus(status: DollStatus): Promise<Doll[]> {
  return getDolls({ status });
}
