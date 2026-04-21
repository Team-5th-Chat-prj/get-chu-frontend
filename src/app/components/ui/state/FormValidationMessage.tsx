import { AlertCircle } from "lucide-react";

interface FormValidationMessageProps {
  message?: string;
}

export default function FormValidationMessage({ message }: FormValidationMessageProps) {
  if (!message) {
    return null;
  }

  return (
    <p className="state-fade-in mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#f6efff] px-3 py-1 text-xs font-medium text-[#7b6db6]">
      <AlertCircle className="h-3.5 w-3.5" />
      {message}
    </p>
  );
}
