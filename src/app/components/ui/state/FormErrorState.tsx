import { AlertCircle } from "lucide-react";

interface FormErrorStateProps {
  title?: string;
  description?: string;
  mascotImage?: string;
}

export default function FormErrorState({
  title = "문제가 발생했어요. 다시 시도해주세요.",
  description,
  mascotImage,
}: FormErrorStateProps) {
  return (
    <div className="state-fade-in flex items-center gap-3 rounded-[1.25rem] border border-red-100 bg-red-50 px-4 py-3 text-left">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm">
        {mascotImage ? (
          <img src={mascotImage} alt="" className="h-8 w-auto -translate-x-[9%] object-contain" />
        ) : (
          <AlertCircle className="h-5 w-5 text-red-500" />
        )}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-red-600">{title}</p>
        {description ? <p className="mt-0.5 text-xs leading-5 text-red-500">{description}</p> : null}
      </div>
    </div>
  );
}
