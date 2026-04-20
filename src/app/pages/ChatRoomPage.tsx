import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Send, User, LogOut } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { toast } from "sonner";
import { chatApi } from "../api/chat";
import { ChatMessage } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { useStompChat } from "../hooks/useStompChat";
import { getMockImageUrl } from "../utils/imageStorage";
import { useChatContext } from "../contexts/ChatContext";

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
function groupByDate(messages: ChatMessage[]) {
  const result: Array<{ type: "date"; date: string } | { type: "msg"; msg: ChatMessage }> = [];
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

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  // 낙관적 메시지 추적 (content 기준으로 서버 메시지와 매칭)
  const pendingRef = useRef<Set<string>>(new Set());
  const bottomRef = useRef<HTMLDivElement>(null);

  // 채팅방 입장/퇴장 시 activeChatRoomId 설정 → 전역 STOMP에서 unread 증가 방지
  useEffect(() => {
    if (!chatRoomId) return;
    const id = Number(chatRoomId);
    setActiveChatRoomId(id);
    markAsRead(id);
    return () => setActiveChatRoomId(null); // 퇴장 시 초기화
  }, [chatRoomId]);

  useEffect(() => {
    if (!chatRoomId) return;
    chatApi.getMessages(Number(chatRoomId))
      .then((res) => setMessages([...res.content].reverse()))
      .catch(() => toast.error("메시지를 불러오지 못했습니다"))
      .finally(() => setLoading(false));
  }, [chatRoomId]);

  const { sendMessage: stompSend } = useStompChat({
    chatRoomId: Number(chatRoomId),
    token,
    onConnect: () => setConnected(true),
    onMessage: (msg: ChatMessage) => {
      // ChatListPage의 lastMessage 실시간 갱신
      updateLastMessage(Number(chatRoomId), msg.content);
      setMessages((prev) => {
        // 내가 보낸 메시지가 서버에서 브로드캐스트로 돌아온 경우
        // → 낙관적으로 추가한 메시지(content 일치)를 서버 메시지로 교체
        if (msg.senderId === user?.id && pendingRef.current.has(msg.content)) {
          pendingRef.current.delete(msg.content);
          return prev.map((m) =>
            m.senderId === user?.id && m.content === msg.content && m.messageId > 1e12
              ? msg  // 임시 ID → 실제 서버 메시지로 교체
              : m
          );
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

  const handleSend = () => {
    if (!input.trim() || !user) return;
    const content = input.trim();

    // 낙관적 UI
    const optimistic: ChatMessage = {
      messageId: Date.now(), // 임시 ID (1e12 이상)
      chatRoomId: Number(chatRoomId),
      senderId: user.id,
      senderNickname: user.nickname,
      content,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    pendingRef.current.add(content);
    setMessages((prev) => [...prev, optimistic]);
    stompSend(content);
    setInput("");
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
              {connected ? "연결됨" : "연결 중..."}
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
          <div className="text-center py-12 text-gray-500">불러오는 중...</div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 text-gray-500">첫 메시지를 보내보세요</div>
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
              <div key={msg.messageId} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                {/* 상대방: 프로필 이미지 + 닉네임 */}
                {!isMe && (
                  <div className="flex items-start gap-2 max-w-[75%]">
                    <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0 mt-1 overflow-hidden">
                      {opponent?.opponentProfileImageUrl ? (
                        <img
                          src={opponent.opponentProfileImageUrl ?? ""}
                          alt=""
                          style={{ width: "32px", height: "32px", objectFit: "cover", borderRadius: "50%", display: "block" }}
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">{msg.senderNickname}</p>
                      <div className="flex items-end gap-1">
                        <div className="px-4 py-2 rounded-2xl bg-gray-100 text-gray-900">
                          <p className="text-sm">{msg.content}</p>
                        </div>
                        <p className="text-xs text-gray-400 shrink-0">{formatTime(msg.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 내 메시지 */}
                {isMe && (
                  <div className="flex items-end gap-1 max-w-[75%]">
                    <p className="text-xs text-gray-400 shrink-0">{formatTime(msg.createdAt)}</p>
                    <div className="px-4 py-2 rounded-2xl bg-[var(--getchu-orange)] text-white">
                      <p className="text-sm">{msg.content}</p>
                    </div>
                  </div>
                )}
              </div>
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
            placeholder="메시지를 입력하세요"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button onClick={handleSend} className="bg-[var(--getchu-orange)] hover:bg-[var(--getchu-orange-strong)] px-4">
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
