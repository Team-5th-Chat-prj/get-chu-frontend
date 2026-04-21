import { CheckCircle2 } from "lucide-react";

interface FormSuccessFeedbackProps {
  title?: string;
  description?: string;
  mascotImage?: string;
}

export default function FormSuccessFeedback({
  title = "완료됐어요!",
  description,
  mascotImage,
}: FormSuccessFeedbackProps) {
  return (
    <div className="state-fade-in flex items-center gap-3 rounded-[1.25rem] border border-emerald-100 bg-emerald-50 px-4 py-3 text-left">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm">
        {mascotImage ? (
          <img src={mascotImage} alt="" className="mascot-float h-8 w-auto -translate-x-[9%] object-contain" />
        ) : (
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
        )}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-emerald-700">{title}</p>
        {description ? <p className="mt-0.5 text-xs leading-5 text-emerald-600">{description}</p> : null}
      </div>
    </div>
  );
}
