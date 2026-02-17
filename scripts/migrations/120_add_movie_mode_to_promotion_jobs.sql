-- Migration 120: Add Movie Mode support to promotion_jobs
-- This extends the existing video generation system to support sequences

-- Add sequence tracking columns to promotion_jobs
ALTER TABLE promotion_jobs
  ADD COLUMN sequence_id UUID REFERENCES video_sequences(id) ON DELETE CASCADE,
  ADD COLUMN clip_order INTEGER,
  ADD COLUMN last_frame_url TEXT;

-- Index for quick sequence lookups
CREATE INDEX idx_promotion_jobs_sequence ON promotion_jobs(sequence_id, clip_order);

-- Create video_sequences table (metadata only - clips stored in promotion_jobs)
CREATE TABLE video_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  name TEXT NOT NULL,
  aspect_ratio VARCHAR(10) NOT NULL, -- All clips in sequence must match (16:9 or 9:16)
  status VARCHAR(20) DEFAULT 'draft', -- draft | composing | completed | failed
  composition_url TEXT, -- Final stitched movie URL (optional)
  total_clips INTEGER DEFAULT 0,
  total_duration_seconds DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for quick user lookups
CREATE INDEX idx_video_sequences_wallet ON video_sequences(wallet_address);

-- Optional: Video composition jobs table (for final stitching)
CREATE TABLE video_composition_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID REFERENCES video_sequences(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending', -- pending | processing | completed | failed
  cloudinary_result_url TEXT,
  error_message TEXT,
  credits_charged DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE INDEX idx_video_composition_jobs_sequence ON video_composition_jobs(sequence_id);
