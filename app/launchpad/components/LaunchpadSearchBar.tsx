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
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
      <div className="flex-1 relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#71717A]" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search collections..."
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#15181a] border border-white/10 hover:border-[#2DE2FF]/35 focus:border-[#2DE2FF] text-white text-sm placeholder:text-[#71717A] outline-none transition-colors"
        />
      </div>
      <div className="flex items-center gap-2">
        {filters.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => onFilterChange(status)}
            className={`px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-colors ${
              filterStatus === status
                ? 'bg-[#2DE2FF] text-black shadow-[0_0_20px_rgba(45, 226, 255,0.35)]'
                : 'bg-[#15181a] border border-white/10 text-[#a8aab2] hover:border-[#2DE2FF]/40 hover:text-white'
            }`}
          >
            {status}
          </button>
        ))}
      </div>
    </div>
  )
}
