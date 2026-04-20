import { apiClient } from "./client";
import { Member, ApiResponse } from "../types";

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  expiresIn: number;
}

export const authApi = {
  login: async (credentials: {
    email: string;
    password: string;
  }): Promise<LoginResponse> => {
    const response = await apiClient.post<ApiResponse<LoginResponse>>(
      "/auth/login",
      credentials
    );
    return response.data.data;
  },

  signup: async (userData: {
    email: string;
    password: string;
    nickname: string;
    profileImageUrl?: string;
  }): Promise<Member> => {
    const response = await apiClient.post<ApiResponse<Member>>(
      "/auth/signup",
      userData
    );
    return response.data.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post("/auth/logout");
  },

  refresh: async (refreshToken: string): Promise<LoginResponse> => {
    const response = await apiClient.post<ApiResponse<LoginResponse>>(
      "/auth/refresh",
      { refreshToken }
    );
    return response.data.data;
  },
};
