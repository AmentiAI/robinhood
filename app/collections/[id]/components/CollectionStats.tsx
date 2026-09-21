'use client'

interface Layer {
  trait_count: number
}

interface CollectionStatsProps {
  layers: Layer[]
  totalOrdinals: number
  isActive: boolean
}

export function CollectionStats({ layers, totalOrdinals, isActive }: CollectionStatsProps) {
  const totalTraits = layers.reduce((sum, layer) => sum + layer.trait_count, 0)

  const items = [
    { label: 'Layers', value: String(layers.length), accent: 'text-[#2DE2FF]', glow: 'rgba(45,226,255,0.15)' },
    { label: 'Traits', value: String(totalTraits), accent: 'text-[#A855F7]', glow: 'rgba(168,85,247,0.15)' },
    { label: 'NFTs', value: String(totalOrdinals), accent: 'text-[#FF2BD6]', glow: 'rgba(255,43,214,0.15)' },
    {
      label: 'Status',
      value: isActive ? 'Active' : 'Inactive',
      accent: isActive ? 'text-emerald-400' : 'text-zinc-500',
      glow: isActive ? 'rgba(52,211,153,0.12)' : 'transparent',
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {items.map((item, i) => (
        <div
          key={item.label}
          className={`hg-card hg-rise rounded-2xl border border-white/[0.1] bg-[#131318] px-4 py-3.5 ${
            i === 1 ? 'hg-rise-delay-1' : i === 2 ? 'hg-rise-delay-2' : i === 3 ? 'hg-rise-delay-3' : ''
          }`}
        >
          <p className={`text-xl sm:text-2xl font-bold tracking-tight ${item.accent}`}>
            {item.value}
          </p>
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500 mt-1">
            {item.label}
          </p>
        </div>
      ))}
    </div>
  )
}
