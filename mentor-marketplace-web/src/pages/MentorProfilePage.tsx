import { FormEvent, useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Link, useNavigate } from "react-router-dom";
import {
  Award,
  FileText,
  IndianRupee,
  Link2,
  MapPin,
  Upload,
} from "lucide-react";
import {
  LANGUAGE_OPTIONS,
  ONBOARDING_CATEGORIES,
} from "@/constants/onboardingCategories";
import { normalizeApiError } from "@/lib/apiError";
import { getStoredAccessToken, getStoredUserId } from "@/lib/sessionUser";
import { endpoints, httpClient } from "@/services/api";

type ExpertiseRow = {
  key: string;
  categoryId: string;
  subcategoryId: string;
};

const EXPERIENCE_LEVELS = [
  { id: "1-2 years", label: "1-2 years" },
  { id: "3-5 years", label: "3-5 years" },
  { id: "5+ years", label: "5+ years" },
];

function newRow(catId: string, subId: string): ExpertiseRow {
  return {
    key: crypto.randomUUID(),
    categoryId: catId,
    subcategoryId: subId,
  };
}

export function MentorProfilePage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(() => getStoredUserId());
  const [step, setStep] = useState(1);
  const [certifications, setCertifications] = useState(false);
  const [rows, setRows] = useState<ExpertiseRow[]>(() => {
    const c = ONBOARDING_CATEGORIES[0];
    const sub = c?.subcategories[0];
    return c && sub ? [newRow(c.id, sub.id)] : [];
  });
  const [language, setLanguage] = useState(LANGUAGE_OPTIONS[0]?.value ?? "en");
  const [hourlyRate, setHourlyRate] = useState("");
  const [experienceDetails, setExperienceDetails] = useState("");
  const [linkedinProfile, setLinkedinProfile] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("IN");
  const [pinCode, setPinCode] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setUserId(getStoredUserId());
  }, []);

  const categoryFor = (categoryId: string) =>
    ONBOARDING_CATEGORIES.find((c) => c.id === categoryId);

  const expertisePayload = useMemo(() => {
    const list: { category: string; subcategory: string }[] = [];
    for (const r of rows) {
      const cat = categoryFor(r.categoryId);
      const sub = cat?.subcategories.find((s) => s.id === r.subcategoryId);
      if (cat && sub) {
        list.push({ category: cat.id, subcategory: sub.id });
      }
    }
    return list;
  }, [rows]);

  function updateRow(
    key: string,
    patch: Partial<Pick<ExpertiseRow, "categoryId" | "subcategoryId">>
  ) {
    setRows((prev) =>
      prev.map((r) => {
        if (r.key !== key) {
          return r;
        }
        const next = { ...r, ...patch };
        if (patch.categoryId) {
          const cat = categoryFor(patch.categoryId);
          const firstSub = cat?.subcategories[0]?.id;
          if (firstSub) next.subcategoryId = firstSub;
        }
        return next;
      })
    );
  }

  function canGoStepTwo() {
    const rate = Number(hourlyRate);
    return (
      expertisePayload.length > 0 &&
      Boolean(experienceDetails.trim()) &&
      Boolean(city.trim()) &&
      Boolean(pinCode.trim()) &&
      Number.isFinite(rate) &&
      rate > 0
    );
  }

  function handleContinueStep() {
    if (step === 1 && canGoStepTwo()) {
      setStep(2);
    }
  }

  async function handleSubmit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (!getStoredAccessToken() || !userId || loading) return;

    const rate = Number(hourlyRate);
    if (!Number.isFinite(rate) || rate <= 0) {
      setErrorMessage("Enter a valid hourly rate.");
      return;
    }
    const cc = country.trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(cc)) {
      setErrorMessage("Country must be a 2-letter ISO code (e.g. IN, US).");
      return;
    }
    if (!city.trim()) {
      setErrorMessage("Service city / area is required for discovery and safety.");
      return;
    }
    const pinNorm = pinCode.replace(/[\s-]+/g, "").trim();
    if (!pinNorm) {
      setErrorMessage(
        "PIN or postal code is required so learners can find you for offline sessions."
      );
      return;
    }
    if (pinNorm.length < 3 || pinNorm.length > 16) {
      setErrorMessage("PIN / postal code should be between 3 and 16 characters.");
      return;
    }
    if (expertisePayload.length === 0) {
      setErrorMessage("Add at least one skill category.");
      return;
    }

    let latN: number | undefined;
    let lngN: number | undefined;
    if (lat.trim() || lng.trim()) {
      latN = Number(lat);
      lngN = Number(lng);
      if (!Number.isFinite(latN) || !Number.isFinite(lngN)) {
        setErrorMessage(
          "Latitude and longitude must both be valid numbers if provided."
        );
        return;
      }
    }

    setErrorMessage(null);
    setLoading(true);
    try {
      await httpClient.post(endpoints.mentorsMeProfile, {
        expertise: expertisePayload,
        hourlyRate: rate,
        languages: [language],
        ...(experienceDetails.trim()
          ? { experienceDetails: `${experienceDetails.trim()}\n${bio.trim()}` }
          : {}),
        ...(linkedinProfile.trim()
          ? { linkedinProfile: linkedinProfile.trim() }
          : {}),
        serviceArea: {
          city: city.trim(),
          ...(state.trim() ? { state: state.trim() } : {}),
          country: cc,
          pinCode: pinNorm,
          ...(latN !== undefined ? { lat: latN, lng: lngN! } : {}),
        },
      });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setErrorMessage(normalizeApiError(err));
    } finally {
      setLoading(false);
    }
  }

  if (!userId || !getStoredAccessToken()) {
    return (
      <div className="mx-auto max-w-md px-4 py-6">
        <div className="alert-warn">
          <p className="font-semibold">Sign in required</p>
          <p className="mt-2 text-sm text-amber-900/90">
            Sign in to create your mentor profile.
          </p>
          <Link to="/login" className="link-subtle mt-4 inline-block text-sm">
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur">
        <div className="mx-auto flex w-full max-w-2xl items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-lg px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
          >
            Back
          </button>
          <h1 className="text-base font-semibold text-slate-900">Become a Mentor</h1>
        </div>
      </header>

      <div className="px-6 py-4">
        <div className="mx-auto flex max-w-2xl items-center gap-2">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                s <= step ? "bg-purple-600" : "bg-slate-200"
              }`}
            />
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-6 pb-24">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="mx-auto max-w-2xl space-y-6"
        >
          {step === 1 && (
            <>
              <div className="py-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500">
                  <Award className="h-8 w-8 text-white" />
                </div>
                <h2 className="mb-2 text-2xl font-bold text-slate-900">
                  Share your expertise
                </h2>
                <p className="text-slate-600">Help students learn while earning</p>
              </div>

              <section className="space-y-3 rounded-2xl border border-slate-200 p-4 sm:p-5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">
                    What subjects can you teach? *
                  </p>
                  {rows.length < 5 && (
                    <button
                      type="button"
                      className="text-xs font-semibold text-purple-600 hover:text-purple-800"
                      onClick={() => {
                        const c = ONBOARDING_CATEGORIES[0];
                        const sub = c?.subcategories[0];
                        if (c && sub) {
                          setRows((r) => [...r, newRow(c.id, sub.id)]);
                        }
                      }}
                    >
                      + Add skill
                    </button>
                  )}
                </div>
                {rows.map((row) => {
                  const cat = categoryFor(row.categoryId);
                  return (
                    <div key={row.key} className="grid gap-3 sm:grid-cols-2">
                      <select
                        className="select-modern"
                        value={row.categoryId}
                        onChange={(e) =>
                          updateRow(row.key, { categoryId: e.target.value })
                        }
                      >
                        {ONBOARDING_CATEGORIES.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                      <select
                        className="select-modern"
                        value={row.subcategoryId}
                        onChange={(e) =>
                          updateRow(row.key, { subcategoryId: e.target.value })
                        }
                        disabled={!cat?.subcategories.length}
                      >
                        {cat?.subcategories.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </section>

              <div>
                <p className="mb-3 text-sm font-medium text-slate-900">
                  Teaching experience *
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {EXPERIENCE_LEVELS.map((level) => (
                    <button
                      key={level.id}
                      type="button"
                      onClick={() => setExperienceDetails(level.id)}
                      className={`rounded-xl border-2 p-3 text-sm font-medium transition-all ${
                        experienceDetails === level.id
                          ? "border-purple-600 bg-purple-50 text-purple-700"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      {level.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    className="input-modern pl-11"
                    placeholder="City / area *"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <div className="relative">
                  <IndianRupee className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="number"
                    min={1}
                    className="input-modern pl-11"
                    placeholder="Hourly rate *"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  className="input-modern"
                  placeholder="PIN / postal code *"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                />
                <input
                  className="input-modern"
                  placeholder="State / region (optional)"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                />
              </div>

              <textarea
                className="input-modern min-h-28 py-3"
                placeholder="About your teaching style (optional)"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />

              <button
                type="button"
                onClick={handleContinueStep}
                disabled={!canGoStepTwo()}
                className="h-12 w-full rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white transition hover:from-purple-700 hover:to-pink-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Continue
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="py-6 text-center">
                <h2 className="mb-2 text-2xl font-bold text-slate-900">
                  Build credibility
                </h2>
                <p className="text-slate-600">
                  Add credentials to stand out (optional)
                </p>
              </div>

              <div className="relative">
                <Link2 className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  className="input-modern pl-11"
                  placeholder="LinkedIn profile (optional)"
                  value={linkedinProfile}
                  onChange={(e) => setLinkedinProfile(e.target.value)}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <input
                  className="input-modern"
                  placeholder="Country (ISO-2)"
                  maxLength={2}
                  value={country}
                  onChange={(e) => setCountry(e.target.value.toUpperCase())}
                />
                <input
                  className="input-modern"
                  placeholder="Latitude (optional)"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                />
                <input
                  className="input-modern"
                  placeholder="Longitude (optional)"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                />
              </div>

              <select
                className="select-modern"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                {LANGUAGE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setCertifications(true)}
                className="w-full rounded-2xl border-2 border-dashed border-slate-300 p-6 text-center transition-colors hover:border-purple-400"
              >
                {!certifications ? (
                  <>
                    <Upload className="mx-auto mb-3 h-10 w-10 text-slate-400" />
                    <p className="mb-1 font-medium text-slate-900">
                      Upload Certifications
                    </p>
                    <p className="text-sm text-slate-600">
                      Teaching certificates, degrees, or awards
                    </p>
                  </>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <FileText className="h-8 w-8 text-purple-600" />
                    <span className="font-medium text-purple-600">
                      Certificates uploaded
                    </span>
                  </div>
                )}
              </button>

              <div className="rounded-2xl border border-purple-100 bg-gradient-to-br from-indigo-50 to-purple-50 p-6">
                <h3 className="mb-3 flex items-center gap-2 font-semibold text-slate-900">
                  <Award className="h-5 w-5 text-purple-600" />
                  Take a Skill Assessment
                </h3>
                <p className="mb-4 text-sm text-slate-700">
                  Optional in this build. We can enable assessment integration
                  later without changing your profile flow.
                </p>
                <button
                  type="button"
                  disabled
                  className="w-full rounded-xl border border-purple-300 py-2 text-sm font-medium text-purple-700 opacity-70"
                >
                  Start Assessment
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="h-12 w-full rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white transition hover:from-purple-700 hover:to-pink-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Saving..." : "Complete Profile"}
              </button>

              <button
                type="button"
                onClick={() => handleSubmit()}
                className="w-full text-sm text-slate-600 hover:text-slate-900"
              >
                Skip for now
              </button>
            </>
          )}

          {errorMessage && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorMessage}
            </div>
          )}
        </motion.div>
      </form>
    </div>
  );
}
