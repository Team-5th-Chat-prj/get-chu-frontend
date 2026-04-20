import {
  createContext, useContext, useState, useCallback,
  useEffect, useRef, ReactNode
} from "react";
import { Client, IMessage } from "@stomp/stompjs";
import { ChatRoomSummary } from "../types";
import { chatApi } from "../api/chat";

interface ChatContextType {
  chatRooms: ChatRoomSummary[];
  totalUnread: number;
  markAsRead: (chatRoomId: number) => void;
  markAsLeft: (chatRoomId: number) => void;
  updateLastMessage: (chatRoomId: number, content: string) => void;
  activeChatRoomId: number | null;
  setActiveChatRoomId: (id: number | null) => void;
  refreshChatRooms: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [chatRooms, setChatRooms] = useState<ChatRoomSummary[]>([]);
  const [activeChatRoomId, setActiveChatRoomId] = useState<number | null>(null);
  const clientRef = useRef<Client | null>(null);
  const subscriptionsRef = useRef<Map<number, { unsubscribe: () => void }>>(new Map());
  const activeChatRoomIdRef = useRef<number | null>(null);
  // 내가 나간 채팅방 ID 추적 (구독은 유지하되 목록에서 숨김)
  const leftRoomIdsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    activeChatRoomIdRef.current = activeChatRoomId;
  }, [activeChatRoomId]);

  const handleIncomingMessage = useCallback((chatRoomId: number, content: string) => {
    const isCurrentRoom = activeChatRoomIdRef.current === chatRoomId;

    // 내가 나간 채팅방에서 메시지 수신 → 목록 갱신으로 재입장
    if (leftRoomIdsRef.current.has(chatRoomId)) {
      leftRoomIdsRef.current.delete(chatRoomId);
      chatApi.getChatRooms().then(setChatRooms).catch(() => {});
      return;
    }

    setChatRooms((prev) => {
      const exists = prev.some((room) => room.chatRoomId === chatRoomId);
      if (!exists) {
        chatApi.getChatRooms().then(setChatRooms).catch(() => {});
        return prev;
      }
      return prev.map((room) =>
        room.chatRoomId !== chatRoomId
          ? room
          : {
              ...room,
              lastMessage: content,
              unreadCount: isCurrentRoom ? 0 : room.unreadCount + 1,
            }
      );
    });
  }, []);

  // 새 채팅방 구독 추가 (기존 구독은 유지)
  const subscribeNew = useCallback((rooms: ChatRoomSummary[], client: Client) => {
    rooms.forEach((room) => {
      if (!subscriptionsRef.current.has(room.chatRoomId)) {
        const sub = client.subscribe(
          `/topic/room.${room.chatRoomId}`,
          (frame: IMessage) => {
            try {
              const msg = JSON.parse(frame.body);
              handleIncomingMessage(room.chatRoomId, msg.content);
            } catch {
              console.error("[전역 STOMP] 파싱 실패", frame.body);
            }
          }
        );
        subscriptionsRef.current.set(room.chatRoomId, sub);
      }
    });
  }, [handleIncomingMessage]);

  // 전체 재구독 (초기 연결 시 사용)
  const subscribeAll = useCallback((rooms: ChatRoomSummary[], client: Client) => {
    try {
      subscriptionsRef.current.forEach((sub) => sub.unsubscribe());
    } catch {}
    subscriptionsRef.current.clear();
    rooms.forEach((room) => {
      try {
        const sub = client.subscribe(
          `/topic/room.${room.chatRoomId}`,
          (frame: IMessage) => {
            try {
              const msg = JSON.parse(frame.body);
              handleIncomingMessage(room.chatRoomId, msg.content);
            } catch {
              console.error("[전역 STOMP] 파싱 실패", frame.body);
            }
          }
        );
        subscriptionsRef.current.set(room.chatRoomId, sub);
      } catch {}
    });
  }, [handleIncomingMessage]);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    const client = new Client({
      brokerURL: "ws://localhost:8080/ws-chat",
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 0,

      onConnect: () => {
        console.log("[전역 STOMP] 연결 성공");
        chatApi.getChatRooms()
          .then((rooms) => {
            setChatRooms(rooms);
            subscribeAll(rooms, client);
          })
          .catch(() => {});
      },

      onStompError: (frame) => {
        console.error("[전역 STOMP] 에러:", frame.headers["message"]);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      subscriptionsRef.current.forEach((sub) => sub.unsubscribe());
      subscriptionsRef.current.clear();
      client.deactivate();
      clientRef.current = null;
    };
  }, []);

  const markAsRead = useCallback((chatRoomId: number) => {
    setChatRooms((prev) =>
      prev.map((room) =>
        room.chatRoomId === chatRoomId ? { ...room, unreadCount: 0 } : room
      )
    );
  }, []);

  const refreshChatRooms = useCallback(async () => {
    try {
      const rooms = await chatApi.getChatRooms();
      setChatRooms(rooms);
      // 기존 구독 유지하면서 새 채팅방만 추가 구독
      if (clientRef.current?.connected) {
        subscribeNew(rooms, clientRef.current);
      }
    } catch (err) {
      console.error("[전역 STOMP] 채팅방 목록 갱신 실패", err);
    }
  }, [subscribeNew]);

  // 채팅방 나가기 시 leftRoomIds에 추가 (구독은 유지)
  const markAsLeft = useCallback((chatRoomId: number) => {
    leftRoomIdsRef.current.add(chatRoomId);
    setChatRooms((prev) => prev.filter((room) => room.chatRoomId !== chatRoomId));
  }, []);

  const updateLastMessage = useCallback((chatRoomId: number, content: string) => {
    setChatRooms((prev) =>
      prev.map((room) =>
        room.chatRoomId === chatRoomId ? { ...room, lastMessage: content } : room
      )
    );
  }, []);

  const totalUnread = chatRooms.reduce((sum, room) => sum + room.unreadCount, 0);

  return (
    <ChatContext.Provider value={{
      chatRooms,
      totalUnread,
      markAsRead,
      markAsLeft,
      updateLastMessage,
      activeChatRoomId,
      setActiveChatRoomId,
      refreshChatRooms,
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChatContext must be used within ChatProvider");
  return ctx;
}
