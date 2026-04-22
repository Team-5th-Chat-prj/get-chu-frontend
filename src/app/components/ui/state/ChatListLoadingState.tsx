function SkeletonChatItem() {
  return (
    <div className="rounded-[28px] border border-orange-100 bg-white p-4 shadow-[0_12px_32px_rgba(148,163,184,0.08)] sm:p-5">
      <div className="flex gap-4">
        <div className="skeleton h-16 w-16 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex gap-2">
            <div className="skeleton h-6 w-16 rounded-full" />
            <div className="skeleton h-6 w-20 rounded-full" />
          </div>
          <div className="skeleton h-5 w-36" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-2/3" />
        </div>
      </div>
    </div>
  );
}

export default function ChatListLoadingState() {
  return (
    <div className="space-y-4">
      <div className="rounded-[26px] border border-orange-100 bg-[linear-gradient(135deg,#fff7ed,#f7f0ff)] px-6 py-7 text-center">
        <p className="text-base font-semibold text-[var(--getchu-ink)]">채팅 목록 불러오는 중이에요...</p>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">여우가 대화방을 가지런히 정리하고 있어요.</p>
      </div>
      {Array.from({ length: 4 }).map((_, index) => (
        <SkeletonChatItem key={index} />
      ))}
    </div>
  );
}
