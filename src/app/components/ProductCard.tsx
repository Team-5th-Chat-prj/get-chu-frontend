import { Heart, MapPin, PackageSearch, Sparkles } from "lucide-react";
import { Link } from "react-router";
import { ProductStatus } from "../types";

interface ProductCardItem {
  id: number;
  title: string;
  price: number;
  status: ProductStatus | "SOLD";
  imageUrl?: string | null;
  thumbnailUrl?: string | null;
  likeCount?: number;
  distanceKm?: number;
}

const statusMeta: Record<string, { label: string; className: string }> = {
  SALE: {
    label: "판매중",
    className: "bg-[var(--getchu-orange)] text-white",
  },
  RESERVED: {
    label: "예약중",
    className: "bg-amber-400 text-white",
  },
  SOLD: {
    label: "판매완료",
    className: "bg-stone-300 text-stone-600",
  },
  SOLD_OUT: {
    label: "판매완료",
    className: "bg-stone-300 text-stone-600",
  },
};

export default function ProductCard({ product }: { product: ProductCardItem }) {
  const imageUrl = product.thumbnailUrl ?? product.imageUrl;
  const status = statusMeta[product.status] ?? statusMeta.SALE;

  return (
    <Link to={`/products/${product.id}`} className="card-hover group flex h-full flex-col overflow-hidden rounded-[1.8rem] border border-orange-100 bg-white">
      <div className="relative aspect-[0.95] overflow-hidden bg-[linear-gradient(180deg,#fff6ec,#fff1e1)]">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[var(--getchu-orange-strong)]">
            <PackageSearch className="size-10" />
          </div>
        )}

        <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-2 p-3">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold shadow-sm ${status.className}`}>
            {status.label}
          </span>
          {typeof product.distanceKm === "number" ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[var(--getchu-orange-strong)] shadow-sm">
              <MapPin className="size-3" />
              {product.distanceKm.toFixed(1)}km
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-[var(--muted-foreground)]">
            <Sparkles className="size-3.5 text-[var(--getchu-orange)]" />
            <span>가까운 중고 거래</span>
          </div>
          <h3 className="line-clamp-2 text-base font-semibold text-[var(--getchu-ink)]">{product.title}</h3>
        </div>

        <div className="mt-auto flex items-end justify-between gap-3">
          <div>
            <p className="text-lg font-bold text-[var(--getchu-orange-strong)]">
              {product.price.toLocaleString()}원
            </p>
            <div className="mt-1 flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
              <Heart className="size-3.5" />
              <span>{product.likeCount ?? 0}</span>
            </div>
          </div>
          <div className="rounded-full bg-[var(--getchu-orange-pale)] px-3 py-1 text-xs font-semibold text-[var(--getchu-orange-strong)]">
            보러가기
          </div>
        </div>
      </div>
    </Link>
  );
}
