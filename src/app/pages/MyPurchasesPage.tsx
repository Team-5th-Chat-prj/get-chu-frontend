import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRightLeft,
  BadgeCheck,
  Clock3,
  House,
  MessageSquareText,
  ShoppingBag,
} from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import foxHeadImage from "../../assets/logo-fox-head.png";
import { tradesApi } from "../api/trades";
import { Button } from "../components/ui/button";
import EmptyState from "../components/ui/state/EmptyState";
import ErrorState from "../components/ui/state/ErrorState";
import ListLoadingState from "../components/ui/state/ListLoadingState";
import { useAuth } from "../contexts/AuthContext";
import { Trade, TradeStatus } from "../types";

const TABS = [
  { key: "RESERVED", label: "예약중", icon: Clock3 },
  { key: "TRADING", label: "거래중", icon: ArrowRightLeft },
  { key: "SOLD", label: "구매완료", icon: ShoppingBag },
  { key: "REVIEWED", label: "리뷰완료", icon: BadgeCheck },
] as const;

const statusMeta = {
  RESERVED: {
    label: "예약중",
    badgeClass: "bg-amber-100 text-amber-700",
  },
  TRADING: {
    label: "거래중",
    badgeClass: "bg-sky-100 text-sky-700",
  },
  SOLD: {
    label: "구매완료",
    badgeClass: "bg-orange-100 text-[var(--getchu-orange-strong)]",
  },
  REVIEWED: {
    label: "리뷰완료",
    badgeClass: "bg-emerald-100 text-emerald-700",
  },
} as const;

export default function MyPurchasesPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("RESERVED");
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchTrades = () => {
    setLoading(true);
    setErrorMessage("");

    tradesApi
      .getMyTrades("BUYER")
      .then(setTrades)
      .catch(() => {
        setErrorMessage("구매 내역을 불러오지 못했어요. 잠시 후 다시 시도해주세요.");
        toast.error("구매 내역을 불러오지 못했어요.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    fetchTrades();
  }, [isAuthenticated]);

  const handleComplete = async (tradeId: number) => {
    setActionLoading(tradeId);

    try {
      await tradesApi.updateTradeStatus(tradeId, "SOLD" as TradeStatus);
      toast.success("거래 완료를 확인했어요.");
      fetchTrades();
    } catch {
      toast.error("거래 완료 처리에 실패했어요.");
    } finally {
      setActionLoading(null);
    }
  };

  const counts = useMemo(
    () =>
      Object.fromEntries(
        TABS.map((tab) => [tab.key, trades.filter((trade) => trade.status === tab.key).length]),
      ),
    [trades],
  );

  const filteredTrades = useMemo(
    () => trades.filter((trade) => trade.status === activeTab),
    [activeTab, trades],
  );

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
                Buyer Dashboard
              </p>
              <h1 className="text-xl font-semibold text-gray-900">내 구매 목록</h1>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/")}
            className="gap-2 border-orange-200 bg-white text-[var(--getchu-orange-strong)]"
          >
            <House className="h-4 w-4" />
            홈
          </Button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:py-8">
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`surface-panel flex items-start gap-4 p-5 text-left transition ${
                  isActive
                    ? "border-[var(--getchu-orange)] shadow-[0_18px_50px_rgba(249,115,22,0.16)]"
                    : "hover:-translate-y-0.5 hover:border-orange-200"
                }`}
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                    isActive ? "bg-orange-100 text-[var(--getchu-orange-strong)]" : "bg-[var(--getchu-cream)] text-gray-500"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-500">{tab.label}</p>
                  <p className="mt-1 text-2xl font-semibold text-gray-900">{counts[tab.key] ?? 0}</p>
                </div>
              </button>
            );
          })}
        </section>

        <section className="surface-panel overflow-hidden p-0">
          <div className="flex flex-wrap gap-2 border-b border-[var(--getchu-border)] px-4 py-4 sm:px-6">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                data-testid={`buyer-trades-tab-${tab.key}`}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  activeTab === tab.key
                    ? "bg-[var(--getchu-orange)] text-white shadow-[0_12px_24px_rgba(249,115,22,0.22)]"
                    : "bg-[var(--getchu-cream)] text-gray-600 hover:bg-orange-100 hover:text-[var(--getchu-orange-strong)]"
                }`}
              >
                {tab.label} {counts[tab.key] ?? 0}
              </button>
            ))}
          </div>

          <div className="px-4 py-5 sm:px-6">
            {loading ? (
              <ListLoadingState title="정보를 불러오는 중이에요..." description="구매 내역을 확인하고 있어요." />
            ) : errorMessage ? (
              <ErrorState
                title="구매 내역을 불러오지 못했어요"
                description={errorMessage}
                actionLabel="다시 불러오기"
                onAction={fetchTrades}
                mascotImage={foxHeadImage}
              />
            ) : filteredTrades.length === 0 ? (
              <EmptyState
                title={trades.length === 0 ? "구매 내역이 없어요" : "이 상태의 구매 내역이 아직 없어요"}
                description="거래를 시작하면 예약중, 거래중, 구매완료 상태로 확인할 수 있어요."
                actionLabel="상품 둘러보기"
                onAction={() => navigate("/")}
                mascotImage={foxHeadImage}
              />
            ) : (
              <div className="space-y-4">
                {filteredTrades.map((trade) => {
                  const statusInfo = statusMeta[trade.status];

                  return (
                    <article
                      key={trade.tradeId}
                      data-testid={`buyer-trade-card-${trade.tradeId}`}
                      className="rounded-[28px] border border-[var(--getchu-border)] bg-white p-4 shadow-[0_12px_32px_rgba(148,163,184,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_42px_rgba(148,163,184,0.14)] sm:p-5"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusInfo.badgeClass}`}>
                              {statusInfo.label}
                            </span>
                            <span className="text-xs text-gray-400">거래 ID {trade.tradeId}</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => navigate(`/products/${trade.productId}`)}
                            className="mt-3 block text-left text-lg font-semibold text-gray-900 transition hover:text-[var(--getchu-orange-strong)]"
                          >
                            {trade.productTitle}
                          </button>

                          <p className="mt-2 text-2xl font-semibold text-gray-900">{trade.price.toLocaleString()}원</p>
                          <p className="mt-3 text-xs text-gray-400">
                            최근 업데이트: {new Date(trade.updatedAt).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="flex w-full flex-col gap-2 lg:w-auto lg:min-w-[220px]">
                          {trade.status === "RESERVED" && (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => navigate(`/products/${trade.productId}`)}
                              className="w-full border-orange-200 text-[var(--getchu-orange-strong)]"
                            >
                              상품 다시 보기
                            </Button>
                          )}

                          {trade.status === "TRADING" && (
                            <>
                              <Button
                                type="button"
                                disabled={actionLoading === trade.tradeId}
                                onClick={() => handleComplete(trade.tradeId)}
                                data-testid={`buyer-complete-trade-button-${trade.tradeId}`}
                                className="w-full bg-[var(--getchu-orange)] hover:bg-[var(--getchu-orange-strong)]"
                              >
                                거래 완료 확인
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => navigate(`/products/${trade.productId}`)}
                                className="w-full border-orange-200 text-[var(--getchu-orange-strong)]"
                              >
                                상품 다시 보기
                              </Button>
                            </>
                          )}

                          {trade.status === "SOLD" && (
                            <>
                              <Button
                                type="button"
                                onClick={() => navigate(`/trades/${trade.tradeId}/review`)}
                                data-testid={`buyer-write-review-button-${trade.tradeId}`}
                                className="w-full bg-[var(--getchu-orange)] hover:bg-[var(--getchu-orange-strong)]"
                              >
                                <MessageSquareText className="mr-2 h-4 w-4" />
                                리뷰 작성
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => navigate(`/products/${trade.productId}`)}
                                className="w-full border-orange-200 text-[var(--getchu-orange-strong)]"
                              >
                                상품 다시 보기
                              </Button>
                            </>
                          )}

                          {trade.status === "REVIEWED" && (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => navigate(`/products/${trade.productId}`)}
                              className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                            >
                              상품 다시 보기
                            </Button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
