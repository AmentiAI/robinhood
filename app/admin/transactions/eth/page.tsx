'use client'

import { useState, useEffect } from 'react'
import { useWallet } from '@/lib/wallet/compatibility'
import { useAdminCheck } from '@/lib/auth/use-admin-check'
import { ExternalLink, RefreshCw } from 'lucide-react'

interface PendingPayment {
  id: string
  wallet_address: string
  credits_amount: number
  bitcoin_amount: string
  payment_address: string
  status: 'pending' | 'completed' | 'expired'
  payment_txid: string | null
  confirmations: number
  created_at: string
  expires_at: string
  credited: boolean
  payment_type: string | null
}

export default function EthPaymentsAdminPage() {
  const { isConnected, currentAddress } = useWallet()
  const { isAdmin: authorized, loading: adminLoading } = useAdminCheck(currentAddress || null)
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<PendingPayment[]>([])
  const [error, setError] = useState<string | null>(null)

  const explorer =
    process.env.NEXT_PUBLIC_RH_NETWORK === 'mainnet'
      ? 'https://robinhoodchain.blockscout.com'
      : 'https://explorer.testnet.chain.robinhood.com'

  const load = async () => {
    if (!currentAddress) return
    setLoading(true)
    setError(null)
    try {
      // payment_type=sol kept for legacy DB rows that stored ETH purchases under that key
      const response = await fetch(
        `/api/admin/transactions?wallet_address=${encodeURIComponent(currentAddress)}&payment_type=sol`
      )
      if (!response.ok) throw new Error('Failed to load transactions')
      const data = await response.json()
      setTransactions(data.transactions || data.pending_payments || [])
    } catch (e: any) {
      setError(e.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (authorized && currentAddress) load()
  }, [authorized, currentAddress])

  if (adminLoading) return <div className="p-8 text-[#a8aab2]">Checking access...</div>
  if (!isConnected || !authorized) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-black text-white mb-2">Access Denied</h1>
        <p className="text-[#a8aab2]">Connect an admin wallet.</p>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#2DE2FF] mb-2">
            Credits
          </p>
          <h1 className="text-3xl font-black text-white">ETH Payments</h1>
          <p className="text-[#a8aab2] text-sm mt-1">
            Credit purchases paid in ETH on Robinhood Chain
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#15181a] border border-[#2DE2FF]/30 text-white text-sm font-bold"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-[#ff5052]/40 bg-[#ff5052]/10 p-4 text-[#ff5052] text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-[#a8aab2]">Loading...</div>
      ) : transactions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#2DE2FF]/25 bg-[#15181a] py-16 text-center text-[#a8aab2]">
          No ETH credit payments yet
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 bg-[#15181a] overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-[10px] uppercase tracking-wider text-[#71717A]">
                <th className="px-4 py-3">Wallet</th>
                <th className="px-4 py-3">Credits</th>
                <th className="px-4 py-3">ETH Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Tx</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className="border-b border-white/5 text-white">
                  <td className="px-4 py-3 font-mono text-xs">
                    {tx.wallet_address?.slice(0, 6)}...{tx.wallet_address?.slice(-4)}
                  </td>
                  <td className="px-4 py-3 font-bold">{tx.credits_amount}</td>
                  <td className="px-4 py-3 text-[#2DE2FF] font-mono">
                    {tx.bitcoin_amount} ETH
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider ${
                        tx.status === 'completed'
                          ? 'text-[#2DE2FF]'
                          : tx.status === 'expired'
                            ? 'text-[#ff5052]'
                            : 'text-[#FF2BD6]'
                      }`}
                    >
                      {tx.status}
                      {tx.credited ? ' - credited' : ''}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {tx.payment_txid ? (
                      <a
                        href={`${explorer}/tx/${tx.payment_txid}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#2DE2FF] hover:underline inline-flex items-center gap-1 font-mono text-xs"
                      >
                        {tx.payment_txid.slice(0, 10)}... <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-4 py-3 text-[#a8aab2] text-xs">
                    {tx.created_at ? new Date(tx.created_at).toLocaleString() : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
