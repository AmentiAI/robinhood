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
    <div className="min-h-screen bg-[#0a0c0d]">
      <PageHeader
        title="Profile"
        subtitle="Manage your profile, collections, and collaborations"
      />

      <main className="w-full py-6 lg:py-12 px-6 lg:px-12">
        <div className="space-y-6 lg:space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
            <ProfileManager />
            <CreditTransfer />
            <CollaborationInvitations />
          </div>

          <div className="bg-[#15181a] border-2 border-[#2DE2FF] overflow-hidden">
            <div className="flex border-b border-[#404040]">
              <button
                onClick={() => setActiveTab('collections')}
                className={`flex-1 px-6 py-4 text-center font-semibold tracking-wide uppercase transition-all duration-300 relative ${
                  activeTab === 'collections'
                    ? 'text-white bg-[#0a0c0d]'
                    : 'text-[#808080] hover:text-white hover:bg-[#0a0c0d]'
                }`}
              >
                {activeTab === 'collections' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2DE2FF]" />
                )}
                <span className="relative z-10">My Collections</span>
              </button>
              <button
                onClick={() => setActiveTab('collabs')}
                className={`flex-1 px-6 py-4 text-center font-semibold tracking-wide uppercase transition-all duration-300 relative ${
                  activeTab === 'collabs'
                    ? 'text-white bg-[#0a0c0d]'
                    : 'text-[#808080] hover:text-white hover:bg-[#0a0c0d]'
                }`}
              >
                {activeTab === 'collabs' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2DE2FF]" />
                )}
                <span className="relative z-10">My Collabs</span>
              </button>
            </div>

            <div className="p-8">
              {activeTab === 'collections' ? <ProfileCollections /> : <ProfileCollabs />}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
