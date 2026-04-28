import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRightLeft,
  BadgeCheck,
  Clock3,
  House,
  Package2,
  Plus,
  Tag,
} from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import foxHeadImage from "../../assets/logo-fox-head.png";
import { membersApi } from "../api/members";
import { productsApi } from "../api/products";
import { tradesApi } from "../api/trades";
import { Button } from "../components/ui/button";
import EmptyState from "../components/ui/state/EmptyState";
import ErrorState from "../components/ui/state/ErrorState";
import ListLoadingState from "../components/ui/state/ListLoadingState";
import { useAuth } from "../contexts/AuthContext";
import { ProductSummary, Trade, TradeStatus } from "../types";

interface ProductWithTrade extends ProductSummary {
  tradeId?: number;
  tradeStatus?: string;
}

const TABS = [
  { key: "SALE", label: "판매중", icon: Tag },
  { key: "RESERVED", label: "예약중", icon: Clock3 },
  { key: "TRADING", label: "거래중", icon: ArrowRightLeft },
  { key: "SOLD_OUT", label: "판매완료", icon: BadgeCheck },
] as const;

function buildTradeMap(trades: Trade[]): Map<number, { tradeId: number; tradeStatus: string }> {
  return new Map(trades.map((trade) => [Number(trade.productId), { tradeId: trade.tradeId, tradeStatus: trade.status }]));
}

function getEffectiveStatus(product: ProductWithTrade) {
  if (product.tradeStatus === "TRADING") return "TRADING";
  if (product.tradeStatus === "RESERVED") return "RESERVED";
  if (product.tradeStatus === "SOLD" || product.status === "SOLD_OUT") return "SOLD_OUT";
  return "SALE";
}

const statusMeta = {
  SALE: {
    label: "판매중",
    badgeClass: "bg-orange-100 text-[var(--getchu-orange-strong)]",
  },
  RESERVED: {
    label: "예약중",
    badgeClass: "bg-amber-100 text-amber-700",
  },
  TRADING: {
    label: "거래중",
    badgeClass: "bg-sky-100 text-sky-700",
  },
  SOLD_OUT: {
    label: "판매완료",
    badgeClass: "bg-gray-200 text-gray-700",
  },
} as const;

export default function MyProductsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("SALE");
  const [products, setProducts] = useState<ProductWithTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    void fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const [myProductsRes, trades] = await Promise.all([
        membersApi.getMyProducts({ size: 200 }),
        tradesApi.getMyTrades("SELLER"),
      ]);

      const tradeMap = buildTradeMap(trades);
      const merged: ProductWithTrade[] = myProductsRes.content.map((product) => ({
        ...product,
        tradeId: tradeMap.get(Number(product.id))?.tradeId,
        tradeStatus: tradeMap.get(Number(product.id))?.tradeStatus,
      }));

      setProducts(merged);
    } catch {
      setErrorMessage("판매 목록을 불러오지 못했어요. 잠시 후 다시 시도해주세요.");
      toast.error("판매 목록을 불러오지 못했어요.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("정말 삭제하시겠어요?")) {
      return;
    }

    try {
      await productsApi.deleteProduct(id);
      setProducts((prev) => prev.filter((product) => product.id !== id));
      toast.success("상품을 삭제했어요.");
    } catch {
      toast.error("삭제에 실패했어요.");
    }
  };

  const handleTradeStatus = async (tradeId: number, status: TradeStatus) => {
    setActionLoading(tradeId);

    try {
      await tradesApi.updateTradeStatus(tradeId, status);
      toast.success("거래 상태를 변경했어요.");
      await fetchData();
    } catch {
      toast.error("거래 상태 변경에 실패했어요.");
    } finally {
      setActionLoading(null);
    }
  };

  const counts = useMemo(
    () =>
      Object.fromEntries(
        TABS.map((tab) => [tab.key, products.filter((product) => getEffectiveStatus(product) === tab.key).length]),
      ),
    [products],
  );

  const filteredProducts = useMemo(
    () => products.filter((product) => getEffectiveStatus(product) === activeTab),
    [activeTab, products],
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
                Seller Dashboard
              </p>
              <h1 className="text-xl font-semibold text-gray-900">내 판매 목록</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/")}
              className="gap-2 border-orange-200 bg-white text-[var(--getchu-orange-strong)]"
            >
              <House className="h-4 w-4" />
              홈
            </Button>
            <Button
              type="button"
              onClick={() => navigate("/products/new")}
              className="gap-2 bg-[var(--getchu-orange)] hover:bg-[var(--getchu-orange-strong)]"
            >
              <Plus className="h-4 w-4" />
              상품 등록
            </Button>
          </div>
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
                data-testid={`seller-products-tab-${tab.key}`}
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
              <ListLoadingState title="정보를 불러오는 중이에요..." description="판매 목록을 정리하고 있어요." />
            ) : errorMessage ? (
              <ErrorState
                title="판매 목록을 불러오지 못했어요"
                description={errorMessage}
                actionLabel="다시 불러오기"
                onAction={fetchData}
                mascotImage={foxHeadImage}
              />
            ) : filteredProducts.length === 0 ? (
              <EmptyState
                title={products.length === 0 ? "등록한 상품이 없어요" : "이 상태의 상품이 아직 없어요"}
                description="상품을 등록하면 판매 목록에서 상태별로 확인할 수 있어요."
                actionLabel="상품 등록하기"
                onAction={() => navigate("/products/new")}
                mascotImage={foxHeadImage}
              />
            ) : (
              <div className="space-y-4">
                {filteredProducts.map((product) => {
                  const status = getEffectiveStatus(product);
                  const statusInfo = statusMeta[status];

                  return (
                    <article
                      key={product.id}
                      data-testid={`seller-product-card-${product.id}`}
                      className="rounded-[28px] border border-[var(--getchu-border)] bg-white p-4 shadow-[0_12px_32px_rgba(148,163,184,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_42px_rgba(148,163,184,0.14)] sm:p-5"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex min-w-0 gap-4">
                          <button
                            type="button"
                            onClick={() => navigate(`/products/${product.id}`)}
                            className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-[var(--getchu-cream)] ring-1 ring-[var(--getchu-border)] transition hover:ring-[var(--getchu-orange)]"
                          >
                            {product.thumbnailUrl ? (
                              <img src={product.thumbnailUrl} alt={product.title} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-gray-400">
                                <Package2 className="h-7 w-7" />
                              </div>
                            )}
                          </button>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusInfo.badgeClass}`}>
                                {statusInfo.label}
                              </span>
                              <span className="text-xs text-gray-400">상품 ID {product.id}</span>
                            </div>

                            <button
                              type="button"
                              onClick={() => navigate(`/products/${product.id}`)}
                              className="mt-3 block text-left text-lg font-semibold text-gray-900 transition hover:text-[var(--getchu-orange-strong)]"
                            >
                              {product.title}
                            </button>

                            <p className="mt-2 text-2xl font-semibold text-gray-900">{product.price.toLocaleString()}원</p>
                          </div>
                        </div>

                        <div className="flex w-full flex-col gap-2 lg:w-auto lg:min-w-[220px]">
                          {status === "SALE" && (
                            <>
                              <Button
                                type="button"
                                onClick={() => navigate(`/products/${product.id}/edit`)}
                                className="w-full bg-[var(--getchu-orange)] hover:bg-[var(--getchu-orange-strong)]"
                              >
                                수정하기
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => navigate(`/products/${product.id}`)}
                                className="w-full border-orange-200 text-[var(--getchu-orange-strong)]"
                              >
                                상세 보기
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleDelete(product.id)}
                                className="w-full border-red-200 text-red-500 hover:bg-red-50"
                              >
                                삭제
                              </Button>
                            </>
                          )}

                          {status === "RESERVED" && product.tradeId && (
                            <>
                              <Button
                                type="button"
                                disabled={actionLoading === product.tradeId}
                                onClick={() => handleTradeStatus(product.tradeId!, "TRADING")}
                                data-testid={`seller-confirm-trade-button-${product.id}`}
                                className="w-full bg-[var(--getchu-orange)] hover:bg-[var(--getchu-orange-strong)]"
                              >
                                거래 확정
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                disabled={actionLoading === product.tradeId}
                                onClick={() => handleTradeStatus(product.tradeId!, "SALE")}
                                data-testid={`seller-cancel-reserve-button-${product.id}`}
                                className="w-full border-orange-200 text-[var(--getchu-orange-strong)]"
                              >
                                예약 취소
                              </Button>
                            </>
                          )}

                          {status === "TRADING" && (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => navigate(`/products/${product.id}`)}
                              className="w-full border-sky-200 text-sky-700 hover:bg-sky-50"
                            >
                              상세 보기
                            </Button>
                          )}

                          {status === "SOLD_OUT" && (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => navigate(`/products/${product.id}`)}
                              className="w-full border-gray-200 text-gray-600"
                            >
                              상세 보기
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

      <div className="fixed bottom-6 right-6 sm:hidden">
        <Button
          type="button"
          onClick={() => navigate("/products/new")}
          className="h-14 w-14 rounded-full bg-[var(--getchu-orange)] text-2xl shadow-lg hover:bg-[var(--getchu-orange-strong)]"
        >
          +
        </Button>
      </div>
    </div>
  );
}
