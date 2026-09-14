import { mentorDisplayName } from "@/lib/mentorDisplay";
import type {
  Expertise,
  Location,
  MentorSearchItem,
  MentorSearchResponse,
  Pagination,
  PricingPackage,
} from "@/types";

function paginationFromRoot(
  raw: Record<string, unknown>,
  dataLen: number
): Pagination {
  const page = typeof raw.page === "number" ? raw.page : 1;
  const pageSize =
    typeof raw.pageSize === "number"
      ? raw.pageSize
      : Math.max(1, dataLen || 1);
  const total = typeof raw.total === "number" ? raw.total : dataLen;
  const totalPages =
    pageSize > 0 ? Math.max(1, Math.ceil(total / pageSize)) : 1;
  return { page, pageSize, total, totalPages };
}

function mapExpertise(raw: unknown): Expertise[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.map((e) => {
    const row = e as Record<string, unknown>;
    const cat = String(row.category ?? row.categoryId ?? "");
    const sub = String(row.subcategory ?? row.subcategoryId ?? "");
    return {
      categoryId: cat,
      subcategoryId: sub,
      language: typeof row.language === "string" ? row.language : "en",
      categoryName: typeof row.categoryName === "string" ? row.categoryName : cat,
      subcategoryName:
        typeof row.subcategoryName === "string" ? row.subcategoryName : sub,
    };
  });
}

function mapLocation(raw: unknown): Location {
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    return {
      city: typeof o.city === "string" ? o.city : "—",
      state: typeof o.state === "string" ? o.state : undefined,
      country: typeof o.country === "string" ? o.country : "—",
      lat: typeof o.lat === "number" ? o.lat : undefined,
      lng: typeof o.lng === "number" ? o.lng : undefined,
      formattedAddress:
        typeof o.formattedAddress === "string" ? o.formattedAddress : undefined,
    };
  }
  return { city: "—", country: "—" };
}

function mapPricingFromHourly(
  mentorId: string,
  hourlyRate: unknown
): PricingPackage[] {
  const hr = Number(hourlyRate);
  if (!Number.isFinite(hr) || hr <= 0) {
    return [];
  }
  const pricePaise = Math.round(hr * 100);
  return [
    {
      packageId: `${mentorId}-hourly`,
      durationMinutes: 60,
      priceAmount: pricePaise,
      currency: "INR",
      isActive: true,
    },
  ];
}

function mapSearchItem(raw: Record<string, unknown>): MentorSearchItem {
  const mentorId = String(raw.mentorId ?? "");
  const hourlyRate = raw.hourlyRate;
  const approx =
    typeof raw.approximateLocation === "string"
      ? raw.approximateLocation.trim()
      : "";
  const packagesRaw = raw.pricingPackages;
  const pricingPackages: PricingPackage[] = Array.isArray(packagesRaw)
    ? (packagesRaw as PricingPackage[])
    : mapPricingFromHourly(mentorId, hourlyRate);

  const fullName =
    typeof raw.fullName === "string" && raw.fullName.trim()
      ? raw.fullName
      : mentorDisplayName(mentorId);

  const location = mapLocation(raw.location);
  if (approx) {
    location.formattedAddress = approx;
  }

  return {
    mentorId,
    fullName,
    headline: typeof raw.headline === "string" ? raw.headline : "",
    rating: Number(raw.rating) || 0,
    totalSessions:
      typeof raw.totalSessions === "number" ? raw.totalSessions : 0,
    expertise: mapExpertise(raw.expertise),
    pricingPackages,
    isAvailableNow: Boolean(raw.isAvailableNow ?? raw.available),
    nextAvailableAt:
      typeof raw.nextAvailableAt === "string"
        ? raw.nextAvailableAt
        : undefined,
    location,
  };
}

/** Accepts both OpenAPI-shaped responses and the Java API's flat pagination. */
export function normalizeMentorSearchResponse(
  raw: unknown
): MentorSearchResponse {
  if (!raw || typeof raw !== "object") {
    return {
      data: [],
      pagination: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
    };
  }

  const root = raw as Record<string, unknown>;
  let rows: unknown = root.data;
  if (!Array.isArray(rows) && root.data && typeof root.data === "object") {
    const inner = root.data as Record<string, unknown>;
    rows = inner.items ?? inner.mentors ?? [];
  }
  const data: MentorSearchItem[] = Array.isArray(rows)
    ? rows.map((item) =>
        mapSearchItem(
          item && typeof item === "object"
            ? (item as Record<string, unknown>)
            : {}
        )
      )
    : [];

  const nestedPagination = root.pagination;
  if (nestedPagination && typeof nestedPagination === "object") {
    const p = nestedPagination as Record<string, unknown>;
    const page = typeof p.page === "number" ? p.page : 1;
    const pageSize = typeof p.pageSize === "number" ? p.pageSize : 20;
    const total = typeof p.total === "number" ? p.total : data.length;
    const totalPages =
      typeof p.totalPages === "number"
        ? p.totalPages
        : pageSize > 0
          ? Math.max(1, Math.ceil(total / pageSize))
          : 1;
    return { data, pagination: { page, pageSize, total, totalPages } };
  }

  return {
    data,
    pagination: paginationFromRoot(root, data.length),
  };
}
