const RETURN_KEY = "mm_post_auth_return";

/** Store an in-app path (must start with /) to open after successful authentication. */
export function setPostAuthReturn(path: string): void {
  if (!path.startsWith("/")) {
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
    if (v && v.startsWith("/")) {
      return v;
    }
    return null;
  } catch {
    return null;
  }
}
