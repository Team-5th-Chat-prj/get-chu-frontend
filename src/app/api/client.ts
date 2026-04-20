import axios from "axios";
import { authApi } from "./auth";

export const apiClient = axios.create({
  baseURL: "/api",
  timeout: 10000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  const isAuthPath = config.url?.startsWith("/auth/login") || config.url?.startsWith("/auth/signup");
  if (token && !isAuthPath) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response) {
      console.error(
        `[API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}`,
        `→ ${error.response.status}`,
        error.response.data
      );

      // 401 + 아직 재시도 안 한 경우 → refresh 시도
      if (error.response.status === 401 && !originalRequest._retry) {
        // refresh 엔드포인트 자체가 401이면 무한루프 방지
        if (originalRequest.url?.includes("/auth/refresh")) {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
          window.dispatchEvent(new CustomEvent("auth:expired"));
          return Promise.reject(error);
        }

        const refreshToken = localStorage.getItem("refreshToken");

        if (!refreshToken) {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("user");
          window.dispatchEvent(new CustomEvent("auth:expired"));
          return Promise.reject(error);
        }

        if (isRefreshing) {
          // 이미 갱신 중이면 큐에 대기
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const res = await authApi.refresh(refreshToken);
          const newToken = res.accessToken;
          localStorage.setItem("accessToken", newToken);
          if (res.refreshToken) localStorage.setItem("refreshToken", res.refreshToken);
          processQueue(null, newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
          window.dispatchEvent(new CustomEvent("auth:expired"));
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }
    } else {
      console.error("[API Error] Network/Timeout:", error.message);
    }
    return Promise.reject(error);
  }
);
