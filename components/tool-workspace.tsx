import { cn } from '@/lib/utils'

/** Consistent max-width content wrapper for studio/tool pages */
export function ToolWorkspace({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8', className)}>
      {children}
    </div>
  )
}

/** Dark studio panel with optional title row */
export function ToolPanel({
  title,
  subtitle,
  action,
  children,
  className,
  delayClass,
}: {
  title?: string
  subtitle?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
  delayClass?: string
}) {
  return (
    <section
      className={cn(
        'hg-card relative overflow-hidden rounded-2xl border border-white/[0.1] bg-[#131318] shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]',
        delayClass,
        className
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent, rgba(45,226,255,0.5), rgba(255,43,214,0.4), transparent)',
        }}
      />
      {(title || action) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 sm:px-6 pt-5 sm:pt-6 pb-3 border-b border-white/[0.06]">
          <div className="min-w-0">
            {title ? (
              <h2 className="text-base sm:text-lg font-semibold text-white tracking-tight">
                {title}
              </h2>
            ) : null}
            {subtitle ? (
              <p className="text-sm text-zinc-500 mt-0.5">{subtitle}</p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      )}
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  )
}

/** Tip / info callout used in tool UIs */
export function ToolTip({
  children,
  tone = 'cyan',
}: {
  children: React.ReactNode
  tone?: 'cyan' | 'magenta' | 'amber'
}) {
  const tones = {
    cyan: 'border-[#2DE2FF]/25 bg-[#2DE2FF]/[0.06] text-zinc-300',
    magenta: 'border-[#FF2BD6]/25 bg-[#FF2BD6]/[0.06] text-zinc-300',
    amber: 'border-amber-500/25 bg-amber-500/[0.08] text-amber-100/90',
  }
  return (
    <div className={cn('rounded-xl border px-3.5 py-3 text-xs sm:text-sm leading-relaxed', tones[tone])}>
      {children}
    </div>
  )
}
