import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  BookOpen,
  Calculator,
  Camera,
  Code,
  Dumbbell,
  Globe,
  Music,
  Palette,
  TrendingUp,
  Utensils,
} from "lucide-react";
import {
  LANGUAGE_OPTIONS,
  ONBOARDING_CATEGORIES,
} from "@/constants/onboardingCategories";
import { normalizeApiError } from "@/lib/apiError";
import { getStoredUserId } from "@/lib/sessionUser";
import { endpoints, httpClient } from "@/services/api";
import type {
  AddParentDetailsRequest,
  InterestsEnvelope,
  PreferredLearningMode,
  UpdateUserProfileRequest,
  UpsertInterestsRequest,
  UserProfileEnvelope,
} from "@/types";

const SUBJECT_ICONS = [
  Calculator,
  BookOpen,
  Globe,
  Music,
  Palette,
  Code,
  Dumbbell,
  Utensils,
  Camera,
  TrendingUp,
];

const SKILL_LEVELS = [
  { id: "beginner", label: "Beginner", description: "Just starting out" },
  { id: "intermediate", label: "Intermediate", description: "Some experience" },
  { id: "advanced", label: "Advanced", description: "Looking to master" },
];

export function MenteeProfilePage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(() => getStoredUserId());
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
  const [language, setLanguage] = useState(LANGUAGE_OPTIONS[0]?.value ?? "en");
  const [skillLevel, setSkillLevel] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [age, setAge] = useState("");
  const [preferredLearningMode, setPreferredLearningMode] =
    useState<PreferredLearningMode>("online");
  const [preferredSchedule, setPreferredSchedule] = useState("");
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [parentAadharNumber, setParentAadharNumber] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const cat = ONBOARDING_CATEGORIES.find((c) => c.id === categoryId);
    const firstSub = cat?.subcategories[0]?.id;
    if (firstSub) {
      setSubcategoryId(firstSub);
    }
  }, [categoryId]);

  useEffect(() => {
    setUserId(getStoredUserId());
  }, []);

  useEffect(() => {
    const uid = getStoredUserId();
    if (!uid) {
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data } = await httpClient.get<UserProfileEnvelope>(endpoints.usersMe);
        if (cancelled) {
          return;
        }
        const p = data.data;
        if (p.firstName?.trim()) {
          setFirstName(p.firstName.trim());
        }
        if (p.lastName?.trim()) {
          setLastName(p.lastName.trim());
        }
        if (p.age != null) {
          setAge(String(p.age));
        }
      } catch {
        /* Profile prefetch is optional; onboarding can still continue. */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const uid = userId ?? getStoredUserId();
    if (!uid || !selectedCategory || !subcategoryId || loading) {
      return;
    }

    const sub = selectedCategory.subcategories.find((s) => s.id === subcategoryId);
    if (!sub) {
      return;
    }

    setErrorMessage(null);
    setLoading(true);

    const payload: UpsertInterestsRequest = {
      interests: [
        {
          categoryId: selectedCategory.id,
          subcategoryId: sub.id,
          language,
        },
      ],
    };

    try {
      const parsedAge = age.trim() ? Number(age) : undefined;
      if (
        parsedAge !== undefined &&
        (Number.isNaN(parsedAge) || parsedAge < 0 || parsedAge > 120)
      ) {
        setErrorMessage("Age must be between 0 and 120.");
        return;
      }
      if (parsedAge !== undefined && parsedAge < 18) {
        if (!parentName.trim() || !parentPhone.trim()) {
          setErrorMessage(
            "Minors must provide a parent or guardian name and phone."
          );
          return;
        }
        const a12 = parentAadharNumber.replace(/\D/g, "");
        if (a12.length !== 12) {
          setErrorMessage(
            "Minors must provide the parent or guardian 12-digit Aadhaar number for verification."
          );
          return;
        }
      }

      const profilePayload: UpdateUserProfileRequest = {
        ...(firstName.trim() ? { firstName: firstName.trim() } : {}),
        ...(lastName.trim() ? { lastName: lastName.trim() } : {}),
        ...(parsedAge !== undefined ? { age: parsedAge } : {}),
        preferredLearningMode,
        ...(preferredSchedule.trim()
          ? { preferredSchedule: preferredSchedule.trim() }
          : {}),
      };
      await httpClient.patch(endpoints.usersMe, profilePayload);

      await httpClient.put<InterestsEnvelope>(endpoints.usersMeInterests, payload);

      const isMinor = parsedAge !== undefined && parsedAge < 18;
      if (isMinor && parentName.trim() && parentPhone.trim()) {
        const parentPayload: AddParentDetailsRequest = {
          parentName: parentName.trim(),
          parentPhone: parentPhone.trim().replace(/\D/g, ""),
          parentAadharNumber: parentAadharNumber.replace(/\D/g, ""),
        };
        await httpClient.post(endpoints.parentAddDetails, parentPayload);
      }
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setErrorMessage(normalizeApiError(error));
    } finally {
      setLoading(false);
    }
  }

  if (!userId) {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-6">
        <div className="alert-warn">
          <p className="font-semibold">Sign in required</p>
          <p className="mt-2 text-amber-900/90">
            Sign in so we can attach this mentee profile to your account.
          </p>
          <Link to="/login" className="link-subtle mt-4 inline-block text-sm">
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  const isMinor = age.trim() !== "" && Number(age) < 18;
  const canSubmit =
    Boolean(categoryId && subcategoryId && language && skillLevel) && !loading;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-indigo-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur">
        <div className="mx-auto flex w-full max-w-2xl items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-lg px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
          >
            Back
          </button>
          <h1 className="text-base font-semibold text-slate-900">
            Tell us about yourself
          </h1>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="px-6 pb-24 pt-6">
        <div className="mx-auto max-w-2xl space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="mb-2 text-2xl font-bold text-slate-900">
              What do you want to learn?
            </h2>
            <p className="mb-6 text-slate-600">
              Select a main topic and then pick a subtopic.
            </p>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {ONBOARDING_CATEGORIES.map((subject, index) => {
                const Icon = SUBJECT_ICONS[index % SUBJECT_ICONS.length];
                const selected = categoryId === subject.id;
                return (
                  <button
                    key={subject.id}
                    type="button"
                    onClick={() => setCategoryId(subject.id)}
                    className={`rounded-2xl border-2 p-4 text-left transition-all ${
                      selected
                        ? "border-indigo-600 bg-indigo-50 shadow-md"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div
                      className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${
                        selected ? "bg-indigo-600" : "bg-slate-100"
                      }`}
                    >
                      <Icon
                        className={`h-5 w-5 ${
                          selected ? "text-white" : "text-slate-600"
                        }`}
                      />
                    </div>
                    <p
                      className={`text-sm font-medium ${
                        selected ? "text-indigo-900" : "text-slate-900"
                      }`}
                    >
                      {subject.label}
                    </p>
                  </button>
                );
              })}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h2 className="mb-2 text-2xl font-bold text-slate-900">Your skill level</h2>
            <p className="mb-6 text-slate-600">
              This helps us match you with the right mentors.
            </p>

            <div className="space-y-3">
              {SKILL_LEVELS.map((level) => (
                <button
                  key={level.id}
                  type="button"
                  onClick={() => setSkillLevel(level.id)}
                  className={`w-full rounded-2xl border-2 p-4 text-left transition-all ${
                    skillLevel === level.id
                      ? "border-indigo-600 bg-indigo-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="mb-1 font-semibold text-slate-900">{level.label}</p>
                      <p className="text-sm text-slate-600">{level.description}</p>
                    </div>
                    <span
                      className={`h-5 w-5 rounded-full border-2 ${
                        skillLevel === level.id
                          ? "border-indigo-600 bg-indigo-600"
                          : "border-slate-300"
                      }`}
                    >
                      {skillLevel === level.id && (
                        <span className="flex h-full w-full items-center justify-center">
                          <span className="h-2 w-2 rounded-full bg-white" />
                        </span>
                      )}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
            <p className="mb-3 text-sm font-semibold text-slate-800">
              Matching details
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <select
                className="select-modern"
                value={subcategoryId}
                onChange={(e) => setSubcategoryId(e.target.value)}
              >
                {selectedCategory?.subcategories.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
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
              <input
                type="number"
                min={0}
                max={120}
                className="input-modern"
                placeholder="Age"
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />
              <select
                className="select-modern"
                value={preferredLearningMode}
                onChange={(e) =>
                  setPreferredLearningMode(e.target.value as PreferredLearningMode)
                }
              >
                <option value="online">Online</option>
                <option value="offline">Offline</option>
                <option value="both">Both</option>
              </select>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <input
                type="text"
                className="input-modern"
                placeholder="First name (optional)"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              <input
                type="text"
                className="input-modern"
                placeholder="Last name (optional)"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
            <input
              type="text"
              className="input-modern mt-3"
              placeholder="Schedule preference (optional)"
              value={preferredSchedule}
              onChange={(e) => setPreferredSchedule(e.target.value)}
            />
          </section>

          {isMinor && (
            <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
              <p className="text-sm font-semibold text-slate-800">
                Parent / guardian details required
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Minors require parent verification for booking safety.
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  className="input-modern"
                  placeholder="Parent name"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                />
                <input
                  type="tel"
                  className="input-modern"
                  placeholder="Parent phone"
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value.replace(/\D/g, ""))}
                />
              </div>
              <input
                type="text"
                className="input-modern mt-3"
                placeholder="Aadhar reference (optional)"
                value={parentAadharNumber}
                onChange={(e) => setParentAadharNumber(e.target.value)}
              />
              <Link
                to="/parent-verification"
                className="mt-3 inline-flex text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Open guided parent verification flow
              </Link>
            </section>
          )}

          {errorMessage && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorMessage}
            </div>
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white p-4 shadow-lg">
          <div className="mx-auto max-w-2xl">
            <button
              type="submit"
              disabled={!canSubmit}
              className="h-12 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white transition hover:from-indigo-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Saving..." : "Complete Setup"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
