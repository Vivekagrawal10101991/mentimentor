import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Award,
  Calendar,
  Home,
  IndianRupee,
  MapPin,
  MessageCircle,
  Star,
  Video,
} from "lucide-react";
import { normalizeApiError } from "@/lib/apiError";
import {
  expertiseLine,
  formatCheapestActivePackage,
  formatInrPaise,
  formatLocation,
  initialsFromName,
} from "@/lib/mentorDisplay";
import { getStoredUserId } from "@/lib/sessionUser";
import { endpoints, httpClient } from "@/services/api";
import type {
  Booking,
  BookingEnvelope,
  BookingType,
  CreateBookingRequest,
  MentorDetailData,
  MentorDetailResponse,
  SessionMode,
} from "@/types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function defaultPackageId(mentor: MentorDetailData): string | null {
  const active = mentor.pricingPackages.filter((p) => p.isActive);
  if (active.length === 0) return null;
  const cheapest = active.reduce((a, b) =>
    a.priceAmount <= b.priceAmount ? a : b
  );
  return cheapest.packageId;
}

function defaultSessionMode(mentor: MentorDetailData): SessionMode {
  return mentor.modalities[0] ?? "video";
}

function statusClass(status: string) {
  const s = status.toLowerCase();
  if (s.includes("confirm") || s.includes("complete")) {
    return "bg-emerald-100 text-emerald-700";
  }
  if (s.includes("pending")) {
    return "bg-amber-100 text-amber-700";
  }
  return "bg-slate-100 text-slate-700";
}

export function BookingPage() {
  const navigate = useNavigate();
  const { mentorId } = useParams<{ mentorId: string }>();
  const validId = mentorId && UUID_RE.test(mentorId);

  const [mentor, setMentor] = useState<MentorDetailData | null>(null);
  const [mentorLoading, setMentorLoading] = useState(true);
  const [mentorError, setMentorError] = useState<string | null>(null);

  const menteeId = getStoredUserId();

  const [scheduleLocal, setScheduleLocal] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingResult, setBookingResult] = useState<Booking | null>(null);

  const [packageId, setPackageId] = useState<string>("");
  const [sessionMode, setSessionMode] = useState<SessionMode>("video");

  const [minScheduleLocal, setMinScheduleLocal] = useState("");
  useEffect(() => {
    const pad = (n: number) => String(n).padStart(2, "0");
    const now = new Date();
    setMinScheduleLocal(
      `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`
    );
  }, []);

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
          const detail = res.data.data;
          setMentor(detail);
          const pid = defaultPackageId(detail);
          if (pid) setPackageId(pid);
          setSessionMode(defaultSessionMode(detail));
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setMentor(null);
          setMentorError(normalizeApiError(err));
        }
      })
      .finally(() => {
        if (!cancelled) setMentorLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [mentorId, validId]);

  const activePackages = useMemo(() => {
    if (!mentor) return [];
    return mentor.pricingPackages.filter((p) => p.isActive);
  }, [mentor]);

  function toInstantIso(localDatetime: string): string | null {
    if (!localDatetime.trim()) return null;
    const d = new Date(localDatetime);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString();
  }

  async function submitBooking(bookingType: BookingType) {
    if (!mentorId || !menteeId || !mentor || bookingLoading || !packageId) return;

    let scheduledStartTime: string | undefined;
    if (bookingType === "scheduled") {
      const iso = toInstantIso(scheduleLocal);
      if (!iso) {
        setBookingError("Choose a valid date and time in the future.");
        return;
      }
      if (new Date(iso) <= new Date()) {
        setBookingError("Scheduled time must be in the future.");
        return;
      }
      scheduledStartTime = iso;
    }

    setBookingError(null);
    setBookingResult(null);
    setBookingLoading(true);

    const payload: CreateBookingRequest = {
      mentorId,
      packageId,
      bookingType,
      sessionMode,
      ...(bookingType === "scheduled" && scheduledStartTime
        ? { scheduledStartTime }
        : {}),
    };

    try {
      const { data } = await httpClient.post<BookingEnvelope>(
        endpoints.bookings,
        payload,
        { headers: { "Idempotency-Key": crypto.randomUUID() } }
      );
      setBookingResult(data.data);
    } catch (err) {
      setBookingError(normalizeApiError(err));
    } finally {
      setBookingLoading(false);
    }
  }

  if (!validId) {
    return (
      <div className="mx-auto max-w-lg px-4 py-6">
        <div className="alert-error">
          <p className="font-semibold text-rose-900">Invalid mentor</p>
          <Link to="/" className="link-subtle mt-3 inline-block text-sm">
            Back to search
          </Link>
        </div>
      </div>
    );
  }

  if (mentorLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6">
        <div className="skeleton-line h-64 rounded-3xl" />
      </div>
    );
  }

  if (mentorError || !mentor) {
    return (
      <div className="mx-auto max-w-lg px-4 py-6">
        <div className="alert-error" role="alert">
          {mentorError ?? "Unable to load mentor."}
        </div>
      </div>
    );
  }

  const mentorName = mentor.fullName || "Mentor";

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white px-4 py-4">
        <div className="mx-auto flex w-full max-w-4xl items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-lg px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
          >
            Back
          </button>
          <h1 className="text-base font-semibold text-slate-900">Mentor Profile</h1>
        </div>
      </header>

      <div className="mx-auto max-w-4xl space-y-3 px-4 py-6">
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-6">
          <div className="mb-4 flex items-start gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500">
              <span className="text-3xl font-bold text-white">
                {initialsFromName(mentorName)}
              </span>
            </div>
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">{mentorName}</h2>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  Verified
                </span>
              </div>
              <p className="mb-2 text-slate-600">{mentor.headline || "Expert Mentor"}</p>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">
                  KYC
                </span>
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                  Parent Approved
                </span>
              </div>
            </div>
          </div>

          <div className="mb-4 flex items-center gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900">
                {Number.isFinite(Number(mentor.rating))
                  ? Number(mentor.rating).toFixed(1)
                  : "—"}
              </p>
              <p className="flex items-center gap-0.5 text-xs text-slate-500">
                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                Rating
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900">
                {mentor.totalSessions.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500">Sessions</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900">8+</p>
              <p className="text-xs text-slate-500">Years Exp</p>
            </div>
            <div className="ml-auto text-center">
              <p className="flex items-center text-2xl font-bold text-indigo-600">
                <IndianRupee className="h-5 w-5" />
                {formatCheapestActivePackage(mentor.pricingPackages).replace(/[^\d]/g, "") || "0"}
              </p>
              <p className="text-xs text-slate-500">per hour</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-5">
          <h3 className="mb-3 font-semibold text-slate-900">About</h3>
          <p className="text-sm leading-relaxed text-slate-700">
            {mentor.bio || "No biography shared yet."}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-5">
          <h3 className="mb-3 font-semibold text-slate-900">Subjects</h3>
          <div className="flex flex-wrap gap-2">
            {mentor.expertise?.length ? (
              mentor.expertise.map((subject, idx) => (
                <span
                  key={`${subject.categoryId}-${subject.subcategoryId}-${idx}`}
                  className="rounded-full bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700"
                >
                  {expertiseLine(subject)}
                </span>
              ))
            ) : (
              <span className="text-sm text-slate-500">No subjects listed</span>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-5">
          <h3 className="mb-3 font-semibold text-slate-900">Available For</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 rounded-xl border-2 border-indigo-200 bg-indigo-50 p-3">
              <Video className="h-5 w-5 text-indigo-600" />
              <span className="text-sm font-medium text-indigo-900">
                {mentor.modalities.includes("video") ? "Online Sessions" : "Video off"}
              </span>
            </div>
            <div className="flex items-center gap-3 rounded-xl border-2 border-indigo-200 bg-indigo-50 p-3">
              <Home className="h-5 w-5 text-indigo-600" />
              <span className="text-sm font-medium text-indigo-900">
                Mentor Place
              </span>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
            <MapPin className="h-4 w-4" />
            <span>{formatLocation(mentor.location)}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-5">
          <h3 className="mb-3 flex items-center gap-2 font-semibold text-slate-900">
            <Award className="h-5 w-5 text-purple-600" />
            Achievements
          </h3>
          <ul className="space-y-2 text-sm text-slate-700">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-green-600">✓</span>
              <span>Active mentor with completed sessions on the platform.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-green-600">✓</span>
              <span>Maintains profile availability and updated expertise.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-green-600">✓</span>
              <span>Supports secure booking and verified identity checks.</span>
            </li>
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-5">
          <h3 className="mb-3 font-semibold text-slate-900">Book options</h3>
          {!menteeId ? (
            <div className="alert-warn">
              <p className="font-semibold">Sign in to book</p>
              <p className="mt-1 text-amber-900/90">
                Log in with OTP so we can create a booking on your account.
              </p>
              <Link to="/login" className="link-subtle mt-4 inline-block text-sm">
                Go to login
              </Link>
            </div>
          ) : activePackages.length === 0 ? (
            <p className="alert-error text-rose-800">
              This mentor has no active pricing packages right now.
            </p>
          ) : (
            <div className="space-y-3">
              <select
                value={packageId}
                onChange={(e) => setPackageId(e.target.value)}
                className="select-modern"
              >
                {activePackages.map((p) => (
                  <option key={p.packageId} value={p.packageId}>
                    {formatInrPaise(p.priceAmount)} · {p.durationMinutes} min
                  </option>
                ))}
              </select>
              <select
                value={sessionMode}
                onChange={(e) => setSessionMode(e.target.value as SessionMode)}
                className="select-modern"
              >
                {mentor.modalities.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <input
                type="datetime-local"
                value={scheduleLocal}
                min={minScheduleLocal || undefined}
                onChange={(e) => setScheduleLocal(e.target.value)}
                className="input-datetime-modern"
              />
              <button
                type="button"
                onClick={() => submitBooking("scheduled")}
                disabled={bookingLoading || !packageId}
                className="w-full rounded-xl border border-slate-300 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {bookingLoading ? "Booking..." : "Schedule for Later"}
              </button>
            </div>
          )}

          {bookingError && (
            <p className="alert-error mt-4" role="alert">
              {bookingError}
            </p>
          )}
          {bookingResult && (
            <div className="mt-4 space-y-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              <p className="font-semibold">Booking created</p>
              <p className="font-mono text-xs">
                {bookingResult.bookingId} · {bookingResult.bookingType} ·{" "}
                <span className={`rounded-full px-2 py-0.5 ${statusClass(bookingResult.status)}`}>
                  {bookingResult.status}
                </span>
              </p>
              <p>
                Payable: {formatInrPaise(bookingResult.pricing.payableAmount)}{" "}
                {bookingResult.pricing.currency}
              </p>
              <p className="flex flex-wrap gap-x-5 gap-y-2 pt-2">
                <Link
                  to={`/bookings/${bookingResult.bookingId}/payment?amountPaise=${encodeURIComponent(String(bookingResult.pricing.payableAmount))}`}
                  className="link-subtle text-sm"
                >
                  Pay for session
                </Link>
                <Link
                  to={`/bookings/${bookingResult.bookingId}/start-session`}
                  className="link-subtle text-sm"
                >
                  Start session
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white p-4 shadow-lg">
        <div className="mx-auto flex max-w-4xl gap-3">
          <button
            type="button"
            className="flex h-12 flex-1 items-center justify-center rounded-xl border border-indigo-300 text-slate-700 transition hover:bg-slate-50"
            onClick={() => navigate("/profiles")}
          >
            <MessageCircle className="mr-2 h-5 w-5" />
            Message
          </button>
          <button
            type="button"
            onClick={() => submitBooking("instant")}
            disabled={bookingLoading || !packageId || !menteeId}
            className="flex h-12 flex-1 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white transition hover:from-indigo-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Calendar className="mr-2 h-5 w-5" />
            {bookingLoading ? "Booking..." : "Book Session"}
          </button>
        </div>
      </div>
    </div>
  );
}
