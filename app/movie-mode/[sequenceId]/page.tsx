'use client';

/**
 * Movie Mode - Sequence Editor Page
 * Edit and compose a video sequence with timeline, video library, and controls
 */

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/lib/wallet/compatibility';
import { useCredits } from '@/lib/credits-context';
import { calculateCompositionCost, type VideoSequenceClipWithVideo, type TransitionType } from '@/types/movie-mode';

export default function SequenceEditorPage({ params }: { params: Promise<{ sequenceId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { isConnected, currentAddress } = useWallet();
  const { credits } = useCredits();

  const [sequence, setSequence] = useState<any>(null);
  const [clips, setClips] = useState<VideoSequenceClipWithVideo[]>([]);
  const [availableVideos, setAvailableVideos] = useState<any[]>([]);
  const [compositionJob, setCompositionJob] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);
  const [polling, setPolling] = useState(false);

  const [editingName, setEditingName] = useState(false);
  const [sequenceName, setSequenceName] = useState('');

  // Clip generation state
  const [showGeneratePanel, setShowGeneratePanel] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [videoScene, setVideoScene] = useState('');
  const [videoActions, setVideoActions] = useState('');
  const [videoSpeech, setVideoSpeech] = useState('');
  const [generatingJobId, setGeneratingJobId] = useState<string | null>(null);

  useEffect(() => {
    if (isConnected && currentAddress) {
      loadSequence();
      loadAvailableVideos();
    }
  }, [isConnected, currentAddress, resolvedParams.sequenceId]);

  // Poll for status if processing
  useEffect(() => {
    if (sequence?.status === 'processing' && !polling) {
      setPolling(true);
      const interval = setInterval(() => {
        checkCompositionStatus();
      }, 5000); // Poll every 5 seconds

      return () => {
        clearInterval(interval);
        setPolling(false);
      };
    }
  }, [sequence?.status]);

  const loadSequence = async () => {
    if (!currentAddress) return;

    try {
      setLoading(true);
      const response = await fetch(
        `/api/movie-mode/sequences/${resolvedParams.sequenceId}?wallet_address=${encodeURIComponent(currentAddress)}`
      );

      if (response.ok) {
        const data = await response.json();
        setSequence(data.sequence);
        setClips(data.clips || []);
        setCompositionJob(data.composition_job);
        setSequenceName(data.sequence.name);
      } else {
        alert('Failed to load sequence');
        router.push('/movie-mode');
      }
    } catch (error) {
      console.error('Error loading sequence:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableVideos = async () => {
    if (!currentAddress) return;

    try {
      const response = await fetch(
        `/api/promotion/history?wallet_address=${encodeURIComponent(currentAddress)}`
      );

      if (response.ok) {
        const data = await response.json();
        // Filter only video jobs that are completed
        const videos = data.items.filter((item: any) => {
          const isVideo = item.subject_actions?.content_type === 'video';
          const isCompleted = item.status === 'completed';
          return isVideo && isCompleted;
        });
        setAvailableVideos(videos);
      }
    } catch (error) {
      console.error('Error loading videos:', error);
    }
  };

  const checkCompositionStatus = async () => {
    if (!currentAddress) return;

    try {
      const response = await fetch(
        `/api/movie-mode/sequences/${resolvedParams.sequenceId}/status?wallet_address=${encodeURIComponent(currentAddress)}`
      );

      if (response.ok) {
        const data = await response.json();
        setSequence(data.sequence);
        setCompositionJob(data.composition_job);

        if (data.sequence.status === 'completed' || data.sequence.status === 'failed') {
          setPolling(false);
          loadSequence(); // Reload full sequence data
        }
      }
    } catch (error) {
      console.error('Error checking status:', error);
    }
  };

  const updateSequenceName = async () => {
    if (!currentAddress || !sequenceName.trim()) return;

    try {
      const response = await fetch(`/api/movie-mode/sequences/${resolvedParams.sequenceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: currentAddress,
          name: sequenceName.trim(),
        }),
      });

      if (response.ok) {
        setEditingName(false);
        loadSequence();
      } else {
        alert('Failed to update sequence name');
      }
    } catch (error) {
      console.error('Error updating name:', error);
    }
  };

  const addVideoToSequence = async (videoJobId: string) => {
    if (!currentAddress) return;

    try {
      const response = await fetch(`/api/movie-mode/sequences/${resolvedParams.sequenceId}/clips`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: currentAddress,
          promotion_job_id: videoJobId,
          clip_order: clips.length, // Add to end
          transition_type: 'none',
        }),
      });

      if (response.ok) {
        loadSequence(); // Reload to get updated clips
      } else {
        const error = await response.json();
        alert(`Failed to add video: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error adding video:', error);
      alert('Failed to add video');
    }
  };

  const removeClip = async (clipId: string) => {
    if (!currentAddress) return;

    try {
      const response = await fetch(
        `/api/movie-mode/sequences/${resolvedParams.sequenceId}/clips/${clipId}?wallet_address=${encodeURIComponent(currentAddress)}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        loadSequence();
      } else {
        alert('Failed to remove clip');
      }
    } catch (error) {
      console.error('Error removing clip:', error);
    }
  };

  const updateClipTransition = async (clipId: string, transitionType: TransitionType) => {
    if (!currentAddress) return;

    try {
      const response = await fetch(`/api/movie-mode/sequences/${resolvedParams.sequenceId}/clips/${clipId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: currentAddress,
          transition_type: transitionType,
        }),
      });

      if (response.ok) {
        loadSequence();
      } else {
        alert('Failed to update transition');
      }
    } catch (error) {
      console.error('Error updating transition:', error);
    }
  };

  const generateNewClip = async () => {
    if (!currentAddress || !videoScene.trim() || !videoActions.trim()) {
      alert('Please provide both scene description and actions');
      return;
    }

    // Check credits
    const clipCost = 4;
    if (credits < clipCost) {
      alert(`Insufficient credits. Need ${clipCost} credits for video generation, you have ${credits}`);
      return;
    }

    const isFirstClip = clips.length === 0;
    const confirmMessage = isFirstClip
      ? `Generate first clip for ${clipCost} credits?`
      : `Generate clip ${clips.length + 1} with automatic continuity from previous clip for ${clipCost} credits?`;

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setGenerating(true);
      const response = await fetch(
        `/api/movie-mode/sequences/${resolvedParams.sequenceId}/generate-clip`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            wallet_address: currentAddress,
            video_scene: videoScene,
            video_actions: videoActions,
            video_speech: videoSpeech || undefined,
            transition_type: 'none',
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setGeneratingJobId(data.promotion_job.id);

        // Clear form
        setVideoScene('');
        setVideoActions('');
        setVideoSpeech('');

        // Start polling for completion
        alert(data.message || 'Clip generation started! This may take 5-10 minutes.');

        // Poll every 5 seconds
        const pollInterval = setInterval(async () => {
          const job = await fetch(
            `/api/promotion/history?wallet_address=${encodeURIComponent(currentAddress)}`
          ).then((r) => r.json());

          const generatingJob = job.items?.find((j: any) => j.id === data.promotion_job.id);

          if (generatingJob?.status === 'completed') {
            clearInterval(pollInterval);
            setGenerating(false);
            setGeneratingJobId(null);
            setShowGeneratePanel(false);
            loadSequence(); // Reload to show new clip
            alert('Clip generation completed!');
          } else if (generatingJob?.status === 'failed') {
            clearInterval(pollInterval);
            setGenerating(false);
            setGeneratingJobId(null);
            alert('Clip generation failed: ' + (generatingJob.error_message || 'Unknown error'));
          }
        }, 5000);

        // Stop polling after 15 minutes
        setTimeout(() => clearInterval(pollInterval), 15 * 60 * 1000);
      } else {
        const error = await response.json();
        alert(`Failed to generate clip: ${error.error || 'Unknown error'}`);
        setGenerating(false);
      }
    } catch (error) {
      console.error('Error generating clip:', error);
      alert('Failed to generate clip');
      setGenerating(false);
    }
  };

  const triggerComposition = async () => {
    if (!currentAddress || clips.length < 2) {
      alert('You need at least 2 clips to compose a video');
      return;
    }

    // Check credits
    const transitionTypes = clips.map((c) => c.transition_type as TransitionType);
    const cost = calculateCompositionCost(sequence.composition_mode, clips.length, transitionTypes);

    if (credits < cost.total_cost) {
      alert(`Insufficient credits. Need ${cost.total_cost} credits, you have ${credits}`);
      return;
    }

    if (!confirm(`This will cost ${cost.total_cost} credits. Continue?`)) {
      return;
    }

    try {
      setComposing(true);
      const response = await fetch(`/api/movie-mode/sequences/${resolvedParams.sequenceId}/compose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: currentAddress }),
      });

      if (response.ok) {
        alert('Composition started! This may take a few minutes.');
        loadSequence();
      } else {
        const error = await response.json();
        alert(`Failed to start composition: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error triggering composition:', error);
      alert('Failed to start composition');
    } finally {
      setComposing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--solana-purple)]"></div>
          <p className="text-[var(--text-secondary)] mt-4">Loading sequence...</p>
        </div>
      </div>
    );
  }

  if (!sequence) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[var(--text-secondary)]">Sequence not found</p>
        </div>
      </div>
    );
  }

  // Calculate cost estimate
  const transitionTypes = clips.map((c) => c.transition_type as TransitionType);
  const costEstimate = calculateCompositionCost(sequence.composition_mode, clips.length, transitionTypes);

  return (
    <div className="min-h-screen bg-[var(--background)] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={sequenceName}
                  onChange={(e) => setSequenceName(e.target.value)}
                  className="text-2xl font-bold bg-[var(--surface)] border border-[var(--border)] rounded px-3 py-1 text-white"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') updateSequenceName();
                    if (e.key === 'Escape') {
                      setEditingName(false);
                      setSequenceName(sequence.name);
                    }
                  }}
                  autoFocus
                />
                <button
                  onClick={updateSequenceName}
                  className="px-3 py-1 bg-[var(--solana-purple)] text-white rounded text-sm"
                >
                  Save
                </button>
              </div>
            ) : (
              <h1
                className="text-2xl font-bold text-white cursor-pointer hover:text-[var(--solana-purple)]"
                onClick={() => setEditingName(true)}
              >
                {sequence.name} ✏️
              </h1>
            )}
            <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)] mt-1">
              <span className="capitalize">{sequence.composition_mode} mode</span>
              <span>•</span>
              <span>{sequence.aspect_ratio}</span>
              <span>•</span>
              <span className="capitalize">{sequence.status}</span>
            </div>
          </div>

          <button
            onClick={() => router.push('/movie-mode')}
            className="px-4 py-2 bg-[var(--surface)] text-[var(--text-secondary)] rounded-lg hover:text-white transition-all"
          >
            ← Back to Sequences
          </button>
        </div>

        {/* Status Banner */}
        {sequence.status === 'processing' && compositionJob && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-yellow-400 font-medium">Composition in Progress</div>
                <div className="text-sm text-[var(--text-secondary)] mt-1">
                  {compositionJob.current_stage || 'Processing...'}
                </div>
              </div>
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-400"></div>
            </div>
          </div>
        )}

        {sequence.status === 'completed' && sequence.output_video_url && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
            <div className="text-green-400 font-medium mb-2">✅ Composition Complete!</div>
            <video
              src={sequence.output_video_url}
              controls
              className="w-full max-w-2xl rounded-lg"
            />
            <a
              href={sequence.output_video_url}
              download
              className="inline-block mt-3 px-4 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-all"
            >
              Download Video
            </a>
          </div>
        )}

        {sequence.status === 'failed' && compositionJob && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <div className="text-red-400 font-medium">❌ Composition Failed</div>
            <div className="text-sm text-[var(--text-secondary)] mt-1">
              {compositionJob.error_message || 'Unknown error'}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Video Library & Generation */}
          <div className="lg:col-span-1 space-y-4">
            {/* Generate New Clip Panel */}
            <div className="bg-[var(--surface)] rounded-lg border border-[var(--solana-purple)] p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">🎬 Generate New Clip</h2>
                <button
                  onClick={() => setShowGeneratePanel(!showGeneratePanel)}
                  className="text-sm text-[var(--solana-purple)] hover:underline"
                >
                  {showGeneratePanel ? 'Hide' : 'Show'}
                </button>
              </div>

              {showGeneratePanel && (
                <div className="space-y-3">
                  {clips.length === 0 ? (
                    <div className="text-sm text-[var(--text-secondary)] mb-2">
                      ✨ First clip: Start your story from scratch
                    </div>
                  ) : (
                    <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg mb-3">
                      <div className="text-sm font-medium text-green-400 mb-1">
                        🔗 Automatic Continuity
                      </div>
                      <div className="text-xs text-[var(--text-secondary)]">
                        This clip will start from where clip #{clips.length} ended, maintaining visual continuity
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm text-[var(--text-secondary)] mb-1">
                      Scene Description *
                    </label>
                    <input
                      type="text"
                      value={videoScene}
                      onChange={(e) => setVideoScene(e.target.value)}
                      placeholder="e.g., A wizard casting a spell in a tower"
                      disabled={generating || sequence.status !== 'draft'}
                      className="w-full bg-[var(--background)] border border-[var(--border)] rounded px-3 py-2 text-white text-sm disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-[var(--text-secondary)] mb-1">
                      Actions *
                    </label>
                    <input
                      type="text"
                      value={videoActions}
                      onChange={(e) => setVideoActions(e.target.value)}
                      placeholder="e.g., The spell creates a portal"
                      disabled={generating || sequence.status !== 'draft'}
                      className="w-full bg-[var(--background)] border border-[var(--border)] rounded px-3 py-2 text-white text-sm disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-[var(--text-secondary)] mb-1">
                      Speech (Optional)
                    </label>
                    <input
                      type="text"
                      value={videoSpeech}
                      onChange={(e) => setVideoSpeech(e.target.value)}
                      placeholder="e.g., Dialog or narration"
                      disabled={generating || sequence.status !== 'draft'}
                      className="w-full bg-[var(--background)] border border-[var(--border)] rounded px-3 py-2 text-white text-sm disabled:opacity-50"
                    />
                  </div>

                  <button
                    onClick={generateNewClip}
                    disabled={generating || sequence.status !== 'draft' || !videoScene.trim() || !videoActions.trim()}
                    className="w-full px-4 py-3 bg-gradient-to-r from-[var(--solana-purple)] to-[var(--solana-green)] text-white rounded-lg font-medium hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {generating ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Generating Clip...
                      </span>
                    ) : (
                      `Generate Clip ${clips.length + 1} (4 credits)`
                    )}
                  </button>

                  {generating && (
                    <div className="text-xs text-[var(--text-secondary)] text-center">
                      This may take 5-10 minutes. You can leave this page.
                    </div>
                  )}

                  <div className="text-xs text-[var(--text-secondary)] pt-2 border-t border-[var(--border)]">
                    💡 Tip: Each clip costs 4 credits. The system automatically uses the last frame of the previous clip to ensure seamless transitions.
                  </div>
                </div>
              )}
            </div>

            {/* Video Library */}
            <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] p-4">
              <h2 className="text-lg font-semibold text-white mb-4">📚 Existing Videos</h2>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {availableVideos.length === 0 ? (
                  <p className="text-sm text-[var(--text-secondary)]">
                    No videos available. Generate some videos first!
                  </p>
                ) : (
                  availableVideos.map((video) => {
                    const isInSequence = clips.some((c) => c.promotion_job_id === video.id);
                    const aspectRatio = video.subject_actions?.aspect_ratio || '16:9';
                    const matchesSequence = aspectRatio === sequence.aspect_ratio;

                    return (
                      <div
                        key={video.id}
                        className={`p-3 rounded-lg border transition-all ${
                          isInSequence
                            ? 'border-green-500/50 bg-green-500/10'
                            : !matchesSequence
                            ? 'border-red-500/50 bg-red-500/10 opacity-50'
                            : 'border-[var(--border)] hover:border-[var(--solana-purple)] cursor-pointer'
                        }`}
                        onClick={() => {
                          if (!isInSequence && matchesSequence && sequence.status === 'draft') {
                            addVideoToSequence(video.id);
                          }
                        }}
                      >
                        <video src={video.image_url} className="w-full rounded mb-2" muted />
                        <div className="text-xs text-[var(--text-secondary)]">
                          {aspectRatio}
                          {isInSequence && <span className="ml-2 text-green-400">✓ Added</span>}
                          {!matchesSequence && <span className="ml-2 text-red-400">Wrong ratio</span>}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right: Timeline & Controls */}
          <div className="lg:col-span-2">
            {/* Timeline */}
            <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] p-4 mb-6">
              <h2 className="text-lg font-semibold text-white mb-4">🎬 Timeline ({clips.length} clips)</h2>
              {clips.length === 0 ? (
                <p className="text-sm text-[var(--text-secondary)]">
                  Add videos from the library to start building your sequence
                </p>
              ) : (
                <div className="space-y-3">
                  {clips.map((clip, index) => (
                    <div key={clip.id} className="border border-[var(--border)] rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <div className="text-[var(--text-secondary)] font-mono text-sm w-8">
                          #{index + 1}
                        </div>
                        <video src={clip.video_url} className="w-24 h-16 object-cover rounded" muted />
                        <div className="flex-1">
                          <div className="text-sm text-white">Clip {index + 1}</div>
                          {index < clips.length - 1 && (
                            <select
                              value={clip.transition_type}
                              onChange={(e) => updateClipTransition(clip.id, e.target.value as TransitionType)}
                              disabled={sequence.status !== 'draft'}
                              className="mt-1 text-xs bg-[var(--background)] border border-[var(--border)] rounded px-2 py-1 text-white"
                            >
                              <option value="none">No Transition</option>
                              <option value="cut">Cut</option>
                              <option value="fade">Fade</option>
                              <option value="dissolve">Dissolve</option>
                              <option value="ai_transition">AI Transition (+4 credits)</option>
                            </select>
                          )}
                        </div>
                        {sequence.status === 'draft' && (
                          <button
                            onClick={() => removeClip(clip.id)}
                            className="px-3 py-1 bg-red-500/20 text-red-400 rounded text-sm hover:bg-red-500/30"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cost & Compose */}
            {clips.length >= 2 && sequence.status === 'draft' && (
              <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Cost Estimate</h3>
                <div className="space-y-2 mb-4">
                  {costEstimate.breakdown.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-[var(--text-secondary)]">{item.description}</span>
                      <span className="text-white">{item.cost} credits</span>
                    </div>
                  ))}
                  <div className="border-t border-[var(--border)] pt-2 mt-2">
                    <div className="flex justify-between font-semibold">
                      <span className="text-white">Total</span>
                      <span className="text-[var(--solana-green)]">{costEstimate.total_cost} credits</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={triggerComposition}
                  disabled={composing || clips.length < 2}
                  className="w-full px-6 py-3 bg-gradient-to-r from-[var(--solana-purple)] to-[var(--solana-green)] text-white rounded-lg font-medium hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {composing ? 'Starting Composition...' : `Compose Video (${costEstimate.total_cost} credits)`}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
