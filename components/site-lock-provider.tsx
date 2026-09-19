'use client'

import { useEffect, useState, createContext, useContext, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useWallet } from '@/lib/wallet/compatibility'

type WhitelistStatus = 'approved' | 'pending' | 'rejected' | null

interface SiteLockContextValue {
  locked: boolean
  allowed: boolean
  isAdmin: boolean
  status: WhitelistStatus
  loading: boolean
  refresh: () => Promise<void>
}

const SiteLockContext = createContext<SiteLockContextValue>({
  locked: true,
  allowed: false,
  isAdmin: false,
  status: null,
  loading: true,
  refresh: async () => {},
})

export function useSiteLock() {
  return useContext(SiteLockContext)
}

const ALLOWED_WHEN_LOCKED = ['/', '/support', '/privacy', '/terms']

export function SiteLockProvider({ children }: { children: React.ReactNode }) {
  const { currentAddress, isConnected } = useWallet()
  const pathname = usePathname()
  const router = useRouter()
  const [locked, setLocked] = useState(true)
  const [allowed, setAllowed] = useState(false)
  const [isAdminUser, setIsAdminUser] = useState(false)
  const [status, setStatus] = useState<WhitelistStatus>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const url = currentAddress
        ? `/api/site-whitelist?wallet=${encodeURIComponent(currentAddress)}`
        : '/api/site-whitelist'
      const res = await fetch(url)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      const isLocked = Boolean(data.locked)
      const admin = Boolean(data.isAdmin)
      setLocked(isLocked)
      setIsAdminUser(admin)
      // Public stays locked; admins get platform access while lock is on
      setAllowed(Boolean(data.allowed) || !isLocked || admin)
      setStatus((data.status as WhitelistStatus) || null)
    } catch (e) {
      console.error('[SiteLock]', e)
      setLocked(true)
      setAllowed(false)
      setIsAdminUser(false)
    } finally {
      setLoading(false)
    }
  }, [currentAddress])

  useEffect(() => {
    refresh()
  }, [refresh, isConnected])

  useEffect(() => {
    if (loading) return
    if (!locked) return
    if (allowed) return

    const path = pathname || '/'
    const ok =
      ALLOWED_WHEN_LOCKED.includes(path) ||
      path.startsWith('/api') ||
      path.startsWith('/admin')

    if (!ok) {
      router.replace('/')
    }
  }, [loading, locked, allowed, pathname, router])

  return (
    <SiteLockContext.Provider
      value={{ locked, allowed, isAdmin: isAdminUser, status, loading, refresh }}
    >
      {children}
    </SiteLockContext.Provider>
  )
}
