// Dev default: call Spring Boot directly on :8080.
// Production default: same-origin /api (edge Nginx strips /api and proxies to the backend).
const raw =
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.DEV ? "http://localhost:8080" : "/api");

export const apiBaseUrl = raw.replace(/\/$/, "");

/** Google OAuth Web client ID (optional). */
export const googleClientId = (
  import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ""
).trim();
