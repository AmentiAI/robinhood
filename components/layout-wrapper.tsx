'use client'

import { usePathname } from 'next/navigation'
import { AppTopBar } from '@/components/app-top-bar'
import { SidebarNav } from '@/components/sidebar-nav'
import { RightSidebar } from '@/components/right-sidebar'
import { GlobalFooter } from '@/components/global-footer'
import { FallingCodeBackground } from '@/components/falling-code-background'

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdminPage = pathname?.startsWith('/admin')

  if (isAdminPage) {
    return <>{children}</>
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
