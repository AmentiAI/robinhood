'use client'

interface LaunchpadTickerProps {
  activeCollectionsCount: number
  totalMintsCount: number
  isConnected: boolean
  onLaunchClick: () => void
}

export function LaunchpadTicker({
  activeCollectionsCount,
  totalMintsCount,
  isConnected,
  onLaunchClick,
}: LaunchpadTickerProps) {
  return (
    <div className="bg-[#0a0c0d] border-b border-[#00C805]/30 py-3 overflow-hidden relative">
      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(0,200,5,0.06),transparent)] pointer-events-none" />
      <div className="flex items-center gap-8 animate-scroll whitespace-nowrap relative">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#00C805] shadow-[0_0_8px_#00C805]" />
              <span className="text-xs text-[#a8aab2] uppercase tracking-wider font-medium">
                Robinhood Chain
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#00C805]" />
              <span className="text-xs text-[#a8aab2] uppercase tracking-wider">
                {activeCollectionsCount} Live Mints
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#CCFF00]" />
              <span className="text-xs text-[#a8aab2] uppercase tracking-wider">
                {totalMintsCount} Total Mints
              </span>
            </div>
            {isConnected && (
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#00C805]" />
                <button
                  type="button"
                  onClick={onLaunchClick}
                  className="text-xs text-[#00C805] hover:text-[#CCFF00] uppercase tracking-wider font-bold transition-colors"
                >
                  Launch Your Collection →
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
