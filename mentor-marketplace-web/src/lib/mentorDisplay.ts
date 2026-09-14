import type { Expertise, Location, PricingPackage } from "@/types";

/** Fallback label when API omits display names. */
export function mentorDisplayName(mentorId: string): string {
  const hex = mentorId.replace(/-/g, "");
  return `Mentor ${hex.slice(0, 8)}`;
}

/** Gross amount in paise → INR string (no /hr). */
export function formatInrPaise(amountPaise: number | null | undefined): string {
  if (amountPaise == null || Number.isNaN(Number(amountPaise))) {
    return "—";
  }
  const rupees = Number(amountPaise) / 100;
  return `₹${rupees.toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })}`;
}

export function minActivePackagePricePaise(
  packages: PricingPackage[] | undefined
): number | null {
  if (!Array.isArray(packages) || !packages.length) {
    return null;
  }
  const active = packages.filter((p) => p.isActive);
  if (active.length === 0) {
    return null;
  }
  return Math.min(...active.map((p) => p.priceAmount));
}

/** Short label for the cheapest active package (price + duration). */
export function formatCheapestActivePackage(
  packages: PricingPackage[] | undefined
): string {
  if (!Array.isArray(packages) || !packages.length) {
    return "—";
  }
  const active = packages.filter((p) => p.isActive);
  if (active.length === 0) {
    return "—";
  }
  const pkg = active.reduce((a, b) =>
    a.priceAmount <= b.priceAmount ? a : b
  );
  return `${formatInrPaise(pkg.priceAmount)} · ${pkg.durationMinutes} min`;
}

export function formatLocation(loc: Location | undefined): string {
  if (!loc) {
    return "—";
  }
  if (loc.formattedAddress?.trim()) {
    return loc.formattedAddress;
  }
  const parts = [loc.city, loc.state, loc.country].filter(Boolean);
  return parts.length ? parts.join(", ") : "—";
}

export function expertiseLine(e: Expertise): string {
  const cat = e.categoryName ?? e.categoryId;
  const sub = e.subcategoryName ?? e.subcategoryId;
  return `${cat} · ${sub}`;
}

/** Two-letter avatar initials from a display name. */
export function initialsFromName(name: string): string {
  const t = name.trim();
  if (!t) {
    return "?";
  }
  const parts = t.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const a = parts[0]?.[0];
    const b = parts[parts.length - 1]?.[0];
    if (a && b) {
      return (a + b).toUpperCase();
    }
  }
  return t.slice(0, 2).toUpperCase();
}
