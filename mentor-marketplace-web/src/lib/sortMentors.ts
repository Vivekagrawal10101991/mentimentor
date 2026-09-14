import type { MentorSearchItem } from "@/types";
import { minActivePackagePricePaise } from "@/lib/mentorDisplay";

export type MentorSortOption =
  | "recommended"
  | "rating_desc"
  | "price_asc"
  | "price_desc"
  | "sessions_desc"
  | "availability_first";

function numRating(m: MentorSearchItem): number {
  const n = Number(m.rating);
  return Number.isFinite(n) ? n : 0;
}

function numPricePaise(m: MentorSearchItem): number {
  const p = minActivePackagePricePaise(m.pricingPackages);
  if (p == null) {
    return Number.POSITIVE_INFINITY;
  }
  return p;
}

function numSessions(m: MentorSearchItem): number {
  const n = Number(m.totalSessions);
  return Number.isFinite(n) ? n : 0;
}

export function sortMentors(
  items: MentorSearchItem[] | null | undefined,
  sortBy: MentorSortOption
): MentorSearchItem[] {
  const list = Array.isArray(items) ? items : [];
  if (sortBy === "recommended") {
    return [...list];
  }

  const copy = [...list];

  copy.sort((a, b) => {
    switch (sortBy) {
      case "rating_desc": {
        const cmp = numRating(b) - numRating(a);
        if (cmp !== 0) {
          return cmp;
        }
        return numPricePaise(a) - numPricePaise(b);
      }
      case "price_asc": {
        const pa = numPricePaise(a);
        const pb = numPricePaise(b);
        const aMissing = minActivePackagePricePaise(a.pricingPackages) == null;
        const bMissing = minActivePackagePricePaise(b.pricingPackages) == null;
        if (aMissing !== bMissing) {
          return aMissing ? 1 : -1;
        }
        const cmp = pa - pb;
        if (cmp !== 0) {
          return cmp;
        }
        return numRating(b) - numRating(a);
      }
      case "price_desc": {
        const pa = numPricePaise(a);
        const pb = numPricePaise(b);
        const aMissing = minActivePackagePricePaise(a.pricingPackages) == null;
        const bMissing = minActivePackagePricePaise(b.pricingPackages) == null;
        if (aMissing !== bMissing) {
          return aMissing ? 1 : -1;
        }
        const cmp = pb - pa;
        if (cmp !== 0) {
          return cmp;
        }
        return numRating(b) - numRating(a);
      }
      case "sessions_desc": {
        const cmp = numSessions(b) - numSessions(a);
        if (cmp !== 0) {
          return cmp;
        }
        return numRating(b) - numRating(a);
      }
      case "availability_first": {
        if (a.isAvailableNow !== b.isAvailableNow) {
          return a.isAvailableNow ? -1 : 1;
        }
        const cmp = numRating(b) - numRating(a);
        if (cmp !== 0) {
          return cmp;
        }
        return numPricePaise(a) - numPricePaise(b);
      }
      default:
        return 0;
    }
  });

  return copy;
}
