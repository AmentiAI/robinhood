'use client';

/**
 * Movie Mode - Sequences List Page
 * Shows all user's video sequences with creation and management options
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/lib/wallet/compatibility';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header'
import { BrandLoader } from '@/components/brand-loader'
import { ToolWorkspace, ToolPanel } from '@/components/tool-workspace'
import type { VideoSequenceWithDetails } from '@/types/movie-mode';

const FILTERS: Array<'all' | 'draft' | 'processing' | 'completed' | 'failed'> = [
  'all',
  'draft',
  'processing',
  'completed',
  'failed',
]

export default function MovieModePage() {
  const router = useRouter();
  const { isConnected, currentAddress } = useWallet();

  const [sequences, setSequences] = useState<VideoSequenceWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'processing' | 'completed' | 'failed'>('all');

  const [newSequenceName, setNewSequenceName] = useState('');
  const [newSequenceMode, setNewSequenceMode] = useState<'simple' | 'transitions'>('simple');
  const [newSequenceAspectRatio, setNewSequenceAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (isConnected && currentAddress) {
      loadSequences();
    } else {
      setSequences([]);
      setLoading(false);
    }
  }, [isConnected, currentAddress, filterStatus]);

  const loadSequences = async () => {
    if (!currentAddress) return;

    try {
      setLoading(true);
      const statusParam = filterStatus !== 'all' ? `&status=${filterStatus}` : '';
      const response = await fetch(
        `/api/movie-mode/sequences?wallet_address=${encodeURIComponent(currentAddress)}${statusParam}`
      );

      if (response.ok) {
        const data = await response.json();
        setSequences(data.sequences || []);
      } else {
        console.error('Failed to load sequences');
      }
    } catch (error) {
      console.error('Error loading sequences:', error);
    } finally {
      setLoading(false);
    }
  };

  const createSequence = async () => {
    if (!currentAddress || !newSequenceName.trim()) return;

    try {
      setCreating(true);
      const response = await fetch('/api/movie-mode/sequences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: currentAddress,
          name: newSequenceName.trim(),
          composition_mode: newSequenceMode,
          aspect_ratio: newSequenceAspectRatio,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/movie-mode/${data.sequence.id}`);
      } else {
        const error = await response.json();
        alert(`Failed to create sequence: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating sequence:', error);
      alert('Failed to create sequence');
    } finally {
      setCreating(false);
    }
  };

  const deleteSequence = async (sequenceId: string) => {
    if (!currentAddress) return;
    if (!confirm('Are you sure you want to delete this sequence? This cannot be undone.')) return;

    try {
      const response = await fetch(
        `/api/movie-mode/sequences/${sequenceId}?wallet_address=${encodeURIComponent(currentAddress)}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        loadSequences(); // Reload list
      } else {
        const error = await response.json();
        alert(`Failed to delete sequence: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting sequence:', error);
      alert('Failed to delete sequence');
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-[#0a0a0c]">
        <PageHeader
          title="Movie Mode"
          subtitle="Chain AI-generated videos together with seamless transitions"
        />
        <ToolWorkspace>
          <ToolPanel title="Connect wallet" subtitle="Required to create and manage sequences">
            <p className="text-sm text-zinc-400">
              Connect your wallet to access Movie Mode and build video sequences.
            </p>
          </ToolPanel>
        </ToolWorkspace>
      </div>
    );
  }

  const createButton = (
    <button
      type="button"
      onClick={() => setShowCreateModal(true)}
      className="hg-btn-glow inline-flex h-10 items-center px-5 rounded-full bg-[#2DE2FF] text-[#0a0a0c] text-sm font-bold"
    >
      Create sequence
    </button>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0c]">
      <PageHeader
        title="Movie Mode"
        subtitle="Chain AI-generated videos together with seamless transitions"
        action={createButton}
      />

      <ToolWorkspace>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex flex-wrap gap-1 p-1 rounded-full bg-[#131318] border border-white/[0.08]">
            {FILTERS.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setFilterStatus(status)}
                className={`px-3.5 py-2 rounded-full text-sm font-semibold capitalize transition-colors ${
                  filterStatus === status
                    ? 'bg-[#2DE2FF] text-[#0a0a0c]'
                    : 'text-zinc-500 hover:text-white'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <ToolPanel>
            <BrandLoader variant="card" label="Loading sequences" />
          </ToolPanel>
        ) : sequences.length === 0 ? (
          <ToolPanel title="No sequences yet" subtitle="Create your first video sequence to get started">
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="hg-btn-glow inline-flex h-10 items-center px-5 rounded-full bg-[#2DE2FF] text-[#0a0a0c] text-sm font-bold"
            >
              Create sequence
            </button>
          </ToolPanel>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {sequences.map((sequence: any) => (
              <div
                key={sequence.id}
                className="hg-card rounded-2xl border border-white/[0.1] bg-[#131318] overflow-hidden hover:border-[#2DE2FF]/50 transition-all"
              >
                <div className="aspect-video bg-[#0c0c10] flex items-center justify-center border-b border-white/[0.06]">
                  {sequence.output_video_url ? (
                    <video
                      src={sequence.output_video_url}
                      className="w-full h-full object-cover"
                      muted
                      loop
                      playsInline
                    />
                  ) : (
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-600">
                      No preview
                    </span>
                  )}
                </div>

                <div className="p-4 sm:p-5">
                  <h3 className="text-lg font-semibold text-white mb-2 truncate">{sequence.name}</h3>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-500 mb-3">
                    <span>{sequence.clip_count || 0} clips</span>
                    <span className="text-zinc-700">·</span>
                    <span className="capitalize">{sequence.composition_mode}</span>
                    <span className="text-zinc-700">·</span>
                    <span>{sequence.aspect_ratio}</span>
                  </div>

                  <div className="mb-4">
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                        sequence.status === 'completed'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                          : sequence.status === 'processing'
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/25'
                          : sequence.status === 'failed'
                          ? 'bg-red-500/15 text-red-400 border border-red-500/25'
                          : 'bg-white/[0.06] text-zinc-400 border border-white/[0.08]'
                      }`}
                    >
                      {sequence.status}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/movie-mode/${sequence.id}`}
                      className="hg-btn-glow flex-1 px-4 py-2.5 bg-[#2DE2FF] text-[#0a0a0c] text-center rounded-full text-sm font-bold hover:opacity-90 transition-all"
                    >
                      {sequence.status === 'completed' ? 'View' : 'Edit'}
                    </Link>
                    {sequence.status !== 'processing' && (
                      <button
                        type="button"
                        onClick={() => deleteSequence(sequence.id)}
                        className="px-4 py-2.5 rounded-full text-sm font-semibold bg-[#FF2BD6]/15 text-[#FF2BD6] border border-[#FF2BD6]/25 hover:bg-[#FF2BD6]/25 transition-all"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ToolWorkspace>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#131318] rounded-2xl border border-white/[0.1] max-w-md w-full p-6 shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]">
            <h2 className="text-xl font-bold text-white mb-5">Create new sequence</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Sequence name
                </label>
                <input
                  type="text"
                  value={newSequenceName}
                  onChange={(e) => setNewSequenceName(e.target.value)}
                  placeholder="e.g., Epic Adventure Trailer"
                  className="w-full px-4 py-2.5 bg-[#0c0c10] border border-white/[0.1] rounded-xl text-white placeholder:text-zinc-600 focus:border-[#2DE2FF] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Composition mode
                </label>
                <select
                  value={newSequenceMode}
                  onChange={(e) => setNewSequenceMode(e.target.value as 'simple' | 'transitions')}
                  className="w-full px-4 py-2.5 bg-[#0c0c10] border border-white/[0.1] rounded-xl text-white focus:border-[#2DE2FF] focus:outline-none"
                >
                  <option value="simple">Simple (Fast & Cheap)</option>
                  <option value="transitions">Transitions (AI-Powered)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Aspect ratio
                </label>
                <select
                  value={newSequenceAspectRatio}
                  onChange={(e) => setNewSequenceAspectRatio(e.target.value as '16:9' | '9:16' | '1:1')}
                  className="w-full px-4 py-2.5 bg-[#0c0c10] border border-white/[0.1] rounded-xl text-white focus:border-[#2DE2FF] focus:outline-none"
                >
                  <option value="16:9">16:9 (Landscape)</option>
                  <option value="9:16">9:16 (Portrait)</option>
                  <option value="1:1">1:1 (Square)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2.5 rounded-full bg-white/[0.06] border border-white/[0.1] text-zinc-300 font-semibold hover:text-white transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={createSequence}
                disabled={creating || !newSequenceName.trim()}
                className="hg-btn-glow flex-1 px-4 py-2.5 rounded-full bg-gradient-to-r from-[#2DE2FF] to-[#FF2BD6] text-[#0a0a0c] font-bold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
              >
                {creating ? <BrandLoader variant="inline" label="Creating" /> : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
