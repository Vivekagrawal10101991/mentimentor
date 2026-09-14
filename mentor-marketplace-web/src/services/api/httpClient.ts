import axios, { type AxiosInstance } from "axios";
import { apiBaseUrl } from "@/config/env";
import { getStoredAccessToken } from "@/lib/sessionUser";

function createHttpClient(): AxiosInstance {
  const client = axios.create({
    baseURL: apiBaseUrl || undefined,
    headers: {
      "Content-Type": "application/json",
    },
    timeout: 30_000,
  });

  client.interceptors.request.use((config) => {
    const token = getStoredAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
