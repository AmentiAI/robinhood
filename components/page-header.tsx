interface PageHeaderProps {
  title: string
  subtitle: string
  action?: React.ReactNode
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="relative px-4 sm:px-6 lg:px-8 pt-6 pb-2">
      <div className="max-w-[1400px] mx-auto hg-rise">
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.1] bg-[#131318]/75 backdrop-blur-md px-5 sm:px-7 py-6 sm:py-7 shadow-[0_1px_0_rgba(255,255,255,0.05)_inset]">
          {/* Color edge + soft glow */}
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-px"
            style={{
              background:
                'linear-gradient(90deg, transparent, #2DE2FF, #A855F7, #FF2BD6, transparent)',
              backgroundSize: '200% 100%',
              animation: 'hg-shimmer 5s linear infinite',
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full blur-3xl"
            style={{
              background: 'radial-gradient(circle, rgba(45,226,255,0.22), transparent 70%)',
              animation: 'hg-orb-alt 12s ease-in-out infinite',
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -left-10 bottom-[-30%] h-36 w-36 rounded-full blur-3xl"
            style={{
              background: 'radial-gradient(circle, rgba(255,43,214,0.18), transparent 70%)',
              animation: 'hg-orb 16s ease-in-out infinite',
            }}
          />

          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold tracking-[0.22em] uppercase text-[#2DE2FF] mb-2">
                HoodGFX
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1.5">
                <span className="hg-gradient-text">{title}</span>
              </h1>
              <p className="text-zinc-400 text-sm max-w-xl leading-relaxed">{subtitle}</p>
            </div>
            {action ? (
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0 [&_a]:hg-btn-glow [&_button]:hg-btn-glow">
                {action}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
