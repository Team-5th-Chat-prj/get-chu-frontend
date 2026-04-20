import { AlertTriangle, SearchX } from "lucide-react";
import { Button } from "./ui/button";

type FeedbackVariant = "empty" | "error";

const iconMap = {
  empty: SearchX,
  error: AlertTriangle,
};

const toneMap = {
  empty: "bg-[var(--getchu-orange-pale)] text-[var(--getchu-orange-strong)]",
  error: "bg-red-50 text-red-500",
};

interface FeedbackStateProps {
  variant?: FeedbackVariant;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function FeedbackState({
  variant = "empty",
  title,
  description,
  actionLabel,
  onAction,
}: FeedbackStateProps) {
  const Icon = iconMap[variant];

  return (
    <div className="surface-panel flex flex-col items-center justify-center px-6 py-12 text-center sm:px-10 sm:py-16">
      <div className={`mb-5 flex size-16 items-center justify-center rounded-full ${toneMap[variant]}`}>
        <Icon className="size-7" />
      </div>
      <h3 className="mb-2 text-xl font-semibold text-[var(--getchu-ink)]">{title}</h3>
      <p className="max-w-md text-sm leading-6 text-[var(--muted-foreground)]">{description}</p>
      {actionLabel && onAction ? (
        <Button variant="outline" className="mt-6" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
