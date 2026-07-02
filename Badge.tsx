import clsx from "clsx";

type BadgeTone = "neutral" | "amber" | "green" | "red";

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: "bg-court-100 text-court-900/70",
  amber: "bg-hardwood-100 text-hardwood-700",
  green: "bg-rim-green/10 text-rim-green",
  red: "bg-rim-red/10 text-rim-red",
};

export default function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
        TONE_CLASSES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
