import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Star } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { toast } from "sonner";
import { tradesApi } from "../api/trades";
import { TradeDetail } from "../types";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";

// 별 하나에서 마우스 위치(왼쪽/오른쪽)로 0.5 단위 판별
function HalfStar({
  index,
  rating,
  hovered,
  onHover,
  onClick,
}: {
  index: number;       // 1~5
  rating: number;
  hovered: number;
  onHover: (val: number) => void;
  onClick: (val: number) => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const active = hovered || rating;

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const half = e.clientX - rect.left < rect.width / 2;
    onHover(half ? index - 0.5 : index);
  };

  const handleClick = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const half = e.clientX - rect.left < rect.width / 2;
    onClick(half ? index - 0.5 : index);
  };

  // 이 별이 완전히 채워지는 경우
  const full = active >= index;
  // 이 별이 반만 채워지는 경우
  const halfFill = !full && active >= index - 0.5;

  return (
    <button
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => onHover(0)}
      onClick={handleClick}
      className="relative w-10 h-10 transition-transform hover:scale-110"
    >
      {/* 빈 별 (배경) */}
      <Star className="w-10 h-10 text-gray-300 absolute inset-0" />
      {/* 채워진 별 */}
      {(full || halfFill) && (
        <span
          className="absolute inset-0 overflow-hidden"
          style={{ width: full ? "100%" : "50%" }}
        >
          <Star className="w-10 h-10 fill-yellow-400 text-yellow-400" />
        </span>
      )}
    </button>
  );
}

export default function ReviewPage() {
  const navigate = useNavigate();
  const { id } = useParams(); // tradeId
  const { refreshUser } = useAuth();
  const [trade, setTrade] = useState<TradeDetail | null>(null);
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    tradesApi.getTradeDetail(Number(id))
      .then(setTrade)
      .catch(() => { toast.error("거래 정보를 불러오지 못했습니다"); navigate(-1); });
  }, [id, navigate]);

  const handleSubmit = async () => {
    if (rating === 0) { toast.error("별점을 선택해주세요"); return; }
    if (!id) return;
    setIsLoading(true);
    try {
      await tradesApi.createReview(Number(id), { rating, content });
      await refreshUser(); // 리뷰 수/평점 마이페이지에 즉시 반영
      toast.success("리뷰가 등록되었습니다");
      navigate("/my/purchases");
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const { status, data } = err.response;
        if (status === 409) {
          toast.error("이미 리뷰를 작성한 거래입니다");
        } else if (status === 403) {
          toast.error("리뷰 작성 권한이 없습니다");
        } else if (status === 400) {
          toast.error(data?.message ?? "입력값을 확인해주세요");
        } else {
          toast.error(data?.message ?? "리뷰 등록에 실패했습니다");
        }
      } else {
        toast.error("서버와 연결할 수 없습니다");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const displayRating = hovered || rating;

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200 px-4 py-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)}>
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg">리뷰 작성</h1>
        </div>
      </header>

      <div className="px-4 py-6 max-w-3xl mx-auto space-y-6">
        {/* 거래 정보 */}
        {trade && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-1">
            <p className="text-sm font-medium">{trade.productTitle}</p>
            <p className="text-sm text-gray-600">{trade.price.toLocaleString()}원</p>
            <p className="text-sm text-gray-600">판매자: {trade.sellerNickname}</p>
          </div>
        )}

        {/* 별점 — 0.5 단위 */}
        <div>
          <h3 className="text-sm mb-3">거래는 어떠셨나요?</h3>
          <div className="flex justify-center gap-1 py-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <HalfStar
                key={star}
                index={star}
                rating={rating}
                hovered={hovered}
                onHover={setHovered}
                onClick={setRating}
              />
            ))}
          </div>
          <p className="text-center text-sm text-gray-600">
            {displayRating > 0 ? `${displayRating}점` : "별점을 선택하세요"}
          </p>
        </div>

        {/* 내용 */}
        <div>
          <h3 className="text-sm mb-2">상세 후기 (최대 500자)</h3>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="거래 경험을 공유해주세요"
            maxLength={500}
            rows={6}
          />
          <p className="text-xs text-gray-500 mt-1">{content.length}/500자</p>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full bg-[var(--getchu-orange)] hover:bg-[var(--getchu-orange-strong)]"
        >
          {isLoading ? "등록 중..." : "리뷰 등록"}
        </Button>
        <p className="text-xs text-center text-gray-500">* 등록 후 수정/삭제 불가합니다</p>
      </div>
    </div>
  );
}
