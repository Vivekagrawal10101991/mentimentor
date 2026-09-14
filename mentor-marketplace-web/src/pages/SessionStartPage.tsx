import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { formatElapsed } from "@/lib/formatElapsed";
import { normalizeApiError } from "@/lib/apiError";
import { endpoints, httpClient } from "@/services/api";
import type {
  SessionActorRole,
  SessionStartEnvelope,
  StartSessionOtpRequest,
} from "@/types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function SessionStartPage() {
  const { bookingId } = useParams<{ bookingId: string }>();

  const validId = useMemo(
    () => Boolean(bookingId && UUID_RE.test(bookingId)),
    [bookingId]
  );

  const [otp, setOtp] = useState("");
  const [actorRole, setActorRole] = useState<SessionActorRole>("mentee");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [sessionStartIso, setSessionStartIso] = useState<string | null>(null);
  const [nowTick, setNowTick] = useState(() => Date.now());

  const isOtpValid = /^[0-9]{4,8}$/.test(otp);

  useEffect(() => {
    if (!sessionStartIso) {
      return;
    }
    const id = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [sessionStartIso]);

  const elapsedMs = useMemo(() => {
    if (!sessionStartIso) {
      return 0;
    }
    const t = new Date(sessionStartIso).getTime();
    if (Number.isNaN(t)) {
      return 0;
    }
    return Math.max(0, nowTick - t);
  }, [sessionStartIso, nowTick]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validId || !bookingId || !isOtpValid || submitLoading) {
      return;
    }

    setErrorMessage(null);
    setSubmitLoading(true);

    const payload: StartSessionOtpRequest = {
      otpCode: otp,
      actorRole,
    };

    try {
      const { data } = await httpClient.post<SessionStartEnvelope>(
        endpoints.bookingSessionStartOtp(bookingId),
        payload
      );
      const startedAt = data.data.startedAt;
      if (startedAt) {
        setSessionStartIso(startedAt);
      } else if (data.data.sessionStarted) {
        setSessionStartIso(new Date().toISOString());
      }
    } catch (err) {
      setErrorMessage(normalizeApiError(err));
    } finally {
      setSubmitLoading(false);
    }
  }

  if (!validId) {
    return (
      <div className="mx-auto max-w-md">
        <div className="alert-error">
          <p className="font-semibold text-rose-900">Invalid booking link</p>
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

      {!sessionStartIso ? (
        <div className="card-surface relative overflow-hidden p-6 sm:p-8">
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-primary-100/35 blur-3xl"
            aria-hidden
          />
          <div className="relative">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Start session
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Enter the session OTP. The timer begins once the session is
              confirmed.
            </p>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label
                  htmlFor="actor-role"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-500"
                >
                  You are
                </label>
                <select
                  id="actor-role"
                  value={actorRole}
                  onChange={(e) =>
                    setActorRole(e.target.value as SessionActorRole)
                  }
                  className="select-modern"
                >
                  <option value="mentee">Mentee</option>
                  <option value="mentor">Mentor</option>
                </select>
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="session-otp"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-500"
                >
                  Session OTP
                </label>
                <input
                  id="session-otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 8))
                  }
                  className="input-modern text-center font-mono text-2xl tracking-[0.35em] sm:text-3xl sm:tracking-[0.4em]"
                  placeholder="••••"
                  maxLength={8}
                />
                {otp.length > 0 && !isOtpValid && (
                  <p className="text-xs text-rose-600">Enter 4–8 digits.</p>
                )}
              </div>
              <button
                type="submit"
                disabled={!isOtpValid || submitLoading}
                className="btn-primary w-full"
              >
                {submitLoading ? "Starting…" : "Start session"}
              </button>
              {errorMessage && (
                <p className="alert-error text-sm" role="alert">
                  {errorMessage}
                </p>
              )}
            </form>
          </div>
        </div>
      ) : (
        <div className="card-surface relative overflow-hidden px-5 py-14 text-center sm:px-12 sm:py-20">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(99,102,241,0.12),transparent_55%)]"
            aria-hidden
          />
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Session live
            </p>
            <p
              className="mt-6 font-mono text-5xl font-bold tabular-nums tracking-tight text-slate-900 sm:text-6xl sm:leading-none"
              aria-live="polite"
            >
              {formatElapsed(elapsedMs)}
            </p>
            <p className="mt-3 text-sm font-medium text-slate-500">
              Elapsed time
            </p>
            <p className="mx-auto mt-8 max-w-xs text-xs leading-relaxed text-slate-500">
              End the call in your video tool when you&apos;re done. This screen
              only tracks elapsed time.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
