import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from "axios";
import { apiBaseUrl } from "@/config/env";
import { getStoredAccessToken } from "@/lib/sessionUser";

function createHttpClient(): AxiosInstance {
  const client = axios.create({
    baseURL: apiBaseUrl || undefined,
    timeout: 30_000,
  });

  client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = getStoredAccessToken();
    if (token) {
      config.headers.set("Authorization", `Bearer ${token}`);
    }

    const method = (config.method ?? "get").toLowerCase();
    const hasBody =
      config.data !== undefined && config.data !== null && config.data !== "";

    // Only set JSON Content-Type when there is a body. A bodyless DELETE with
    // Content-Type: application/json can break CORS preflight so the browser
    // omits Authorization — which surfaces as "Authentication required".
    if (hasBody && (method === "post" || method === "put" || method === "patch")) {
      if (!config.headers.get("Content-Type")) {
        config.headers.set("Content-Type", "application/json");
      }
    } else {
      config.headers.delete("Content-Type");
    }

    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    (error) => Promise.reject(error)
  );

  return client;
}

export const httpClient = createHttpClient();
