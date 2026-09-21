'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'

type BrandLoaderProps = {
  /** full = page center, card = panel, inline = compact row */
  variant?: 'full' | 'card' | 'inline'
  label?: string
  className?: string
}

export function BrandLoader({
  variant = 'full',
  label = 'Loading',
  className,
}: BrandLoaderProps) {
  if (variant === 'inline') {
    return (
      <div
        className={cn('inline-flex items-center gap-3', className)}
        role="status"
        aria-label={label}
      >
        <Image
          src="/hoodgfx-logo.png"
          alt=""
          width={36}
          height={36}
          className="w-9 h-9 object-contain hg-loader-logo"
          priority
        />
        <div className="w-24 h-2 rounded-full bg-white/[0.08] overflow-hidden">
          <div className="hg-loader-bar h-full rounded-full" />
        </div>
      </div>
    )
  }

  if (variant === 'card') {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-5 py-12 px-6',
          className
        )}
        role="status"
        aria-label={label}
      >
        <Image
          src="/hoodgfx-logo.png"
          alt="HoodGFX"
          width={140}
          height={140}
          className="w-[140px] h-[140px] object-contain hg-loader-logo"
          priority
        />
        <div className="w-52 max-w-full h-2 rounded-full bg-white/[0.08] overflow-hidden">
          <div className="hg-loader-bar h-full rounded-full" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
          {label}
        </p>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'min-h-screen bg-[#0a0a0c] flex flex-col items-center justify-center gap-7 px-6',
        className
      )}
      role="status"
      aria-label={label}
    >
      <div className="relative">
        <div
          aria-hidden
          className="absolute inset-0 -m-12 rounded-full blur-3xl opacity-45"
          style={{
            background:
              'radial-gradient(circle, rgba(45,226,255,0.35), rgba(255,43,214,0.15), transparent 70%)',
          }}
        />
        <Image
          src="/hoodgfx-logo.png"
          alt="HoodGFX"
          width={200}
          height={200}
          className="relative w-[180px] h-[180px] sm:w-[200px] sm:h-[200px] object-contain hg-loader-logo"
          priority
        />
      </div>
      <div className="w-64 max-w-[75vw] h-2 rounded-full bg-white/[0.08] overflow-hidden border border-white/[0.06]">
        <div className="hg-loader-bar h-full rounded-full" />
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">
        {label}
      </p>
    </div>
  )
}
