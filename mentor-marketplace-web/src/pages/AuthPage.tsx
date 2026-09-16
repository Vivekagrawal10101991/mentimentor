import { CredentialResponse, GoogleLogin } from "@react-oauth/google";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Globe,
  Phone,
  ShieldCheck,
  Star,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { googleClientId } from "@/config/env";
import { COUNTRY_CODES } from "@/constants/countryCodes";
import { normalizeApiError } from "@/lib/apiError";
import { consumePostAuthReturn, setPostAuthReturn } from "@/lib/postAuthRedirect";
import { safeInternalPath } from "@/lib/safeInternalPath";
import {
  clearStoredSession,
  setStoredAccessToken,
  setStoredRoles,
  setStoredUserId,
} from "@/lib/sessionUser";
import { endpoints, httpClient } from "@/services/api";
import type {
  OtpDeliveryHint,
  SendOtpRequest,
  SendOtpResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
} from "@/types";

const BLUE = "#243B8F";
const LIME = "#DFFF2F";

const inputClass =
  "h-12 w-full rounded-xl border border-[#101A5C]/15 bg-white px-3 text-sm text-[#101A5C] placeholder:text-gray-400 transition focus:border-[#243B8F] focus:outline-none focus:ring-4 focus:ring-[#243B8F]/10";
const primaryBtnClass =
  "inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#DFFF2F] text-sm font-bold text-[#101A5C] transition hover:bg-[#d4f520] disabled:cursor-not-allowed disabled:opacity-50";
const darkBtnClass =
  "inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#101A5C] text-sm font-bold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50";

function messageAfterOtpSent(hint: OtpDeliveryHint): {
  success: string | null;
  setupWarning: string | null;
} {
  switch (hint) {
    case "sms":
      return {
        success: "We sent a verification code to your phone.",
        setupWarning: null,
      };
    case "dev_log":
      return {
        success:
          "Check the terminal where the API is running — the verification code was printed in the logs.",
        setupWarning: null,
      };
    case "none":
    default:
      return {
        success: null,
        setupWarning:
          "SMS is not enabled on this API and the code is not printed to logs. For local development, set OTP_LOG_CODE=true in the server environment and restart Spring Boot, or configure Twilio (TWILIO_*).",
      };
  }
}

type AuthVariant = "login" | "signup";
type AuthMode = "member" | "admin";

export interface AuthRoleGate {
  anyOf: string[];
  redirectTo: string;
  failMessage: string;
}

interface AuthPageProps {
  variant: AuthVariant;
  authMode?: AuthMode;
  roleGate?: AuthRoleGate;
}

async function navigateAfterMemberSignIn(
  navigate: ReturnType<typeof useNavigate>
) {
  const returnTo = consumePostAuthReturn();
  const next = safeInternalPath(returnTo);
  // Skip account verification gate — return to the intended destination
  // (e.g. /profiles/mentor after "Become a Mentor") or the profiles hub.
  navigate(next ?? "/profiles", { replace: true });
}

export function AuthPage({
  variant,
  authMode = "member",
  roleGate,
}: AuthPageProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isAdminPortal = authMode === "admin";
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpRequestId, setOtpRequestId] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [sendLoading, setSendLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Honor ?next=/path from auth-gated CTAs (also mirrored into sessionStorage).
  useEffect(() => {
    if (isAdminPortal) {
      return;
    }
    const next = safeInternalPath(searchParams.get("next"));
    if (next) {
      setPostAuthReturn(next);
    }
  }, [isAdminPortal, searchParams]);
  const [otpSetupWarning, setOtpSetupWarning] = useState<string | null>(null);
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [portalLoginLoading, setPortalLoginLoading] = useState(false);

  const isPhoneValid = useMemo(
    () => /^[0-9]{6,15}$/.test(phoneNumber),
    [phoneNumber]
  );
  const isOtpValid = useMemo(() => /^[0-9]{4,6}$/.test(otpCode), [otpCode]);
  const flowStep = otpRequestId ? 2 : 1;
  const isAdminFormValid = useMemo(() => {
    const u = adminUsername.trim().toLowerCase();
    return /^[a-z0-9_]{3,64}$/.test(u) && adminPassword.length >= 8;
  }, [adminUsername, adminPassword]);

  const title = isAdminPortal
    ? "Admin sign-in"
    : variant === "signup"
      ? "Create your account"
      : "Welcome back";
  const subtitle = isAdminPortal
    ? "Sign in with your portal username and password."
    : variant === "signup"
      ? "Join mentimentor to learn 1:1 or start mentoring."
      : "Sign in to continue matching with verified mentors.";

  const brandPanel = (
    <aside
      className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:px-12 lg:py-12"
      style={{ backgroundColor: BLUE }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="relative">
        <Link to="/">
          <Logo className="h-8 w-auto" variant="white" />
        </Link>
      </div>
      <div className="relative max-w-md space-y-6">
        <p
          className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-white/80"
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: LIME }} />
          Capability-verified mentors
        </p>
        <h2 className="text-4xl font-extrabold leading-tight text-white">
          Learning that fits{" "}
          <span style={{ color: LIME }}>you</span>
          — not a generic tutor list.
        </h2>
        <p className="text-lg leading-relaxed text-white/70">
          Sign in to find mentors matched to your goals, level, and preferences.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          {[
            { icon: BadgeCheck, text: "Verified mentors" },
            { icon: Star, text: "4.8+ average rating" },
            { icon: ShieldCheck, text: "Identity checked" },
          ].map(({ icon: Icon, text }) => (
            <div
              key={text}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm"
            >
              <Icon className="h-3.5 w-3.5" style={{ color: LIME }} />
              {text}
            </div>
          ))}
        </div>
      </div>
      <p className="relative text-xs text-white/40">© 2026 mentimentor · Made in India</p>
    </aside>
  );

  async function handleSendOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isPhoneValid || sendLoading) {
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setOtpSetupWarning(null);
    setSendLoading(true);

    const payload: SendOtpRequest = {
      countryCode,
      phoneNumber,
      purpose: "login",
    };

    try {
      const { data } = await httpClient.post<SendOtpResponse>(
        endpoints.sendOtp,
        payload
      );
      setOtpRequestId(data.otpRequestId);
      setExpiresAt(data.expiresAt);
      setOtpCode("");
      const { success, setupWarning } = messageAfterOtpSent(
        data.deliveryHint ?? "none"
      );
      setSuccessMessage(success);
      setOtpSetupWarning(setupWarning);
    } catch (error) {
      setErrorMessage(normalizeApiError(error));
    } finally {
      setSendLoading(false);
    }
  }

  async function handleVerifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!otpRequestId || !isOtpValid || verifyLoading) {
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setOtpSetupWarning(null);
    setVerifyLoading(true);

    const payload: VerifyOtpRequest = {
      otpRequestId,
      otpCode,
    };

    try {
      const { data } = await httpClient.post<VerifyOtpResponse>(
        endpoints.verifyOtp,
        payload
      );
      setStoredAccessToken(data.accessToken);
      setStoredUserId(data.user.id);
      setStoredRoles(data.user.roles);
      setSuccessMessage("Verified. You are signed in.");
      if (roleGate) {
        const ok = data.user.roles.some((r) =>
          roleGate.anyOf.includes(String(r).toLowerCase())
        );
        if (!ok) {
          clearStoredSession();
          setErrorMessage(roleGate.failMessage);
          return;
        }
        navigate(roleGate.redirectTo, { replace: true });
        return;
      }
      await navigateAfterMemberSignIn(navigate);
    } catch (error) {
      setErrorMessage(normalizeApiError(error));
    } finally {
      setVerifyLoading(false);
    }
  }

  async function handleGoogleSuccess(credentialResponse: CredentialResponse) {
    const credential = credentialResponse.credential;
    if (!credential) {
      setErrorMessage("Google did not return a credential.");
      return;
    }
    setErrorMessage(null);
    setSuccessMessage(null);
    setOtpSetupWarning(null);
    setSendLoading(true);
    try {
      const { data } = await httpClient.post<VerifyOtpResponse>(
        endpoints.googleAuth,
        { credential }
      );
      setStoredAccessToken(data.accessToken);
      setStoredUserId(data.user.id);
      setStoredRoles(data.user.roles);
      setSuccessMessage("Signed in with Google.");
      if (roleGate) {
        const ok = data.user.roles.some((r) =>
          roleGate.anyOf.includes(String(r).toLowerCase())
        );
        if (!ok) {
          clearStoredSession();
          setErrorMessage(roleGate.failMessage);
          return;
        }
        navigate(roleGate.redirectTo, { replace: true });
        return;
      }
      await navigateAfterMemberSignIn(navigate);
    } catch (error) {
      setErrorMessage(normalizeApiError(error));
    } finally {
      setSendLoading(false);
    }
  }

  async function handleAdminPortalLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isAdminFormValid || portalLoginLoading) {
      return;
    }
    setErrorMessage(null);
    setSuccessMessage(null);
    setOtpSetupWarning(null);
    setPortalLoginLoading(true);
    try {
      const { data } = await httpClient.post<VerifyOtpResponse>(
        endpoints.adminPortalLogin,
        {
          username: adminUsername.trim().toLowerCase(),
          password: adminPassword,
        }
      );
      setStoredAccessToken(data.accessToken);
      setStoredUserId(data.user.id);
      setStoredRoles(data.user.roles);
      setSuccessMessage("Signed in.");
      if (roleGate) {
        const ok = data.user.roles.some((r) =>
          roleGate.anyOf.includes(String(r).toLowerCase())
        );
        if (!ok) {
          clearStoredSession();
          setErrorMessage(roleGate.failMessage);
          return;
        }
        navigate(roleGate.redirectTo, { replace: true });
        return;
      }
      navigate("/admin/kyc", { replace: true });
    } catch (error) {
      setErrorMessage(normalizeApiError(error));
    } finally {
      setPortalLoginLoading(false);
    }
  }

  if (isAdminPortal) {
    return (
      <div className="grid min-h-screen bg-white font-[Manrope,sans-serif] lg:grid-cols-2">
        {brandPanel}

        <div className="flex flex-col">
          <div className="flex items-center justify-between border-b border-black/8 px-6 py-4 lg:hidden">
            <Link to="/">
              <Logo className="h-7 w-auto" />
            </Link>
            <Link
              to="/"
              className="text-sm font-semibold text-[#243B8F] hover:text-[#101A5C]"
            >
              Home
            </Link>
          </div>

          <div className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10">
            <motion.div
              key="admin-portal"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-md space-y-8"
            >
              <div>
                <p className="mb-3 inline-block rounded-full bg-[#DFFF2F] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#101A5C]">
                  Admin portal
                </p>
                <h1 className="mb-2 text-3xl font-extrabold text-[#101A5C] sm:text-4xl">
                  {title}
                </h1>
                <p className="text-gray-600">{subtitle}</p>
              </div>

              <form className="space-y-4" onSubmit={handleAdminPortalLogin}>
                <div>
                  <label
                    htmlFor="adminUsername"
                    className="mb-1.5 block text-sm font-semibold text-[#101A5C]"
                  >
                    Username
                  </label>
                  <input
                    id="adminUsername"
                    type="text"
                    autoComplete="username"
                    value={adminUsername}
                    onChange={(e) =>
                      setAdminUsername(
                        e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "")
                      )
                    }
                    className={inputClass}
                    placeholder="superadmin"
                    maxLength={64}
                  />
                </div>
                <div>
                  <label
                    htmlFor="adminPassword"
                    className="mb-1.5 block text-sm font-semibold text-[#101A5C]"
                  >
                    Password
                  </label>
                  <input
                    id="adminPassword"
                    type="password"
                    autoComplete="current-password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className={inputClass}
                    placeholder="••••••••"
                  />
                </div>
                {!isAdminFormValid &&
                  (adminUsername.length > 0 || adminPassword.length > 0) && (
                    <p className="text-xs text-gray-500">
                      Username: 3–64 characters (lowercase letters, digits,
                      underscore). Password: at least 8 characters.
                    </p>
                  )}
                <button
                  type="submit"
                  disabled={!isAdminFormValid || portalLoginLoading}
                  className={darkBtnClass}
                >
                  {portalLoginLoading ? "Signing in…" : "Sign in"}
                  {!portalLoginLoading && <ArrowRight className="h-4 w-4" />}
                </button>
              </form>

              {(errorMessage || successMessage) && (
                <div className="rounded-2xl border border-[#101A5C]/10 bg-[#F6F7F2] p-4 text-sm">
                  {errorMessage && (
                    <p className="text-rose-600">{errorMessage}</p>
                  )}
                  {successMessage && (
                    <p className="text-emerald-700">{successMessage}</p>
                  )}
                </div>
              )}

              <p className="text-center text-sm text-gray-500">
                <Link
                  to="/"
                  className="font-semibold text-[#243B8F] hover:text-[#101A5C]"
                >
                  Back to mentimentor
                </Link>
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen bg-white font-[Manrope,sans-serif] lg:grid-cols-2">
      {brandPanel}

      <div className="flex flex-col">
        <div className="flex items-center justify-between border-b border-black/8 px-6 py-4 lg:hidden">
          <Link to="/">
            <Logo className="h-7 w-auto" />
          </Link>
          <Link
            to="/"
            className="text-sm font-semibold text-[#243B8F] hover:text-[#101A5C]"
          >
            Home
          </Link>
        </div>

        <div className="px-6 pt-8 sm:px-10 lg:pt-12">
          <div className="mx-auto flex max-w-md items-center gap-2">
            {[1, 2].map((step) => (
              <div
                key={step}
                className={`h-1.5 flex-1 rounded-full transition-all ${
                  step <= flowStep ? "bg-[#243B8F]" : "bg-[#101A5C]/10"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10">
          <motion.div
            key={flowStep}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md space-y-8"
          >
            {!otpRequestId ? (
              <div className="space-y-6">
                <div>
                  <p className="mb-3 inline-block rounded-full bg-[#DFFF2F] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#101A5C]">
                    {variant === "signup" ? "Get started" : "Sign in"}
                  </p>
                  <h1 className="mb-2 text-3xl font-extrabold text-[#101A5C] sm:text-4xl">
                    {title}
                  </h1>
                  <p className="text-gray-600">{subtitle}</p>
                </div>

                {googleClientId ? (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-[#101A5C]/10 bg-[#F6F7F2] p-4">
                      <div className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-[#101A5C]">
                        <Globe className="h-4 w-4 text-[#243B8F]" />
                        Continue with Google
                      </div>
                      <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() =>
                          setErrorMessage(
                            "Google sign-in failed or was cancelled."
                          )
                        }
                        useOneTap={false}
                        text={
                          variant === "signup" ? "signup_with" : "signin_with"
                        }
                        shape="rectangular"
                        size="large"
                        width={360}
                      />
                    </div>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-[#101A5C]/10" />
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="bg-white px-4 text-gray-500">
                          or use phone
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="rounded-2xl border border-[#101A5C]/10 bg-[#F6F7F2] p-4 text-sm text-gray-600">
                    To enable Google sign-in, set `VITE_GOOGLE_CLIENT_ID` for web
                    and `GOOGLE_CLIENT_ID` for the API.
                  </p>
                )}

                <form className="space-y-3" onSubmit={handleSendOtp}>
                  <div className="flex gap-3">
                    <label className="sr-only" htmlFor="countryCode">
                      Country code
                    </label>
                    <select
                      id="countryCode"
                      value={countryCode}
                      onChange={(event) => setCountryCode(event.target.value)}
                      className={`${inputClass} w-[7.5rem] shrink-0 appearance-none bg-[length:12px] bg-[right_0.75rem_center] bg-no-repeat pr-8`}
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
                      }}
                      aria-label="Country code"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.code}
                        </option>
                      ))}
                    </select>
                    <div className="relative min-w-0 flex-1">
                      <Phone className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                      <input
                        id="phoneNumber"
                        type="tel"
                        inputMode="numeric"
                        value={phoneNumber}
                        onChange={(event) =>
                          setPhoneNumber(
                            event.target.value.replace(/\D/g, "")
                          )
                        }
                        className={`${inputClass} pl-11`}
                        placeholder="Phone number"
                        maxLength={15}
                      />
                    </div>
                  </div>

                  {!isPhoneValid && phoneNumber.length > 0 && (
                    <p className="text-xs text-rose-600">
                      Enter 6 to 15 digits.
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={!isPhoneValid || sendLoading || verifyLoading}
                    className={primaryBtnClass}
                  >
                    {sendLoading ? "Sending OTP..." : "Continue"}
                    {!sendLoading && <ArrowRight className="h-4 w-4" />}
                  </button>
                </form>
              </div>
            ) : (
              <form className="space-y-6" onSubmit={handleVerifyOtp}>
                <div>
                  <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#DFFF2F] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#101A5C]">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Step 2 of 2
                  </p>
                  <h1 className="mb-2 text-3xl font-extrabold text-[#101A5C] sm:text-4xl">
                    Enter OTP
                  </h1>
                  <p className="text-gray-600">
                    Enter the verification code for {countryCode} {phoneNumber}.
                  </p>
                  {expiresAt && (
                    <p className="mt-2 text-xs text-gray-500">
                      Expires at {new Date(expiresAt).toLocaleString()}.
                    </p>
                  )}
                </div>

                <input
                  id="otpCode"
                  type="text"
                  inputMode="numeric"
                  value={otpCode}
                  onChange={(event) =>
                    setOtpCode(event.target.value.replace(/\D/g, ""))
                  }
                  className={`${inputClass} font-mono text-lg tracking-[0.3em]`}
                  placeholder="4-6 digit code"
                  maxLength={6}
                />

                {!isOtpValid && otpCode.length > 0 && (
                  <p className="text-xs text-rose-600">
                    OTP must be 4 to 6 digits.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={!isOtpValid || verifyLoading || sendLoading}
                  className={primaryBtnClass}
                >
                  {verifyLoading ? "Verifying..." : "Verify OTP"}
                  {!verifyLoading && <ArrowRight className="h-4 w-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOtpRequestId(null);
                    setOtpCode("");
                    setExpiresAt(null);
                    setErrorMessage(null);
                    setSuccessMessage(null);
                    setOtpSetupWarning(null);
                  }}
                  className="w-full text-sm font-semibold text-[#243B8F] hover:text-[#101A5C]"
                >
                  Use a different number
                </button>
              </form>
            )}

            {(errorMessage || successMessage || otpSetupWarning) && (
              <div className="rounded-2xl border border-[#101A5C]/10 bg-[#F6F7F2] p-4 text-sm">
                {errorMessage && (
                  <p className="text-rose-600">{errorMessage}</p>
                )}
                {successMessage && (
                  <p className="text-emerald-700">{successMessage}</p>
                )}
                {otpSetupWarning && (
                  <p className="text-amber-800">{otpSetupWarning}</p>
                )}
              </div>
            )}

            <p className="text-center text-sm text-gray-500">
              {variant === "signup" ? (
                <>
                  Already have an account?{" "}
                  <Link
                    to={
                      searchParams.get("next")
                        ? `/login?next=${encodeURIComponent(searchParams.get("next")!)}`
                        : "/login"
                    }
                    className="font-semibold text-[#243B8F] hover:text-[#101A5C]"
                  >
                    Sign in
                  </Link>
                </>
              ) : (
                <>
                  New here?{" "}
                  <Link
                    to={
                      searchParams.get("next")
                        ? `/signup?next=${encodeURIComponent(searchParams.get("next")!)}`
                        : "/signup"
                    }
                    className="font-semibold text-[#243B8F] hover:text-[#101A5C]"
                  >
                    Create an account
                  </Link>
                </>
              )}
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export function LoginPage() {
  return <AuthPage variant="login" />;
}

export function SignupPage() {
  return <AuthPage variant="signup" />;
}

export function AdminLoginPage() {
  return (
    <AuthPage
      variant="login"
      authMode="admin"
      roleGate={{
        anyOf: ["admin", "super_admin"],
        redirectTo: "/admin/kyc",
        failMessage:
          "This account is not allowed for the admin portal. Sign in with a portal username that has admin access.",
      }}
    />
  );
}
