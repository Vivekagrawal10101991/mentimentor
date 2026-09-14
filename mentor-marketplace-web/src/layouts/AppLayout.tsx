import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { User } from "lucide-react";
import { Logo } from "@/components/Logo";
import { clearStoredSession, getStoredAccessToken } from "@/lib/sessionUser";

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const signedIn = !!getStoredAccessToken();
  const isSimpleLayoutRoute =
    location.pathname === "/" ||
    location.pathname === "/login" ||
    location.pathname === "/signup" ||
    location.pathname === "/account/verification" ||
    location.pathname === "/account/details" ||
    location.pathname === "/admin/login" ||
    location.pathname === "/admin/kyc" ||
    location.pathname === "/parent-verification" ||
    location.pathname === "/profiles" ||
    location.pathname === "/profiles/mentee" ||
    location.pathname === "/profiles/mentor" ||
    location.pathname === "/mentor-onboarding" ||
    location.pathname === "/search" ||
    location.pathname === "/search/offline" ||
    (location.pathname.startsWith("/mentors/") &&
      (location.pathname.endsWith("/book") ||
        location.pathname.endsWith("/session-request"))) ||
    location.pathname === "/dashboard" ||
    location.pathname === "/study-partner" ||
    location.pathname === "/video-session" ||
    /^\/bookings\/[^/]+\/confirm$/.test(location.pathname) ||
    /^\/bookings\/[^/]+\/video-session$/.test(location.pathname);

  if (isSimpleLayoutRoute) {
    return (
      <div className="min-h-screen bg-white">
        <Outlet />
      </div>
    );
  }

  function signOut() {
    clearStoredSession();
    navigate("/", { replace: true });
  }

  return (
    <div className="page-shell">
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4">
          <Link
            to="/"
            className="group flex items-center rounded-2xl outline-none transition focus-visible:ring-4 focus-visible:ring-primary-500/25"
          >
            <Logo className="h-8 w-auto" />
          </Link>
          <nav className="flex flex-wrap items-center justify-end gap-0.5 sm:gap-1">
            <Link
              to="/"
              className="rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition duration-250 hover:bg-slate-100/80 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/35"
            >
              Home
            </Link>
            {signedIn ? (
              <>
                <Link
                  to="/profiles"
                  className="rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition duration-250 hover:bg-slate-100/80 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/35"
                >
                  Profiles
                </Link>
                <Link
                  to="/dashboard"
                  className="rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition duration-250 hover:bg-slate-100/80 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/35"
                >
                  Dashboard
                </Link>
                <Link
                  to="/requests/create"
                  className="rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition duration-250 hover:bg-slate-100/80 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/35"
                >
                  Learn
                </Link>
                <Link
                  to="/profiles"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 transition duration-250 hover:bg-slate-100/80 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/35"
                  aria-label="My account"
                  title="My account"
                >
                  <User className="h-5 w-5" strokeWidth={2} />
                </Link>
                <button
                  type="button"
                  onClick={signOut}
                  className="rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition duration-250 hover:bg-slate-100/80 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/35"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition duration-250 hover:bg-slate-100/80 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/35"
                >
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  className="rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition duration-250 hover:bg-slate-100/80 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/35"
                >
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10 lg:py-12">
        <Outlet />
      </main>
    </div>
  );
}
