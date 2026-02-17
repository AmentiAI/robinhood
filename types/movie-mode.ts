/**
 * Movie Mode Types
 * TypeScript interfaces for the video sequencing and composition feature
 */

// ============================================
// Enums and Literal Types
// ============================================

export type SequenceStatus = 'draft' | 'processing' | 'completed' | 'failed';

export type CompositionMode = 'simple' | 'transitions';

export type TransitionType = 'none' | 'fade' | 'dissolve' | 'cut' | 'ai_transition';

export type AspectRatio = '16:9' | '9:16' | '1:1';

export type CompositionJobStatus =
  | 'pending'
  | 'extracting_frames'
  | 'generating_transitions'
  | 'composing'
  | 'completed'
  | 'failed';

// ============================================
// Database Schema Interfaces
// ============================================

/**
 * Video Sequence - Main container for a movie/sequence
 */
export interface VideoSequence {
  id: string;
  wallet_address: string;
  name: string;
  collection_id?: string;

  // Status
  status: SequenceStatus;

  // Settings
  composition_mode: CompositionMode;
  aspect_ratio: AspectRatio;

  // Output
  output_video_url?: string;
  total_duration_seconds?: number;

  // Timestamps
  created_at: Date;
  updated_at: Date;
  completed_at?: Date;
}

/**
 * Video Sequence Clip - Individual video in a sequence
 */
export interface VideoSequenceClip {
  id: string;
  sequence_id: string;
  promotion_job_id: string;

  // Ordering and transitions
  clip_order: number;
  transition_type: TransitionType;
  transition_duration: number;

  // Frame extraction
  last_frame_url?: string;

  // Timestamp
  created_at: Date;
}

/**
 * Video Composition Job - Tracks processing of a composition
 */
export interface VideoCompositionJob {
  id: string;
  sequence_id: string;
  wallet_address: string;

  // Processing status
  status: CompositionJobStatus;
  current_stage?: string;
  error_message?: string;

  // Kie AI tracking
  kie_ai_task_ids?: string[];

  // Results
  composition_result_url?: string;

  // Credits
  credits_charged: number;

  // Timestamps
  created_at: Date;
  started_at?: Date;
  completed_at?: Date;
}

// ============================================
// Extended Interfaces (with JOIN data)
// ============================================

/**
 * Extended clip with video data from promotion_jobs
 */
export interface VideoSequenceClipWithVideo extends VideoSequenceClip {
  // From promotion_jobs via JOIN
  video_url?: string;
  video_duration?: number;
  video_thumbnail?: string;
  video_aspect_ratio?: string;
}

/**
 * Extended sequence with clips and composition job
 */
export interface VideoSequenceWithDetails extends VideoSequence {
  clips?: VideoSequenceClipWithVideo[];
  composition_job?: VideoCompositionJob;
  clip_count?: number;
}

// ============================================
// Request/Response Types for API
// ============================================

/**
 * Create sequence request
 */
export interface CreateSequenceRequest {
  name: string;
  collection_id?: string;
  composition_mode: CompositionMode;
  aspect_ratio: AspectRatio;
}

/**
 * Create sequence response
 */
export interface CreateSequenceResponse {
  sequence: VideoSequence;
}

/**
 * Update sequence request
 */
export interface UpdateSequenceRequest {
  name?: string;
  composition_mode?: CompositionMode;
}

/**
 * Add clip to sequence request
 */
export interface AddClipRequest {
  promotion_job_id: string;
  clip_order: number;
  transition_type?: TransitionType;
  transition_duration?: number;
}

/**
 * Update clip request
 */
export interface UpdateClipRequest {
  clip_order?: number;
  transition_type?: TransitionType;
  transition_duration?: number;
}

/**
 * Trigger composition request
 */
export interface TriggerCompositionRequest {
  // No body needed - everything is from sequence metadata
}

/**
 * Composition status response
 */
export interface CompositionStatusResponse {
  sequence: VideoSequence;
  composition_job?: VideoCompositionJob;
  clips: VideoSequenceClipWithVideo[];
}

/**
 * List sequences response
 */
export interface ListSequencesResponse {
  sequences: VideoSequenceWithDetails[];
  total: number;
}

// ============================================
// Client-Side UI Types
// ============================================

/**
 * Timeline clip for drag-and-drop
 */
export interface TimelineClip {
  id: string;
  clipId: string;
  promotionJobId: string;
  order: number;
  videoUrl: string;
  thumbnailUrl?: string;
  duration: number;
  transitionType: TransitionType;
  transitionDuration: number;
}

/**
 * Cost estimation breakdown
 */
export interface CostEstimate {
  base_cost: number;
  clip_cost: number;
  frame_extraction_cost: number;
  transition_cost: number;
  total_cost: number;
  breakdown: {
    description: string;
    cost: number;
  }[];
}

/**
 * Composition progress stages
 */
export interface CompositionProgress {
  current_stage: CompositionJobStatus;
  stage_description: string;
  progress_percentage: number;
  estimated_time_remaining?: number;
}

/**
 * Video library item
 */
export interface VideoLibraryItem {
  promotion_job_id: string;
  video_url: string;
  thumbnail_url?: string;
  duration?: number;
  aspect_ratio: AspectRatio;
  created_at: Date;
  is_in_sequence: boolean; // True if already added to current sequence
}

// ============================================
// Utility Types
// ============================================

/**
 * Transition configuration
 */
export interface TransitionConfig {
  type: TransitionType;
  duration: number;
  label: string;
  description: string;
  credits_cost: number; // For ai_transition
}

/**
 * Composition mode configuration
 */
export interface CompositionModeConfig {
  mode: CompositionMode;
  label: string;
  description: string;
  base_cost: number;
}

/**
 * Constants for credit costs
 */
export const COMPOSITION_COSTS = {
  BASE_SIMPLE: 2,
  BASE_TRANSITIONS: 2,
  PER_CLIP: 0.5,
  FRAME_EXTRACTION: 0.1,
  AI_TRANSITION: 4,
} as const;

/**
 * Available transition configurations
 */
export const TRANSITION_CONFIGS: TransitionConfig[] = [
  {
    type: 'none',
    duration: 0,
    label: 'No Transition',
    description: 'Clips play back-to-back with no transition',
    credits_cost: 0,
  },
  {
    type: 'cut',
    duration: 0,
    label: 'Cut',
    description: 'Instant transition between clips',
    credits_cost: 0,
  },
  {
    type: 'fade',
    duration: 0.5,
    label: 'Fade',
    description: 'Fade to black transition',
    credits_cost: 0,
  },
  {
    type: 'dissolve',
    duration: 1.0,
    label: 'Dissolve',
    description: 'Crossfade between clips',
    credits_cost: 0,
  },
  {
    type: 'ai_transition',
    duration: 2.0,
    label: 'AI Transition',
    description: 'AI-generated cinematic transition using Kie AI Veo 3.1',
    credits_cost: 4,
  },
];

/**
 * Composition mode configurations
 */
export const COMPOSITION_MODE_CONFIGS: CompositionModeConfig[] = [
  {
    mode: 'simple',
    label: 'Simple Mode',
    description: 'Fast concatenation with basic transitions (fade, dissolve)',
    base_cost: 2,
  },
  {
    mode: 'transitions',
    label: 'Transition Mode',
    description: 'AI-generated cinematic transitions for seamless flow',
    base_cost: 2,
  },
];

/**
 * Helper function to calculate composition cost
 */
export function calculateCompositionCost(
  mode: CompositionMode,
  clipCount: number,
  transitionTypes: TransitionType[]
): CostEstimate {
  const baseCost = mode === 'simple' ? COMPOSITION_COSTS.BASE_SIMPLE : COMPOSITION_COSTS.BASE_TRANSITIONS;
  const clipCost = clipCount * COMPOSITION_COSTS.PER_CLIP;
  const frameExtractionCost = mode === 'transitions' ? clipCount * COMPOSITION_COSTS.FRAME_EXTRACTION : 0;

  const aiTransitionCount = transitionTypes.filter((t) => t === 'ai_transition').length;
  const transitionCost = aiTransitionCount * COMPOSITION_COSTS.AI_TRANSITION;

  const totalCost = baseCost + clipCost + frameExtractionCost + transitionCost;

  const breakdown = [
    { description: 'Base fee', cost: baseCost },
    { description: `${clipCount} clips`, cost: clipCost },
  ];

  if (frameExtractionCost > 0) {
    breakdown.push({ description: 'Frame extraction', cost: frameExtractionCost });
  }

  if (transitionCost > 0) {
    breakdown.push({ description: `${aiTransitionCount} AI transitions`, cost: transitionCost });
  }

  return {
    base_cost: baseCost,
    clip_cost: clipCost,
    frame_extraction_cost: frameExtractionCost,
    transition_cost: transitionCost,
    total_cost: totalCost,
    breakdown,
  };
}
