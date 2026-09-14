import { useState } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Phone, Shield } from "lucide-react";
import { normalizeApiError } from "@/lib/apiError";
import { endpoints, httpClient } from "@/services/api";
import type {
  AddParentDetailsRequest,
  ParentDetailsResponse,
  ParentOtpResponse,
  ParentOtpVerifyResponse,
  ParentSendOtpRequest,
  ParentVerifyOtpRequest,
} from "@/types";

export function ParentVerificationPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [parentAadharNumber, setParentAadharNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [parentDetails, setParentDetails] = useState<ParentDetailsResponse | null>(
    null
  );
  const [otpMeta, setOtpMeta] = useState<ParentOtpResponse | null>(null);
  const [verifyResult, setVerifyResult] = useState<ParentOtpVerifyResponse | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleStepOne() {
    if (!parentName.trim() || !parentPhone.trim() || loading) {
      return;
    }
    const a12 = parentAadharNumber.replace(/\D/g, "");
    if (a12.length !== 12) {
      setErrorMessage("Parent or guardian Aadhaar must be exactly 12 digits.");
      return;
    }
    setErrorMessage(null);
    setLoading(true);
    try {
      const payload: AddParentDetailsRequest = {
        parentName: parentName.trim(),
        parentPhone: parentPhone.trim().replace(/\D/g, ""),
        parentAadharNumber: a12,
      };
      const parentRes = await httpClient.post<ParentDetailsResponse>(
        endpoints.parentAddDetails,
        payload
      );
      setParentDetails(parentRes.data);

      const otpPayload: ParentSendOtpRequest = {
        parentDetailsId: parentRes.data.id,
      };
      const otpRes = await httpClient.post<ParentOtpResponse>(
        endpoints.parentSendOtp,
        otpPayload
      );
      setOtpMeta(otpRes.data);
      setStep(2);
    } catch (error) {
      setErrorMessage(normalizeApiError(error));
    } finally {
      setLoading(false);
    }
  }

  async function handleStepTwo() {
    if (!otpMeta?.otpRequestId || otp.length !== 4 || loading) return;
    setErrorMessage(null);
    setLoading(true);
    try {
      const payload: ParentVerifyOtpRequest = {
        otpRequestId: otpMeta.otpRequestId,
        otpCode: otp,
      };
      const { data } = await httpClient.post<ParentOtpVerifyResponse>(
        endpoints.parentVerifyOtp,
        payload
      );
      setVerifyResult(data);
      setStep(3);
    } catch (error) {
      setErrorMessage(normalizeApiError(error));
    } finally {
      setLoading(false);
    }
  }

  async function resendOtp() {
    if (!parentDetails?.id || loading) return;
    setErrorMessage(null);
    setLoading(true);
    try {
      const payload: ParentSendOtpRequest = { parentDetailsId: parentDetails.id };
      const { data } = await httpClient.post<ParentOtpResponse>(
        endpoints.parentSendOtp,
        payload
      );
      setOtpMeta(data);
    } catch (error) {
      setErrorMessage(normalizeApiError(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white px-4 py-4">
        <div className="mx-auto flex w-full max-w-md items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-lg px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
          >
            Back
          </button>
          <h1 className="text-base font-semibold text-slate-900">
            Parent Verification
          </h1>
        </div>
      </header>

      <div className="px-6 py-4">
        <div className="mx-auto flex max-w-md items-center gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                s <= step ? "bg-blue-600" : "bg-slate-200"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 px-6 pb-6">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="mx-auto max-w-md space-y-6"
        >
          {step === 1 && (
            <>
              <div className="py-8 text-center">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
                  <Shield className="h-10 w-10 text-blue-600" />
                </div>
                <h2 className="mb-2 text-2xl font-bold text-slate-900">
                  Parental Verification Required
                </h2>
                <p className="text-slate-600">
                  For users under 18, a parent or guardian must verify account
                  ownership.
                </p>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
                <h3 className="mb-3 font-semibold text-slate-900">Why this matters</h3>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                    <span>Improve learner safety for minors.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                    <span>Reduce misuse with guardian consent.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                    <span>Ensure verified participation for bookings.</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Parent/Guardian full name"
                  className="h-12 w-full rounded-xl border border-slate-300 px-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                />
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    placeholder="Parent/Guardian phone number"
                    className="h-12 w-full rounded-xl border border-slate-300 pl-11 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value.replace(/\D/g, ""))}
                  />
                </div>
                <input
                  type="text"
                  placeholder="Parent Aadhaar (12 digits)"
                  className="h-12 w-full rounded-xl border border-slate-300 px-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                  value={parentAadharNumber}
                  onChange={(e) =>
                    setParentAadharNumber(e.target.value.replace(/\D/g, "").slice(0, 12))
                  }
                  inputMode="numeric"
                />
              </div>

              <button
                type="button"
                onClick={handleStepOne}
                disabled={
                  !parentName.trim() ||
                  !parentPhone.trim() ||
                  parentAadharNumber.replace(/\D/g, "").length !== 12 ||
                  loading
                }
                className="h-12 w-full rounded-xl bg-blue-600 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Sending OTP..." : "Send OTP"}
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="py-8 text-center">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                  <Phone className="h-10 w-10 text-green-600" />
                </div>
                <h2 className="mb-2 text-2xl font-bold text-slate-900">Verify OTP</h2>
                <p className="text-slate-600">Code sent to {parentPhone}</p>
              </div>

              <input
                type="text"
                placeholder="4-digit code"
                className="h-12 w-full rounded-xl border border-slate-300 px-4 text-center text-2xl tracking-widest focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                maxLength={4}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
              />

              <button
                type="button"
                onClick={resendOtp}
                className="text-sm text-indigo-600 hover:text-indigo-700"
              >
                Resend OTP
              </button>

              <button
                type="button"
                onClick={handleStepTwo}
                disabled={otp.length !== 4 || loading}
                className="h-12 w-full rounded-xl bg-blue-600 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify"}
              </button>
            </>
          )}

          {step === 3 && (
            <div className="py-8 text-center">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-amber-100"
              >
                <CheckCircle2 className="h-12 w-12 text-amber-700" />
              </motion.div>
              <h2 className="mb-2 text-2xl font-bold text-slate-900">
                Submitted for admin review
              </h2>
              <p className="mx-auto max-w-sm text-slate-600">
                Parent phone is verified. Status:{" "}
                <span className="font-semibold text-slate-800">
                  {verifyResult?.kycStatus ?? "SUBMITTED"}
                </span>
                . Our team will confirm guardian Aadhaar details; we will notify you when
                your account is fully approved.
              </p>
              <button
                type="button"
                onClick={() => navigate("/profiles")}
                className="mt-8 h-12 w-full rounded-xl bg-blue-600 text-white transition hover:bg-blue-700"
              >
                Back to hub
              </button>
            </div>
          )}

          {errorMessage && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorMessage}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
