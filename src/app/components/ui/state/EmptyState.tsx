import StateCard from "./StateCard";

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  mascotImage?: string;
}

export default function EmptyState({
  title = "아직 등록된 상품이 없어요 🥲",
  description = "조금 뒤에 다시 둘러봐도 좋아요.",
  actionLabel,
  onAction,
  mascotImage,
}: EmptyStateProps) {
  return (
    <StateCard
      eyebrow="Empty Feed"
      title={title}
      description={description}
      actionLabel={actionLabel}
      onAction={onAction}
      mascotImage={mascotImage}
      mascotAlt="빈 상자를 든 여우"
    />
  );
}
