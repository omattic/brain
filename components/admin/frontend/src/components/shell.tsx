export function Shell({
  eyebrow = "Brain Admin",
  title,
  description,
  actions,
  children,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(15,99,246,0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(249,115,22,0.12),transparent_22%),linear-gradient(180deg,#f5f0e6_0%,#eef4ff_100%)]">
      <div className="mx-auto max-w-7xl px-5 py-8">
        <header className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{eyebrow}</p>
            <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 lg:text-5xl">{title}</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">{description}</p>
          </div>
          {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
        </header>
        {children}
      </div>
    </main>
  );
}
