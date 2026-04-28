import { AlertCircle, Loader2, RotateCcw } from "lucide-react";

interface MessageStatusProps {
  status?: "sending" | "failed";
  onRetry?: () => void;
}

export default function MessageStatus({ status, onRetry }: MessageStatusProps) {
  if (status === "sending") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-orange-100/90">
        <Loader2 className="h-3 w-3 animate-spin" />
        전송 중
      </span>
    );
  }

  if (status === "failed") {
    return (
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-500 transition hover:bg-red-100"
      >
        <AlertCircle className="h-3 w-3" />
        실패
        <RotateCcw className="h-3 w-3" />
      </button>
    );
  }

  return null;
}
