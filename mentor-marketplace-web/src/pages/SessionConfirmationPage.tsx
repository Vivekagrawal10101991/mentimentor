import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import { CheckCircle2, Clock, Lock, Phone, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MobileHeader } from "@/components/ui/mobile-header";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function formatTotalInr(searchParams: URLSearchParams): string {
  const paiseRaw = searchParams.get("amountPaise");
  if (paiseRaw != null && paiseRaw.trim() !== "") {
    const n = Number.parseInt(paiseRaw, 10);
    if (Number.isFinite(n) && n >= 0) {
      return `₹${(n / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    }
  }
  const rupees = searchParams.get("amount");
  if (rupees != null && rupees.trim() !== "") {
    const n = Number.parseFloat(rupees.replace(/,/g, ""));
    if (Number.isFinite(n) && n >= 0) {
      return `₹${Math.round(n).toLocaleString()}`;
    }
  }
  return "₹650";
}

function formatDurationLabel(searchParams: URLSearchParams): string {
  const mins = searchParams.get("durationMinutes");
  if (mins != null && mins.trim() !== "") {
    const n = Number.parseInt(mins, 10);
    if (Number.isFinite(n) && n > 0) {
      if (n >= 60 && n % 60 === 0) {
        const h = n / 60;
        return `${h} hour${h === 1 ? "" : "s"}`;
      }
      return `${n} min`;
    }
  }
  return "1 hour";
}

export function SessionConfirmationPage() {
  const navigate = useNavigate();
  const { bookingId } = useParams<{ bookingId: string }>();
  const [searchParams] = useSearchParams();
  const validId = bookingId && UUID_RE.test(bookingId);

  const [step, setStep] = useState(1);
  const [parentOtp, setParentOtp] = useState("");
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mentorName =
    searchParams.get("mentorName")?.trim() || "Dr. Anita Verma";
  const subject = searchParams.get("subject")?.trim() || "Chemistry";
  const dateTime =
    searchParams.get("dateTime")?.trim() || "Today, 4:00 PM";
  const mode = searchParams.get("mode")?.trim() || "Online";
  const parentMasked =
    searchParams.get("parentPhone")?.trim() || "+91 XXXXX 43210";

  const totalLabel = formatTotalInr(searchParams);
  const durationLabel = formatDurationLabel(searchParams);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current != null) {
        clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  function handleContinue() {
    if (step === 1) {
      setStep(2);
      return;
    }
    if (step === 2 && parentOtp.length === 6) {
      setStep(3);
      redirectTimerRef.current = setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    }
  }

  if (!validId) {
    return (
      <div className="flex min-h-screen flex-col bg-white px-4 py-6">
        <MobileHeader title="Confirm Session" showBack />
        <div className="mx-auto mt-8 max-w-md rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
          <p className="font-semibold text-rose-900">Invalid booking link.</p>
          <Link
            to="/dashboard"
            className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <MobileHeader title="Confirm Session" showBack />

      <div className="flex-1 px-6 py-6">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="mx-auto max-w-md"
        >
          {step === 1 ? (
            <div className="space-y-6">
              <div className="py-6 text-center">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
                <h1 className="mb-2 text-2xl font-bold text-gray-900">
                  Request Accepted!
                </h1>
                <p className="text-gray-600">
                  {mentorName} has accepted your session request
                </p>
              </div>

              <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-purple-50 p-5">
                <h3 className="mb-4 font-semibold text-gray-900">
                  Session Details
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subject</span>
                    <span className="font-medium text-gray-900">{subject}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Date &amp; Time</span>
                    <span className="font-medium text-gray-900">{dateTime}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Mode</span>
                    <span className="font-medium text-gray-900">{mode}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Duration</span>
                    <span className="font-medium text-gray-900">
                      {durationLabel}
                    </span>
                  </div>
                  <div className="my-2 h-px bg-indigo-200" />
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-900">
                      Total Amount
                    </span>
                    <span className="text-lg font-bold text-indigo-600">
                      {totalLabel}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
                <div className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-5 w-5 shrink-0 text-yellow-600" />
                  <div>
                    <p className="mb-1 font-medium text-yellow-900">
                      Parent Approval Required
                    </p>
                    <p className="text-sm text-yellow-800">
                      Since you&apos;re under 18, your parent/guardian needs to
                      approve this session
                    </p>
                  </div>
                </div>
              </div>

              <Button
                type="button"
                onClick={handleContinue}
                className="h-12 w-full bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Request Parent Approval
              </Button>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-6">
              <div className="py-6 text-center">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
                  <Shield className="h-10 w-10 text-blue-600" />
                </div>
                <h1 className="mb-2 text-2xl font-bold text-gray-900">
                  Parent Approval
                </h1>
                <p className="text-gray-600">
                  OTP sent to parent&apos;s phone number
                </p>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-5">
                <div className="mb-4 flex items-center gap-3">
                  <Phone className="h-5 w-5 text-blue-600" />
                  <span className="text-sm text-gray-700">
                    OTP sent to: {parentMasked}
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  Please ask your parent to share the OTP they received
                </p>
              </div>

              <div>
                <label
                  htmlFor="parent-otp"
                  className="mb-2 block text-sm font-medium text-gray-900"
                >
                  Enter 6-digit OTP
                </label>
                <Input
                  id="parent-otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="123456"
                  className="h-12 text-center text-2xl tracking-widest"
                  maxLength={6}
                  value={parentOtp}
                  onChange={(e) =>
                    setParentOtp(e.target.value.replace(/\D/g, ""))
                  }
                />
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Lock className="h-4 w-4 shrink-0" />
                <span>Your safety is our priority</span>
              </div>

              <Button
                type="button"
                onClick={handleContinue}
                className="h-12 w-full bg-blue-600 text-white hover:bg-blue-700"
                disabled={parentOtp.length !== 6}
              >
                Verify &amp; Confirm
              </Button>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="py-12 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5 }}
                className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-100"
              >
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </motion.div>
              <h1 className="mb-2 text-2xl font-bold text-gray-900">
                Session Confirmed! 🎉
              </h1>
              <p className="mb-6 text-gray-600">
                You&apos;ll receive a reminder 10 minutes before the session
              </p>
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
                <p className="text-sm text-indigo-900">
                  Join link will be shared 5 minutes before the session starts
                </p>
              </div>
            </div>
          ) : null}
        </motion.div>
      </div>
    </div>
  );
}
