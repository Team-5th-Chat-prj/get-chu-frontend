import { apiClient } from "./client";
import {
  ApiResponse,
  CursorResponse,
  Member,
  PublicMember,
  ProductSummary,
  Review,
} from "../types";

export const membersApi = {
  // ─── 내 프로필 ─────────────────────────────────────────
  getMe: async (): Promise<Member> => {
    const response = await apiClient.get<ApiResponse<Member>>("/members/me");
    return response.data.data;
  },

  updateProfile: async (data: {
    nickname: string;
    profileImageUrl?: string;
  }): Promise<Member> => {
    const response = await apiClient.patch<ApiResponse<Member>>("/members/me", data);
    return response.data.data;
  },

  updatePassword: async (data: {
    oldPassword: string;
    newPassword: string;
  }): Promise<void> => {
    await apiClient.patch("/members/me/password", data);
  },

  deleteAccount: async (): Promise<void> => {
    await apiClient.delete("/members/me");
  },

  // ─── 타 회원 프로필 ────────────────────────────────────
  getMember: async (memberId: number): Promise<PublicMember> => {
    const response = await apiClient.get<ApiResponse<PublicMember>>(`/members/${memberId}`);
    return response.data.data;
  },

  // ─── 내 판매 목록 ──────────────────────────────────────
  // 백엔드: GET /products/me (ProductController)
  getMyProducts: async (params?: {
    status?: string;
    cursor?: string;
    size?: number;
  }): Promise<CursorResponse<ProductSummary>> => {
    const response = await apiClient.get<ApiResponse<CursorResponse<ProductSummary>>>(
      "/products/me",
      { params }
    );
    return response.data.data;
  },

  // ─── 내 찜 목록 ────────────────────────────────────────
  getMyLikes: async (params?: {
    cursor?: string;
    size?: number;
  }): Promise<CursorResponse<ProductSummary>> => {
    const response = await apiClient.get<ApiResponse<CursorResponse<ProductSummary>>>(
      "/members/me/likes",
      { params }
    );
    return response.data.data;
  },

  // ─── 작성한 리뷰 목록 ─────────────────────────────────
  // 백엔드: GET /members/{memberId}/reviews/written
  getWrittenReviews: async (
    memberId: number,
    params?: { cursor?: string; size?: number }
  ): Promise<CursorResponse<Review>> => {
    const response = await apiClient.get<ApiResponse<CursorResponse<Review>>>(
      `/members/${memberId}/reviews/written`,
      { params }
    );
    return response.data.data;
  },

  // ─── 회원 리뷰 목록 ────────────────────────────────────
  getMemberReviews: async (
    memberId: number,
    params?: { cursor?: string; size?: number }
  ): Promise<CursorResponse<Review>> => {
    const response = await apiClient.get<ApiResponse<CursorResponse<Review>>>(
      `/members/${memberId}/reviews`,
      { params }
    );
    return response.data.data;
  },
};
