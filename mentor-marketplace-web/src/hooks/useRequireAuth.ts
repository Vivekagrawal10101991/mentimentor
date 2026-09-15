import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { navigateRequiringAuth } from "@/lib/postAuthRedirect";
import { getStoredAccessToken } from "@/lib/sessionUser";

/**
 * Blocks rendering until the user is signed in. Unsigned visitors are sent to
 * login (with return to the current path, or `fallbackReturn`).
 */
export function useRequireAuth(options?: {
  authPath?: "/login" | "/signup";
  fallbackReturn?: string;
}): boolean {
  const navigate = useNavigate();
  const location = useLocation();
  const [allowed, setAllowed] = useState(() => !!getStoredAccessToken());

  useEffect(() => {
    if (getStoredAccessToken()) {
      setAllowed(true);
      return;
    }
    setAllowed(false);
    const returnTo =
      options?.fallbackReturn ?? `${location.pathname}${location.search}`;
    navigateRequiringAuth(navigate, returnTo, {
      authPath: options?.authPath ?? "/login",
      replace: true,
    });
  }, [
    navigate,
    location.pathname,
    location.search,
    options?.authPath,
    options?.fallbackReturn,
  ]);

  return allowed;
}
