import { Link } from "react-router-dom";
import type { MentorSearchItem } from "@/types";
import {
  formatCheapestActivePackage,
  formatLocation,
  initialsFromName,
} from "@/lib/mentorDisplay";

interface MentorCardProps {
  mentor: MentorSearchItem;
}

function StarRow({ rating }: { rating: number }) {
  const full = Math.min(5, Math.max(0, Math.round(rating)));
  return (
    <div className="flex items-center gap-0.5" aria-hidden>
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={
            i < full ? "text-amber-400" : "text-slate-200"
          }
        >
          ★
        </span>
      ))}
    </div>
  );
}

export function MentorCard({ mentor }: MentorCardProps) {
  const rating = Number(mentor.rating);
  const ratingLabel = Number.isFinite(rating) ? rating.toFixed(1) : "—";
  const initials = initialsFromName(mentor.fullName);

  return (
    <article className="group card-surface-interactive flex flex-col p-5 sm:p-6">
      <div className="flex gap-4">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-100 to-primary-50/80 text-base font-bold text-primary-800 shadow-sm ring-1 ring-inset ring-primary-100/80 transition group-hover:ring-primary-200/80"
          aria-hidden
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-lg font-bold tracking-tight text-slate-900 transition group-hover:text-primary-950">
                {mentor.fullName}
              </h3>
              {mentor.headline ? (
                <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-600">
                  {mentor.headline}
                </p>
              ) : null}
            </div>
            <Link
              to={`/mentors/${mentor.mentorId}/book`}
              className="btn-primary shrink-0 px-4 py-2.5 text-xs sm:text-sm"
            >
              Book
            </Link>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div
              className="flex items-center gap-2 rounded-xl bg-slate-50/80 px-2.5 py-1 ring-1 ring-slate-100/80"
              aria-label={
                Number.isFinite(rating)
                  ? `Rating ${ratingLabel} out of 5`
                  : "No rating"
              }
            >
              {Number.isFinite(rating) ? (
                <StarRow rating={rating} />
              ) : (
                <span className="text-slate-300">★★★★★</span>
              )}
              <span className="text-sm font-semibold tabular-nums text-slate-800">
                {ratingLabel}
              </span>
            </div>
            <span className="hidden h-4 w-px bg-slate-200 sm:block" aria-hidden />
            <div className="text-sm">
              <span className="font-medium text-slate-500">From </span>
              <span className="font-semibold tabular-nums text-slate-900">
                {formatCheapestActivePackage(mentor.pricingPackages)}
              </span>
              <span className="ml-1 text-xs font-medium text-slate-400">
                / session
              </span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
            <span
              className={
                mentor.isAvailableNow
                  ? "inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200/60"
                  : "inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200/80"
              }
            >
              {mentor.isAvailableNow
                ? "Available now"
                : mentor.nextAvailableAt
                  ? `Next ${new Date(mentor.nextAvailableAt).toLocaleString()}`
                  : "Unavailable"}
            </span>
            <span className="text-xs text-slate-500">
              {formatLocation(mentor.location)}
            </span>
          </div>

          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Sessions
              </dt>
              <dd className="mt-0.5 font-semibold text-slate-800">
                {Number.isFinite(mentor.totalSessions)
                  ? mentor.totalSessions.toLocaleString()
                  : "—"}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </article>
  );
}
