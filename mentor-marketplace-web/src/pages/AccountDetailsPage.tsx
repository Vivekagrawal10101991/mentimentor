import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { normalizeApiError } from "@/lib/apiError";
import { getStoredAccessToken } from "@/lib/sessionUser";
import { endpoints, httpClient } from "@/services/api";
import type {
  UpdateUserProfileRequest,
  UserProfile,
  UserProfileEnvelope,
} from "@/types";

export function AccountDetailsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const loadProfile = useCallback(async () => {
    const { data } = await httpClient.get<UserProfileEnvelope>(endpoints.usersMe);
    const p: UserProfile = data.data;
    setFirstName(p.firstName?.trim() ?? "");
    setLastName(p.lastName?.trim() ?? "");
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

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    const f = firstName.trim();
    const l = lastName.trim();
    if (!f && !l) {
      setErrorMessage("Enter at least a first name or last name.");
      return;
    }
    setSaving(true);
    setErrorMessage(null);
    try {
      const body: UpdateUserProfileRequest = {
        ...(f ? { firstName: f } : {}),
        ...(l ? { lastName: l } : {}),
      };
      await httpClient.patch<UserProfileEnvelope>(endpoints.usersMe, body);
      await loadProfile();
      navigate("/profiles", { replace: true });
    } catch (e) {
      setErrorMessage(normalizeApiError(e));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <p className="text-slate-600">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-md">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <h1 className="text-2xl font-bold text-slate-900">Name & account</h1>
        <p className="mt-2 text-sm text-slate-600">
          This is how you appear across MentorHub. Age and identity checks stay on{" "}
          <Link to="/account/verification" className="font-medium text-indigo-600 underline">
            account verification
          </Link>
          .
        </p>

        <form
          onSubmit={handleSave}
          className="mt-8 space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          {errorMessage && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {errorMessage}
            </div>
          )}
          <div>
            <label htmlFor="ad-first" className="mb-1 block text-sm font-medium text-slate-700">
              First name
            </label>
            <input
              id="ad-first"
              className="input-modern w-full"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoComplete="given-name"
              maxLength={64}
            />
          </div>
          <div>
            <label htmlFor="ad-last" className="mb-1 block text-sm font-medium text-slate-700">
              Last name
            </label>
            <input
              id="ad-last"
              className="input-modern w-full"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              autoComplete="family-name"
              maxLength={64}
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="h-12 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 font-medium text-white disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </form>
      </div>
    </div>
  );
}
