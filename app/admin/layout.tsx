'use client'

import { AdminSidebar } from '@/components/admin-sidebar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#050607]">
      <AdminSidebar />
      <div className="flex-1 ml-64 min-h-screen">{children}</div>
    </div>
  )
}
