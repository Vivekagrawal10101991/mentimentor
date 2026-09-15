import { FormEvent, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  IndianRupee,
  MapPin,
  Navigation,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { ONBOARDING_CATEGORIES } from "@/constants/onboardingCategories";
import { normalizeApiError } from "@/lib/apiError";
import { normalizeMentorSearchResponse } from "@/lib/normalizeMentorSearchResponse";
import { formatCheapestActivePackage } from "@/lib/mentorDisplay";
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

export function MapSearchPage() {
  const allowed = useRequireAuth({ fallbackReturn: "/search/offline" });
  const navigate = useNavigate();
  const [urlParams] = useSearchParams();
  const initialPin = urlParams.get("pin") ?? "";
  const [pinCode, setPinCode] = useState(initialPin);
  const [mentors, setMentors] = useState<MentorSearchItem[]>([]);
  const [selectedMentor, setSelectedMentor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selected = useMemo(
    () => mentors.find((mentor) => mentor.mentorId === selectedMentor) ?? null,
    [selectedMentor, mentors]
  );

  async function runSearch(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const pin = sanitizePin(pinCode);
    if (!pin) {
      setErrorMessage("Enter PIN or postal code to search offline mentors.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setSelectedMentor(null);
    try {
      const defaults = defaultSearchParams();
      const { data } = await httpClient.get(endpoints.mentorsSearch, {
        params: {
          category: urlParams.get("category") ?? defaults.category,
          subcategory: urlParams.get("subcategory") ?? defaults.subcategory,
          page: 1,
          pageSize: 20,
          matchMode: "offline",
          pinCode: pin,
        },
      });
      const normalized = normalizeMentorSearchResponse(data);
      setMentors(normalized.data);
      if (normalized.data.length > 0) {
        setSelectedMentor(normalized.data[0].mentorId);
      }
    } catch (error) {
      setMentors([]);
      setErrorMessage(normalizeApiError(error));
    } finally {
      setLoading(false);
    }
  }

  const mapPins = mentors.map((mentor, index) => {
    const fallback = {
      left: `${20 + ((index * 23) % 60)}%`,
      top: `${30 + ((index * 17) % 45)}%`,
    };
    if (
      typeof mentor.location.lat === "number" &&
      typeof mentor.location.lng === "number"
    ) {
      const normalizedLeft = Math.max(8, Math.min(92, (mentor.location.lng % 1) * 100));
      const normalizedTop = Math.max(12, Math.min(88, (mentor.location.lat % 1) * 100));
      return { mentor, left: `${normalizedLeft}%`, top: `${normalizedTop}%` };
    }
    return { mentor, ...fallback };
  });

  if (!allowed) {
    return null;
  }

  return (
    <div className="flex h-screen flex-col bg-slate-50">
      <form
        onSubmit={runSearch}
        className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3"
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="rounded-full p-2 transition-colors hover:bg-slate-100"
        >
          <X className="h-5 w-5 text-slate-700" />
        </button>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={pinCode}
            onChange={(e) => setPinCode(e.target.value)}
            placeholder="Search PIN / location..."
            className="h-10 w-full rounded-xl border border-slate-300 pl-11 pr-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          type="submit"
          className="rounded-full p-2 transition-colors hover:bg-slate-100"
        >
          <SlidersHorizontal className="h-5 w-5 text-slate-700" />
        </button>
      </form>

      <div className="relative flex-1 bg-slate-200">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-green-50 to-yellow-50">
          <div className="absolute inset-0 opacity-20">
            <svg width="100%" height="100%">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="gray" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          {mapPins.map(({ mentor, left, top }) => (
            <button
              key={mentor.mentorId}
              type="button"
              onClick={() => setSelectedMentor(mentor.mentorId)}
              className={`absolute flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all ${
                selectedMentor === mentor.mentorId
                  ? "z-10 scale-125 bg-indigo-600"
                  : "bg-white hover:scale-110"
              }`}
              style={{ left, top }}
            >
              {selectedMentor === mentor.mentorId ? (
                <MapPin className="h-6 w-6 fill-white text-white" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500">
                  <span className="text-sm font-bold text-white">
                    {mentor.fullName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-lg transition-colors hover:bg-slate-50"
          onClick={() => runSearch()}
        >
          <Navigation className="h-5 w-5 text-indigo-600" />
        </button>

        <div className="absolute left-4 top-4 flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-lg">
          <MapPin className="h-4 w-4 text-indigo-600" />
          <span className="text-xs font-medium text-slate-700">
            {mentors.length} mentors nearby
          </span>
        </div>
      </div>

      {selected ? (
        <div className="max-h-[40vh] rounded-t-3xl bg-white p-5 shadow-2xl">
          <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-slate-300" />
          <div className="mb-4 flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500">
              <span className="text-2xl font-bold text-white">
                {selected.fullName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <div className="mb-1 flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">{selected.fullName}</h3>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  Verified
                </span>
              </div>
              <p className="mb-2 text-slate-600">
                {selected.expertise[0] ? selected.expertise[0].subcategoryName : "Mentor"}
              </p>
              <div className="flex items-center gap-3 text-sm">
                <span className="flex items-center gap-1">
                  <span className="text-yellow-500">★</span>
                  <span className="font-medium">{selected.rating.toFixed(1)}</span>
                </span>
                <span className="text-slate-400">•</span>
                <span className="flex items-center gap-0.5 font-semibold text-slate-900">
                  <IndianRupee className="h-4 w-4" />
                  {formatCheapestActivePackage(selected.pricingPackages).replace(/[^\d]/g, "") || "0"}/hr
                </span>
              </div>
            </div>
          </div>

          <div className="mb-4 flex items-center gap-3 text-sm text-slate-600">
            <MapPin className="h-4 w-4 text-indigo-600" />
            <span>{selected.location.formattedAddress || `${selected.location.city}`}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => navigate(`/mentors/${selected.mentorId}/book`)}
              className="h-11 rounded-xl border border-indigo-300 text-sm font-medium text-indigo-700 transition hover:bg-indigo-50"
            >
              View Profile
            </button>
            <button
              type="button"
              onClick={() => navigate(`/mentors/${selected.mentorId}/book`)}
              className="h-11 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-sm font-medium text-white transition hover:from-indigo-700 hover:to-purple-700"
            >
              Book Now
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-t-3xl bg-white p-5 shadow-2xl">
          <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-slate-300" />
          <div className="py-8 text-center">
            <MapPin className="mx-auto mb-3 h-12 w-12 text-slate-300" />
            <p className="text-slate-500">
              {loading
                ? "Searching mentors..."
                : mentors.length
                  ? "Tap on a pin to view mentor details"
                  : "Search with PIN code to find offline mentors"}
            </p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="absolute bottom-24 left-4 right-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </div>
      )}
    </div>
  );
}
