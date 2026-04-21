import { apiClient } from "./client";
import { ApiResponse, CursorResponse, ChatRoomSummary, ChatRoomResponse, ChatMessage } from "../types";

export const chatApi = {
  // ─── 채팅방 생성 (중복 시 기존 방 반환) ───────────────
  // TODO: 백엔드 Product 도메인 담당자가 ChatRoomService에서 productId로 sellerId를 자동 조회하도록
  //       수정 완료되면 → sellerId 파라미터 제거하고 { productId } 만 전송하도록 변경
  createChatRoom: async (productId: number, sellerId: number): Promise<ChatRoomResponse> => {
    const response = await apiClient.post<ApiResponse<ChatRoomResponse>>("/chat-rooms", {
      productId,
      sellerId,
    });
    return response.data.data;
  },

  // ─── 내 채팅방 목록 ────────────────────────────────────
  // 백엔드 응답: ChatRoomSummaryResponse[]
  getChatRooms: async (): Promise<ChatRoomSummary[]> => {
    const response = await apiClient.get<ApiResponse<ChatRoomSummary[]>>("/chat-rooms");
    return response.data.data;
  },

  // ─── 채팅방 나가기 ────────────────────────────────────
  leaveChatRoom: async (chatRoomId: number): Promise<void> => {
    await apiClient.delete(`/chat-rooms/${chatRoomId}/leave`);
  },

  markMessagesAsRead: async (chatRoomId: number): Promise<void> => {
    await apiClient.patch(`/chat-rooms/${chatRoomId}/read`);
  },

  // 백엔드: cursor는 Long(messageId), size 기본 30
  getMessages: async (
    chatRoomId: number,
    cursor?: number,
    size = 30
  ): Promise<CursorResponse<ChatMessage>> => {
    const response = await apiClient.get<ApiResponse<CursorResponse<ChatMessage>>>(
      `/chat-rooms/${chatRoomId}/messages`,
      { params: { cursor, size } }
    );
    return response.data.data;
  },
};
