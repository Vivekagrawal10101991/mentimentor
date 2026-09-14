import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import {
  BookOpen,
  Calendar,
  ChevronRight,
  Clock,
  Home as HomeIcon,
  IndianRupee,
  MapPin,
  MessageCircle,
  Plus,
  Search,
  TrendingUp,
  User,
  Users,
  Video,
} from "lucide-react";
import { normalizeApiError } from "@/lib/apiError";
import { getStoredAccessToken } from "@/lib/sessionUser";
import { endpoints, httpClient } from "@/services/api";
import type { LearningRequestResponse, UserDashboardResponse } from "@/types";

type DashboardMode = "learn" | "teach";
type ActiveTab = "home" | "sessions" | "messages" | "profile";

function statusClass(status: string) {
  const normalized = status.toLowerCase();
  if (normalized.includes("confirm") || normalized.includes("complete") || normalized.includes("accept")) {
    return "bg-emerald-100 text-emerald-700";
  }
  if (normalized.includes("await") || normalized.includes("pending")) {
    return "bg-amber-100 text-amber-700";
  }
  return "bg-slate-100 text-slate-700";
}

function formatCountdown(seconds: number | null | undefined) {
  if (seconds == null || seconds < 0) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function DashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<UserDashboardResponse | null>(null);
  const [mentorRequests, setMentorRequests] = useState<LearningRequestResponse[]>([]);
  const [mentorRequestError, setMentorRequestError] = useState<string | null>(
    null
  );
  const [actionRequestId, setActionRequestId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMode, setCurrentMode] = useState<DashboardMode>("learn");
  const [activeTab, setActiveTab] = useState<ActiveTab>("home");
  const [nowTick, setNowTick] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!getStoredAccessToken()) {
      setLoading(false);
      setError("Sign in to view your dashboard.");
      return;
    }
    let cancelled = false;
    Promise.all([
      httpClient.get<UserDashboardResponse>(endpoints.userDashboard),
      httpClient
        .get<LearningRequestResponse[]>(endpoints.requestsMentorIncoming)
        .then((res) => res.data)
        .catch(() => []),
    ])
      .then(([dashboardRes, mentorRequestsRes]) => {
        if (cancelled) return;
        setData(dashboardRes.data);
        setMentorRequests(mentorRequestsRes);
        if (dashboardRes.data.mentor) {
          setCurrentMode("teach");
        }
      })
      .catch((err) => {
        if (!cancelled) setError(normalizeApiError(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const learningRequests = data?.mentee?.learningRequests ?? [];
  const upcomingSessions = useMemo(
    () => learningRequests.slice(0, 2),
    [learningRequests]
  );
  const mentorSkills = data?.mentor?.skillSummaries ?? [];

  function remainingFor(request: LearningRequestResponse) {
    if (request.status !== "AWAITING_CONFIRMATION") return null;
    if (request.confirmationExpiresAt) {
      return Math.max(
        0,
        Math.floor(
          (new Date(request.confirmationExpiresAt).getTime() - nowTick) / 1000
        )
      );
    }
    return request.confirmationRemainingSeconds ?? null;
  }

  async function handleMentorRequestDecision(
    requestId: string,
    decision: "accept" | "reject" | "confirm"
  ) {
    if (actionRequestId) return;
    setActionRequestId(requestId);
    setMentorRequestError(null);
    try {
      if (decision === "accept") {
        await httpClient.post(endpoints.requestMentorAccept(requestId));
      } else if (decision === "confirm") {
        await httpClient.post(endpoints.requestMentorConfirm(requestId));
      } else {
        await httpClient.post(endpoints.requestMentorReject(requestId));
      }
      const refreshed = await httpClient.get<LearningRequestResponse[]>(
        endpoints.requestsMentorIncoming
      );
      setMentorRequests(refreshed.data);
      setData((prev) =>
        prev
          ? {
              ...prev,
              mentor: prev.mentor
                ? {
                    ...prev.mentor,
                    requestsReceivedCount: refreshed.data.length,
                  }
                : prev.mentor,
            }
          : prev
      );
    } catch (err) {
      setMentorRequestError(normalizeApiError(err));
    } finally {
      setActionRequestId(null);
    }
  }

  if (loading) {
    return (
      <p className="px-4 py-6 text-sm text-slate-600" aria-live="polite">
        Loading dashboard…
      </p>
    );
  }
  if (error) {
    return (
      <div className="max-w-md space-y-4 px-4 py-6">
        <p className="alert-error">{error}</p>
        <button
          type="button"
          onClick={() => navigate("/login")}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          Sign in
        </button>
      </div>
    );
  }
  if (!data) {
    return <p className="px-4 py-6 text-slate-600">No dashboard data.</p>;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className="px-4 py-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {currentMode === "learn" ? "Learn" : "Teach"}
              </h1>
              <p className="text-sm text-slate-600">Welcome back!</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveTab("messages");
                navigate("/profiles");
              }}
              className="relative rounded-full p-2 transition-colors hover:bg-slate-100"
            >
              <MessageCircle className="h-6 w-6 text-slate-700" />
              <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-rose-500" />
            </button>
          </div>

          <div className="flex rounded-full bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setCurrentMode("learn")}
              className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                currentMode === "learn"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-600"
              }`}
            >
              Learn Mode
            </button>
            <button
              type="button"
              onClick={() => setCurrentMode("teach")}
              className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                currentMode === "teach"
                  ? "bg-white text-purple-600 shadow-sm"
                  : "text-slate-600"
              }`}
            >
              Teach Mode
            </button>
          </div>
        </div>
      </header>

      <div className="px-4 py-6">
        <AnimatePresence mode="wait">
          {currentMode === "learn" ? (
            <motion.div
              key="learn"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div>
                <h2 className="mb-3 text-lg font-semibold text-slate-900">
                  What do you want to learn?
                </h2>
                <button
                  type="button"
                  onClick={() => navigate("/requests/create")}
                  className="flex w-full items-center gap-3 rounded-2xl border-2 border-slate-200 bg-white p-4 transition-colors hover:border-indigo-300"
                >
                  <Search className="h-5 w-5 text-slate-400" />
                  <span className="flex-1 text-left text-slate-500">
                    Create a learning request...
                  </span>
                  <ChevronRight className="h-5 w-5 text-slate-300" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/search")}
                  className="rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 p-4 text-left text-white"
                >
                  <MapPin className="mb-2 h-6 w-6" />
                  <p className="font-semibold">Find Nearby</p>
                  <p className="text-xs opacity-90">Discover local mentors</p>
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/profiles/mentee")}
                  className="rounded-2xl bg-gradient-to-br from-emerald-500 to-green-500 p-4 text-left text-white"
                >
                  <Users className="mb-2 h-6 w-6" />
                  <p className="font-semibold">Preferences</p>
                  <p className="text-xs opacity-90">Update learning profile</p>
                </button>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Upcoming Sessions
                  </h2>
                  <button
                    type="button"
                    onClick={() => setActiveTab("sessions")}
                    className="text-sm text-indigo-600 hover:text-indigo-700"
                  >
                    View all
                  </button>
                </div>
                <div className="space-y-3">
                  {upcomingSessions.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                      No upcoming requests yet. Create one to get matched.
                    </div>
                  ) : (
                    upcomingSessions.map((session) => (
                      <div
                        key={session.id}
                        className="rounded-2xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md"
                      >
                        <div className="mb-3 flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-slate-900">
                              {session.category} · {session.subcategory}
                            </h3>
                            <p className="text-sm text-slate-600">
                              Request ID: {session.id}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${statusClass(session.status)}`}
                          >
                            {session.status}
                          </span>
                        </div>
                        <div className="mb-3 flex items-center gap-4 text-sm text-slate-600">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {new Date(session.createdAt).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            {session.mode === "online" ? (
                              <Video className="h-4 w-4" />
                            ) : (
                              <MapPin className="h-4 w-4" />
                            )}
                            {session.mode}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => navigate("/requests/create")}
                          className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
                        >
                          Update Request
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Recommended for you
                  </h2>
                  <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="text-sm text-indigo-600 hover:text-indigo-700"
                  >
                    See more
                  </button>
                </div>
                <div className="space-y-3">
                  {(mentorSkills.length ? mentorSkills : ["Math", "Coding"]).map(
                    (skill, index) => (
                      <div
                        key={`${skill}-${index}`}
                        className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md"
                        onClick={() => navigate("/")}
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500">
                            <BookOpen className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-900">
                              {skill}
                            </h3>
                            <p className="mb-2 text-sm text-slate-600">
                              Explore mentors and sessions in this topic
                            </p>
                            <div className="text-sm text-slate-500">
                              Based on your dashboard activity
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="teach"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-[#101A5C] p-5 text-white">
                  <IndianRupee className="mb-2 h-6 w-6 text-[#DFFF2F]" />
                  <p className="mb-1 text-2xl font-bold">
                    ₹{data.mentor?.hourlyRate ?? data.recommendedPrice}
                  </p>
                  <p className="text-sm text-white/70">MentiMentor rate / hr</p>
                </div>
                <div className="rounded-2xl bg-[#243B8F] p-5 text-white">
                  <Users className="mb-2 h-6 w-6 text-[#DFFF2F]" />
                  <p className="mb-1 text-2xl font-bold">
                    {data.mentor?.mentimentorRating
                      ? Number(data.mentor.mentimentorRating).toFixed(1)
                      : "—"}
                  </p>
                  <p className="text-sm text-white/70">
                    Rating · {data.mentor?.profileCompletenessPercent ?? 0}% profile
                  </p>
                </div>
              </div>

              {data.mentor?.onboardingStatus !== "COMPLETED" ? (
                <button
                  type="button"
                  onClick={() => navigate("/profiles/mentor")}
                  className="w-full rounded-2xl border border-[#243B8F]/20 bg-[#DFFF2F] px-4 py-3 text-left text-sm font-semibold text-[#101A5C]"
                >
                  Continue mentor onboarding →
                </button>
              ) : null}

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">
                    New Mentoring Requests
                  </h2>
                  <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-medium text-rose-700">
                    {mentorRequests.length} open
                  </span>
                </div>
                {mentorRequestError ? (
                  <p className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                    {mentorRequestError}
                  </p>
                ) : null}
                <div className="space-y-3">
                  {mentorRequests.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                      No requests yet. Complete capability onboarding so learners can match with you.
                    </div>
                  ) : (
                    mentorRequests.slice(0, 5).map((request) => {
                      const remaining = remainingFor(request);
                      const awaiting = request.status === "AWAITING_CONFIRMATION";
                      return (
                      <div
                        key={request.id}
                        className="rounded-2xl border border-slate-200 bg-white p-4"
                      >
                        <div className="mb-3 flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-slate-900">
                              {request.category} · {request.subcategory}
                            </h3>
                            <p className="text-sm text-slate-600">
                              {request.preferredSchedule || request.scheduleType}
                              {request.locationPreference
                                ? ` · ${request.locationPreference}`
                                : ""}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${statusClass(request.status)}`}
                          >
                            {request.status.replaceAll("_", " ")}
                          </span>
                        </div>
                        {awaiting && remaining != null ? (
                          <div className="mb-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
                            Confirming your session ·{" "}
                            <span className="font-bold tabular-nums">
                              {formatCountdown(remaining)}
                            </span>{" "}
                            remaining
                          </div>
                        ) : null}
                        <div className="mb-4 flex items-center gap-4 text-sm text-slate-600">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {request.scheduleType}
                          </span>
                          <span className="flex items-center gap-1">
                            {request.mode === "online" ? (
                              <Video className="h-4 w-4" />
                            ) : (
                              <MapPin className="h-4 w-4" />
                            )}
                            {request.mode}
                          </span>
                        </div>
                        {awaiting ? (
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleMentorRequestDecision(request.id, "reject")
                              }
                              disabled={actionRequestId === request.id}
                              className="rounded-xl border border-slate-300 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                              Release
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleMentorRequestDecision(request.id, "confirm")
                              }
                              disabled={actionRequestId === request.id}
                              className="rounded-xl bg-[#243B8F] py-2 text-sm font-medium text-white transition hover:bg-[#101A5C]"
                            >
                              Confirm session
                            </button>
                          </div>
                        ) : (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleMentorRequestDecision(request.id, "reject")
                            }
                            disabled={actionRequestId === request.id}
                            className="rounded-xl border border-slate-300 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                          >
                            {actionRequestId === request.id
                              ? "Updating..."
                              : "Decline"}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleMentorRequestDecision(request.id, "accept")
                            }
                            disabled={actionRequestId === request.id}
                            className="rounded-xl bg-[#243B8F] py-2 text-sm font-medium text-white transition hover:bg-[#101A5C]"
                          >
                            {actionRequestId === request.id
                              ? "Updating..."
                              : "Accept Request"}
                          </button>
                        </div>
                        )}
                      </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="mb-4 flex items-center gap-2 font-semibold text-slate-900">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                  Your Performance
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Mentor test</span>
                    <span className="font-semibold">{data.mentor?.testStatus ?? "N/A"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">
                      Sessions Completed
                    </span>
                    <span className="font-semibold">
                      {data.learningHistory.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Price guidance</span>
                    <span className="font-semibold text-emerald-600">
                      ₹{data.recommendedPrice}/hr
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white px-2 py-2 shadow-lg">
        <div className="mx-auto flex max-w-lg items-center justify-around">
          <button
            type="button"
            onClick={() => {
              setActiveTab("home");
              navigate("/dashboard");
            }}
            className={`flex flex-col items-center gap-1 rounded-xl px-4 py-2 transition-colors ${
              activeTab === "home" ? "bg-indigo-50 text-indigo-600" : "text-slate-600"
            }`}
          >
            <HomeIcon className="h-6 w-6" />
            <span className="text-xs font-medium">Home</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("sessions")}
            className={`flex flex-col items-center gap-1 rounded-xl px-4 py-2 transition-colors ${
              activeTab === "sessions"
                ? "bg-indigo-50 text-indigo-600"
                : "text-slate-600"
            }`}
          >
            <Calendar className="h-6 w-6" />
            <span className="text-xs font-medium">Sessions</span>
          </button>
          <button
            type="button"
            onClick={() => navigate("/requests/create")}
            className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg"
          >
            <Plus className="h-6 w-6 text-white" />
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("messages");
              navigate("/profiles");
            }}
            className={`relative flex flex-col items-center gap-1 rounded-xl px-4 py-2 transition-colors ${
              activeTab === "messages"
                ? "bg-indigo-50 text-indigo-600"
                : "text-slate-600"
            }`}
          >
            <MessageCircle className="h-6 w-6" />
            <span className="text-xs font-medium">Messages</span>
            <span className="absolute right-2 top-1 h-2 w-2 rounded-full bg-rose-500" />
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("profile");
              navigate("/profiles");
            }}
            className={`flex flex-col items-center gap-1 rounded-xl px-4 py-2 transition-colors ${
              activeTab === "profile"
                ? "bg-indigo-50 text-indigo-600"
                : "text-slate-600"
            }`}
          >
            <User className="h-6 w-6" />
            <span className="text-xs font-medium">Profile</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
