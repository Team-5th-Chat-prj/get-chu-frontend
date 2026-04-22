import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Send, LogOut, Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { toast } from "sonner";
import { chatApi } from "../api/chat";
import { ChatMessage } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { useStompChat } from "../hooks/useStompChat";
import { useChatContext } from "../contexts/ChatContext";
import MessageBubble from "../components/chat/MessageBubble";
import EmptyState from "../components/ui/state/EmptyState";
import ErrorState from "../components/ui/state/ErrorState";

type LocalChatMessage = ChatMessage & {
  clientId?: string;
  deliveryStatus?: "sending" | "failed";
};

// 날짜 구분선용 포맷
function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).replace(/\. /g, "-").replace(".", "");
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// 날짜가 바뀌는 지점에 구분선 삽입
function groupByDate(messages: LocalChatMessage[]) {
  const result: Array<{ type: "date"; date: string } | { type: "msg"; msg: LocalChatMessage }> = [];
  let lastDate = "";
  for (const msg of messages) {
    const date = formatDate(msg.createdAt);
    if (date !== lastDate) {
      result.push({ type: "date", date });
      lastDate = date;
    }
    result.push({ type: "msg", msg });
  }
  return result;
}

export default function ChatRoomPage() {
  const navigate = useNavigate();
  const { chatRoomId } = useParams();
  const { user } = useAuth();
  const { markAsRead, setActiveChatRoomId, chatRooms, refreshChatRooms, markAsLeft, updateLastMessage } = useChatContext();
  const token = localStorage.getItem("accessToken");

  const opponent = chatRooms.find((r) => r.chatRoomId === Number(chatRoomId));

  const [messages, setMessages] = useState<LocalChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [connected, setConnected] = useState(false);
  const pendingRef = useRef<Map<string, { content: string; timeoutId: ReturnType<typeof setTimeout> }>>(new Map());
  const bottomRef = useRef<HTMLDivElement>(null);
  const hasSendingMessage = messages.some((message) => message.deliveryStatus === "sending");

  // 채팅방 입장/퇴장 시 activeChatRoomId 설정 → 전역 STOMP에서 unread 증가 방지
  useEffect(() => {
    if (!chatRoomId) return;
    const id = Number(chatRoomId);
    let cancelled = false;

    setActiveChatRoomId(id);
    markAsRead(id);

    chatApi.markMessagesAsRead(id)
      .then(() => {
        if (!cancelled) {
          refreshChatRooms().catch(() => {});
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      setActiveChatRoomId(null);
    }; // 퇴장 시 초기화
  }, [chatRoomId, markAsRead, refreshChatRooms, setActiveChatRoomId]);

  useEffect(() => {
    if (!chatRoomId) return;
    chatApi.getMessages(Number(chatRoomId))
      .then((res) => {
        setMessages([...res.content].reverse());
        setLoadError("");
      })
      .catch(() => {
        setLoadError("메시지를 불러오지 못했어요. 잠시 후 다시 시도해주세요.");
        toast.error("메시지를 불러오지 못했어요.");
      })
      .finally(() => setLoading(false));
  }, [chatRoomId]);

  const { sendMessage: stompSend } = useStompChat({
    chatRoomId: Number(chatRoomId),
    token,
    onConnect: () => setConnected(true),
    onDisconnect: () => setConnected(false),
    onError: () => setConnected(false),
    onMessage: (msg: ChatMessage) => {
      if ("type" in msg && msg.type === "READ") {
        refreshChatRooms().catch(() => {});
        return;
      }

      // ChatListPage의 lastMessage 실시간 갱신
      updateLastMessage(Number(chatRoomId), msg.content);

      if (msg.senderId !== user?.id) {
        chatApi.markMessagesAsRead(Number(chatRoomId))
          .then(refreshChatRooms)
          .catch(() => {});
      }

      setMessages((prev) => {
        // 내가 보낸 메시지가 서버에서 브로드캐스트로 돌아온 경우
        // → 낙관적으로 추가한 메시지(content 일치)를 서버 메시지로 교체한다.
        if (msg.senderId === user?.id) {
          const pendingEntry = [...pendingRef.current.entries()].find(([, value]) => value.content === msg.content);

          if (pendingEntry) {
            const [clientId, value] = pendingEntry;
            window.clearTimeout(value.timeoutId);
            pendingRef.current.delete(clientId);

            return prev.map((message) =>
              message.clientId === clientId
                ? {
                    ...msg,
                    deliveryStatus: undefined,
                    clientId: undefined,
                  }
                : message,
            );
          }
        }
        // 상대방 메시지 — 중복 방지
        if (prev.some((m) => m.messageId === msg.messageId)) return prev;
        return [...prev, msg];
      });
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    return () => {
      pendingRef.current.forEach(({ timeoutId }) => window.clearTimeout(timeoutId));
      pendingRef.current.clear();
    };
  }, []);

  const handleLeave = async () => {
    if (!window.confirm("채팅방을 나가시겠습니까?")) return;
    try {
      await chatApi.leaveChatRoom(Number(chatRoomId));
      markAsLeft(Number(chatRoomId)); // 구독 유지하면서 목록에서만 제거
      navigate("/chat");
    } catch {
      toast.error("채팅방 나가기에 실패했습니다");
    }
  };

  const markMessageFailed = (clientId: string) => {
    pendingRef.current.delete(clientId);
    setMessages((prev) =>
      prev.map((message) =>
        message.clientId === clientId
          ? {
              ...message,
              deliveryStatus: "failed",
            }
          : message,
      ),
    );
  };

  const sendContent = (content: string, existingClientId?: string) => {
    if (!content.trim() || !user) return;
    if (!connected) {
      toast.error("채팅 연결이 준비되지 않았어요. 잠시 후 다시 시도해주세요.");
      return;
    }

    const clientId = existingClientId ?? `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const createdAt = new Date().toISOString();

    const optimistic: LocalChatMessage = {
      messageId: Date.now(),
      chatRoomId: Number(chatRoomId),
      senderId: user.id,
      senderNickname: user.nickname,
      content,
      isRead: false,
      createdAt,
      clientId,
      deliveryStatus: "sending",
    };

    const timeoutId = window.setTimeout(() => {
      markMessageFailed(clientId);
    }, 8000);

    pendingRef.current.set(clientId, { content, timeoutId });

    setMessages((prev) => {
      if (existingClientId) {
        return prev.map((message) => (message.clientId === existingClientId ? optimistic : message));
      }

      return [...prev, optimistic];
    });

    const sent = stompSend(content);

    if (!sent) {
      window.clearTimeout(timeoutId);
      markMessageFailed(clientId);
      toast.error("메시지를 보내지 못했어요. 다시 시도해주세요.");
      return;
    }

    updateLastMessage(Number(chatRoomId), content);
  };

  const handleSend = () => {
    if (hasSendingMessage) return;
    const content = input.trim();
    if (!content) return;

    sendContent(content);
    setInput("");
  };

  const retryMessage = (message: LocalChatMessage) => {
    if (!message.clientId) return;
    sendContent(message.content, message.clientId);
  };

  const grouped = groupByDate(messages);

  return (
    <div className="flex flex-col h-screen bg-white">
      <header className="border-b border-gray-200 px-4 py-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)}>
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-base font-medium">
              {opponent?.opponentNickname ?? "채팅"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <span className={`w-2 h-2 rounded-full ${connected ? "bg-green-400" : "bg-gray-300"}`} />
              {connected ? "연결됨" : "재연결 중..."}
            </div>
            <button
              onClick={handleLeave}
              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600"
            >
              <LogOut className="w-4 h-4" />
              나가기
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading ? (
          <div className="space-y-4 py-4">
            <div className="mx-auto flex w-fit items-center gap-2 rounded-full bg-orange-50 px-4 py-2 text-sm font-semibold text-[var(--getchu-orange-strong)]">
              <Loader2 className="h-4 w-4 animate-spin" />
              메시지 불러오는 중이에요...
            </div>
            <div className="flex justify-start">
              <div className="skeleton h-11 w-48 rounded-[1.35rem]" />
            </div>
            <div className="flex justify-end">
              <div className="skeleton h-11 w-56 rounded-[1.35rem]" />
            </div>
            <div className="flex justify-start">
              <div className="skeleton h-11 w-40 rounded-[1.35rem]" />
            </div>
          </div>
        ) : loadError ? (
          <ErrorState
            title="메시지를 불러오지 못했어요"
            description={loadError}
            actionLabel="다시 불러오기"
            onAction={() => {
              setLoading(true);
              setLoadError("");
              chatApi.getMessages(Number(chatRoomId))
                .then((res) => setMessages([...res.content].reverse()))
                .catch(() => setLoadError("메시지를 불러오지 못했어요. 잠시 후 다시 시도해주세요."))
                .finally(() => setLoading(false));
            }}
          />
        ) : messages.length === 0 ? (
          <EmptyState
            title="아직 메시지가 없어요"
            description="첫 인사를 보내면 거래 이야기가 시작돼요."
          />
        ) : (
          grouped.map((item, idx) => {
            if (item.type === "date") {
              return (
                <div key={`date-${idx}`} className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400 shrink-0">{item.date}</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
              );
            }

            const msg = item.msg;
            const isMe = msg.senderId === user?.id;

            return (
              <MessageBubble
                key={msg.clientId ?? msg.messageId}
                content={msg.content}
                time={formatTime(msg.createdAt)}
                isMe={isMe}
                senderNickname={msg.senderNickname}
                opponentProfileImageUrl={opponent?.opponentProfileImageUrl}
                status={msg.deliveryStatus}
                onRetry={() => retryMessage(msg)}
              />
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-gray-200 px-4 py-3 shrink-0">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={connected ? "메시지를 입력하세요" : "채팅 연결을 기다리는 중이에요"}
            disabled={!connected || hasSendingMessage}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button
            onClick={handleSend}
            disabled={!connected || hasSendingMessage || !input.trim()}
            className="bg-[var(--getchu-orange)] px-4 hover:bg-[var(--getchu-orange-strong)] disabled:opacity-60"
          >
            {hasSendingMessage ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </Button>
        </div>
        {!connected ? (
          <p className="mt-2 text-center text-xs text-gray-400">연결이 돌아오면 바로 메시지를 보낼 수 있어요.</p>
        ) : null}
      </div>
    </div>
  );
}
