import { FormEvent, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const MOCK_PAY_MS = 900;

function formatInrFromPaise(amountPaise: number): string {
  const rupees = amountPaise / 100;
  return `₹${rupees.toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })}`;
}

/** Legacy query: whole rupees (no minor units). */
function parseRupees(raw: string | null): number {
  if (raw == null || raw.trim() === "") {
    return 499;
  }
  const n = Number.parseFloat(raw.replace(/,/g, ""));
  if (!Number.isFinite(n) || n < 0) {
    return 499;
  }
  return Math.round(n);
}

export function PaymentPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const [searchParams] = useSearchParams();
  const validId = bookingId && UUID_RE.test(bookingId);

  const amountPaise = useMemo(() => {
    const paiseRaw = searchParams.get("amountPaise");
    if (paiseRaw != null && paiseRaw.trim() !== "") {
      const n = Number.parseInt(paiseRaw, 10);
      if (Number.isFinite(n) && n >= 0) {
        return n;
      }
    }
    const rupees = parseRupees(searchParams.get("amount"));
    return rupees * 100;
  }, [searchParams]);

  const sessionStartPath = bookingId
    ? `/bookings/${bookingId}/start-session`
    : null;

  const [paying, setPaying] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handlePay(event: FormEvent) {
    event.preventDefault();
    if (paying || success) {
      return;
    }
    setPaying(true);
    await new Promise((r) => window.setTimeout(r, MOCK_PAY_MS));
    setPaying(false);
    setSuccess(true);
  }

  if (!validId) {
    return (
      <div className="mx-auto max-w-lg">
        <div className="alert-error">
          <p className="font-semibold text-rose-900">Invalid booking link.</p>
          <Link to="/" className="link-subtle mt-3 inline-block text-sm">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <div>
        <Link to="/" className="link-back">
          <span aria-hidden>←</span> Back
        </Link>
      </div>

      <section className="card-surface relative overflow-hidden p-6 sm:p-8">
        <div
          className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-primary-100/30 blur-2xl"
          aria-hidden
        />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-600">
            Checkout
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            Payment
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Complete checkout for your booking (demo — no real charge).
          </p>

          <dl className="mt-8 space-y-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-5">
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-sm text-slate-600">Booking</dt>
              <dd className="max-w-[55%] truncate font-mono text-xs text-slate-800">
                {bookingId}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 border-t border-slate-200/80 pt-4">
              <dt className="text-sm font-semibold text-slate-800">
                Total due
              </dt>
              <dd className="text-3xl font-bold tabular-nums tracking-tight text-slate-900">
                {formatInrFromPaise(amountPaise)}
              </dd>
            </div>
          </dl>

          {success ? (
            <div className="alert-success mt-8" role="status">
              <p className="font-semibold">Payment successful</p>
              <p className="mt-1 text-emerald-800/95">
                {formatInrFromPaise(amountPaise)} has been recorded (mock).
              </p>
              <p className="mt-5">
                {sessionStartPath ? (
                  <Link to={sessionStartPath} className="link-subtle text-sm">
                    Start session (enter OTP)
                  </Link>
                ) : (
                  <Link to="/" className="link-subtle text-sm">
                    Back to mentors
                  </Link>
                )}
              </p>
            </div>
          ) : (
            <form onSubmit={handlePay} className="mt-8">
              <button
                type="submit"
                disabled={paying}
                className="btn-primary w-full"
              >
                {paying
                  ? "Processing…"
                  : `Pay ${formatInrFromPaise(amountPaise)}`}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
