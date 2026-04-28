import { useEffect, useState } from "react";
import { ArrowLeft, Heart, House, Package2 } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import foxHeadImage from "../../assets/logo-fox-head.png";
import { membersApi } from "../api/members";
import { productsApi } from "../api/products";
import EmptyState from "../components/ui/state/EmptyState";
import ErrorState from "../components/ui/state/ErrorState";
import ListLoadingState from "../components/ui/state/ListLoadingState";
import { Button } from "../components/ui/button";
import { ProductSummary } from "../types";

const STATUS_LABEL: Record<string, string> = {
  SALE: "판매중",
  RESERVED: "예약중",
  TRADING: "거래중",
  SOLD: "판매완료",
  SOLD_OUT: "판매완료",
};

const STATUS_BADGE_CLASS: Record<string, string> = {
  SALE: "bg-orange-100 text-[var(--getchu-orange-strong)]",
  RESERVED: "bg-amber-100 text-amber-700",
  TRADING: "bg-sky-100 text-sky-700",
  SOLD: "bg-gray-200 text-gray-700",
  SOLD_OUT: "bg-gray-200 text-gray-700",
};

export default function MyLikesPage() {
  const navigate = useNavigate();
  const [likedProducts, setLikedProducts] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchLikes = () => {
    setLoading(true);
    setErrorMessage("");

    membersApi
      .getMyLikes({ size: 50 })
      .then((data) => setLikedProducts(data.content))
      .catch(() => {
        setErrorMessage("찜 목록을 불러오지 못했어요. 잠시 후 다시 시도해주세요.");
        toast.error("찜 목록을 불러오지 못했어요.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLikes();
  }, []);

  const handleUnlike = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      await productsApi.deleteLike(id);
      setLikedProducts((prev) => prev.filter((product) => product.id !== id));
      toast.success("찜을 취소했어요.");
    } catch {
      toast.error("찜 취소 중 문제가 발생했어요.");
    }
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
                Favorite Shelf
              </p>
              <h1 className="text-xl font-semibold text-gray-900">내 찜 목록</h1>
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
        <section className="surface-panel overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-[var(--getchu-border)] px-4 py-4 sm:px-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--getchu-orange)]">
                Liked Items
              </p>
              <h2 className="mt-1 text-lg font-semibold text-gray-900">찜한 상품</h2>
            </div>
            <span className="rounded-full bg-[var(--getchu-cream)] px-3 py-1 text-sm font-semibold text-[var(--getchu-orange-strong)]">
              총 {likedProducts.length}개
            </span>
          </div>

          <div className="px-4 py-5 sm:px-6">
            {loading ? (
              <ListLoadingState title="정보를 불러오는 중이에요..." description="찜한 상품을 모아오고 있어요." />
            ) : errorMessage ? (
              <ErrorState
                title="찜 목록을 불러오지 못했어요"
                description={errorMessage}
                actionLabel="다시 불러오기"
                onAction={fetchLikes}
                mascotImage={foxHeadImage}
              />
            ) : likedProducts.length === 0 ? (
              <EmptyState
                title="찜한 상품이 없어요 🧡"
                description="마음에 드는 상품을 찜하면 여기에 차곡차곡 모여요."
                actionLabel="상품 둘러보기"
                onAction={() => navigate("/")}
                mascotImage={foxHeadImage}
              />
            ) : (
              <div className="space-y-4">
                {likedProducts.map((product) => (
                  <article
                    key={product.id}
                    onClick={() => navigate(`/products/${product.id}`)}
                    className="cursor-pointer rounded-[28px] border border-[var(--getchu-border)] bg-white p-4 shadow-[0_12px_32px_rgba(148,163,184,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_42px_rgba(148,163,184,0.14)] sm:p-5"
                  >
                    <div className="flex gap-4">
                      <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[var(--getchu-cream)] ring-1 ring-[var(--getchu-border)]">
                        {product.thumbnailUrl ? (
                          <img src={product.thumbnailUrl} alt={product.title} className="h-full w-full object-cover" />
                        ) : (
                          <Package2 className="h-7 w-7 text-gray-400" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              STATUS_BADGE_CLASS[product.status] ?? "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {STATUS_LABEL[product.status] ?? product.status}
                          </span>
                          <span className="text-xs text-gray-400">상품 ID {product.id}</span>
                        </div>

                        <h3 className="mt-3 line-clamp-2 text-lg font-semibold text-gray-900">{product.title}</h3>
                        <p className="mt-2 text-2xl font-semibold text-gray-900">{product.price.toLocaleString()}원</p>
                      </div>

                      <button
                        type="button"
                        onClick={(event) => handleUnlike(product.id, event)}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500 transition hover:-translate-y-0.5 hover:bg-red-100"
                        aria-label={`${product.title} 찜 취소`}
                      >
                        <Heart className="h-5 w-5 fill-current" />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
