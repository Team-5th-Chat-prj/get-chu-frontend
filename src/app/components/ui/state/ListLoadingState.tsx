interface ListLoadingStateProps {
  title?: string;
  description?: string;
  itemCount?: number;
}

function SkeletonListItem() {
  return (
    <div className="rounded-[28px] border border-[var(--getchu-border)] bg-white p-4 shadow-[0_12px_32px_rgba(148,163,184,0.08)] sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 gap-4">
          <div className="skeleton h-20 w-20 shrink-0 rounded-2xl sm:h-24 sm:w-24" />
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex gap-2">
              <div className="skeleton h-6 w-16 rounded-full" />
              <div className="skeleton h-6 w-20 rounded-full" />
            </div>
            <div className="skeleton h-5 w-3/4" />
            <div className="skeleton h-7 w-28" />
          </div>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-48">
          <div className="skeleton h-10 rounded-full" />
          <div className="skeleton h-10 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export default function ListLoadingState({
  title = "정보를 불러오는 중이에요...",
  description = "잠시만 기다려 주세요. 여우가 목록을 정리하고 있어요.",
  itemCount = 3,
}: ListLoadingStateProps) {
  return (
    <div className="state-fade-in space-y-4">
      <div className="rounded-[26px] border border-orange-100 bg-[var(--getchu-orange-pale)]/45 px-5 py-4">
        <p className="text-sm font-semibold text-[var(--getchu-ink)]">{title}</p>
        {description ? <p className="mt-1 text-xs text-[var(--muted-foreground)]">{description}</p> : null}
      </div>

      <div className="space-y-4">
        {Array.from({ length: itemCount }).map((_, index) => (
          <SkeletonListItem key={index} />
        ))}
      </div>
    </div>
  );
}
