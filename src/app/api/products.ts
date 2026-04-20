import { apiClient } from "./client";
import {
  ApiResponse,
  CursorResponse,
  ProductSummary,
  ProductDetail,
  ProductPayload,
  Category,
  PopularKeywordsResponse,
  TradeReserveResponse,
} from "../types";

const CATEGORY_STORAGE_KEY = "getchu.categories";

const FALLBACK_CATEGORIES: Category[] = [
  { id: 1, name: "디지털기기" },
  { id: 2, name: "생활가전" },
  { id: 3, name: "가구/인테리어" },
  { id: 4, name: "패션" },
  { id: 5, name: "도서" },
  { id: 6, name: "스포츠/레저" },
  { id: 7, name: "기타" },
];

export const productsApi = {
  // ─── 카테고리 ──────────────────────────────────────────
  getCategories: async (): Promise<Category[]> => {
    try {
      const response = await apiClient.get<ApiResponse<Category[]>>("/categories");
      const categories = response.data.data?.length ? response.data.data : FALLBACK_CATEGORIES;
      localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(categories));
      return categories;
    } catch {
      const cached = localStorage.getItem(CATEGORY_STORAGE_KEY);

      if (cached) {
        try {
          return JSON.parse(cached) as Category[];
        } catch {
          localStorage.removeItem(CATEGORY_STORAGE_KEY);
        }
      }

      return FALLBACK_CATEGORIES;
    }
  },

  // ─── 상품 목록 (검색 통합) ─────────────────────────────
  // 백엔드: GET /products?keyword=&categoryId=&status=&cursor=
  // /products/search 엔드포인트는 백엔드에 없음
  getProducts: async (params?: {
    keyword?: string;
    categoryId?: number;
    status?: string;
    cursor?: string;
    size?: number;
  }): Promise<CursorResponse<ProductSummary>> => {
    const response = await apiClient.get<ApiResponse<CursorResponse<ProductSummary>>>(
      "/products",
      { params }
    );
    return response.data.data;
  },

  // searchProducts는 getProducts로 통합 (동일 엔드포인트)
  searchProducts: async (params?: {
    keyword?: string;
    categoryId?: number;
    status?: string;
    cursor?: string;
    size?: number;
  }): Promise<CursorResponse<ProductSummary>> => {
    return productsApi.getProducts(params);
  },

  // ─── 상품 상세 ─────────────────────────────────────────
  getProduct: async (id: number): Promise<ProductDetail> => {
    const response = await apiClient.get<ApiResponse<ProductDetail>>(`/products/${id}`);
    return response.data.data;
  },

  // ─── 상품 등록 ─────────────────────────────────────────
  createProduct: async (payload: ProductPayload): Promise<ProductDetail> => {
    const response = await apiClient.post<ApiResponse<ProductDetail>>("/products", payload);
    return response.data.data;
  },

  // ─── 상품 수정 ─────────────────────────────────────────
  updateProduct: async (id: number, payload: ProductPayload): Promise<ProductDetail> => {
    const response = await apiClient.patch<ApiResponse<ProductDetail>>(
      `/products/${id}`,
      payload
    );
    return response.data.data;
  },

  // ─── 상품 삭제 ─────────────────────────────────────────
  deleteProduct: async (id: number): Promise<void> => {
    await apiClient.delete(`/products/${id}`);
  },

  // ─── 예약 ──────────────────────────────────────────────
  reserveProduct: async (id: number): Promise<TradeReserveResponse> => {
    const response = await apiClient.post<ApiResponse<TradeReserveResponse>>(
      `/products/${id}/reserve`
    );
    return response.data.data;
  },

  // ─── 찜 ────────────────────────────────────────────────
  createLike: async (id: number): Promise<void> => {
    await apiClient.post(`/products/${id}/likes`);
  },

  deleteLike: async (id: number): Promise<void> => {
    await apiClient.delete(`/products/${id}/likes`);
  },

  // ─── 인기 검색어 ───────────────────────────────────────
  getPopularKeywords: async (): Promise<PopularKeywordsResponse> => {
    const response = await apiClient.get<ApiResponse<PopularKeywordsResponse>>(
      "/search/popular"
    );
    return response.data.data;
  },
};
