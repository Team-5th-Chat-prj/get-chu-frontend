import StateCard from "./StateCard";

interface LoadingStateProps {
  title?: string;
  description?: string;
  mascotImage?: string;
  cardCount?: number;
}

function SkeletonProductCard() {
  return (
    <div className="overflow-hidden rounded-[1.8rem] border border-orange-100 bg-white shadow-[0_14px_30px_rgba(148,163,184,0.08)]">
      <div className="skeleton aspect-[0.95] rounded-none" />
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <div className="skeleton h-6 w-16 rounded-full" />
          <div className="skeleton h-9 w-9 rounded-full" />
        </div>
        <div className="skeleton h-4 w-24" />
        <div className="skeleton h-6 w-4/5" />
        <div className="flex items-end justify-between pt-2">
          <div className="space-y-2">
            <div className="skeleton h-6 w-24" />
            <div className="skeleton h-4 w-16" />
          </div>
          <div className="skeleton h-8 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export default function LoadingState({
  title = "좋은 물건 찾는 중이에요...",
  description = "여우가 마음에 드는 상품을 고르고 있어요.",
  mascotImage,
  cardCount = 8,
}: LoadingStateProps) {
  return (
    <div className="space-y-5">
      <StateCard
        eyebrow="Loading"
        title={title}
        description={description}
        mascotImage={mascotImage}
        mascotAlt="상품을 찾는 여우"
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: cardCount }).map((_, index) => (
          <SkeletonProductCard key={index} />
        ))}
      </div>
    </div>
  );
}
