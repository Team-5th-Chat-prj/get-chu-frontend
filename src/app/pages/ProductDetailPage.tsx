import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Heart,
  House,
  MessageCircle,
  PackageSearch,
  PencilLine,
  Star,
  User,
} from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { chatApi } from "../api/chat";
import { membersApi } from "../api/members";
import { productsApi } from "../api/products";
import { ProductDetail, PublicMember } from "../types";
import { Button } from "../components/ui/button";
import { useAuth } from "../contexts/AuthContext";
import { useChatContext } from "../contexts/ChatContext";

const STATUS_MAP: Record<string, { label: string; badgeClass: string }> = {
  SALE: {
    label: "판매중",
    badgeClass: "bg-orange-100 text-[var(--getchu-orange-strong)]",
  },
  RESERVED: {
    label: "예약중",
    badgeClass: "bg-amber-100 text-amber-700",
  },
  SOLD_OUT: {
    label: "판매완료",
    badgeClass: "bg-gray-200 text-gray-700",
  },
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function ProductDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { isAuthenticated, user } = useAuth();
  const { refreshChatRooms } = useChatContext();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [seller, setSeller] = useState<PublicMember | null>(null);
  const [currentImage, setCurrentImage] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!id) {
      return;
    }

    setLoading(true);
    setCurrentImage(0);

    productsApi
      .getProduct(Number(id))
      .then((data) => {
        setProduct(data);
        return membersApi.getMember(data.sellerId);
      })
      .then((sellerData) => setSeller(sellerData))
      .catch(() => {
        toast.error("상품을 찾을 수 없어요.");
        navigate("/");
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading || !product) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--getchu-cream)]/55 px-4">
        <div className="surface-panel w-full max-w-md px-6 py-12 text-center">
          <p className="text-sm font-medium text-gray-500">상품 정보를 불러오고 있어요.</p>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === product.sellerId;
  const statusInfo = STATUS_MAP[product.status] ?? STATUS_MAP.SALE;
  const images = product.imageUrls ?? [];

  const handleLike = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    try {
      if (isLiked) {
        await productsApi.deleteLike(product.id);
        setIsLiked(false);
        toast.success("찜을 취소했어요.");
      } else {
        await productsApi.createLike(product.id);
        setIsLiked(true);
        toast.success("찜했어요.");
      }
    } catch {
      toast.error("찜 처리 중 문제가 생겼어요.");
    }
  };

  const handleReserve = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    setActionLoading(true);
    try {
      const result = await productsApi.reserveProduct(product.id);
      setProduct({ ...product, status: "RESERVED" });
      toast.success(`예약했어요. 판매자는 ${result.sellerNickname}님이에요.`);
    } catch {
      toast.error("예약할 수 없는 상품이에요.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleChat = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    setActionLoading(true);
    try {
      const { chatRoomId } = await chatApi.createChatRoom(product.id, product.sellerId);
      await refreshChatRooms();
      navigate(`/chat/${chatRoomId}`);
    } catch (err: any) {
      console.error("채팅방 생성 실패:", err?.response?.status, err?.response?.data, err?.message);
      toast.error("채팅방을 만들지 못했어요.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--getchu-cream)]/55 pb-24">
      <header className="border-b border-[var(--getchu-border)] bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--getchu-border)] bg-white text-gray-700 transition hover:-translate-y-0.5 hover:border-[var(--getchu-orange)] hover:text-[var(--getchu-orange-strong)]"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--getchu-orange)]">
                Product Detail
              </p>
              <h1 className="truncate text-xl font-semibold text-gray-900">{product.title}</h1>
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

      <main className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:py-8 xl:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.92fr)]">
        <section className="surface-panel overflow-hidden p-4 sm:p-5">
          <div className="relative aspect-square overflow-hidden rounded-[28px] bg-[linear-gradient(180deg,#fff8f0,#fff2e2)]">
            {images.length > 0 ? (
              <img
                src={images[currentImage]}
                alt={product.title}
                className="h-full w-full object-contain p-5 sm:p-8"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-[var(--getchu-orange-strong)]/70">
                <PackageSearch className="h-10 w-10" />
                <p className="text-sm font-medium">등록된 이미지가 없어요.</p>
              </div>
            )}

            {images.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={() => setCurrentImage((prev) => (prev - 1 + images.length) % images.length)}
                  className="btn-interactive absolute left-4 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-orange-100 bg-white/92 text-gray-700 shadow-sm"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentImage((prev) => (prev + 1) % images.length)}
                  className="btn-interactive absolute right-4 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-orange-100 bg-white/92 text-gray-700 shadow-sm"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-white/88 px-3 py-2 shadow-sm backdrop-blur">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setCurrentImage(index)}
                      className={`h-2.5 rounded-full transition-all ${
                        index === currentImage ? "w-6 bg-[var(--getchu-orange)]" : "w-2.5 bg-orange-200"
                      }`}
                    />
                  ))}
                </div>
              </>
            ) : null}
          </div>

          {images.length > 1 ? (
            <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-5">
              {images.map((url, index) => (
                <button
                  key={`${url}-${index}`}
                  type="button"
                  onClick={() => setCurrentImage(index)}
                  className={`overflow-hidden rounded-[20px] border bg-white transition ${
                    index === currentImage
                      ? "border-[var(--getchu-orange)] shadow-[0_12px_28px_rgba(249,115,22,0.16)]"
                      : "border-[var(--getchu-border)] hover:border-orange-200"
                  }`}
                >
                  <img src={url} alt="" className="aspect-square h-full w-full object-cover" />
                </button>
              ))}
            </div>
          ) : null}
        </section>

        <section className="flex flex-col gap-5">
          <div className="surface-panel-strong p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusInfo.badgeClass}`}>
                {statusInfo.label}
              </span>
              {product.categoryName ? (
                <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-500 ring-1 ring-orange-100">
                  {product.categoryName}
                </span>
              ) : null}
              {isOwner ? (
                <span className="rounded-full bg-[var(--getchu-orange-pale)] px-3 py-1 text-xs font-semibold text-[var(--getchu-orange-strong)]">
                  내 상품
                </span>
              ) : null}
            </div>

            <h2 className="mt-4 text-3xl font-bold leading-tight text-gray-900">{product.title}</h2>

            <div className="mt-5">
              <p className="text-4xl font-bold tracking-tight text-[var(--getchu-orange-strong)]">
                {product.price.toLocaleString()}원
              </p>
              <p className="mt-2 text-sm text-gray-400">{formatDate(product.createdAt)}</p>
            </div>
          </div>

          <div className="surface-panel p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--getchu-orange)]">
                  Seller
                </p>
                <h3 className="mt-1 text-lg font-semibold text-gray-900">판매자 정보</h3>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate(`/members/${product.sellerId}/reviews`)}
              className="flex w-full items-center gap-4 rounded-[24px] border border-[var(--getchu-border)] bg-[var(--getchu-cream)]/55 px-4 py-4 text-left transition hover:-translate-y-0.5 hover:border-orange-200"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-gray-400 shadow-sm">
                {seller?.profileImageUrl ? (
                  <img src={seller.profileImageUrl} alt={product.sellerNickname} className="h-full w-full object-cover" />
                ) : (
                  <User className="h-6 w-6" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-base font-semibold text-gray-900">{product.sellerNickname}</p>
                {seller ? (
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                    <span className="inline-flex items-center gap-1 font-medium text-[var(--getchu-orange-strong)]">
                      <Star className="h-4 w-4 fill-current" />
                      {seller.averageRating.toFixed(1)}
                    </span>
                    <span>리뷰 {seller.reviewCount}개</span>
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-gray-400">판매자 정보를 불러오는 중이에요.</p>
                )}
              </div>
            </button>
          </div>

          <div className="surface-panel p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--getchu-orange)]">
              Description
            </p>
            <h3 className="mt-1 text-lg font-semibold text-gray-900">상품 설명</h3>
            <p className="mt-4 whitespace-pre-line text-sm leading-7 text-gray-700 sm:text-[15px]">
              {product.description || "설명이 아직 없어요."}
            </p>
          </div>

          <div className="surface-panel p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row">
              {!isOwner && product.status !== "SOLD_OUT" ? (
                <button
                  type="button"
                  onClick={handleLike}
                  className={`btn-interactive inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full border transition ${
                    isLiked
                      ? "border-red-200 bg-red-50 text-red-500"
                      : "border-[var(--getchu-border)] bg-white text-gray-500 hover:border-orange-200 hover:text-[var(--getchu-orange-strong)]"
                  }`}
                >
                  <Heart className={`h-5 w-5 ${isLiked ? "fill-current" : ""}`} />
                </button>
              ) : null}

              <div className="flex flex-1 flex-col gap-3 sm:flex-row">
                {isOwner ? (
                  <Button
                    type="button"
                    onClick={() => navigate(`/products/${product.id}/edit`)}
                    className="h-14 flex-1 rounded-full bg-[var(--getchu-orange)] text-base font-semibold hover:bg-[var(--getchu-orange-strong)]"
                  >
                    <PencilLine className="mr-2 h-4 w-4" />
                    상품 수정
                  </Button>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleReserve}
                      disabled={actionLoading || product.status !== "SALE"}
                      className="h-14 flex-1 rounded-full border-orange-200 text-base font-semibold text-[var(--getchu-orange-strong)] hover:bg-[var(--getchu-orange-pale)] disabled:opacity-45"
                    >
                      {product.status === "RESERVED" ? "예약중" : "예약하기"}
                    </Button>
                    <Button
                      type="button"
                      onClick={handleChat}
                      disabled={actionLoading || product.status === "SOLD_OUT"}
                      className="h-14 flex-1 rounded-full bg-[var(--getchu-orange)] text-base font-semibold hover:bg-[var(--getchu-orange-strong)] disabled:opacity-45"
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      {product.status === "SOLD_OUT" ? "판매완료" : "채팅하기"}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
