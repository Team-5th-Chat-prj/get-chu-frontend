import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Home,
  MessageCircle,
  User,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router";
import { productsApi } from "../api/products";
import { tradesApi } from "../api/trades";
import { Button } from "../components/ui/button";
import ChatListEmptyState from "../components/ui/state/ChatListEmptyState";
import ChatListLoadingState from "../components/ui/state/ChatListLoadingState";
import ErrorState from "../components/ui/state/ErrorState";
import { useChatContext } from "../contexts/ChatContext";
import { TradeStatus } from "../types";
import foxHeadImage from "../../assets/logo-fox-head.png";

const tradeStatusMeta: Partial<Record<TradeStatus, { label: string; className: string }>> = {
  RESERVED: {
    label: "예약중",
    className: "bg-amber-100 text-amber-700",
  },
  TRADING: {
    label: "거래중",
    className: "bg-sky-100 text-sky-700",
  },
  SOLD: {
    label: "거래완료",
    className: "bg-orange-100 text-[var(--getchu-orange-strong)]",
  },
  REVIEWED: {
    label: "리뷰완료",
    className: "bg-emerald-100 text-emerald-700",
  },
};

export default function ChatListPage() {
  const navigate = useNavigate();
  const { chatRooms, markAsRead, refreshChatRooms } = useChatContext();
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [productTitles, setProductTitles] = useState<Record<number, string>>({});
  const [tradeStatuses, setTradeStatuses] = useState<Record<number, TradeStatus>>({});

  const loadChatRooms = () => {
    setLoading(true);
    setErrorMessage("");
    refreshChatRooms()
      .catch(() => setErrorMessage("채팅 목록을 불러오지 못했어요. 잠시 후 다시 시도해주세요."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadChatRooms();
  }, []);

  useEffect(() => {
    let cancelled = false;

    Promise.allSettled([tradesApi.getMyTrades("BUYER"), tradesApi.getMyTrades("SELLER")]).then((results) => {
      if (cancelled) {
        return;
      }

      const nextStatuses: Record<number, TradeStatus> = {};

      results.forEach((result) => {
        if (result.status !== "fulfilled") {
          return;
        }

        result.value.forEach((trade) => {
          nextStatuses[trade.productId] = trade.status;
        });
      });

      setTradeStatuses(nextStatuses);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const missingProductIds = [...new Set(chatRooms.map((room) => room.productId))].filter(
      (productId) => productId && !productTitles[productId],
    );

    if (missingProductIds.length === 0) {
      return;
    }

    let cancelled = false;

    Promise.allSettled(
      missingProductIds.map(async (productId) => ({
        productId,
        title: (await productsApi.getProduct(productId)).title,
      })),
    ).then((results) => {
      if (cancelled) {
        return;
      }

      const nextTitles: Record<number, string> = {};

      results.forEach((result, index) => {
        const productId = missingProductIds[index];

        if (result.status === "fulfilled") {
          nextTitles[result.value.productId] = result.value.title;
        } else {
          nextTitles[productId] = "상품 정보를 불러올 수 없어요";
        }
      });

      setProductTitles((prev) => ({ ...prev, ...nextTitles }));
    });

    return () => {
      cancelled = true;
    };
  }, [chatRooms, productTitles]);

  const unreadTotal = useMemo(() => chatRooms.reduce((sum, room) => sum + room.unreadCount, 0), [chatRooms]);

  const handleRoomClick = (roomId: number) => {
    markAsRead(roomId);
    navigate(`/chat/${roomId}`);
  };

  return (
    <div className="min-h-screen bg-[var(--getchu-cream)]/55 pb-24">
      <header className="border-b border-[var(--getchu-border)] bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--getchu-border)] bg-white text-gray-700 transition hover:-translate-y-0.5 hover:border-[var(--getchu-orange)] hover:text-[var(--getchu-orange-strong)]"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--getchu-orange)]">
                Conversations
              </p>
              <h1 className="text-xl font-semibold text-gray-900">채팅 목록</h1>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/")}
            className="gap-2 border-orange-200 bg-white text-[var(--getchu-orange-strong)]"
          >
            <Home className="h-4 w-4" />
            홈
          </Button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:py-8">
        <section className="grid gap-3 md:grid-cols-2">
          <div className="surface-panel p-5">
            <p className="text-sm font-medium text-gray-500">전체 대화방</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900">{chatRooms.length}</p>
          </div>

          <div className="surface-panel p-5">
            <p className="text-sm font-medium text-gray-500">읽지 않은 메시지</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900">{unreadTotal}</p>
          </div>
        </section>

        <section className="surface-panel overflow-hidden p-0">
          <div className="border-b border-[var(--getchu-border)] px-4 py-4 sm:px-6">
            <h2 className="text-lg font-semibold text-gray-900">대화 목록</h2>
          </div>

          <div className="px-4 py-5 sm:px-6">
            {loading ? (
              <ChatListLoadingState />
            ) : errorMessage ? (
              <ErrorState
                title="채팅 목록을 불러오지 못했어요"
                description={errorMessage}
                actionLabel="다시 불러오기"
                onAction={loadChatRooms}
                mascotImage={foxHeadImage}
              />
            ) : chatRooms.length === 0 ? (
              <ChatListEmptyState
                onAction={() => navigate("/")}
                mascotImage={foxHeadImage}
              />
            ) : (
              <div className="space-y-4">
                {chatRooms.map((room) => {
                  const status = tradeStatuses[room.productId];
                  const statusMeta = status ? tradeStatusMeta[status] : null;

                  return (
                    <article
                      key={room.chatRoomId}
                      className="rounded-[28px] border border-[var(--getchu-border)] bg-white p-4 shadow-[0_12px_32px_rgba(148,163,184,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_42px_rgba(148,163,184,0.14)] sm:p-5"
                    >
                      <button
                        type="button"
                        onClick={() => handleRoomClick(room.chatRoomId)}
                        className="flex w-full flex-col gap-4 text-left lg:flex-row lg:items-center lg:justify-between"
                      >
                        <div className="flex min-w-0 gap-4">
                          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--getchu-cream)] ring-1 ring-[var(--getchu-border)]">
                            {room.opponentProfileImageUrl ? (
                              <img
                                src={room.opponentProfileImageUrl}
                                alt={room.opponentNickname}
                                className="h-full w-full object-cover"
                                onError={(event) => {
                                  (event.target as HTMLImageElement).style.display = "none";
                                }}
                              />
                            ) : (
                              <Users className="h-6 w-6 text-gray-400" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-[var(--getchu-orange-strong)]">
                                채팅방
                              </span>
                              {statusMeta ? (
                                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusMeta.className}`}>
                                  {statusMeta.label}
                                </span>
                              ) : null}
                              <span className="rounded-full bg-[var(--getchu-cream)] px-3 py-1 text-xs font-medium text-gray-600">
                                {productTitles[room.productId] ?? "상품명 불러오는 중"}
                              </span>
                            </div>

                            <h3 className="mt-3 text-lg font-semibold text-gray-900">{room.opponentNickname}</h3>
                            <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-600">
                              {room.lastMessage ?? "아직 주고받은 메시지가 없어요."}
                            </p>
                          </div>
                        </div>

                        <div className="flex w-full items-center justify-between gap-3 lg:w-auto lg:min-w-[180px] lg:flex-col lg:items-end">
                          {room.unreadCount > 0 ? (
                            <span className="inline-flex min-w-[44px] items-center justify-center rounded-full bg-[var(--getchu-orange)] px-3 py-2 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(249,115,22,0.22)]">
                              {room.unreadCount}개
                            </span>
                          ) : (
                            <span className="rounded-full bg-[var(--getchu-cream)] px-3 py-2 text-sm font-medium text-gray-500">
                              모두 읽음
                            </span>
                          )}

                          <span className="inline-flex items-center gap-2 text-sm font-medium text-[var(--getchu-orange-strong)]">
                            <MessageCircle className="h-4 w-4" />
                            대화 열기
                          </span>
                        </div>
                      </button>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 border-t border-orange-100 bg-white/90 backdrop-blur-xl md:hidden">
        <div className="floating-nav flex items-center justify-around py-3">
          <button onClick={() => navigate("/")} className="flex flex-col items-center gap-1 text-gray-500">
            <Home className="h-6 w-6" />
            <span className="text-xs">홈</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-[var(--getchu-orange)]">
            <MessageCircle className="h-6 w-6" />
            <span className="text-xs">채팅</span>
          </button>
          <button onClick={() => navigate("/my")} className="flex flex-col items-center gap-1 text-gray-500">
            <User className="h-6 w-6" />
            <span className="text-xs">마이</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
