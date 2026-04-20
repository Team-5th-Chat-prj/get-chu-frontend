import { ReactNode } from "react";
import { Button } from "../button";

interface StateCardProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  mascotImage?: string;
  mascotAlt?: string;
  eyebrow?: string;
  children?: ReactNode;
}

export default function StateCard({
  title,
  description,
  actionLabel,
  onAction,
  mascotImage,
  mascotAlt = "Get-chu fox mascot",
  eyebrow,
  children,
}: StateCardProps) {
  return (
    <div className="surface-panel state-fade-in relative overflow-hidden px-6 py-10 text-center sm:px-10 sm:py-12">
      <div className="pointer-events-none absolute -left-6 bottom-4 h-24 w-24 rounded-full bg-[var(--getchu-orange-pale)] blur-2xl" />
      <div className="pointer-events-none absolute -right-2 top-4 h-24 w-24 rounded-full bg-[#f1e9ff] blur-2xl" />

      <div className="relative flex flex-col items-center">
        {eyebrow ? (
          <span className="mb-4 inline-flex rounded-full bg-[#f6efff] px-3 py-1 text-xs font-semibold text-[#7b6db6]">
            {eyebrow}
          </span>
        ) : null}

        {mascotImage ? (
          <div className="mb-5 flex h-28 w-28 items-center justify-center rounded-[2rem] bg-[linear-gradient(180deg,#fff9f3,#f7f1ff)] shadow-[0_18px_36px_rgba(255,138,61,0.14)] ring-1 ring-orange-100/80">
            <img
              src={mascotImage}
              alt={mascotAlt}
              className="mascot-float h-20 w-auto object-contain drop-shadow-[0_10px_18px_rgba(255,138,61,0.16)]"
            />
          </div>
        ) : null}

        <h3 className="text-xl font-semibold text-[var(--getchu-ink)] sm:text-2xl">{title}</h3>
        {description ? (
          <p className="mt-3 max-w-md text-sm leading-6 text-[var(--muted-foreground)] sm:text-base">{description}</p>
        ) : null}

        {children ? <div className="mt-6 w-full">{children}</div> : null}

        {actionLabel && onAction ? (
          <Button
            type="button"
            onClick={onAction}
            className="mt-6 rounded-full bg-[var(--getchu-orange)] px-5 text-white hover:bg-[var(--getchu-orange-strong)]"
          >
            {actionLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
