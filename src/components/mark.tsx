import { cn } from "@/lib/utils";

export function VelaMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("text-sage", className)} aria-hidden>
      <rect width="32" height="32" rx="8" fill="currentColor" opacity="0.14" />
      <path
        d="M8 24 L16 6 L24 24 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M12.2 16.5 H19.8" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="22.5" cy="8.5" r="1.15" fill="currentColor" />
    </svg>
  );
}
