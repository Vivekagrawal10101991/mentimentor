import type { NavigateFunction } from "react-router-dom";
import { getStoredAccessToken } from "@/lib/sessionUser";

const RETURN_KEY = "mm_post_auth_return";

/** Store an in-app path (must start with /) to open after successful authentication. */
export function setPostAuthReturn(path: string): void {
  if (!path.startsWith("/") || path.startsWith("//")) {
    return;
  }
  try {
    sessionStorage.setItem(RETURN_KEY, path);
  } catch {
    /* ignore */
  }
}

/** Returns the stored path once, then clears it. */
export function consumePostAuthReturn(): string | null {
  try {
    const v = sessionStorage.getItem(RETURN_KEY);
    sessionStorage.removeItem(RETURN_KEY);
    if (v && v.startsWith("/") && !v.startsWith("//")) {
      return v;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Navigate to an in-app destination. If the user is not signed in, store the
 * destination and send them to login/signup first.
 */
export function navigateRequiringAuth(
  navigate: NavigateFunction,
  destination: string,
  options?: { authPath?: "/login" | "/signup"; replace?: boolean }
): void {
  const authPath = options?.authPath ?? "/login";
  const replace = options?.replace ?? false;

  if (getStoredAccessToken()) {
    navigate(destination, { replace });
    return;
  }

  setPostAuthReturn(destination);
  const separator = authPath.includes("?") ? "&" : "?";
  navigate(
    `${authPath}${separator}next=${encodeURIComponent(destination)}`,
    { replace }
  );
}
