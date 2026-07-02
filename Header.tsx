export default function Header({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 bg-court-25/95 px-5 pb-3 pt-6 backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-court-900/50">{subtitle}</p>}
        </div>
        {action}
      </div>
    </header>
  );
}
