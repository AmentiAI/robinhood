'use client';

/**
 * Movie Mode - Sequences List Page
 * Shows all user's video sequences with creation and management options
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/lib/wallet/compatibility';
import Link from 'next/link';
import type { VideoSequenceWithDetails } from '@/types/movie-mode';

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
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">🎬 Movie Mode</h1>
          <p className="text-[var(--text-secondary)] mb-6">Connect your wallet to create video sequences</p>
          <div className="text-sm text-[var(--text-secondary)]">
            Please connect your wallet to access Movie Mode
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            🎬 Movie Mode
          </h1>
          <p className="text-[var(--text-secondary)]">
            Chain your AI-generated videos together with seamless transitions
          </p>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filterStatus === 'all'
                  ? 'bg-[var(--solana-purple)] text-white'
                  : 'bg-[var(--surface)] text-[var(--text-secondary)] hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('draft')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filterStatus === 'draft'
                  ? 'bg-[var(--solana-purple)] text-white'
                  : 'bg-[var(--surface)] text-[var(--text-secondary)] hover:text-white'
              }`}
            >
              Draft
            </button>
            <button
              onClick={() => setFilterStatus('processing')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filterStatus === 'processing'
                  ? 'bg-[var(--solana-purple)] text-white'
                  : 'bg-[var(--surface)] text-[var(--text-secondary)] hover:text-white'
              }`}
            >
              Processing
            </button>
            <button
              onClick={() => setFilterStatus('completed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filterStatus === 'completed'
                  ? 'bg-[var(--solana-purple)] text-white'
                  : 'bg-[var(--surface)] text-[var(--text-secondary)] hover:text-white'
              }`}
            >
              Completed
            </button>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-[var(--solana-purple)] to-[var(--solana-green)] text-white rounded-lg font-medium hover:opacity-90 transition-all"
          >
            + Create New Sequence
          </button>
        </div>

        {/* Sequences Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--solana-purple)]"></div>
            <p className="text-[var(--text-secondary)] mt-4">Loading sequences...</p>
          </div>
        ) : sequences.length === 0 ? (
          <div className="text-center py-12 bg-[var(--surface)] rounded-lg border border-[var(--border)]">
            <div className="text-6xl mb-4">🎬</div>
            <h3 className="text-xl font-semibold text-white mb-2">No sequences yet</h3>
            <p className="text-[var(--text-secondary)] mb-6">
              Create your first video sequence to get started
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-[var(--solana-purple)] to-[var(--solana-green)] text-white rounded-lg font-medium hover:opacity-90 transition-all"
            >
              Create Sequence
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sequences.map((sequence: any) => (
              <div
                key={sequence.id}
                className="bg-[var(--surface)] rounded-lg border border-[var(--border)] overflow-hidden hover:border-[var(--solana-purple)] transition-all"
              >
                {/* Thumbnail */}
                <div className="aspect-video bg-gradient-to-br from-[var(--solana-purple)]/20 to-[var(--solana-green)]/20 flex items-center justify-center">
                  {sequence.output_video_url ? (
                    <video
                      src={sequence.output_video_url}
                      className="w-full h-full object-cover"
                      muted
                      loop
                      playsInline
                    />
                  ) : (
                    <div className="text-6xl">🎬</div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-white mb-2 truncate">{sequence.name}</h3>

                  <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)] mb-3">
                    <span>{sequence.clip_count || 0} clips</span>
                    <span>•</span>
                    <span className="capitalize">{sequence.composition_mode}</span>
                    <span>•</span>
                    <span>{sequence.aspect_ratio}</span>
                  </div>

                  {/* Status Badge */}
                  <div className="mb-3">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        sequence.status === 'completed'
                          ? 'bg-green-500/20 text-green-400'
                          : sequence.status === 'processing'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : sequence.status === 'failed'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}
                    >
                      {sequence.status}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link
                      href={`/movie-mode/${sequence.id}`}
                      className="flex-1 px-4 py-2 bg-[var(--solana-purple)] text-white text-center rounded-lg text-sm font-medium hover:opacity-90 transition-all"
                    >
                      {sequence.status === 'completed' ? 'View' : 'Edit'}
                    </Link>
                    {sequence.status !== 'processing' && (
                      <button
                        onClick={() => deleteSequence(sequence.id)}
                        className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/30 transition-all"
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
      </div>

      {/* Create Sequence Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Create New Sequence</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Sequence Name
                </label>
                <input
                  type="text"
                  value={newSequenceName}
                  onChange={(e) => setNewSequenceName(e.target.value)}
                  placeholder="e.g., Epic Adventure Trailer"
                  className="w-full px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-white focus:border-[var(--solana-purple)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Composition Mode
                </label>
                <select
                  value={newSequenceMode}
                  onChange={(e) => setNewSequenceMode(e.target.value as 'simple' | 'transitions')}
                  className="w-full px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-white focus:border-[var(--solana-purple)] focus:outline-none"
                >
                  <option value="simple">Simple (Fast & Cheap)</option>
                  <option value="transitions">Transitions (AI-Powered)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Aspect Ratio
                </label>
                <select
                  value={newSequenceAspectRatio}
                  onChange={(e) => setNewSequenceAspectRatio(e.target.value as '16:9' | '9:16' | '1:1')}
                  className="w-full px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-white focus:border-[var(--solana-purple)] focus:outline-none"
                >
                  <option value="16:9">16:9 (Landscape)</option>
                  <option value="9:16">9:16 (Portrait)</option>
                  <option value="1:1">1:1 (Square)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 bg-[var(--background)] text-[var(--text-secondary)] rounded-lg font-medium hover:text-white transition-all"
              >
                Cancel
              </button>
              <button
                onClick={createSequence}
                disabled={creating || !newSequenceName.trim()}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-[var(--solana-purple)] to-[var(--solana-green)] text-white rounded-lg font-medium hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
