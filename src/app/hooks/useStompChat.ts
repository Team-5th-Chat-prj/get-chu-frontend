import { useEffect, useRef, useCallback } from "react";
import { Client, IMessage } from "@stomp/stompjs";

interface UseStompChatOptions {
  chatRoomId: number;
  token: string | null;
  onMessage: (msg: any) => void;
  onConnect?: () => void;
}

export function useStompChat({ chatRoomId, token, onMessage, onConnect }: UseStompChatOptions) {
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    if (!chatRoomId) return;

    // 토큰이 없으면 localStorage에서 직접 읽기
    const activeToken = token || localStorage.getItem("accessToken");
    if (!activeToken) return;

    const client = new Client({
      brokerURL: `ws://localhost:8080/ws-chat`,
      connectHeaders: {
        Authorization: `Bearer ${activeToken}`,
      },
      reconnectDelay: 5000,

      onConnect: () => {
        console.log("STOMP 연결 성공");
        onConnect?.();

        client.subscribe(`/topic/room.${chatRoomId}`, (frame: IMessage) => {
          try {
            const msg = JSON.parse(frame.body);
            onMessage(msg);
          } catch {
            console.error("STOMP 메시지 파싱 실패", frame.body);
          }
        });
      },

      onDisconnect: () => {
        console.log("STOMP 연결 해제");
      },

      onStompError: (frame) => {
        console.error("STOMP 에러:", frame.headers["message"], frame.body);
      },

      onWebSocketError: () => {
        // 재연결 중 발생하는 일시적 에러 무시
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
    };
  }, [chatRoomId, token]);

  const sendMessage = useCallback((content: string) => {
    if (!clientRef.current?.connected) {
      console.warn("STOMP 연결이 아직 준비되지 않았습니다");
      return false;
    }
    clientRef.current.publish({
      destination: "/app/chat.sendMessage",
      body: JSON.stringify({ chatRoomId, content }),
    });
    return true;
  }, [chatRoomId]);

  return { sendMessage };
}
