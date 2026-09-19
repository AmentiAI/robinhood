'use client'

import { usePathname } from 'next/navigation'
import { AppTopBar } from '@/components/app-top-bar'
import { SidebarNav } from '@/components/sidebar-nav'
import { RightSidebar } from '@/components/right-sidebar'
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

  // Homepage stays splash-only. Elsewhere: lock blocks non-admins; admins pass through.
  if (isHome || (!loading && locked && !allowed)) {
    return <div className="min-h-screen overflow-x-hidden bg-black">{children}</div>
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#09090b]">
      <AppTopBar />
      <SidebarNav />
      <RightSidebar />

      <div className="relative pt-16 sm:pt-[4.25rem] lg:pl-72 xl:pr-72 min-h-screen flex flex-col">
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
