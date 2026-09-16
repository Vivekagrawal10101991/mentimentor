import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Award,
  Bell,
  Calendar,
  ChevronRight,
  Edit,
  FileText,
  HelpCircle,
  Home,
  IndianRupee,
  LogOut,
  Settings,
  Shield,
  Star,
  UserCircle,
} from "lucide-react";
import { normalizeApiError } from "@/lib/apiError";
import { DeleteAccountSection } from "@/components/DeleteAccountSection";
import { clearStoredSession, getStoredAccessToken, getStoredUserId } from "@/lib/sessionUser";
import { endpoints, httpClient } from "@/services/api";
import type { UserProfile, UserProfileEnvelope } from "@/types";

function displayNameFromProfile(p: UserProfile | null): string {
  if (!p) {
    return "…";
  }
  const f = p.firstName?.trim() ?? "";
  const l = p.lastName?.trim() ?? "";
  const combined = `${f} ${l}`.trim();
  return combined || "Add your name";
}

function avatarInitial(p: UserProfile | null, userId: string | null): string {
  const fromName = p?.firstName?.trim()?.charAt(0) ?? p?.lastName?.trim()?.charAt(0);
  if (fromName) {
    return fromName.toUpperCase();
  }
  const fromPhone = p?.phoneNumber?.replace(/\D/g, "").charAt(0);
  if (fromPhone) {
    return fromPhone;
  }
  if (userId) {
    return userId.replace(/-/g, "").charAt(0).toUpperCase() || "Y";
  }
  return "Y";
}

export function PostLoginHubPage() {
  const navigate = useNavigate();
  const storedUserId = getStoredUserId();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [avatarBroken, setAvatarBroken] = useState(false);

  const loadProfile = useCallback(async () => {
    const { data } = await httpClient.get<UserProfileEnvelope>(endpoints.usersMe);
    setAvatarBroken(false);
    setProfile(data.data);
  }, []);

  useEffect(() => {
    if (!getStoredAccessToken()) {
      navigate("/login", { replace: true });
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        await loadProfile();
      } catch (e) {
        if (!cancelled) {
          setLoadError(normalizeApiError(e));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadProfile, navigate]);

  const displayName = useMemo(() => displayNameFromProfile(profile), [profile]);
  const avatarLetter = useMemo(
    () => avatarInitial(profile, storedUserId),
    [profile, storedUserId]
  );
  const roleLine = useMemo(() => {
    const roles = profile?.roles?.length
      ? profile.roles.map((r) => r.charAt(0).toUpperCase() + r.slice(1)).join(" • ")
      : "Member";
    return roles;
  }, [profile]);

  const stats = [
    { label: "Sessions", value: "23", icon: Calendar },
    { label: "Rating", value: "4.8", icon: Star },
    { label: "Earned", value: "₹4.2k", icon: IndianRupee },
  ];

  const menuItems = [
    {
      icon: UserCircle,
      label: "Name & account",
      onClick: () => navigate("/account/details"),
    },
    { icon: Edit, label: "Edit Mentee Profile", onClick: () => navigate("/profiles/mentee") },
    { icon: Bell, label: "Notifications", badge: "3", onClick: () => navigate("/dashboard") },
    { icon: Calendar, label: "My Sessions", onClick: () => navigate("/dashboard") },
    { icon: Award, label: "Mentor Profile", onClick: () => navigate("/profiles/mentor") },
    { icon: Shield, label: "Privacy & Safety", onClick: () => navigate("/parent-verification") },
    { icon: FileText, label: "Terms & Conditions", onClick: () => navigate("/") },
    { icon: HelpCircle, label: "Help & Support", onClick: () => navigate("/") },
    { icon: Settings, label: "Settings", onClick: () => navigate("/dashboard") },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white px-4 py-4">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <Home className="h-4 w-4" aria-hidden />
              Home
            </button>
            <h1 className="truncate text-lg font-semibold text-slate-900">Profile</h1>
          </div>
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="shrink-0 rounded-full p-2 transition-colors hover:bg-slate-100"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5 text-slate-600" />
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
        {loadError && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {loadError}
          </div>
        )}

        <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-600 p-6 text-white">
          <div className="mb-6 flex items-start gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-white/30 bg-white/20 backdrop-blur-sm">
              {profile?.avatarUrl && !avatarBroken ? (
                <img
                  src={profile.avatarUrl}
                  alt=""
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={() => setAvatarBroken(true)}
                />
              ) : (
                <span className="text-3xl font-bold">{avatarLetter}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="mb-1 truncate text-2xl font-bold">{displayName}</h2>
              <p className="mb-3 truncate text-indigo-100">{roleLine}</p>
              <div className="flex flex-wrap gap-2">
                {profile?.accountVerificationComplete ? (
                  <span className="rounded-full bg-white/20 px-2.5 py-1 text-xs font-medium">
                    Account verified
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => navigate("/account/verification")}
                    className="rounded-full bg-white/25 px-2.5 py-1 text-xs font-medium hover:bg-white/35"
                  >
                    Complete verification
                  </button>
                )}
                {profile?.selfKycStatus === "VERIFIED" && (
                  <span className="rounded-full bg-white/20 px-2.5 py-1 text-xs font-medium">
                    Identity verified
                  </span>
                )}
                {profile?.parentKycStatus === "VERIFIED" && (
                  <span className="rounded-full bg-white/20 px-2.5 py-1 text-xs font-medium">
                    Parent / guardian OK
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate("/account/details")}
              className="shrink-0 rounded-full bg-white/20 p-2 transition-colors hover:bg-white/30"
              aria-label="Edit name"
            >
              <Edit className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="rounded-xl border border-white/20 bg-white/10 p-3 text-center backdrop-blur-sm"
                >
                  <Icon className="mx-auto mb-2 h-5 w-5 opacity-90" />
                  <p className="mb-1 text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs opacity-90">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="mb-3 font-semibold text-slate-900">Learning</h3>
          <div className="mb-4 flex flex-wrap gap-2">
            {["Mathematics", "Physics", "Chemistry"].map((subject) => (
              <span
                key={subject}
                className="rounded-full bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700"
              >
                {subject}
              </span>
            ))}
          </div>
          <h3 className="mb-3 font-semibold text-slate-900">Teaching</h3>
          <div className="flex flex-wrap gap-2">
            {["English", "Art"].map((subject) => (
              <span
                key={subject}
                className="rounded-full bg-purple-50 px-3 py-1.5 text-sm font-medium text-purple-700"
              >
                {subject}
              </span>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                onClick={item.onClick}
                className={`flex w-full items-center gap-3 px-5 py-4 transition-colors hover:bg-slate-50 ${
                  index !== menuItems.length - 1 ? "border-b border-slate-100" : ""
                }`}
              >
                <Icon className="h-5 w-5 text-slate-600" />
                <span className="flex-1 text-left font-medium text-slate-900">
                  {item.label}
                </span>
                {item.badge && (
                  <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700">
                    {item.badge}
                  </span>
                )}
                <ChevronRight className="h-5 w-5 text-slate-400" />
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="flex h-12 w-full items-center justify-center rounded-xl border border-rose-300 text-rose-600 transition hover:bg-rose-50"
          onClick={() => {
            clearStoredSession();
            navigate("/", { replace: true });
          }}
        >
          <LogOut className="mr-2 h-5 w-5" />
          Logout
        </button>

        <DeleteAccountSection />

        <p className="text-center text-sm text-slate-500">
          Version 1.0.0 • Made with care in India
        </p>
      </div>
    </div>
  );
}
