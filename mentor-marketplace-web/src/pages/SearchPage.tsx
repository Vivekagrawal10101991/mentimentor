import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import {
  Clock,
  Home,
  IndianRupee,
  MapPin,
  Search,
  SlidersHorizontal,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { MobileHeader } from "@/components/ui/mobile-header";
import { TrustBadge } from "@/components/ui/trust-badge";
import { ONBOARDING_CATEGORIES } from "@/constants/onboardingCategories";
import { normalizeApiError } from "@/lib/apiError";
import {
  formatLocation,
  initialsFromName,
  minActivePackagePricePaise,
} from "@/lib/mentorDisplay";
import { normalizeMentorSearchResponse } from "@/lib/normalizeMentorSearchResponse";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { endpoints, httpClient } from "@/services/api";
import type { MentorSearchItem } from "@/types";

function sanitizePin(pin: string): string {
  return pin.replace(/[\s-]+/g, "").trim();
}

function defaultSearchParams() {
  const firstCategory = ONBOARDING_CATEGORIES[0];
  const firstSubcategory = firstCategory?.subcategories[0];
  return {
    category: firstCategory?.id ?? "",
    subcategory: firstSubcategory?.id ?? "",
  };
}

type SearchMode = "online" | "offline" | "both";
type RatingFilter = null | "4" | "4.5";

export function SearchPage() {
  const allowed = useRequireAuth({ fallbackReturn: "/search" });
  const navigate = useNavigate();
  const [urlParams] = useSearchParams();
  const urlCategory = urlParams.get("category");
  const urlSubcategory = urlParams.get("subcategory");
  const initialPin = urlParams.get("pin") ?? "";

  const [searchQuery, setSearchQuery] = useState("");
  const [mode, setMode] = useState<SearchMode>("both");
  const [showFilters, setShowFilters] = useState(false);
  const [pinCode, setPinCode] = useState(initialPin);

  const [mentors, setMentors] = useState<MentorSearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>(null);

  const runSearch = useCallback(async () => {
    const defaults = defaultSearchParams();
    const matchMode = mode === "offline" ? "offline" : "online";
    const pin = sanitizePin(pinCode);

    if (mode === "offline" && !pin) {
      setMentors([]);
      setErrorMessage(null);
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    try {
      const params: Record<string, string | number> = {
        category: urlCategory ?? defaults.category,
        subcategory: urlSubcategory ?? defaults.subcategory,
        page: 1,
        pageSize: 20,
        matchMode,
      };
      if (mode === "offline") {
        params.pinCode = pin;
      }

      const { data } = await httpClient.get(endpoints.mentorsSearch, { params });
      const normalized = normalizeMentorSearchResponse(data);
      setMentors(normalized.data);
    } catch (error) {
      setMentors([]);
      setErrorMessage(normalizeApiError(error));
    } finally {
      setLoading(false);
    }
  }, [mode, pinCode, urlCategory, urlSubcategory]);

  useEffect(() => {
    void runSearch();
  }, [runSearch]);

  const filteredMentors = useMemo(() => {
    const min = minPrice.trim() === "" ? null : Number(minPrice);
    const max = maxPrice.trim() === "" ? null : Number(maxPrice);
    const minOk = min != null && Number.isFinite(min);
    const maxOk = max != null && Number.isFinite(max);

    return mentors.filter((mentor) => {
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const inName = mentor.fullName.toLowerCase().includes(q);
        const inHeadline = mentor.headline.toLowerCase().includes(q);
        const inExpertise = mentor.expertise.some((e) => {
          const sub = (e.subcategoryName ?? e.subcategoryId ?? "").toLowerCase();
          const cat = (e.categoryName ?? e.categoryId ?? "").toLowerCase();
          return sub.includes(q) || cat.includes(q);
        });
        if (!inName && !inHeadline && !inExpertise) {
          return false;
        }
      }

      const paise = minActivePackagePricePaise(mentor.pricingPackages);
      const rupees = paise != null ? paise / 100 : null;
      if (minOk && rupees != null && rupees < min!) {
        return false;
      }
      if (maxOk && rupees != null && rupees > max!) {
        return false;
      }

      if (ratingFilter === "4" && mentor.rating < 4) {
        return false;
      }
      if (ratingFilter === "4.5" && mentor.rating < 4.5) {
        return false;
      }

      return true;
    });
  }, [mentors, searchQuery, minPrice, maxPrice, ratingFilter]);

  function hourlyRupeeDisplay(mentor: MentorSearchItem): string {
    const paise = minActivePackagePricePaise(mentor.pricingPackages);
    if (paise == null) {
      return "—";
    }
    return Math.round(paise / 100).toLocaleString();
  }

  function availabilityLabel(mentor: MentorSearchItem): string {
    if (mentor.isAvailableNow) {
      return "Available now";
    }
    if (mentor.nextAvailableAt) {
      return `Next ${new Date(mentor.nextAvailableAt).toLocaleString()}`;
    }
    return "Schedule on profile";
  }

  const subjectLine = (mentor: MentorSearchItem) =>
    mentor.expertise[0]?.subcategoryName ??
    mentor.expertise[0]?.subcategoryId ??
    "Mentor";

  if (!allowed) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 pb-6">
      <MobileHeader title="Find a Mentor" showBack />

      <div className="space-y-4 px-4 py-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search subjects or mentors..."
            className="h-12 pl-11"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Filter results by keyword"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMode("both")}
            className={`h-10 flex-1 rounded-xl border-2 text-sm font-medium transition-all ${
              mode === "both"
                ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                : "border-gray-200 bg-white text-gray-600"
            }`}
          >
            Both
          </button>
          <button
            type="button"
            onClick={() => setMode("online")}
            className={`flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border-2 text-sm font-medium transition-all ${
              mode === "online"
                ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                : "border-gray-200 bg-white text-gray-600"
            }`}
          >
            <Video className="h-4 w-4" />
            Online
          </button>
          <button
            type="button"
            onClick={() => setMode("offline")}
            className={`flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border-2 text-sm font-medium transition-all ${
              mode === "offline"
                ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                : "border-gray-200 bg-white text-gray-600"
            }`}
          >
            <Home className="h-4 w-4" />
            Offline
          </button>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-gray-200 bg-white"
            aria-expanded={showFilters}
            aria-label="Toggle filters"
          >
            <SlidersHorizontal className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {mode === "offline" ? (
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              PIN / postal code
            </label>
            <Input
              placeholder="Required for offline search"
              value={pinCode}
              onChange={(e) => setPinCode(e.target.value)}
              inputMode="numeric"
              autoComplete="postal-code"
            />
          </div>
        ) : null}

        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4"
          >
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Price range (₹ / hr)
              </label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min={0}
                  placeholder="Min"
                  className="flex-1"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                />
                <span className="text-gray-400">-</span>
                <Input
                  type="number"
                  min={0}
                  placeholder="Max"
                  className="flex-1"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Experience
              </label>
              <div className="flex flex-wrap gap-2">
                <Chip label="1-2 years" />
                <Chip label="3-5 years" />
                <Chip label="5+ years" />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Rating
              </label>
              <div className="flex gap-2">
                <Chip
                  label="4+ ★"
                  selected={ratingFilter === "4"}
                  onClick={() => setRatingFilter((r) => (r === "4" ? null : "4"))}
                />
                <Chip
                  label="4.5+ ★"
                  selected={ratingFilter === "4.5"}
                  onClick={() => setRatingFilter((r) => (r === "4.5" ? null : "4.5"))}
                />
              </div>
            </div>
          </motion.div>
        )}

        {mode === "offline" && (
          <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3">
            <div className="shrink-0">
              <TrustBadge type="parent-approved" size="sm" />
            </div>
            <p className="text-sm text-blue-900">
              All offline mentors are parent-verified for your safety
            </p>
          </div>
        )}
      </div>

      <div className="flex-1 space-y-3 px-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {loading
              ? "Searching…"
              : mode === "offline" && !sanitizePin(pinCode)
                ? "Enter PIN to search offline"
                : `${filteredMentors.length} mentor${filteredMentors.length === 1 ? "" : "s"} found`}
          </p>
          <button
            type="button"
            onClick={() => navigate("/search/offline")}
            className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
          >
            <MapPin className="h-4 w-4" />
            Map view
          </button>
        </div>

        {errorMessage ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        {filteredMentors.map((mentor, index) => (
          <motion.div
            key={mentor.mentorId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            onClick={() => navigate(`/mentors/${mentor.mentorId}/book`)}
            className="cursor-pointer rounded-2xl border border-gray-200 bg-white p-4 transition-all hover:shadow-lg"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                navigate(`/mentors/${mentor.mentorId}/book`);
              }
            }}
          >
            <div className="mb-3 flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500">
                <span className="text-xl font-bold text-white">
                  {initialsFromName(mentor.fullName)}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{mentor.fullName}</h3>
                  <TrustBadge type="verified" size="sm" />
                </div>
                <p className="mb-1 text-sm text-gray-600">{subjectLine(mentor)}</p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <span className="text-yellow-500">★</span>
                    {Number.isFinite(mentor.rating) ? mentor.rating.toFixed(1) : "—"}
                    <span>({mentor.totalSessions})</span>
                  </span>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="flex items-center justify-end gap-0.5 text-lg font-bold text-gray-900">
                  <IndianRupee className="h-4 w-4" />
                  {hourlyRupeeDisplay(mentor)}
                </p>
                <p className="text-xs text-gray-500">per hour</p>
              </div>
            </div>

            <div className="mb-3 flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1.5 text-gray-600">
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="line-clamp-2">{formatLocation(mentor.location)}</span>
              </span>
            </div>

            <div className="flex items-center justify-between border-t border-gray-100 pt-3">
              <span className="flex items-center gap-1.5 text-sm text-green-600">
                <Clock className="h-4 w-4 shrink-0" />
                <span className="line-clamp-1">{availabilityLabel(mentor)}</span>
              </span>
              <Button
                size="sm"
                className="bg-indigo-600 text-white hover:bg-indigo-700"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/mentors/${mentor.mentorId}/book`);
                }}
              >
                Book now
              </Button>
            </div>
          </motion.div>
        ))}

        {!loading &&
        !errorMessage &&
        filteredMentors.length === 0 &&
        mentors.length > 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
            No mentors match your filters. Try adjusting keywords or price.
          </div>
        ) : null}

        {!loading &&
        !errorMessage &&
        !(mode === "offline" && !sanitizePin(pinCode)) &&
        filteredMentors.length === 0 &&
        mentors.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
            No mentors match this topic yet. Try another category or check back soon.
          </div>
        ) : null}
      </div>
    </div>
  );
}
