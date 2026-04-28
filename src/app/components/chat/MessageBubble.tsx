import { User } from "lucide-react";
import MessageStatus from "./MessageStatus";

interface MessageBubbleProps {
  content: string;
  time: string;
  isMe: boolean;
  senderNickname: string;
  opponentProfileImageUrl?: string | null;
  status?: "sending" | "failed";
  onRetry?: () => void;
}

export default function MessageBubble({
  content,
  time,
  isMe,
  senderNickname,
  opponentProfileImageUrl,
  status,
  onRetry,
}: MessageBubbleProps) {
  if (isMe) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-1 flex justify-end duration-200">
        <div className="flex max-w-[78%] items-end gap-2">
          <div className="flex flex-col items-end gap-1">
            <p className="text-xs text-gray-400">{time}</p>
            <MessageStatus status={status} onRetry={onRetry} />
          </div>
          <div
            className={`rounded-[1.35rem] rounded-br-md bg-[var(--getchu-orange)] px-4 py-2.5 text-white shadow-[0_12px_24px_rgba(255,138,61,0.18)] transition ${
              status === "sending" ? "opacity-70" : ""
            } ${status === "failed" ? "bg-red-500" : ""}`}
          >
            <p className="whitespace-pre-wrap break-words text-sm leading-6">{content}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-1 flex justify-start duration-200">
      <div className="flex max-w-[78%] items-start gap-2">
        <div className="mt-1 h-8 w-8 shrink-0 overflow-hidden rounded-full bg-[var(--getchu-cream)] ring-1 ring-orange-100">
          {opponentProfileImageUrl ? (
            <img
              src={opponentProfileImageUrl}
              alt=""
              className="h-full w-full object-cover"
              onError={(event) => {
                (event.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <User className="h-4 w-4 text-gray-400" />
            </div>
          )}
        </div>
        <div>
          <p className="mb-1 text-xs font-medium text-gray-600">{senderNickname}</p>
          <div className="flex items-end gap-2">
            <div className="rounded-[1.35rem] rounded-bl-md bg-white px-4 py-2.5 text-gray-900 shadow-sm ring-1 ring-orange-100">
              <p className="whitespace-pre-wrap break-words text-sm leading-6">{content}</p>
            </div>
            <p className="shrink-0 text-xs text-gray-400">{time}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
