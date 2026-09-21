'use client'

import { usePathname } from 'next/navigation'
import { AppTopBar } from '@/components/app-top-bar'
import { GlobalFooter } from '@/components/global-footer'
import { SiteLockProvider, useSiteLock } from '@/components/site-lock-provider'

function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { locked, allowed, loading } = useSiteLock()
  const isAdminPage = pathname?.startsWith('/admin')
  const isHome = pathname === '/'
  const isLegalPage = pathname === '/privacy' || pathname === '/terms'

  if (isAdminPage || isLegalPage) {
    return <>{children}</>
  }

  if (isHome || (!loading && locked && !allowed)) {
    return <div className="min-h-screen overflow-x-hidden bg-black">{children}</div>
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0a0a0c]">
      {/* Animated color wash */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div
          className="absolute -top-[20%] -left-[10%] h-[55vmin] w-[55vmin] rounded-full blur-[100px]"
          style={{
            background: 'radial-gradient(circle, rgba(45,226,255,0.28) 0%, transparent 70%)',
            animation: 'hg-orb 14s ease-in-out infinite',
          }}
        />
        <div
          className="absolute -top-[5%] right-[-8%] h-[48vmin] w-[48vmin] rounded-full blur-[110px]"
          style={{
            background: 'radial-gradient(circle, rgba(255,43,214,0.22) 0%, transparent 70%)',
            animation: 'hg-orb-alt 18s ease-in-out infinite',
          }}
        />
        <div
          className="absolute bottom-[-15%] left-[30%] h-[40vmin] w-[40vmin] rounded-full blur-[120px]"
          style={{
            background: 'radial-gradient(circle, rgba(168,85,247,0.16) 0%, transparent 70%)',
            animation: 'hg-orb 22s ease-in-out infinite reverse',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            background:
              'radial-gradient(ellipse 70% 45% at 20% 0%, rgba(45,226,255,0.08), transparent 55%), radial-gradient(ellipse 55% 40% at 85% 5%, rgba(255,43,214,0.07), transparent 50%)',
          }}
        />
      </div>

      <AppTopBar />

      <div className="relative z-10 pt-[6.75rem] sm:pt-[7.75rem] min-h-screen flex flex-col">
        <main className="flex-1 overflow-x-hidden w-full hg-fade">{children}</main>
        <GlobalFooter />
      </div>
    </div>
  )
}

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <SiteLockProvider>
      <AppShell>{children}</AppShell>
    </SiteLockProvider>
  )
}
