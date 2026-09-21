'use client'

import { Collection } from '../../types'

interface SettingsTabProps {
  collection: Collection
  collectionId: string
  currentAddress: string | null
  onSave: (settings: any) => Promise<void>
  saving: boolean
  onLoadData: () => Promise<void>
}

export default function SettingsTab({
  collection,
}: SettingsTabProps) {
  return (
    <div className="hg-card rounded-2xl border border-white/[0.1] bg-[#131318] p-6 sm:p-8">
      <h2 className="text-xl font-bold text-white mb-2">Collection settings</h2>
      <p className="text-zinc-500 text-sm mb-6">
        Configure launch settings for <span className="text-zinc-300">{collection.name}</span>.
      </p>
      <div className="rounded-xl border border-white/[0.08] bg-[#0c0c10] px-5 py-8 text-center">
        <p className="text-sm text-zinc-500">Settings tab — to be implemented</p>
      </div>
    </div>
  )
}
