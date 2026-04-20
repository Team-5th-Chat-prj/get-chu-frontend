import StateCard from "./StateCard";

interface ErrorStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  mascotImage?: string;
}

export default function ErrorState({
  title = "문제가 발생했어요. 다시 시도해주세요.",
  description,
  actionLabel = "다시 시도",
  onAction,
  mascotImage,
}: ErrorStateProps) {
  return (
    <StateCard
      eyebrow="Retry"
      title={title}
      description={description}
      actionLabel={actionLabel}
      onAction={onAction}
      mascotImage={mascotImage}
      mascotAlt="헷갈린 표정의 여우"
    />
  );
}
