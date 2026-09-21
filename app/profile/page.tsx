'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/page-header'
import { ProfileManager } from '@/components/profile-manager'
import { ProfileCollections } from '@/components/profile-collections'
import { ProfileCollabs } from '@/components/profile-collabs'
import { CollaborationInvitations } from '@/components/collaboration-invitations'
import { CreditTransfer } from '@/components/credit-transfer'

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<'collections' | 'collabs'>('collections')

  return (
    <div className="min-h-screen bg-[#0a0a0c]">
      <PageHeader
        title="Profile"
        subtitle="Manage your profile, collections, and collaborations"
      />

      <main className="w-full py-6 lg:py-8 px-4 sm:px-5 lg:px-8">
        <div className="max-w-[1400px] mx-auto space-y-5 lg:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ProfileManager />
            <CreditTransfer />
            <CollaborationInvitations />
          </div>

          <div className="hg-rise rounded-2xl border border-white/[0.1] bg-[#131318] overflow-hidden">
            <div className="flex p-1.5 gap-1 bg-[#0c0c10]/80 border-b border-white/[0.08]">
              <button
                type="button"
                onClick={() => setActiveTab('collections')}
                className={`flex-1 px-4 py-2.5 text-center text-sm font-semibold rounded-full transition-colors ${
                  activeTab === 'collections'
                    ? 'bg-white text-[#0a0a0c]'
                    : 'text-zinc-500 hover:text-white'
                }`}
              >
                My collections
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('collabs')}
                className={`flex-1 px-4 py-2.5 text-center text-sm font-semibold rounded-full transition-colors ${
                  activeTab === 'collabs'
                    ? 'bg-white text-[#0a0a0c]'
                    : 'text-zinc-500 hover:text-white'
                }`}
              >
                My collabs
              </button>
            </div>

            <div className="p-5 sm:p-6">
              {activeTab === 'collections' ? <ProfileCollections /> : <ProfileCollabs />}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
