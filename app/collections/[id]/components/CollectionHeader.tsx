'use client'

import Link from 'next/link'

interface CollectionHeaderProps {
  collection: { id: string; name: string }
  collaboratorCount: number
  userRole: 'owner' | 'editor' | 'viewer'
  onShowCollaborators: () => void
  onDelete: () => void
}

export function CollectionHeader({
  collection,
  collaboratorCount,
  userRole,
  onShowCollaborators,
  onDelete,
}: CollectionHeaderProps) {
  return (
    <div className="mb-6">
      <Link
        href="/collections"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-[#2DE2FF] mb-4 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Collections
      </Link>

      <div className="relative overflow-hidden rounded-2xl border border-white/[0.1] bg-[#131318]/80 backdrop-blur-sm px-5 sm:px-7 py-5 sm:py-6 shadow-[0_1px_0_rgba(255,255,255,0.04)_inset] hg-rise">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(45,226,255,0.6), rgba(255,43,214,0.5), transparent)',
            backgroundSize: '200% 100%',
            animation: 'hg-shimmer 5s linear infinite',
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full blur-3xl"
          style={{
            background: 'radial-gradient(circle, rgba(45,226,255,0.2), transparent 70%)',
          }}
        />
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#2DE2FF] mb-2">
              Collection studio
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight break-words">
              <span className="hg-gradient-text">{collection.name}</span>
            </h1>
            <p className="text-sm text-zinc-500 mt-1.5">
              Manage layers, generate images, compression & launch · {collaboratorCount}{' '}
              collaborator{collaboratorCount === 1 ? '' : 's'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <Link
              href={`/collections/${collection.id}/export`}
              className="hg-btn-glow inline-flex h-10 px-4 items-center rounded-full bg-[#2DE2FF] text-[#0a0a0c] text-sm font-bold"
            >
              Export to OpenSea
            </Link>
            <Link
              href={`/collections/${collection.id}/edit`}
              className="hg-btn-glow inline-flex h-10 px-4 items-center rounded-full border border-white/[0.12] bg-white/[0.04] text-sm font-semibold text-zinc-100 hover:border-[#2DE2FF]/50 hover:text-[#2DE2FF] transition-all"
            >
              Settings
            </Link>
            {(userRole === 'owner' || userRole === 'editor') && (
              <button
                type="button"
                onClick={onShowCollaborators}
                className="inline-flex h-10 px-4 items-center rounded-full border border-[#FF2BD6]/35 text-sm font-semibold text-[#FF2BD6] hover:bg-[#FF2BD6]/10 transition-all"
              >
                Invite
              </button>
            )}
            <Link
              href={`/collections/${collection.id}/launch`}
              className="hg-btn-glow inline-flex h-10 px-5 items-center rounded-full bg-gradient-to-r from-[#2DE2FF] to-[#7aefff] text-[#0a0a0c] text-sm font-bold"
            >
              Launch
            </Link>
            <Link
              href={`/collections/${collection.id}/self-inscribe`}
              className="inline-flex h-10 px-4 items-center rounded-full border border-white/[0.1] text-sm font-semibold text-zinc-300 hover:border-white/25 hover:text-white transition-all"
            >
              Self-inscribe
            </Link>
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex h-10 px-4 items-center rounded-full border border-red-500/25 text-sm font-semibold text-red-400 hover:border-red-500/50 hover:bg-red-500/10 transition-all"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
