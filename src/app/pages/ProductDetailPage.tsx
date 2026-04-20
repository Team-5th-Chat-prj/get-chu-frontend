import { useState, useEffect } from "react";
import { ArrowLeft, Heart, ChevronLeft, ChevronRight, User } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { useAuth } from "../contexts/AuthContext";
import { useChatContext } from "../contexts/ChatContext";
import { toast } from "sonner";
import { productsApi } from "../api/products";
import { membersApi } from "../api/members";
import { chatApi } from "../api/chat";
import { ProductDetail, PublicMember } from "../types";

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  SALE:     { label: "판매중",   className: "bg-[var(--getchu-orange)]" },
  RESERVED: { label: "예약중",   className: "bg-amber-500" },
  SOLD_OUT: { label: "판매완료", className: "bg-gray-400" },
};

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
    if (!id) return;
    setLoading(true);
    productsApi.getProduct(Number(id))
      .then((data) => {
        setProduct(data);
        return membersApi.getMember(data.sellerId);
      })
      .then((sellerData) => setSeller(sellerData))
      .catch(() => { toast.error("상품을 찾을 수 없습니다"); navigate("/"); })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">불러오는 중...</p>
      </div>
    );
  }

  const isOwner = user?.id === product.sellerId;
  const statusInfo = STATUS_MAP[product.status] ?? STATUS_MAP.SALE;
  const images = product.imageUrls;

  const handleLike = async () => {
    if (!isAuthenticated) { navigate("/login"); return; }
    try {
      if (isLiked) {
        await productsApi.deleteLike(product.id);
        setIsLiked(false);
        toast.success("찜 취소되었습니다");
      } else {
        await productsApi.createLike(product.id);
        setIsLiked(true);
        toast.success("찜했습니다");
      }
    } catch {
      toast.error("처리 중 오류가 발생했습니다");
    }
  };

  const handleReserve = async () => {
    if (!isAuthenticated) { navigate("/login"); return; }
    setActionLoading(true);
    try {
      const result = await productsApi.reserveProduct(product.id);
      setProduct({ ...product, status: "RESERVED" });
      toast.success(`예약되었습니다! (판매자: ${result.sellerNickname})`);
    } catch {
      toast.error("이미 예약된 상품이거나 예약에 실패했습니다");
    } finally {
      setActionLoading(false);
    }
  };

  const handleChat = async () => {
    if (!isAuthenticated) { navigate("/login"); return; }
    setActionLoading(true);
    try {
      // TODO: 백엔드 Product 도메인 담당자가 ChatRoomService에서 productId로 sellerId를 자동 조회하도록
      //       수정 완료되면 → chatApi.createChatRoom(product.id) 로 변경 (sellerId 인자 제거)
      const { chatRoomId } = await chatApi.createChatRoom(product.id, product.sellerId);
      await refreshChatRooms();
      navigate(`/chat/${chatRoomId}`);
    } catch (err: any) {
      console.error("채팅방 생성 실패:", err?.response?.status, err?.response?.data, err?.message);
      toast.error("채팅방 생성에 실패했습니다");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <span className="text-sm text-gray-500 truncate">{product.title}</span>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

          {/* 왼쪽: 이미지 */}
          <div>
            <div className="relative bg-white rounded-2xl overflow-hidden border border-gray-200 aspect-square">
              {images.length > 0 ? (
                <img
                  src={images[currentImage]}
                  alt={product.title}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300 text-lg">
                  이미지 없음
                </div>
              )}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImage((prev) => (prev - 1 + images.length) % images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1.5 shadow transition"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-700" />
                  </button>
                  <button
                    onClick={() => setCurrentImage((prev) => (prev + 1) % images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1.5 shadow transition"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-700" />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {images.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImage(idx)}
                        className={`w-2 h-2 rounded-full transition-colors ${idx === currentImage ? "bg-[var(--getchu-orange)]" : "bg-gray-300"}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* 썸네일 */}
            {images.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                {images.map((url, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImage(idx)}
                    className={`w-16 h-16 shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${idx === currentImage ? "border-[var(--getchu-orange)]" : "border-transparent"}`}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 오른쪽: 상품 정보 */}
          <div className="flex flex-col gap-6">
            {/* 상태 + 카테고리 */}
            <div className="flex items-center gap-2">
              <Badge className={`${statusInfo.className} text-white text-xs px-2.5 py-1`}>
                {statusInfo.label}
              </Badge>
              {product.categoryName && (
                <span className="text-sm text-gray-400">{product.categoryName}</span>
              )}
            </div>

            {/* 제목 + 가격 */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-3">{product.title}</h1>
              <p className="text-3xl font-bold text-[var(--getchu-orange-strong)]">{product.price.toLocaleString()}원</p>
              <p className="text-sm text-gray-400 mt-1">
                {new Date(product.createdAt).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>

            {/* 판매자 정보 */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">판매자</p>
              <div
                className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => navigate(`/members/${product.sellerId}/reviews`)}
              >
                <div className="w-11 h-11 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center shrink-0">
                  {seller?.profileImageUrl ? (
                    <img src={seller.profileImageUrl} alt={product.sellerNickname} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{product.sellerNickname}</p>
                  {seller && (
                    <p className="text-xs text-gray-400">⭐ {seller.averageRating.toFixed(1)} · 리뷰 {seller.reviewCount}개</p>
                  )}
                </div>
              </div>
            </div>

            {/* 상품 설명 */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 flex-1">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">상품 설명</p>
              <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                {product.description || "설명이 없습니다."}
              </p>
            </div>

            {/* 액션 버튼 */}
            <div className="flex items-center gap-3">
              {!isOwner && product.status !== "SOLD_OUT" && (
                <button
                  onClick={handleLike}
                  className={`p-3 rounded-xl border-2 transition-colors ${isLiked ? "border-red-400 bg-red-50 text-red-500" : "border-gray-200 hover:border-gray-300 text-gray-500"}`}
                >
                  <Heart className={`w-5 h-5 ${isLiked ? "fill-red-500" : ""}`} />
                </button>
              )}
              <div className="flex-1 flex gap-2">
                {isOwner ? (
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/products/${product.id}/edit`)}
                    className="w-full h-12 text-base font-medium"
                  >
                    수정하기
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={handleReserve}
                      disabled={actionLoading || product.status !== "SALE"}
                      variant="outline"
                      className="flex-1 h-12 text-base font-medium border-orange-200 text-[var(--getchu-orange-strong)] hover:bg-[var(--getchu-orange-pale)] disabled:opacity-40"
                    >
                      {product.status === "RESERVED" ? "예약중" : "예약하기"}
                    </Button>
                    <Button
                      onClick={handleChat}
                      disabled={actionLoading || product.status === "SOLD_OUT"}
                      className="flex-1 h-12 text-base font-medium bg-[var(--getchu-orange)] hover:bg-[var(--getchu-orange-strong)]"
                    >
                      {product.status === "SOLD_OUT" ? "판매완료" : "채팅하기"}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
