'use client'

interface MetadataModalProps {
  isOpen: boolean
  onClose: () => void
  collectionName: string
  metadata: any[]
}

export default function MetadataModal({
  isOpen,
  onClose,
  collectionName,
  metadata,
}: MetadataModalProps) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl border border-white/[0.08] shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/[0.08] flex items-center justify-between bg-[#0c0c10]">
          <div>
            <h3 className="text-lg font-bold text-white">
              {collectionName} - NFT Metadata
            </h3>
            <p className="text-sm text-zinc-500">{metadata.length} minted NFTs</p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-400 text-2xl font-bold leading-none"
          >
            ×
          </button>
        </div>

        {/* JSON Content */}
        <div className="flex-1 overflow-auto p-4">
          <pre className="bg-[#0c0c10] text-green-400 p-4 rounded-lg text-sm overflow-x-auto font-mono whitespace-pre-wrap">
            {JSON.stringify(metadata, null, 2)}
          </pre>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/[0.08] flex items-center justify-between bg-[#0c0c10]">
          <button
            onClick={() => {
              navigator.clipboard.writeText(JSON.stringify(metadata, null, 2))
              alert('Metadata copied to clipboard!')
            }}
            className="px-4 py-2 bg-[#FF2BD6] hover:bg-[#d91fb8] text-white rounded-lg font-semibold transition-colors"
          >
            📋 Copy JSON
          </button>
          <button
            onClick={() => {
              const blob = new Blob([JSON.stringify(metadata, null, 2)], { type: 'application/json' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              const safeName = collectionName.toLowerCase().replace(/[^a-z0-9]/g, '-')
              a.download = `${safeName}-metadata.json`
              a.click()
              URL.revokeObjectURL(url)
            }}
            className="px-4 py-2 bg-[#2DE2FF] hover:opacity-90 text-white rounded-lg font-semibold transition-colors"
          >
            💾 Download JSON
          </button>
        </div>
      </div>
    </div>
  )
}

