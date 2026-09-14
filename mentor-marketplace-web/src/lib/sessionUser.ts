const USER_ID_KEY = "mm_user_id";
const ACCESS_TOKEN_KEY = "mm_access_token";
const ROLES_KEY = "mm_roles";

export function getStoredUserId(): string | null {
  try {
    return sessionStorage.getItem(USER_ID_KEY);
  } catch {
    return null;
  }
}

export function setStoredUserId(userId: string): void {
  try {
    sessionStorage.setItem(USER_ID_KEY, userId);
  } catch {
    /* ignore quota / private mode */
  }
}

export function getStoredAccessToken(): string | null {
  try {
    return sessionStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredAccessToken(token: string): void {
  try {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
  } catch {
    /* ignore */
  }
}

export function clearStoredSession(): void {
  try {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(USER_ID_KEY);
    sessionStorage.removeItem(ROLES_KEY);
  } catch {
    /* ignore */
  }
}

export function setStoredRoles(roles: string[]): void {
  try {
    sessionStorage.setItem(ROLES_KEY, JSON.stringify(roles));
  } catch {
    /* ignore */
  }
}

export function getStoredRoles(): string[] {
  try {
    const raw = sessionStorage.getItem(ROLES_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((r): r is string => typeof r === "string")
      : [];
  } catch {
    return [];
  }
}
