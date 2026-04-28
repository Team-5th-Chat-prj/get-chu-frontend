import { Loader2 } from "lucide-react";

interface FormLoadingStateProps {
  title?: string;
  description?: string;
  mascotImage?: string;
}

export default function FormLoadingState({
  title = "처리 중이에요...",
  description = "여우가 잠깐 준비하고 있어요.",
  mascotImage,
}: FormLoadingStateProps) {
  return (
    <div className="state-fade-in flex items-center gap-3 rounded-[1.25rem] border border-orange-100 bg-[var(--getchu-orange-pale)]/70 px-4 py-3 text-left">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm">
        {mascotImage ? (
          <img src={mascotImage} alt="" className="mascot-float h-8 w-auto -translate-x-[9%] object-contain" />
        ) : (
          <Loader2 className="h-5 w-5 animate-spin text-[var(--getchu-orange-strong)]" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[var(--getchu-ink)]">{title}</p>
        <p className="mt-0.5 text-xs leading-5 text-[var(--muted-foreground)]">{description}</p>
      </div>
      <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[var(--getchu-orange-strong)]" />
    </div>
  );
}
