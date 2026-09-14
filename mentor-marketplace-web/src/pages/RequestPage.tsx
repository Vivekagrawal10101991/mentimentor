import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ONBOARDING_CATEGORIES } from "@/constants/onboardingCategories";
import { normalizeApiError } from "@/lib/apiError";
import { getStoredAccessToken } from "@/lib/sessionUser";
import { endpoints, httpClient } from "@/services/api";
import type {
  CreateLearningRequestPayload,
  LearningRequestResponse,
} from "@/types";

export function RequestPage() {
  const [categoryId, setCategoryId] = useState(
    ONBOARDING_CATEGORIES[0]?.id ?? ""
  );
  const selectedCategory = useMemo(
    () => ONBOARDING_CATEGORIES.find((c) => c.id === categoryId),
    [categoryId]
  );
  const [subcategoryId, setSubcategoryId] = useState(
    () => ONBOARDING_CATEGORIES[0]?.subcategories[0]?.id ?? ""
  );

  useEffect(() => {
    const cat = ONBOARDING_CATEGORIES.find((c) => c.id === categoryId);
    const firstSub = cat?.subcategories[0]?.id;
    if (firstSub) {
      setSubcategoryId(firstSub);
    }
  }, [categoryId]);

  const [mode, setMode] = useState<"online" | "offline">("online");
  const [scheduleType, setScheduleType] = useState<"now" | "later">("later");
  const [preferredSchedule, setPreferredSchedule] = useState("");
  const [locationPreference, setLocationPreference] = useState("");
  const [offlineVenueType, setOfflineVenueType] = useState<
    "AT_MENTOR" | "INVITE_MENTOR"
  >("AT_MENTOR");

  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<LearningRequestResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const signedIn = !!getStoredAccessToken();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (loading || !selectedCategory) return;
    const sub = selectedCategory.subcategories.find(
      (s) => s.id === subcategoryId
    );
    if (!sub) return;

    setLoading(true);
    setError(null);
    setData(null);

    const payload: CreateLearningRequestPayload = {
      category: selectedCategory.id,
      subcategory: sub.id,
      mode,
      scheduleType,
      ...(preferredSchedule.trim()
        ? { preferredSchedule: preferredSchedule.trim() }
        : {}),
      ...(mode === "offline" && locationPreference.trim()
        ? { locationPreference: locationPreference.trim() }
        : {}),
      ...(mode === "offline" ? { offlineVenueType } : {}),
    };

    try {
      const res = await httpClient.post<LearningRequestResponse>(
        endpoints.requestCreate,
        payload
      );
      setData(res.data);
    } catch (err) {
      setError(normalizeApiError(err));
    } finally {
      setLoading(false);
    }
  }

  if (!signedIn) {
    return (
      <div className="mx-auto max-w-md">
        <div className="alert-warn">
          <p className="font-semibold">Sign in required</p>
          <p className="mt-2 text-sm text-amber-900/90">
            Create a learning request after you sign in.
          </p>
          <Link to="/login" className="link-subtle mt-4 inline-block text-sm">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="card-surface p-6 sm:p-8">
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
          What do you want to learn?
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          We&apos;ll queue matching mentors (notifications via async pipeline in
          a later milestone). Offline visits require parent approval for minors
          before the session is confirmed.
        </p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Topic category
            </label>
            <select
              className="select-modern"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              {ONBOARDING_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Subcategory
            </label>
            <select
              className="select-modern"
              value={subcategoryId}
              onChange={(e) => setSubcategoryId(e.target.value)}
              disabled={!selectedCategory?.subcategories.length}
            >
              {selectedCategory?.subcategories.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Mode
            </label>
            <select
              className="select-modern"
              value={mode}
              onChange={(e) =>
                setMode(e.target.value as "online" | "offline")
              }
            >
              <option value="online">Online</option>
              <option value="offline">Offline</option>
            </select>
          </div>

          {mode === "offline" && (
            <>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Location preference (approximate)
                </label>
                <input
                  className="input-modern"
                  value={locationPreference}
                  onChange={(e) => setLocationPreference(e.target.value)}
                  placeholder="e.g. North side, near Central Park"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Offline arrangement
                </label>
                <select
                  className="select-modern"
                  value={offlineVenueType}
                  onChange={(e) =>
                    setOfflineVenueType(
                      e.target.value as "AT_MENTOR" | "INVITE_MENTOR"
                    )
                  }
                >
                  <option value="AT_MENTOR">
                    Go to mentor&apos;s place (parent approval if minor)
                  </option>
                  <option value="INVITE_MENTOR">
                    Invite mentor to my location (parent approval if minor)
                  </option>
                </select>
              </div>
            </>
          )}

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Timing
            </label>
            <select
              className="select-modern"
              value={scheduleType}
              onChange={(e) =>
                setScheduleType(e.target.value as "now" | "later")
              }
            >
              <option value="now">As soon as possible</option>
              <option value="later">Schedule for later</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Preferred schedule notes
            </label>
            <input
              className="input-modern"
              value={preferredSchedule}
              onChange={(e) => setPreferredSchedule(e.target.value)}
              placeholder="e.g. Sat mornings IST"
            />
          </div>

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "Submitting…" : "Submit learning request"}
          </button>
        </form>

        {error && (
          <p className="alert-error mt-4" role="alert">
            {error}
          </p>
        )}
        {data && (
          <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 text-sm text-emerald-900">
            <p className="font-semibold">Request recorded</p>
            <p className="mt-1 text-emerald-800/90">{data.matchingNote}</p>
            <p className="mt-3 text-xs text-emerald-800/80">
              ID: {data.id} · Status: {data.status}
            </p>
            <Link
              to="/dashboard"
              className="link-subtle mt-4 inline-block text-sm font-medium"
            >
              Open dashboard
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
