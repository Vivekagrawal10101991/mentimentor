import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Heart, Lock, Shield } from "lucide-react";
import { normalizeApiError } from "@/lib/apiError";
import { getStoredAccessToken } from "@/lib/sessionUser";
import { endpoints, httpClient } from "@/services/api";
import { safeInternalPath } from "@/lib/safeInternalPath";
import type {
  AddParentDetailsRequest,
  ParentDetailsResponse,
  ParentOtpResponse,
  UserProfile,
  UserProfileEnvelope,
  UpdateUserProfileRequest,
} from "@/types";

function TrustPreamble() {
  return (
    <div className="mb-8 space-y-4 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5 text-sm text-slate-700">
      <div className="flex items-start gap-3">
        <Shield className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" aria-hidden />
        <p>
          We ask for your age and identity details only to keep MentorHub safe—especially
          for younger learners. Verifying age helps us apply the right protections and
          parental oversight where the law and our community standards require it.
        </p>
      </div>
      <div className="flex items-start gap-3">
        <Lock className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" aria-hidden />
        <p>
          Your Aadhaar reference is reviewed by trained admins in a controlled process.
          We treat identity data as highly sensitive: access is limited, audited where
          possible, and we never use it for marketing.
        </p>
      </div>
      <div className="flex items-start gap-3">
        <Heart className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" aria-hidden />
        <p>
          If you are under 18, a parent or guardian completes verification so we know a
          responsible adult is aware of your learning journey. Thank you for helping us
          build a trustworthy space for everyone.
        </p>
      </div>
    </div>
  );
}

export function AccountVerificationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const [ageInput, setAgeInput] = useState("");
  const [savingAge, setSavingAge] = useState(false);

  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [parentAadhar, setParentAadhar] = useState("");
  const [otpMeta, setOtpMeta] = useState<ParentOtpResponse | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [parentBusy, setParentBusy] = useState(false);

  const [adultAadhar, setAdultAadhar] = useState("");
  const [savingAdult, setSavingAdult] = useState(false);

  const loadProfile = useCallback(async () => {
    const { data } = await httpClient.get<UserProfileEnvelope>(endpoints.usersMe);
    setProfile(data.data);
  }, []);

  useEffect(() => {
    if (!getStoredAccessToken()) {
      navigate("/login", { replace: true });
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErrorMessage(null);
      try {
        await loadProfile();
      } catch (e) {
        if (!cancelled) {
          setErrorMessage(normalizeApiError(e));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadProfile, navigate]);

  useEffect(() => {
    if (!profile) {
      return;
    }
    if (profile.accountVerificationComplete) {
      const next = safeInternalPath(searchParams.get("next"));
      navigate(next ?? "/profiles", { replace: true });
    }
  }, [profile, navigate, searchParams]);

  async function submitAge(event: FormEvent) {
    event.preventDefault();
    const n = Number.parseInt(ageInput, 10);
    if (Number.isNaN(n) || n < 1 || n > 120) {
      setErrorMessage("Please enter a valid age between 1 and 120.");
      return;
    }
    setSavingAge(true);
    setErrorMessage(null);
    try {
      const body: UpdateUserProfileRequest = { age: n };
      const { data } = await httpClient.patch<UserProfileEnvelope>(
        endpoints.usersMe,
        body
      );
      setProfile(data.data);
      setAgeInput("");
    } catch (e) {
      setErrorMessage(normalizeApiError(e));
    } finally {
      setSavingAge(false);
    }
  }

  async function submitParentDetails(event: FormEvent) {
    event.preventDefault();
    if (!parentName.trim() || !parentPhone.trim() || parentAadhar.length !== 12) {
      setErrorMessage(
        "Please enter parent or guardian name, phone, and a 12-digit Aadhaar number."
      );
      return;
    }
    setParentBusy(true);
    setErrorMessage(null);
    try {
      const payload: AddParentDetailsRequest = {
        parentName: parentName.trim(),
        parentPhone: parentPhone.trim().replace(/\D/g, ""),
        parentAadharNumber: parentAadhar.replace(/\D/g, ""),
      };
      const parentRes = await httpClient.post<ParentDetailsResponse>(
        endpoints.parentAddDetails,
        payload
      );
      const otpRes = await httpClient.post<ParentOtpResponse>(
        endpoints.parentSendOtp,
        { parentDetailsId: parentRes.data.id }
      );
      setOtpMeta(otpRes.data);
    } catch (e) {
      setErrorMessage(normalizeApiError(e));
    } finally {
      setParentBusy(false);
    }
  }

  async function resendParentOtp() {
    const id = profile?.parentDetailsId;
    if (!id) {
      return;
    }
    setParentBusy(true);
    setErrorMessage(null);
    try {
      const otpRes = await httpClient.post<ParentOtpResponse>(
        endpoints.parentSendOtp,
        { parentDetailsId: id }
      );
      setOtpMeta(otpRes.data);
    } catch (e) {
      setErrorMessage(normalizeApiError(e));
    } finally {
      setParentBusy(false);
    }
  }

  async function verifyParentOtp(event: FormEvent) {
    event.preventDefault();
    if (!otpMeta?.otpRequestId || otpCode.length < 4) {
      return;
    }
    setParentBusy(true);
    setErrorMessage(null);
    try {
      await httpClient.post(endpoints.parentVerifyOtp, {
        otpRequestId: otpMeta.otpRequestId,
        otpCode,
      });
      await loadProfile();
      setOtpMeta(null);
      setOtpCode("");
    } catch (e) {
      setErrorMessage(normalizeApiError(e));
    } finally {
      setParentBusy(false);
    }
  }

  async function submitAdultAadhar(event: FormEvent) {
    event.preventDefault();
    if (adultAadhar.replace(/\D/g, "").length !== 12) {
      setErrorMessage("Aadhaar must be exactly 12 digits.");
      return;
    }
    if (profile?.age == null || profile.age < 18) {
      setErrorMessage("Confirm you are 18 or older before submitting your Aadhaar.");
      return;
    }
    setSavingAdult(true);
    setErrorMessage(null);
    try {
      const body: UpdateUserProfileRequest = {
        aadharReference: adultAadhar.replace(/\D/g, ""),
      };
      const { data } = await httpClient.patch<UserProfileEnvelope>(
        endpoints.usersMe,
        body
      );
      setProfile(data.data);
      setAdultAadhar("");
    } catch (e) {
      setErrorMessage(normalizeApiError(e));
    } finally {
      setSavingAdult(false);
    }
  }

  if (loading || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50 px-4">
        <p className="text-slate-600">Loading your account…</p>
      </div>
    );
  }

  const minor = profile.isMinor === true;
  const parentStatus = profile.parentKycStatus;
  const selfStatus = profile.selfKycStatus;

  const showParentIntakeForm =
    minor &&
    !otpMeta &&
    parentStatus !== "SUBMITTED" &&
    parentStatus !== "VERIFIED" &&
    !(parentStatus === "PENDING" && profile.parentDetailsId);

  const showOtpStep =
    minor &&
    parentStatus !== "SUBMITTED" &&
    parentStatus !== "VERIFIED" &&
    (otpMeta || (parentStatus === "PENDING" && !!profile.parentDetailsId));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 px-4 py-10">
      <div className="mx-auto max-w-lg">
        <h1 className="text-2xl font-bold text-slate-900">Verify your account</h1>
        <p className="mt-2 text-sm text-slate-600">
          One quick step keeps our community safe. You can continue using basic areas of
          the app, but bookings may stay limited until verification is approved.
        </p>

        <TrustPreamble />

        {errorMessage && (
          <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {errorMessage}
          </div>
        )}

        {profile.age == null && (
          <form onSubmit={submitAge} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">How old are you?</h2>
            <input
              type="number"
              min={1}
              max={120}
              inputMode="numeric"
              className="h-12 w-full rounded-xl border border-slate-300 px-4 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100"
              placeholder="Your age in years"
              value={ageInput}
              onChange={(e) => setAgeInput(e.target.value.replace(/\D/g, ""))}
            />
            <button
              type="submit"
              disabled={savingAge || !ageInput}
              className="h-12 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 font-medium text-white disabled:opacity-50"
            >
              {savingAge ? "Saving…" : "Continue"}
            </button>
          </form>
        )}

        {profile.age != null && minor && (
          <div className="space-y-6">
            {parentStatus === "SUBMITTED" && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-950">
                <p className="font-semibold">We&apos;re reviewing guardian details</p>
                <p className="mt-2 text-amber-900/90">
                  Parent phone is confirmed. Our team will review the Aadhaar reference
                  shortly. We&apos;ll email or message you when the account is cleared—usually
                  within one business day.
                </p>
                <Link
                  to="/profiles"
                  className="mt-4 inline-block font-medium text-indigo-700 underline"
                >
                  Go to your hub
                </Link>
              </div>
            )}

            {showParentIntakeForm && (
              <form
                onSubmit={submitParentDetails}
                className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <h2 className="text-lg font-semibold text-slate-900">
                  Parent or guardian
                </h2>
                <p className="text-xs text-slate-600">
                  We&apos;ll send a one-time code to their phone so they confirm they
                  support your learning on MentorHub.
                </p>
                <input
                  className="h-12 w-full rounded-xl border border-slate-300 px-4"
                  placeholder="Full name of parent or guardian"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                />
                <input
                  className="h-12 w-full rounded-xl border border-slate-300 px-4"
                  placeholder="Parent phone (digits only)"
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value.replace(/\D/g, ""))}
                />
                <input
                  className="h-12 w-full rounded-xl border border-slate-300 px-4"
                  placeholder="Parent Aadhaar number (12 digits)"
                  value={parentAadhar}
                  onChange={(e) => setParentAadhar(e.target.value.replace(/\D/g, "").slice(0, 12))}
                  inputMode="numeric"
                />
                <button
                  type="submit"
                  disabled={parentBusy}
                  className="h-12 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 font-medium text-white disabled:opacity-50"
                >
                  {parentBusy ? "Working…" : "Send code to parent"}
                </button>
              </form>
            )}

            {showOtpStep && (
              <form
                onSubmit={verifyParentOtp}
                className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <h2 className="text-lg font-semibold text-slate-900">Parent code</h2>
                <p className="text-xs text-slate-600">
                  Ask your parent for the code we sent to their phone.
                </p>
                {!otpMeta && profile.parentDetailsId && (
                  <button
                    type="button"
                    onClick={() => void resendParentOtp()}
                    disabled={parentBusy}
                    className="text-sm font-medium text-indigo-600 underline disabled:opacity-50"
                  >
                    Send or resend code
                  </button>
                )}
                <input
                  className="h-12 w-full rounded-xl border border-slate-300 px-4 font-mono tracking-widest"
                  placeholder="OTP"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  inputMode="numeric"
                />
                <button
                  type="submit"
                  disabled={parentBusy || otpCode.length < 4 || !otpMeta}
                  className="h-12 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 font-medium text-white disabled:opacity-50"
                >
                  {parentBusy ? "Verifying…" : "Confirm & submit for review"}
                </button>
              </form>
            )}
          </div>
        )}

        {profile.age != null && !minor && (
          <div className="space-y-6">
            {selfStatus === "SUBMITTED" && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-950">
                <p className="font-semibold">Identity submitted</p>
                <p className="mt-2 text-amber-900/90">
                  Thank you. An administrator will verify your Aadhaar reference. You can
                  explore the app meanwhile; sensitive actions stay protected until
                  approval.
                </p>
                <Link
                  to="/profiles"
                  className="mt-4 inline-block font-medium text-indigo-700 underline"
                >
                  Go to your hub
                </Link>
              </div>
            )}

            {(selfStatus == null || selfStatus === "REJECTED") && (
                <form
                  onSubmit={submitAdultAadhar}
                  className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <h2 className="text-lg font-semibold text-slate-900">Your Aadhaar</h2>
                  <p className="text-xs text-slate-600">
                    Enter the 12-digit number from your Aadhaar card. It is stored securely
                    and reviewed only for verification—not shared with mentors or other
                    learners.
                  </p>
                  <input
                    className="h-12 w-full rounded-xl border border-slate-300 px-4 font-mono tracking-widest"
                    placeholder="12-digit Aadhaar"
                    value={adultAadhar}
                    onChange={(e) =>
                      setAdultAadhar(e.target.value.replace(/\D/g, "").slice(0, 12))
                    }
                    inputMode="numeric"
                  />
                  <button
                    type="submit"
                    disabled={savingAdult}
                    className="h-12 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 font-medium text-white disabled:opacity-50"
                  >
                    {savingAdult ? "Submitting…" : "Submit for verification"}
                  </button>
                </form>
              )}
          </div>
        )}
      </div>
    </div>
  );
}
