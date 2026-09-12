'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useWallet } from '@/lib/wallet/compatibility'
import { useAdminCheck } from '@/lib/auth/use-admin-check'

export function AdminSidebar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { currentAddress } = useWallet()
  const { isAdmin: authorized, loading } = useAdminCheck(currentAddress || null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['Overview', 'Chain']))

  const isActive = (path: string, tab?: string) => {
    if (path === '/admin') {
      if (tab) return pathname === '/admin' && searchParams?.get('tab') === tab
      return pathname === '/admin' && !searchParams?.get('tab')
    }
    return pathname === path
  }

  const isInCategory = (path: string, tab?: string) => {
    if (path === '/admin') {
      if (tab) return pathname === '/admin' && searchParams?.get('tab') === tab
      return pathname === '/admin' && !searchParams?.get('tab')
    }
    return pathname?.startsWith(path)
  }

  const navItems = [
    {
      category: 'Overview',
      items: [{ path: '/admin', label: 'Dashboard', icon: '◆' }],
    },
    {
      category: 'Chain',
      items: [
        { path: '/admin/rh', label: 'Robinhood Chain', icon: 'Ξ' },
        { path: '/admin/transactions/eth', label: 'ETH Payments', icon: '💳' },
      ],
    },
    {
      category: 'Launchpad',
      items: [
        { path: '/admin/launchpad', label: 'Launchpad Hub', icon: '🚀' },
        { path: '/admin/launchpad/collections', label: 'Collection Stats', icon: '📊' },
        { path: '/admin/collections', label: 'Collections', icon: '📁' },
        { path: '/admin/launchpad/transactions', label: 'Mint Transactions', icon: '📝' },
      ],
    },
    {
      category: 'Marketplace',
      items: [{ path: '/admin/marketplace', label: 'NFT Marketplace', icon: '🏪' }],
    },
    {
      category: 'Users & Credits',
      items: [
        { path: '/admin', label: 'Users', icon: '👥', tab: 'users' },
        { path: '/admin', label: 'Credit Costs', icon: '💰', tab: 'credit-costs' },
      ],
    },
    {
      category: 'Content',
      items: [
        { path: '/admin', label: 'Generation Jobs', icon: '🎨', tab: 'generation-jobs' },
        { path: '/admin/generation-errors', label: 'Generation Errors', icon: '⚠' },
        { path: '/admin', label: 'Generated Images', icon: '🖼', tab: 'generated-images' },
        { path: '/admin', label: 'Homepage Visibility', icon: '🏠', tab: 'homepage-visibility' },
        { path: '/admin/preset-previews', label: 'Preset Previews', icon: '◎' },
      ],
    },
    {
      category: 'System',
      items: [
        { path: '/admin/site-settings', label: 'Site Settings', icon: '⚙' },
        { path: '/admin/whitelist', label: 'Whitelist', icon: '✓' },
        { path: '/support/admin', label: 'Support Inbox', icon: '✉' },
      ],
    },
  ]

  useEffect(() => {
    const activeCategory = navItems.find((category) =>
      category.items.some((item) => {
        const itemTab = 'tab' in item ? item.tab : undefined
        return isInCategory(item.path, itemTab as string | undefined)
      })
    )
    if (activeCategory) {
      setExpandedCategories((prev) => new Set([...prev, activeCategory.category]))
    }
  }, [pathname, searchParams])

  if (loading) {
    return (
      <div className="w-64 bg-[#050607] border-r border-[#00C805]/20 min-h-screen p-4 pt-6 fixed left-0 top-0 overflow-y-auto z-50">
        <div className="mb-6">
          <h1 className="text-xl font-black text-[#00C805]">Admin</h1>
          <p className="text-xs text-[#71717A] mt-1">Loading...</p>
        </div>
      </div>
    )
  }

  if (!authorized) return null

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(category)) next.delete(category)
      else next.add(category)
      return next
    })
  }

  return (
    <div className="w-64 bg-[#050607] border-r border-[#00C805]/20 min-h-screen p-4 pt-6 fixed left-0 top-0 overflow-y-auto z-50">
      <div className="mb-6">
        <Link href="/admin" className="block group">
          <h1 className="text-xl font-black text-[#00C805] group-hover:text-[#CCFF00] transition-colors">
            OrdMaker Admin
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a8aab2] mt-1">
            Robinhood Chain
          </p>
        </Link>
      </div>

      <nav className="space-y-2">
        {navItems.map((category) => {
          const isExpanded = expandedCategories.has(category.category)
          const hasActiveItem = category.items.some((item) => {
            const itemTab = 'tab' in item ? item.tab : undefined
            return isInCategory(item.path, itemTab as string | undefined)
          })

          return (
            <div key={category.category}>
              <button
                type="button"
                onClick={() => toggleCategory(category.category)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                  hasActiveItem ? 'text-white bg-[#15181a]' : 'text-[#a8aab2] hover:text-white hover:bg-[#15181a]'
                }`}
              >
                <span className="uppercase tracking-wider text-[10px]">{category.category}</span>
                <span className={`text-[#71717A] text-xs transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                  ▶
                </span>
              </button>
              {isExpanded && (
                <div className="mt-1 ml-2 space-y-1 border-l border-[#00C805]/20 pl-2">
                  {category.items.map((item, index) => {
                    const itemTab = 'tab' in item ? (item.tab as string | undefined) : undefined
                    const uniqueKey = `${category.category}-${item.path}-${itemTab || ''}-${index}`
                    const active = isActive(item.path, itemTab)
                    return (
                      <Link
                        key={uniqueKey}
                        href={item.path + (itemTab ? `?tab=${itemTab}` : '')}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          active
                            ? 'bg-[#00C805] text-black shadow-[0_0_20px_rgba(0,200,5,0.3)]'
                            : 'text-[#a8aab2] hover:text-white hover:bg-[#15181a]'
                        }`}
                      >
                        <span className="text-sm w-4 text-center">{item.icon}</span>
                        <span>{item.label}</span>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      <div className="mt-8 pt-6 border-t border-[#00C805]/15 space-y-2">
        <Link
          href="/launchpad"
          className="flex items-center gap-2 px-3 py-2 text-sm text-[#a8aab2] hover:text-[#00C805] hover:bg-[#15181a] rounded-lg transition-colors"
        >
          <span>←</span>
          <span>Back to Launchpad</span>
        </Link>
      </div>
    </div>
  )
}
