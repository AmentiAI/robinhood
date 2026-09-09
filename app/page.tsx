'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/launchpad')
  }, [router])

  return (
    <div className="min-h-screen bg-[#0a0c0d] flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 border-4 border-[#00C805]/20" />
          <div className="absolute inset-0 border-4 border-[#00C805] border-t-transparent animate-spin" />
        </div>
        <p className="text-white text-lg font-bold uppercase tracking-wide">Redirecting to Launchpad...</p>
      </div>
    </div>
  )
}
