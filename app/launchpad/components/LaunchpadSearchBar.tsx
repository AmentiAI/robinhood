'use client'

import { Search } from 'lucide-react'

interface LaunchpadSearchBarProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  filterStatus: 'all' | 'live' | 'upcoming'
  onFilterChange: (status: 'all' | 'live' | 'upcoming') => void
}

export function LaunchpadSearchBar({
  searchTerm,
  onSearchChange,
  filterStatus,
  onFilterChange,
}: LaunchpadSearchBarProps) {
  const filters: Array<'all' | 'live' | 'upcoming'> = ['all', 'live', 'upcoming']

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-2 rounded-2xl border border-white/[0.08] bg-[#131318]/80">
      <div className="flex-1 relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search collections..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0c0c10] border border-white/[0.06] focus:border-[#2DE2FF]/40 text-zinc-100 text-sm placeholder:text-zinc-600 outline-none transition-colors"
        />
      </div>
      <div className="flex items-center gap-1 p-1 rounded-xl bg-[#0c0c10] border border-white/[0.06]">
        {filters.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => onFilterChange(status)}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold capitalize transition-colors ${
              filterStatus === status
                ? 'bg-white text-black'
                : 'text-zinc-500 hover:text-zinc-200'
            }`}
          >
            {status}
          </button>
        ))}
      </div>
    </div>
  )
}
