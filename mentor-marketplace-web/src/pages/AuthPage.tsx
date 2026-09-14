import { CredentialResponse, GoogleLogin } from "@react-oauth/google";
import { FormEvent, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Link, useNavigate } from "react-router-dom";
import { Globe, GraduationCap, Phone } from "lucide-react";
import { googleClientId } from "@/config/env";
import { normalizeApiError } from "@/lib/apiError";
import { consumePostAuthReturn } from "@/lib/postAuthRedirect";
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
  UserProfileEnvelope,
  VerifyOtpRequest,
  VerifyOtpResponse,
} from "@/types";

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
  try {
    const { data } = await httpClient.get<UserProfileEnvelope>(endpoints.usersMe);
    if (data.data.accountVerificationComplete === true) {
      navigate(next ?? "/profiles", { replace: true });
      return;
    }
  } catch {
    /* fall through to verification */
  }
  const suffix = returnTo ? `?next=${encodeURIComponent(returnTo)}` : "";
  navigate(`/account/verification${suffix}`, { replace: true });
}

export function AuthPage({
  variant,
  authMode = "member",
  roleGate,
}: AuthPageProps) {
  const navigate = useNavigate();
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
    ? "Sign in with your portal username and password. The first super admin is created from ADMIN_PORTAL_SUPER_* on the API, or via SQL."
    : variant === "signup"
      ? "Join MentorHub and start learning or mentoring."
      : "Sign in to continue your learning journey.";

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
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="flex items-center justify-center p-6">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-2xl font-bold text-transparent">
              MentorHub
            </span>
          </div>
        </div>

        <div className="flex-1 px-6 pb-6">
          <motion.div
            key="admin-portal"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-sm backdrop-blur-sm sm:p-8"
          >
            <div className="space-y-6">
              <div>
                <h1 className="mb-2 text-3xl font-bold text-slate-900">{title}</h1>
                <p className="text-slate-600">{subtitle}</p>
              </div>

              <form className="space-y-3" onSubmit={handleAdminPortalLogin}>
                <div>
                  <label
                    htmlFor="adminUsername"
                    className="mb-1 block text-sm font-medium text-slate-700"
                  >
                    Username
                  </label>
                  <input
                    id="adminUsername"
                    type="text"
                    autoComplete="username"
                    value={adminUsername}
                    onChange={(e) =>
                      setAdminUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
                    }
                    className="h-12 w-full rounded-xl border border-slate-300 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                    placeholder="superadmin"
                    maxLength={64}
                  />
                </div>
                <div>
                  <label
                    htmlFor="adminPassword"
                    className="mb-1 block text-sm font-medium text-slate-700"
                  >
                    Password
                  </label>
                  <input
                    id="adminPassword"
                    type="password"
                    autoComplete="current-password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="h-12 w-full rounded-xl border border-slate-300 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                    placeholder="••••••••"
                  />
                </div>
                {!isAdminFormValid &&
                  (adminUsername.length > 0 || adminPassword.length > 0) && (
                    <p className="text-xs text-slate-600">
                      Username: 3–64 characters (lowercase letters, digits, underscore). Password: at
                      least 8 characters.
                    </p>
                  )}
                <button
                  type="submit"
                  disabled={!isAdminFormValid || portalLoginLoading}
                  className="h-12 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white transition hover:from-indigo-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {portalLoginLoading ? "Signing in…" : "Sign in"}
                </button>
              </form>
            </div>

            {(errorMessage || successMessage) && (
              <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                {errorMessage && <p className="text-rose-600">{errorMessage}</p>}
                {successMessage && (
                  <p className="text-emerald-700">{successMessage}</p>
                )}
              </div>
            )}

            <p className="mt-6 text-center text-sm text-slate-600">
              <Link to="/" className="font-semibold text-indigo-600">
                Back to MentorHub
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="flex items-center justify-center p-6">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-2xl font-bold text-transparent">
            MentorHub
          </span>
        </div>
      </div>

      <div className="mb-8 px-6">
        <div className="mx-auto flex max-w-md items-center gap-2">
          {[1, 2].map((step) => (
            <div
              key={step}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                step <= flowStep ? "bg-indigo-600" : "bg-slate-200"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 px-6 pb-6">
        <motion.div
          key={flowStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-sm backdrop-blur-sm sm:p-8"
        >
          {!otpRequestId ? (
            <div className="space-y-6">
              <div>
                <h1 className="mb-2 text-3xl font-bold text-slate-900">
                  {title}
                </h1>
                <p className="text-slate-600">{subtitle}</p>
              </div>

              {googleClientId ? (
                <div className="space-y-3">
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                      <Globe className="h-4 w-4" />
                      Continue with Google
                    </div>
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={() =>
                        setErrorMessage("Google sign-in failed or was cancelled.")
                      }
                      useOneTap={false}
                      text={variant === "signup" ? "signup_with" : "signin_with"}
                      shape="rectangular"
                      size="large"
                      width={360}
                    />
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="bg-white px-4 text-slate-500">or</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm text-slate-600">
                  To enable Google sign-in, set `VITE_GOOGLE_CLIENT_ID` for web
                  and `GOOGLE_CLIENT_ID` for the API.
                </p>
              )}

              <form className="space-y-3" onSubmit={handleSendOtp}>
                <div className="grid grid-cols-3 gap-3">
                  <input
                    id="countryCode"
                    type="text"
                    inputMode="text"
                    value={countryCode}
                    onChange={(event) => setCountryCode(event.target.value.trim())}
                    className="h-12 rounded-xl border border-slate-300 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                    placeholder="+91"
                  />
                  <div className="relative col-span-2">
                    <Phone className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      id="phoneNumber"
                      type="tel"
                      inputMode="numeric"
                      value={phoneNumber}
                      onChange={(event) =>
                        setPhoneNumber(event.target.value.replace(/\D/g, ""))
                      }
                      className="h-12 w-full rounded-xl border border-slate-300 pl-11 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                      placeholder="Phone number"
                      maxLength={15}
                    />
                  </div>
                </div>

                {!isPhoneValid && phoneNumber.length > 0 && (
                  <p className="text-xs text-rose-600">Enter 6 to 15 digits.</p>
                )}

                <button
                  type="submit"
                  disabled={!isPhoneValid || sendLoading || verifyLoading}
                  className="h-12 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white transition hover:from-indigo-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {sendLoading ? "Sending OTP..." : "Continue"}
                </button>
              </form>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleVerifyOtp}>
              <div>
                <h1 className="mb-2 text-3xl font-bold text-slate-900">
                  Enter OTP
                </h1>
                <p className="text-slate-600">
                  Enter the verification code for {countryCode} {phoneNumber}.
                </p>
                {expiresAt && (
                  <p className="mt-2 text-xs text-slate-500">
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
                className="h-12 w-full rounded-xl border border-slate-300 px-4 font-mono text-lg tracking-[0.3em] focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                placeholder="4-6 digit code"
                maxLength={6}
              />

              {!isOtpValid && otpCode.length > 0 && (
                <p className="text-xs text-rose-600">OTP must be 4 to 6 digits.</p>
              )}

              <button
                type="submit"
                disabled={!isOtpValid || verifyLoading || sendLoading}
                className="h-12 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white transition hover:from-indigo-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {verifyLoading ? "Verifying..." : "Verify OTP"}
              </button>
            </form>
          )}

          {(errorMessage || successMessage || otpSetupWarning) && (
            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
              {errorMessage && <p className="text-rose-600">{errorMessage}</p>}
              {successMessage && (
                <p className="text-emerald-700">{successMessage}</p>
              )}
              {otpSetupWarning && (
                <p className="text-amber-800">{otpSetupWarning}</p>
              )}
            </div>
          )}

          <p className="mt-6 text-center text-sm text-slate-600">
            {variant === "signup" ? (
              <>
                Already have an account?{" "}
                <Link to="/login" className="font-semibold text-indigo-600">
                  Sign in
                </Link>
              </>
            ) : (
              <>
                New here?{" "}
                <Link to="/signup" className="font-semibold text-indigo-600">
                  Create an account
                </Link>
              </>
            )}
          </p>
        </motion.div>
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
