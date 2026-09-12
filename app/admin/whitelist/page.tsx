'use client'

import { useEffect, useState } from 'react'
import { useWallet } from '@/lib/wallet/compatibility'
import { useAdminCheck } from '@/lib/auth/use-admin-check'
import { toast } from 'sonner'

interface Entry {
  id: string
  wallet_address: string
  email: string | null
  twitter: string | null
  status: string
  created_at: string
}

export default function AdminWhitelistPage() {
  const { currentAddress } = useWallet()
  const { isAdmin: authorized, loading: adminLoading } = useAdminCheck(currentAddress || null)
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')

  const load = async () => {
    setLoading(true)
    try {
      if (!currentAddress) return
      const res = await fetch(
        `/api/admin/site-whitelist?status=${filter}&wallet_address=${encodeURIComponent(currentAddress)}`
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setEntries(data.entries || [])
    } catch (e: any) {
      toast.error(e.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (authorized && currentAddress) load()
  }, [authorized, filter, currentAddress])

  const moderate = async (wallet: string, action: 'approve' | 'reject') => {
    if (!currentAddress) return
    try {
      const res = await fetch('/api/site-whitelist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: wallet,
          action,
          admin_wallet: currentAddress,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      toast.success(`${action}d ${wallet.slice(0, 8)}…`)
      load()
    } catch (e: any) {
      toast.error(e.message || 'Failed')
    }
  }

  if (adminLoading) return <div className="p-8 text-[#a8aab2]">Checking access...</div>
  if (!authorized) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-black text-white">Access Denied</h1>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-5xl">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00C805] mb-2">Access</p>
        <h1 className="text-3xl font-black text-white">Site Whitelist</h1>
        <p className="text-[#a8aab2] text-sm mt-1">Approve wallets to unlock the platform</p>
      </div>

      <div className="flex gap-2">
        {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase ${
              filter === f ? 'bg-[#00C805] text-black' : 'bg-[#15181a] border border-white/10 text-[#a8aab2]'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 text-center text-[#a8aab2]">Loading...</div>
      ) : entries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#00C805]/25 bg-[#15181a] py-16 text-center text-[#a8aab2]">
          No {filter === 'all' ? '' : filter} entries
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((e) => (
            <div
              key={e.id}
              className="flex flex-wrap items-center gap-3 p-4 rounded-2xl bg-[#15181a] border border-white/10"
            >
              <div className="flex-1 min-w-0">
                <p className="font-mono text-sm text-[#00C805] break-all">{e.wallet_address}</p>
                <p className="text-xs text-[#71717A] mt-1">
                  {e.status}
                  {e.email ? ` · ${e.email}` : ''}
                  {e.twitter ? ` · ${e.twitter}` : ''}
                  {e.created_at ? ` · ${new Date(e.created_at).toLocaleString()}` : ''}
                </p>
              </div>
              {e.status === 'pending' && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => moderate(e.wallet_address, 'approve')}
                    className="px-3 py-2 rounded-lg bg-[#00C805] text-black text-xs font-black uppercase"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => moderate(e.wallet_address, 'reject')}
                    className="px-3 py-2 rounded-lg border border-[#ff5052]/40 text-[#ff5052] text-xs font-black uppercase"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
