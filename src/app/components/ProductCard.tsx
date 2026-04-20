import { Heart } from "lucide-react";
import { Link } from "react-router";

interface Product {
  id: number;
  title: string;
  price: number;
  status: "SALE" | "RESERVED" | "SOLD";
  imageUrl?: string;
  likeCount: number;
}

export default function ProductCard({ product }: { product: Product }) {
  const statusLabels = {
    SALE: "판매중",
    RESERVED: "예약중",
    SOLD: "판매완료",
  };

  const statusColors = {
    SALE: "bg-green-500",
    RESERVED: "bg-yellow-500",
    SOLD: "bg-gray-500",
  };

  return (
    <Link to={`/products/${product.id}`} className="block">
      <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <div className="aspect-square bg-gray-100 relative">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              이미지 없음
            </div>
          )}
          <span
            className={`absolute top-2 left-2 px-2 py-1 text-xs text-white rounded ${
              statusColors[product.status]
            }`}
          >
            {statusLabels[product.status]}
          </span>
        </div>
        <div className="p-3">
          <h3 className="font-medium text-sm line-clamp-1">{product.title}</h3>
          <p className="text-base mt-1">{product.price.toLocaleString()}원</p>
          <div className="flex items-center mt-2 text-gray-500 text-sm">
            <Heart className="w-4 h-4 mr-1" />
            <span>{product.likeCount}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
