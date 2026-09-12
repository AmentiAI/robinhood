'use client'

import { usePathname } from 'next/navigation'
import { AppTopBar } from '@/components/app-top-bar'
import { SidebarNav } from '@/components/sidebar-nav'
import { RightSidebar } from '@/components/right-sidebar'
import { GlobalFooter } from '@/components/global-footer'
import { FallingCodeBackground } from '@/components/falling-code-background'
import { SiteLockProvider, useSiteLock } from '@/components/site-lock-provider'

function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { locked, loading } = useSiteLock()
  const isAdminPage = pathname?.startsWith('/admin')
  const isHome = pathname === '/'

  if (isAdminPage) {
    return <>{children}</>
  }

  // Site locked: one bare splash page — no nav chrome
  if ((!loading && locked) || (loading && isHome)) {
    return <div className="min-h-screen overflow-x-hidden bg-[#050607]">{children}</div>
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#050607]">
      <AppTopBar />
      <SidebarNav />
      <RightSidebar />

      <div className="relative pt-16 lg:pl-64 xl:pr-72 min-h-screen flex flex-col">
        <FallingCodeBackground />
        <main className="relative z-10 flex-1 overflow-x-hidden w-full">{children}</main>
        <div className="relative z-10">
          <GlobalFooter />
        </div>
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
