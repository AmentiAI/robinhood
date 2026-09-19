'use client'

import { useState, useEffect } from 'react'
import { useWallet } from '@/lib/wallet/compatibility'
import { useAdminCheck } from '@/lib/auth/use-admin-check'

export default function SiteSettingsPage() {
  const { currentAddress } = useWallet()
  const [settings, setSettings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const activeWalletAddress = currentAddress
  const { isAdmin: authorized, loading: adminLoading } = useAdminCheck(activeWalletAddress || null)

  useEffect(() => {
    if (activeWalletAddress && authorized) {
      loadSettings()
    }
  }, [activeWalletAddress, authorized])

  const loadSettings = async () => {
    if (!activeWalletAddress) return
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(
        `/api/admin/site-settings?wallet_address=${encodeURIComponent(activeWalletAddress)}`
      )
      if (!response.ok) throw new Error('Failed to load settings')
      const data = await response.json()
      setSettings(data.settings || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const updateSetting = async (key: string, value: any) => {
    if (!activeWalletAddress) return
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const response = await fetch('/api/admin/site-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: activeWalletAddress,
          key,
          value,
        }),
      })
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to update setting')
      }
      const data = await response.json()
      setSuccess(`Setting "${key}" updated successfully`)
      setSettings((prev) =>
        prev.map((s: any) =>
          s.key === key ? { ...s, value: data.value, updated_at: data.updated_at } : s
        )
      )
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to update setting')
    } finally {
      setSaving(false)
    }
  }

  if (adminLoading) {
    return <div className="p-8 text-[#a8aab2]">Checking access...</div>
  }

  if (!authorized) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-black text-white mb-2">Access Denied</h1>
        <p className="text-[#a8aab2]">Admin wallet required.</p>
      </div>
    )
  }

  const showCreditPurchase = settings.find((s: any) => s.key === 'show_credit_purchase')?.value ?? true
  const rhNetwork =
    settings.find((s: any) => s.key === 'rh_network')?.value ??
    process.env.NEXT_PUBLIC_RH_NETWORK ??
    'testnet'
  const rhTestnetRpc =
    settings.find((s: any) => s.key === 'rh_testnet_rpc_url')?.value ??
    'https://rpc.testnet.chain.robinhood.com'
  const rhMainnetRpc =
    settings.find((s: any) => s.key === 'rh_mainnet_rpc_url')?.value ??
    'https://rpc.mainnet.chain.robinhood.com'

  const networkLabel = typeof rhNetwork === 'string' ? rhNetwork.replace(/"/g, '') : 'testnet'

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-black text-white mb-2">Site Settings</h1>
        <p className="text-[#a8aab2] mb-8">Robinhood Chain platform configuration</p>

        {error && (
          <div className="mb-4 p-4 rounded-xl border border-[#ff5052]/40 bg-[#ff5052]/10 text-[#ff5052]">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 rounded-xl border border-[#2DE2FF]/40 bg-[#2DE2FF]/10 text-[#2DE2FF]">
            {success}
          </div>
        )}

        {loading ? (
          <div className="text-[#a8aab2]">Loading settings...</div>
        ) : (
          <div className="space-y-6">
            <div className="bg-[#15181a] border border-[#2DE2FF]/25 rounded-xl p-6">
              <div className="mb-6">
                <h2 className="text-xl font-black text-[#2DE2FF] mb-1">Robinhood Chain Network</h2>
                <p className="text-sm text-[#a8aab2]">
                  Switch between testnet and mainnet. Deployments and mints use env + these settings.
                  Contract addresses are configured in <code className="text-[#FF2BD6]">.env</code>.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Active Network</label>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => updateSetting('rh_network', 'testnet')}
                      disabled={saving}
                      className={`flex-1 px-6 py-4 rounded-xl font-semibold transition-all ${
                        networkLabel === 'testnet'
                          ? 'bg-[#2DE2FF] text-black'
                          : 'bg-[#0a0c0d] border border-[#2DE2FF]/30 text-white hover:border-[#2DE2FF]'
                      } disabled:opacity-50`}
                    >
                      <div className="text-lg">Testnet</div>
                      <div className="text-xs mt-1 opacity-80">Chain ID 46630</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => updateSetting('rh_network', 'mainnet')}
                      disabled={saving}
                      className={`flex-1 px-6 py-4 rounded-xl font-semibold transition-all ${
                        networkLabel === 'mainnet'
                          ? 'bg-[#2DE2FF] text-black'
                          : 'bg-[#0a0c0d] border border-[#2DE2FF]/30 text-white hover:border-[#2DE2FF]'
                      } disabled:opacity-50`}
                    >
                      <div className="text-lg">Mainnet</div>
                      <div className="text-xs mt-1 opacity-80">Chain ID 4663</div>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[#2DE2FF]/20">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Testnet RPC</label>
                    <input
                      type="text"
                      value={String(rhTestnetRpc).replace(/^"|"$/g, '')}
                      onChange={(e) => updateSetting('rh_testnet_rpc_url', e.target.value)}
                      disabled={saving}
                      className="w-full px-4 py-2 bg-[#0a0c0d] border border-[#2DE2FF]/30 rounded-xl text-white text-sm font-mono focus:border-[#2DE2FF] outline-none disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Mainnet RPC</label>
                    <input
                      type="text"
                      value={String(rhMainnetRpc).replace(/^"|"$/g, '')}
                      onChange={(e) => updateSetting('rh_mainnet_rpc_url', e.target.value)}
                      disabled={saving}
                      className="w-full px-4 py-2 bg-[#0a0c0d] border border-[#2DE2FF]/30 rounded-xl text-white text-sm font-mono focus:border-[#2DE2FF] outline-none disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="mt-4 p-4 bg-[#0a0c0d] rounded-xl border border-[#2DE2FF]/20 text-sm text-[#a8aab2] space-y-2">
                  <p>
                    <strong className="text-white">Env network:</strong>{' '}
                    {process.env.NEXT_PUBLIC_RH_NETWORK || 'testnet'}
                  </p>
                  <p>
                    <strong className="text-white">Also set in .env:</strong>{' '}
                    <code className="text-[#2DE2FF]">RH_FACTORY_ADDRESS</code>,{' '}
                    <code className="text-[#2DE2FF]">RH_MARKETPLACE_ADDRESS</code>,{' '}
                    <code className="text-[#2DE2FF]">RH_PLATFORM_WALLET</code>
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-[#15181a] border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-black text-white mb-1">Credit Purchase Visibility</h2>
                  <p className="text-sm text-[#a8aab2]">
                    Control whether credit purchase UI is visible across the site
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!showCreditPurchase}
                    onChange={(e) => updateSetting('show_credit_purchase', e.target.checked)}
                    disabled={saving}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#0a0c0d] rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2DE2FF]" />
                  <span className="ml-3 text-sm font-medium text-white">
                    {showCreditPurchase ? 'Visible' : 'Hidden'}
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
