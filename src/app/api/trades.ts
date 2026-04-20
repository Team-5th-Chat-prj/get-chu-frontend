import { apiClient } from "./client";
import { ApiResponse, Trade, TradeDetail, TradeStatus, TradeRole } from "../types";

export const tradesApi = {
  // ─── 거래 내역 목록 ────────────────────────────────────
  // 백엔드 TradeRole enum: SELLER | BUYER (대문자)
  getMyTrades: async (role: TradeRole): Promise<Trade[]> => {
    const response = await apiClient.get<ApiResponse<Trade[]>>("/members/me/trades", {
      params: { role },
    });
    return response.data.data;
  },

  // ─── 거래 상세 ─────────────────────────────────────────
  getTradeDetail: async (tradeId: number): Promise<TradeDetail> => {
    const response = await apiClient.get<ApiResponse<TradeDetail>>(`/trades/${tradeId}`);
    return response.data.data;
  },

  // ─── 거래 상태 변경 ────────────────────────────────────
  // 허용 전이: RESERVED→TRADING(판매자), TRADING→SOLD(구매자), RESERVED/TRADING→SALE(취소)
  updateTradeStatus: async (tradeId: number, status: TradeStatus): Promise<void> => {
    await apiClient.patch(`/trades/${tradeId}/status`, { status });
  },

  // ─── 리뷰 작성 ─────────────────────────────────────────
  // 백엔드 ReviewRequest: rating(BigDecimal), content(String)
  // 응답: Void (data null)
  createReview: async (
    tradeId: number,
    data: { rating: number; content: string }
  ): Promise<void> => {
    await apiClient.post(`/trades/${tradeId}/reviews`, data);
  },
};
