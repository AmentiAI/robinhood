'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BrandLoader } from '@/components/brand-loader'

export default function CreatorPassesPage() {
  const router = useRouter()

  useEffect(() => {
    router.push('/creator-passes/btc')
  }, [router])

  return <BrandLoader label="Opening creator passes" />
}
