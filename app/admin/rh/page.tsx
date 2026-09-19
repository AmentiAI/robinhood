'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useWallet } from '@/lib/wallet/compatibility'
import { useAdminCheck } from '@/lib/auth/use-admin-check'
import { RefreshCw, ExternalLink, Wallet, Rocket, Image as ImageIcon, ShoppingCart, AlertTriangle } from 'lucide-react'

function shortAddr(a?: string | null) {
  if (!a) return '—'
  return `${a.slice(0, 6)}…${a.slice(-4)}`
}

function weiToEth(wei?: string | null) {
  if (!wei) return '0'
  try {
    const n = Number(wei) / 1e18
    if (!Number.isFinite(n)) return '0'
    if (n === 0) return '0'
    if (n < 0.0001) return n.toExponential(2)
    return n.toFixed(4)
  } catch {
    return '0'
  }
}

export default function RobinhoodAdminPage() {
  const { currentAddress } = useWallet()
  const { isAdmin: authorized, loading: adminLoading } = useAdminCheck(currentAddress || null)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<'overview' | 'mints' | 'collections' | 'marketplace'>('overview')

  const load = async () => {
    if (!currentAddress) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/admin/rh/stats?wallet_address=${encodeURIComponent(currentAddress)}`
      )
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to load RH stats')
      }
      setData(await res.json())
    } catch (e: any) {
      setError(e.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (authorized && currentAddress) load()
  }, [authorized, currentAddress])

  if (adminLoading) {
    return <div className="p-8 text-[#a8aab2]">Checking access...</div>
  }

  if (!authorized) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <h1 className="text-2xl font-black text-white mb-2">Access Denied</h1>
          <p className="text-[#a8aab2]">Admin wallet required.</p>
        </div>
      </div>
    )
  }

  const explorer = data?.explorer || 'https://explorer.testnet.chain.robinhood.com'
  const missingContracts = !data?.factory || !data?.marketplace

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#2DE2FF] mb-2">
            Platform ops
          </p>
          <h1 className="text-3xl font-black text-white tracking-tight">Robinhood Chain</h1>
          <p className="text-[#a8aab2] text-sm mt-1">
            Network: <span className="text-[#2DE2FF] font-bold uppercase">{data?.network || '—'}</span>
            {data?.chainId ? ` · Chain ID ${data.chainId}` : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#15181a] border border-[#2DE2FF]/30 text-white text-sm font-bold hover:border-[#2DE2FF] transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {missingContracts && !loading && (
        <div className="rounded-xl border border-[#ff5052]/40 bg-[#ff5052]/10 p-4 flex gap-3">
          <AlertTriangle className="h-5 w-5 text-[#ff5052] shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-white">Contracts not deployed yet</p>
            <p className="text-sm text-[#a8aab2] mt-1">
              Set <code className="text-[#2DE2FF]">RH_FACTORY_ADDRESS</code> and{' '}
              <code className="text-[#2DE2FF]">RH_MARKETPLACE_ADDRESS</code> after{' '}
              <code className="text-[#FF2BD6]">npm run deploy:rh</code>.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-[#ff5052]/40 bg-[#ff5052]/10 p-4 text-[#ff5052] text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Wallet className="h-4 w-4 text-[#2DE2FF]" />}
          label="Platform wallet"
          value={`${(data?.platformWallet?.balanceEth ?? 0).toFixed(4)} ETH`}
          sub={shortAddr(data?.platformWallet?.address)}
          href={data?.platformWallet?.address ? `${explorer}/address/${data.platformWallet.address}` : undefined}
        />
        <StatCard
          icon={<Rocket className="h-4 w-4 text-[#2DE2FF]" />}
          label="Deployed collections"
          value={String(data?.collections?.deployed ?? 0)}
          sub={`${data?.collections?.live ?? 0} live on launchpad`}
        />
        <StatCard
          icon={<ImageIcon className="h-4 w-4 text-[#2DE2FF]" />}
          label="Confirmed mints"
          value={String(data?.mints?.confirmed ?? 0)}
          sub={`${data?.mints?.pending ?? 0} pending · ${data?.mints?.failed ?? 0} failed`}
        />
        <StatCard
          icon={<ShoppingCart className="h-4 w-4 text-[#2DE2FF]" />}
          label="Marketplace"
          value={String(data?.marketplaceStats?.active ?? 0)}
          sub={`${data?.marketplaceStats?.sold ?? 0} sold · ${data?.marketplaceStats?.pending ?? 0} pending`}
        />
      </div>

      <div className="rounded-xl border border-[#2DE2FF]/20 bg-[#15181a] p-5 space-y-3">
        <h2 className="text-sm font-black uppercase tracking-wider text-white">Contract addresses</h2>
        <AddrRow label="Factory" value={data?.factory} explorer={explorer} />
        <AddrRow label="Marketplace" value={data?.marketplace} explorer={explorer} />
        <AddrRow label="Platform wallet" value={data?.platformWallet?.address} explorer={explorer} />
        <div className="pt-2 border-t border-white/5 text-xs text-[#71717A] font-mono break-all">
          RPC: {data?.rpcUrl || '—'}
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(['overview', 'mints', 'collections', 'marketplace'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-colors ${
              tab === t
                ? 'bg-[#2DE2FF] text-black'
                : 'bg-[#15181a] border border-white/10 text-[#a8aab2] hover:border-[#2DE2FF]/40'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading && !data ? (
        <div className="py-16 text-center text-[#a8aab2]">Loading chain data...</div>
      ) : tab === 'mints' ? (
        <Table
          headers={['Collection', 'Minter', 'Token', 'Price', 'Status', 'Tx', 'When']}
          rows={(data?.recentMints || []).map((m: any) => [
            m.collection_name || '—',
            shortAddr(m.minter_wallet),
            m.token_id != null ? `#${m.token_id}` : '—',
            `${weiToEth(m.mint_price_wei)} ETH`,
            <StatusBadge key="s" status={m.mint_status} />,
            m.mint_tx_hash ? (
              <a
                key="tx"
                href={`${explorer}/tx/${m.mint_tx_hash}`}
                target="_blank"
                rel="noreferrer"
                className="text-[#2DE2FF] hover:underline inline-flex items-center gap-1"
              >
                {shortAddr(m.mint_tx_hash)} <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              '—'
            ),
            m.created_at ? new Date(m.created_at).toLocaleString() : '—',
          ])}
          empty="No Robinhood mints yet"
        />
      ) : tab === 'collections' ? (
        <Table
          headers={['Name', 'Contract', 'Status', 'Minted', 'Deploy tx']}
          rows={(data?.deployedCollections || []).map((c: any) => [
            <Link key="n" href={`/admin/collections/${c.id}`} className="text-[#2DE2FF] hover:underline font-bold">
              {c.name}
            </Link>,
            c.contract_address ? (
              <a
                key="c"
                href={`${explorer}/address/${c.contract_address}`}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-xs text-[#a8aab2] hover:text-[#2DE2FF]"
              >
                {shortAddr(c.contract_address)}
              </a>
            ) : (
              '—'
            ),
            c.collection_status || '—',
            `${c.minted_count ?? 0}/${c.total_supply ?? 0}`,
            c.rh_deploy_tx ? (
              <a
                key="d"
                href={`${explorer}/tx/${c.rh_deploy_tx}`}
                target="_blank"
                rel="noreferrer"
                className="text-[#2DE2FF] hover:underline"
              >
                {shortAddr(c.rh_deploy_tx)}
              </a>
            ) : (
              '—'
            ),
          ])}
          empty="No deployed RH collections yet"
        />
      ) : tab === 'marketplace' ? (
        <Table
          headers={['Title', 'Seller', 'Price', 'Status', 'Token', 'Listed']}
          rows={(data?.recentListings || []).map((l: any) => [
            l.title || shortAddr(l.mint_address),
            shortAddr(l.seller_wallet),
            `${Number(l.price_sol || 0).toFixed(4)} ETH`,
            <StatusBadge key="s" status={l.status} />,
            shortAddr(l.mint_address),
            l.created_at ? new Date(l.created_at).toLocaleString() : '—',
          ])}
          empty="No marketplace listings yet"
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl border border-white/10 bg-[#15181a] p-5">
            <h3 className="text-sm font-black uppercase tracking-wider text-white mb-3">Quick links</h3>
            <div className="space-y-2 text-sm">
              <Link href="/admin/launchpad" className="block text-[#2DE2FF] hover:underline">
                Launchpad hub →
              </Link>
              <Link href="/admin/marketplace" className="block text-[#2DE2FF] hover:underline">
                Marketplace admin →
              </Link>
              <Link href="/admin/collections" className="block text-[#2DE2FF] hover:underline">
                Collections manager →
              </Link>
              <a href={explorer} target="_blank" rel="noreferrer" className="block text-[#2DE2FF] hover:underline">
                Block explorer ↗
              </a>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#15181a] p-5">
            <h3 className="text-sm font-black uppercase tracking-wider text-white mb-3">Mint health</h3>
            <ul className="space-y-2 text-sm text-[#a8aab2]">
              <li>Total: <span className="text-white font-bold">{data?.mints?.total ?? 0}</span></li>
              <li>Unique minters: <span className="text-white font-bold">{data?.mints?.unique_minters ?? 0}</span></li>
              <li>Launchpad collections: <span className="text-white font-bold">{data?.collections?.launchpad ?? 0}</span></li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  sub,
  href,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
  href?: string
}) {
  const inner = (
    <>
      <div className="flex items-center gap-2 text-[#71717A] text-xs font-bold uppercase tracking-wider mb-2">
        {icon}
        {label}
      </div>
      <div className="text-2xl font-black text-white tabular-nums">{value}</div>
      {sub && <p className="text-xs text-[#a8aab2] mt-1 font-mono">{sub}</p>}
    </>
  )
  return (
    <div className="rounded-xl border border-white/10 bg-[#15181a] p-4">
      {href ? (
        <a href={href} target="_blank" rel="noreferrer" className="block hover:opacity-90">
          {inner}
        </a>
      ) : (
        inner
      )}
    </div>
  )
}

function AddrRow({ label, value, explorer }: { label: string; value?: string | null; explorer: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm">
      <span className="w-36 text-[#71717A] font-bold uppercase tracking-wider text-[10px]">{label}</span>
      {value ? (
        <a
          href={`${explorer}/address/${value}`}
          target="_blank"
          rel="noreferrer"
          className="font-mono text-[#2DE2FF] hover:underline break-all"
        >
          {value}
        </a>
      ) : (
        <span className="text-[#ff5052] font-bold text-xs uppercase">Not set</span>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const color =
    status === 'confirmed' || status === 'active' || status === 'sold'
      ? 'text-[#2DE2FF]'
      : status === 'failed' || status === 'cancelled'
        ? 'text-[#ff5052]'
        : 'text-[#FF2BD6]'
  return <span className={`font-bold uppercase text-[10px] tracking-wider ${color}`}>{status}</span>
}

function Table({
  headers,
  rows,
  empty,
}: {
  headers: string[]
  rows: React.ReactNode[][]
  empty: string
}) {
  if (!rows.length) {
    return (
      <div className="rounded-xl border border-dashed border-[#2DE2FF]/25 bg-[#15181a] py-16 text-center text-[#a8aab2]">
        {empty}
      </div>
    )
  }
  return (
    <div className="rounded-xl border border-white/10 bg-[#15181a] overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left text-[10px] uppercase tracking-wider text-[#71717A]">
            {headers.map((h) => (
              <th key={h} className="px-4 py-3 font-bold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-white/5 text-white">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 align-middle">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
