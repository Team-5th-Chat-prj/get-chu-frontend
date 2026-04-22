import { MessageSquareText } from "lucide-react";
import { Button } from "../button";

interface ChatListEmptyStateProps {
  mascotImage: string;
  onAction: () => void;
}

export default function ChatListEmptyState({ mascotImage, onAction }: ChatListEmptyStateProps) {
  return (
    <div className="state-fade-in px-6 py-14 text-center sm:px-10">
      <span className="inline-flex rounded-full bg-[#f6efff] px-3 py-1 text-xs font-semibold text-[#7b6db6]">
        Empty Feed
      </span>
      <div className="mx-auto mt-5 flex h-24 w-24 items-center justify-center rounded-[2rem] bg-[linear-gradient(180deg,#fff9f3,#f7f1ff)] shadow-[0_18px_36px_rgba(255,138,61,0.14)] ring-1 ring-orange-100/80">
        <img
          src={mascotImage}
          alt="빈 메시지 상자를 든 여우"
          className="mascot-float h-16 w-auto -translate-x-[9%] object-contain mix-blend-multiply drop-shadow-[0_10px_18px_rgba(255,138,61,0.16)]"
        />
      </div>
      <div className="mt-6 flex items-center justify-center gap-2">
        <MessageSquareText className="h-5 w-5 text-[var(--getchu-orange)]" />
        <h3 className="text-xl font-semibold text-[var(--getchu-ink)] sm:text-2xl">
          아직 대화가 없어요. 첫 거래를 시작해보세요!
        </h3>
      </div>
      <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)] sm:text-base">
        마음에 드는 상품에서 채팅을 시작하면 여기에 대화가 모여요.
      </p>
      <Button
        type="button"
        onClick={onAction}
        className="mt-6 rounded-full bg-[var(--getchu-orange)] px-5 text-white hover:bg-[var(--getchu-orange-strong)]"
      >
        상품 둘러보기
      </Button>
    </div>
  );
}
