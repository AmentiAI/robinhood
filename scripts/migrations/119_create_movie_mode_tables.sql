-- Migration: Create Movie Mode Tables
-- Description: Creates tables for video sequencing and composition feature
-- Tables: video_sequences, video_sequence_clips, video_composition_jobs

-- ============================================
-- TABLE 1: video_sequences
-- Stores user-created video sequences (collections of clips)
-- ============================================
CREATE TABLE IF NOT EXISTS video_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  name TEXT NOT NULL,
  collection_id UUID REFERENCES collections(id) ON DELETE SET NULL,

  -- Status tracking
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  -- Status values: 'draft', 'processing', 'completed', 'failed'

  -- Composition settings
  composition_mode VARCHAR(20) NOT NULL DEFAULT 'simple',
  -- Modes: 'simple' (concatenation only), 'transitions' (AI transitions)

  -- Output
  output_video_url TEXT,
  total_duration_seconds DECIMAL(10, 2),
  aspect_ratio VARCHAR(10) NOT NULL DEFAULT '16:9',
  -- Aspect ratios: '16:9', '9:16', '1:1'

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_video_sequences_wallet ON video_sequences(wallet_address);
CREATE INDEX idx_video_sequences_status ON video_sequences(status);
CREATE INDEX idx_video_sequences_created ON video_sequences(created_at DESC);

-- ============================================
-- TABLE 2: video_sequence_clips
-- Individual video clips within a sequence
-- ============================================
CREATE TABLE IF NOT EXISTS video_sequence_clips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES video_sequences(id) ON DELETE CASCADE,
  promotion_job_id UUID NOT NULL REFERENCES promotion_jobs(id) ON DELETE CASCADE,

  -- Clip ordering and transitions
  clip_order INTEGER NOT NULL,
  transition_type VARCHAR(20) DEFAULT 'none',
  -- Transition types: 'none', 'fade', 'dissolve', 'cut', 'ai_transition'

  transition_duration DECIMAL(5, 2) DEFAULT 0.5,
  -- Transition duration in seconds (typically 0.5-2.0)

  -- Extracted frames for continuity
  last_frame_url TEXT,
  -- URL to the last frame of this clip (for smooth transitions to next clip)

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_video_sequence_clips_sequence ON video_sequence_clips(sequence_id);
CREATE INDEX idx_video_sequence_clips_order ON video_sequence_clips(sequence_id, clip_order);
CREATE INDEX idx_video_sequence_clips_job ON video_sequence_clips(promotion_job_id);

-- Unique constraint: each clip can only appear once in a sequence at a specific position
CREATE UNIQUE INDEX idx_video_sequence_clips_unique_order ON video_sequence_clips(sequence_id, clip_order);

-- ============================================
-- TABLE 3: video_composition_jobs
-- Tracks the multi-stage composition processing
-- ============================================
CREATE TABLE IF NOT EXISTS video_composition_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES video_sequences(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,

  -- Processing status
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  -- Status values: 'pending', 'extracting_frames', 'generating_transitions',
  --                'composing', 'completed', 'failed'

  current_stage TEXT,
  -- Human-readable description of current processing stage

  error_message TEXT,

  -- Kie AI tracking
  kie_ai_task_ids JSONB,
  -- Array of Kie AI task IDs for transition generation
  -- Example: ["task_123", "task_456", "task_789"]

  -- Results
  composition_result_url TEXT,
  -- Final composed video URL

  -- Credits
  credits_charged DECIMAL(10, 2) NOT NULL DEFAULT 0,
  -- Total credits charged for this composition

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_video_composition_jobs_sequence ON video_composition_jobs(sequence_id);
CREATE INDEX idx_video_composition_jobs_wallet ON video_composition_jobs(wallet_address);
CREATE INDEX idx_video_composition_jobs_status ON video_composition_jobs(status);
CREATE INDEX idx_video_composition_jobs_created ON video_composition_jobs(created_at DESC);

-- JSONB index for efficient task ID queries
CREATE INDEX idx_video_composition_jobs_task_ids ON video_composition_jobs USING GIN (kie_ai_task_ids);

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================
COMMENT ON TABLE video_sequences IS 'User-created video sequences for Movie Mode feature';
COMMENT ON TABLE video_sequence_clips IS 'Individual video clips within a sequence with transition settings';
COMMENT ON TABLE video_composition_jobs IS 'Tracks multi-stage processing of video compositions';

COMMENT ON COLUMN video_sequences.composition_mode IS 'simple = concatenation only, transitions = AI-generated transitions';
COMMENT ON COLUMN video_sequence_clips.last_frame_url IS 'Extracted last frame for visual continuity with next clip';
COMMENT ON COLUMN video_composition_jobs.kie_ai_task_ids IS 'Array of Kie AI task IDs for transition generation jobs';
COMMENT ON COLUMN video_composition_jobs.current_stage IS 'Human-readable description of current processing stage for UI display';
