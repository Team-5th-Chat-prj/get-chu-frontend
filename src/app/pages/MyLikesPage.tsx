import { useState, useEffect } from "react";
import { ArrowLeft, Heart } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { membersApi } from "../api/members";
import { productsApi } from "../api/products";
import { ProductSummary } from "../types";

const STATUS_LABEL: Record<string, string> = {
  SALE: "판매중",
  RESERVED: "예약중",
  TRADING: "거래중",
  SOLD: "판매완료",
};

export default function MyLikesPage() {
  const navigate = useNavigate();
  const [likedProducts, setLikedProducts] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    membersApi.getMyLikes({ size: 50 })
      .then((data) => setLikedProducts(data.content))
      .catch(() => toast.error("찜 목록을 불러오지 못했습니다"))
      .finally(() => setLoading(false));
  }, []);

  const handleUnlike = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await productsApi.deleteLike(id);
      setLikedProducts((prev) => prev.filter((p) => p.id !== id));
      toast.success("찜 취소되었습니다");
    } catch {
      toast.error("처리 중 오류가 발생했습니다");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200 px-4 py-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)}>
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-medium">내 찜 목록</h1>
        </div>
      </header>

      <div className="px-4 py-4">
        {loading ? (
          <div className="text-center py-12 text-gray-500">불러오는 중...</div>
        ) : (
          <>
            <p className="text-sm text-gray-600 mb-4">총 {likedProducts.length}개</p>
            {likedProducts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">찜한 상품이 없습니다</div>
            ) : (
              <div className="space-y-3">
                {likedProducts.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => navigate(`/products/${product.id}`)}
                    className="flex gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
                  >
                    <img
                      src={product.thumbnailUrl}
                      alt={product.title}
                      className="w-20 h-20 object-cover rounded bg-gray-100"
                    />
                    <div className="flex-1">
                      <h3 className="text-sm font-medium mb-1">{product.title}</h3>
                      {product.status !== "SOLD" ? (
                        <p className="text-base font-bold mb-1">
                          {product.price.toLocaleString()}원
                        </p>
                      ) : (
                        <p className="text-sm text-gray-500 mb-1">판매완료</p>
                      )}
                      <span className="text-xs text-gray-600">
                        {STATUS_LABEL[product.status] ?? product.status}
                      </span>
                    </div>
                    <button onClick={(e) => handleUnlike(product.id, e)} className="self-start">
                      <Heart className="w-5 h-5 fill-red-500 text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
