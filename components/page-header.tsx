interface PageHeaderProps {
  title: string
  subtitle: string
  action?: React.ReactNode
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="relative bg-[#0a0c0d] text-white border-b border-[#00C805]/25 px-6 lg:px-12 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(0,200,5,0.18),transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(204,255,0,0.04),transparent_40%)]" />
      <div className="w-full py-8 lg:py-12 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 mb-3">
              <span className="w-2 h-2 bg-[#00C805] shadow-[0_0_10px_#00C805]" />
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#00C805]">
                OrdMaker · Robinhood Chain
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight uppercase text-white mb-3">
              <span className="text-[#00C805]">{title}</span>
            </h1>
            <p className="text-[#a8aab2] text-base lg:text-lg font-medium max-w-2xl">
              {subtitle}
            </p>
          </div>
          {action && (
            <div className="flex items-center gap-3">
              {action}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
