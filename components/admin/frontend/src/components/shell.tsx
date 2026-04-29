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
    <main className="min-h-screen bg-[#f6f9fc] text-slate-950">
      <div className="mx-auto max-w-[1500px] px-4 py-4 lg:px-6">
        <header className="mb-6 rounded-[28px] border border-slate-200/80 bg-white px-6 py-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">{eyebrow}</p>
              <h1 className="max-w-4xl text-3xl font-semibold tracking-tight text-slate-950 lg:text-[2.5rem]">{title}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 lg:text-[15px]">{description}</p>
            </div>
            {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
          </div>
        </header>
        {children}
      </div>
    </main>
  );
}
