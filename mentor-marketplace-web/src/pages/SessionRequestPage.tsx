import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Calendar,
  Clock,
  Home,
  IndianRupee,
  MapPin,
  Shield,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileHeader } from "@/components/ui/mobile-header";
import { Textarea } from "@/components/ui/textarea";
import { TrustBadge } from "@/components/ui/trust-badge";
import { normalizeApiError } from "@/lib/apiError";
import {
  expertiseLine,
  formatLocation,
  initialsFromName,
  minActivePackagePricePaise,
} from "@/lib/mentorDisplay";
import { endpoints, httpClient } from "@/services/api";
import type { MentorDetailData, MentorDetailResponse } from "@/types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Placeholder booking id for the demo confirmation flow after “Send request”. */
const DEMO_CONFIRM_BOOKING_ID = "00000000-0000-4000-8000-000000000002";

const PLATFORM_FEE_RUPEES = 50;

function formatDateTimeLabel(date: string, time: string): string {
  if (!date || !time) {
    return "";
  }
  const d = new Date(`${date}T${time}`);
  if (Number.isNaN(d.getTime())) {
    return `${date} · ${time}`;
  }
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function cheapestActivePackage(mentor: MentorDetailData) {
  const active = mentor.pricingPackages.filter((p) => p.isActive);
  if (active.length === 0) {
    return null;
  }
  return active.reduce((a, b) => (a.priceAmount <= b.priceAmount ? a : b));
}

export function SessionRequestPage() {
  const navigate = useNavigate();
  const { mentorId } = useParams<{ mentorId: string }>();
  const validId = mentorId && UUID_RE.test(mentorId);

  const [mentor, setMentor] = useState<MentorDetailData | null>(null);
  const [mentorLoading, setMentorLoading] = useState(true);
  const [mentorError, setMentorError] = useState<string | null>(null);

  const [mode, setMode] = useState<"online" | "offline" | "">("");
  const [offlineType, setOfflineType] = useState<"mentor" | "student" | "">("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [topic, setTopic] = useState("");

  useEffect(() => {
    if (!validId || !mentorId) {
      setMentorLoading(false);
      setMentorError("Invalid mentor link.");
      return;
    }

    let cancelled = false;
    setMentorLoading(true);
    setMentorError(null);

    httpClient
      .get<MentorDetailResponse>(endpoints.mentorById(mentorId))
      .then((res) => {
        if (!cancelled) {
          setMentor(res.data.data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setMentor(null);
          setMentorError(normalizeApiError(err));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setMentorLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [mentorId, validId]);

  const pkg = mentor ? cheapestActivePackage(mentor) : null;
  const sessionPriceRupees = pkg != null ? Math.round(pkg.priceAmount / 100) : null;
  const durationLabel = useMemo(() => {
    if (!pkg) {
      return "1 hour";
    }
    const m = pkg.durationMinutes;
    if (m >= 60 && m % 60 === 0) {
      const h = m / 60;
      return `${h} hour${h === 1 ? "" : "s"}`;
    }
    return `${m} min`;
  }, [pkg]);

  const totalRupees =
    sessionPriceRupees != null ? sessionPriceRupees + PLATFORM_FEE_RUPEES : null;

  const subjectLine = mentor?.expertise?.length
    ? expertiseLine(mentor.expertise[0])
    : "Mentor";

  const hourlyDisplay = useMemo(() => {
    if (!mentor) {
      return "—";
    }
    if (mentor.recommendedHourlyRate != null) {
      return Math.round(Number(mentor.recommendedHourlyRate)).toLocaleString();
    }
    const paise = minActivePackagePricePaise(mentor.pricingPackages);
    if (paise == null) {
      return "—";
    }
    return Math.round(paise / 100).toLocaleString();
  }, [mentor]);

  const mentorPlaceLine = mentor
    ? formatLocation(mentor.location)
    : "Location shared after booking";

  function handleSubmit() {
    if (!mentor || !mode || !date || !time || !topic.trim()) {
      return;
    }
    if (mode === "offline" && !offlineType) {
      return;
    }

    const dateTime = formatDateTimeLabel(date, time);
    const params = new URLSearchParams();
    params.set("mentorName", mentor.fullName || "Mentor");
    params.set("subject", topic.trim());
    if (dateTime) {
      params.set("dateTime", dateTime);
    }
    params.set("mode", mode === "online" ? "Online" : "Offline");
    if (pkg) {
      params.set("durationMinutes", String(pkg.durationMinutes));
    }
    if (totalRupees != null) {
      params.set("amount", String(totalRupees));
    }

    navigate({
      pathname: `/bookings/${DEMO_CONFIRM_BOOKING_ID}/confirm`,
      search: params.toString(),
    });
  }

  const canSubmit =
    Boolean(mode) &&
    Boolean(date) &&
    Boolean(time) &&
    topic.trim().length > 0 &&
    (mode === "online" || Boolean(offlineType)) &&
    mentor != null;

  if (!validId) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <MobileHeader title="Request Session" showBack />
        <div className="px-4 py-6">
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
            <p className="font-semibold text-rose-900">Invalid mentor</p>
            <Link
              to="/search"
              className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              Back to search
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (mentorLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <MobileHeader title="Request Session" showBack />
        <div className="px-4 py-6">
          <div className="h-48 animate-pulse rounded-2xl bg-gray-200" />
        </div>
      </div>
    );
  }

  if (mentorError || !mentor) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <MobileHeader title="Request Session" showBack />
        <div className="px-4 py-6">
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
            {mentorError ?? "Unable to load mentor."}
          </div>
        </div>
      </div>
    );
  }

  const mentorName = mentor.fullName || "Mentor";

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 pb-24">
      <MobileHeader title="Request Session" showBack />

      <div className="flex-1 space-y-6 px-4 py-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500">
              <span className="text-lg font-bold text-white">
                {initialsFromName(mentorName)}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-gray-900">{mentorName}</h3>
                <TrustBadge type="verified" size="sm" />
              </div>
              <p className="text-sm text-gray-600">{subjectLine}</p>
              {mentor.whyThisMentor ? (
                <p className="mt-2 text-xs leading-relaxed text-[#243B8F]">
                  Why this mentor: {mentor.whyThisMentor}
                </p>
              ) : null}
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#626262]">
                Recommended
              </p>
              <p className="flex items-center justify-end gap-0.5 font-bold text-gray-900">
                <IndianRupee className="h-4 w-4" />
                {hourlyDisplay}
              </p>
              <p className="text-xs text-gray-500">/hour</p>
            </div>
          </div>
        </div>

        <div>
          <label className="mb-3 block text-sm font-medium text-gray-900">
            Session Mode *
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setMode("online");
                setOfflineType("");
              }}
              className={`rounded-2xl border-2 p-4 transition-all ${
                mode === "online"
                  ? "border-indigo-600 bg-indigo-50"
                  : "border-gray-200 bg-white"
              }`}
            >
              <Video
                className={`mx-auto mb-2 h-6 w-6 ${
                  mode === "online" ? "text-indigo-600" : "text-gray-400"
                }`}
              />
              <p
                className={`text-sm font-medium ${
                  mode === "online" ? "text-indigo-900" : "text-gray-700"
                }`}
              >
                Online
              </p>
              <p className="text-xs text-gray-500">Video call</p>
            </button>
            <button
              type="button"
              onClick={() => setMode("offline")}
              className={`rounded-2xl border-2 p-4 transition-all ${
                mode === "offline"
                  ? "border-indigo-600 bg-indigo-50"
                  : "border-gray-200 bg-white"
              }`}
            >
              <Home
                className={`mx-auto mb-2 h-6 w-6 ${
                  mode === "offline" ? "text-indigo-600" : "text-gray-400"
                }`}
              />
              <p
                className={`text-sm font-medium ${
                  mode === "offline" ? "text-indigo-900" : "text-gray-700"
                }`}
              >
                Offline
              </p>
              <p className="text-xs text-gray-500">In person</p>
            </button>
          </div>
        </div>

        {mode === "offline" ? (
          <div>
            <label className="mb-3 block text-sm font-medium text-gray-900">
              Where? *
            </label>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setOfflineType("mentor")}
                className={`w-full rounded-2xl border-2 p-4 text-left transition-all ${
                  offlineType === "mentor"
                    ? "border-indigo-600 bg-indigo-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
                  <div>
                    <p className="mb-1 font-medium text-gray-900">
                      At Mentor&apos;s Place
                    </p>
                    <p className="text-sm text-gray-600">{mentorPlaceLine}</p>
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setOfflineType("student")}
                className={`w-full rounded-2xl border-2 p-4 text-left transition-all ${
                  offlineType === "student"
                    ? "border-indigo-600 bg-indigo-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                <div className="flex items-start gap-3">
                  <Home className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
                  <div>
                    <p className="mb-1 font-medium text-gray-900">
                      Invite to Your Place
                    </p>
                    <p className="text-sm text-gray-600">
                      Mentor will come to your location
                    </p>
                  </div>
                </div>
              </button>
            </div>

            <div className="mt-3 flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3">
              <Shield className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
              <div>
                <p className="mb-1 text-sm font-medium text-blue-900">
                  Safety First
                </p>
                <p className="text-xs text-blue-800">
                  Phone numbers are masked. Address shared only after confirmation.
                  Parent approval required for minors.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-900">
              Date *
            </label>
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                className="h-11 w-full rounded-xl border border-gray-300 pl-11 pr-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-900">
              Time *
            </label>
            <div className="relative">
              <Clock className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="time"
                className="h-11 w-full rounded-xl border border-gray-300 pl-11 pr-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-900">
            What do you want to learn? *
          </label>
          <Textarea
            placeholder="E.g., Organic Chemistry - Reaction Mechanisms, JEE preparation..."
            className="min-h-24"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
        </div>

        <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
          <h3 className="mb-3 font-semibold text-gray-900">Session Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Duration</span>
              <span className="font-medium text-gray-900">{durationLabel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Price</span>
              <span className="font-medium text-gray-900">
                {sessionPriceRupees != null
                  ? `₹${sessionPriceRupees.toLocaleString()}`
                  : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Platform Fee</span>
              <span className="font-medium text-gray-900">
                ₹{PLATFORM_FEE_RUPEES.toLocaleString()}
              </span>
            </div>
            <div className="my-2 h-px bg-indigo-200" />
            <div className="flex justify-between text-base">
              <span className="font-semibold text-gray-900">Total</span>
              <span className="font-bold text-indigo-600">
                {totalRupees != null
                  ? `₹${totalRupees.toLocaleString()}`
                  : "—"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white p-4 shadow-lg">
        <Button
          type="button"
          onClick={handleSubmit}
          className="h-12 w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700"
          disabled={!canSubmit}
        >
          Send Request
        </Button>
      </div>
    </div>
  );
}
