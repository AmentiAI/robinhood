/**
 * Movie Mode Composition Jobs Cron Processor
 * Handles multi-stage video composition processing
 *
 * Stages:
 * 1. pending → extracting_frames (extract last frame from each clip)
 * 2. extracting_frames → generating_transitions (generate AI transitions if needed)
 * 3. generating_transitions → composing (concat all videos with transitions)
 * 4. composing → completed (finalize and update sequence)
 */

import { NextResponse } from 'next/server';
import { sql } from '@/lib/database';
import { extractLastFrame } from '@/lib/video-composition/ffmpeg-utils';
import { generateTransitionVideo } from '@/lib/video-composition/kie-ai-composition';
import { addCredits } from '@/lib/credits/credits';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes

/**
 * GET /api/cron/process-composition-jobs
 * Process pending composition jobs
 */
export async function GET() {
  try {
    console.log('[Cron] Processing composition jobs...');

    let processedJobs = 0;
    let failedJobs = 0;

    // ============================================
    // CLEANUP: Mark stuck jobs as failed
    // ============================================
    const stuckJobsResult = await sql`
      UPDATE video_composition_jobs
      SET
        status = 'failed',
        error_message = 'Job timed out - stuck in processing for more than 10 minutes',
        completed_at = CURRENT_TIMESTAMP
      WHERE status IN ('extracting_frames', 'generating_transitions', 'composing')
        AND started_at < NOW() - INTERVAL '10 minutes'
      RETURNING *
    `;

    const stuckJobs = Array.isArray(stuckJobsResult) ? stuckJobsResult : [];
    if (stuckJobs.length > 0) {
      console.log(`[Cron] Marked ${stuckJobs.length} stuck job(s) as failed`);

      // Restore credits for stuck jobs
      for (const job of stuckJobs) {
        const stuckJob = job as any;
        await restoreCreditsForFailedJob(stuckJob);
        await sql`
          UPDATE video_sequences
          SET status = 'failed'
          WHERE id = ${stuckJob.sequence_id}::uuid
        `;
      }
    }

    // ============================================
    // STAGE 1: PENDING → EXTRACTING_FRAMES
    // ============================================
    const pendingJobs = await sql`
      SELECT * FROM video_composition_jobs
      WHERE status = 'pending'
      ORDER BY created_at ASC
      LIMIT 5
    `;

    for (const job of Array.isArray(pendingJobs) ? pendingJobs : []) {
      const jobData = job as any;
      try {
        await processPendingJob(jobData);
        processedJobs++;
      } catch (error) {
        console.error(`[Cron] Failed to process pending job ${jobData.id}:`, error);
        await markJobAsFailed(jobData.id, error instanceof Error ? error.message : 'Unknown error');
        failedJobs++;
      }
    }

    // ============================================
    // STAGE 2: EXTRACTING_FRAMES → GENERATING_TRANSITIONS
    // ============================================
    const extractingJobs = await sql`
      SELECT * FROM video_composition_jobs
      WHERE status = 'extracting_frames'
      ORDER BY created_at ASC
      LIMIT 5
    `;

    for (const job of Array.isArray(extractingJobs) ? extractingJobs : []) {
      const jobData = job as any;
      try {
        await processExtractingJob(jobData);
        processedJobs++;
      } catch (error) {
        console.error(`[Cron] Failed to process extracting job ${jobData.id}:`, error);
        await markJobAsFailed(jobData.id, error instanceof Error ? error.message : 'Unknown error');
        failedJobs++;
      }
    }

    // ============================================
    // STAGE 3: GENERATING_TRANSITIONS → COMPOSING
    // ============================================
    // Note: Transitions are processed via callback, so we just check if all are done
    const transitionJobs = await sql`
      SELECT * FROM video_composition_jobs
      WHERE status = 'generating_transitions'
      ORDER BY created_at ASC
      LIMIT 5
    `;

    for (const job of Array.isArray(transitionJobs) ? transitionJobs : []) {
      const jobData = job as any;
      try {
        await checkTransitionsComplete(jobData);
      } catch (error) {
        console.error(`[Cron] Failed to check transitions for job ${jobData.id}:`, error);
        // Don't mark as failed yet, transitions might still be processing
      }
    }

    // ============================================
    // STAGE 4: COMPOSING → COMPLETED
    // ============================================
    // Note: Composition is handled by external service (Cloudinary)
    // For now, we'll mark it as completed with a placeholder
    const composingJobs = await sql`
      SELECT * FROM video_composition_jobs
      WHERE status = 'composing'
      ORDER BY created_at ASC
      LIMIT 5
    `;

    for (const job of Array.isArray(composingJobs) ? composingJobs : []) {
      const jobData = job as any;
      try {
        await processComposingJob(jobData);
        processedJobs++;
      } catch (error) {
        console.error(`[Cron] Failed to process composing job ${jobData.id}:`, error);
        await markJobAsFailed(jobData.id, error instanceof Error ? error.message : 'Unknown error');
        failedJobs++;
      }
    }

    console.log(`[Cron] Composition jobs processed: ${processedJobs}, failed: ${failedJobs}`);

    return NextResponse.json({
      success: true,
      processed: processedJobs,
      failed: failedJobs,
      stuck_cleaned: stuckJobs.length,
    });
  } catch (error) {
    console.error('[Cron] Error processing composition jobs:', error);
    return NextResponse.json(
      { error: 'Failed to process composition jobs', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Process a pending job - start frame extraction
 */
async function processPendingJob(job: any) {
  console.log(`[processPendingJob] Starting job ${job.id}`);

  // Get sequence
  const sequenceResult = await sql`
    SELECT * FROM video_sequences WHERE id = ${job.sequence_id}::uuid
  `;
  const sequence = Array.isArray(sequenceResult) && sequenceResult.length > 0
    ? sequenceResult[0] as any
    : null;

  if (!sequence) {
    throw new Error('Sequence not found');
  }

  // Get clips
  const clipsResult = await sql`
    SELECT c.*, pj.image_url as video_url
    FROM video_sequence_clips c
    LEFT JOIN promotion_jobs pj ON c.promotion_job_id = pj.id
    WHERE c.sequence_id = ${job.sequence_id}::uuid
    ORDER BY c.clip_order ASC
  `;
  const clips = Array.isArray(clipsResult) ? clipsResult : [];

  if (clips.length === 0) {
    throw new Error('No clips found in sequence');
  }

  // Update status to extracting_frames
  await sql`
    UPDATE video_composition_jobs
    SET
      status = 'extracting_frames',
      current_stage = 'Extracting frames from videos',
      started_at = CURRENT_TIMESTAMP
    WHERE id = ${job.id}::uuid
  `;

  console.log(`[processPendingJob] Job ${job.id} → extracting_frames`);
}

/**
 * Process an extracting job - extract frames from all clips
 */
async function processExtractingJob(job: any) {
  console.log(`[processExtractingJob] Extracting frames for job ${job.id}`);

  // Get clips
  const clipsResult = await sql`
    SELECT c.*, pj.image_url as video_url
    FROM video_sequence_clips c
    LEFT JOIN promotion_jobs pj ON c.promotion_job_id = pj.id
    WHERE c.sequence_id = ${job.sequence_id}::uuid
    ORDER BY c.clip_order ASC
  `;
  const clips = Array.isArray(clipsResult) ? clipsResult : [];

  // Extract last frame from each clip (except the last one, which doesn't need it)
  for (let i = 0; i < clips.length - 1; i++) {
    const clip = clips[i] as any;

    // Skip if already extracted
    if (clip.last_frame_url) {
      console.log(`[processExtractingJob] Frame already extracted for clip ${clip.id}`);
      continue;
    }

    try {
      console.log(`[processExtractingJob] Extracting frame from clip ${clip.id}`);
      const frameUrl = await extractLastFrame(clip.video_url);

      await sql`
        UPDATE video_sequence_clips
        SET last_frame_url = ${frameUrl}
        WHERE id = ${clip.id}::uuid
      `;

      console.log(`[processExtractingJob] Frame extracted: ${frameUrl}`);
    } catch (error) {
      console.error(`[processExtractingJob] Failed to extract frame for clip ${clip.id}:`, error);
      throw error;
    }
  }

  // Get sequence to check composition mode
  const sequenceResult = await sql`
    SELECT * FROM video_sequences WHERE id = ${job.sequence_id}::uuid
  `;
  const sequence = Array.isArray(sequenceResult) && sequenceResult.length > 0
    ? sequenceResult[0] as any
    : null;

  if (!sequence) {
    throw new Error('Sequence not found');
  }

  // If simple mode, skip transitions and go straight to composing
  if (sequence.composition_mode === 'simple') {
    await sql`
      UPDATE video_composition_jobs
      SET
        status = 'composing',
        current_stage = 'Composing final video'
      WHERE id = ${job.id}::uuid
    `;
    console.log(`[processExtractingJob] Simple mode - skipping transitions, job ${job.id} → composing`);
    return;
  }

  // Transition mode: generate AI transitions
  await sql`
    UPDATE video_composition_jobs
    SET
      status = 'generating_transitions',
      current_stage = 'Generating AI transitions between clips'
    WHERE id = ${job.id}::uuid
  `;

  console.log(`[processExtractingJob] Job ${job.id} → generating_transitions`);

  // Generate transitions between clips
  const taskIds: string[] = [];
  for (let i = 0; i < clips.length - 1; i++) {
    const currentClip = clips[i] as any;
    const nextClip = clips[i + 1] as any;

    // Only generate AI transition if transition_type is 'ai_transition'
    if (currentClip.transition_type !== 'ai_transition') {
      continue;
    }

    try {
      const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/movie-mode/composition-callback`;

      const taskId = await generateTransitionVideo(
        currentClip.last_frame_url, // Last frame of current clip
        nextClip.video_url, // First frame of next clip (we'll extract it from video)
        `Smooth cinematic transition maintaining visual continuity`,
        sequence.aspect_ratio,
        callbackUrl
      );

      taskIds.push(taskId);
      console.log(`[processExtractingJob] Transition generated: ${taskId}`);
    } catch (error) {
      console.error(`[processExtractingJob] Failed to generate transition:`, error);
      throw error;
    }
  }

  // Store task IDs in job
  if (taskIds.length > 0) {
    await sql`
      UPDATE video_composition_jobs
      SET kie_ai_task_ids = ${JSON.stringify(taskIds)}::jsonb
      WHERE id = ${job.id}::uuid
    `;
  }
}

/**
 * Check if all transitions are complete
 */
async function checkTransitionsComplete(job: any) {
  // For now, mark as ready to compose after 30 seconds
  // In production, this would check Kie AI callback status
  const jobAge = Date.now() - new Date(job.started_at).getTime();

  if (jobAge > 30000) { // 30 seconds
    await sql`
      UPDATE video_composition_jobs
      SET
        status = 'composing',
        current_stage = 'Composing final video with transitions'
      WHERE id = ${job.id}::uuid
    `;
    console.log(`[checkTransitionsComplete] Job ${job.id} → composing`);
  }
}

/**
 * Process a composing job - concatenate all videos
 */
async function processComposingJob(job: any) {
  console.log(`[processComposingJob] Composing job ${job.id}`);

  // Get sequence
  const sequenceResult = await sql`
    SELECT * FROM video_sequences WHERE id = ${job.sequence_id}::uuid
  `;
  const sequence = Array.isArray(sequenceResult) && sequenceResult.length > 0
    ? sequenceResult[0] as any
    : null;

  if (!sequence) {
    throw new Error('Sequence not found');
  }

  // Get clips
  const clipsResult = await sql`
    SELECT c.*, pj.image_url as video_url
    FROM video_sequence_clips c
    LEFT JOIN promotion_jobs pj ON c.promotion_job_id = pj.id
    WHERE c.sequence_id = ${job.sequence_id}::uuid
    ORDER BY c.clip_order ASC
  `;
  const clips = Array.isArray(clipsResult) ? clipsResult : [];

  // For now, use the first video as the output (placeholder)
  // TODO: Implement actual video concatenation with Cloudinary
  const firstClip = clips[0] as any;
  const outputVideoUrl = firstClip.video_url;

  console.log(`[processComposingJob] Using first clip as output (placeholder): ${outputVideoUrl}`);

  // Update sequence and job to completed
  await sql`
    UPDATE video_sequences
    SET
      status = 'completed',
      output_video_url = ${outputVideoUrl},
      completed_at = CURRENT_TIMESTAMP
    WHERE id = ${job.sequence_id}::uuid
  `;

  await sql`
    UPDATE video_composition_jobs
    SET
      status = 'completed',
      current_stage = 'Composition complete',
      composition_result_url = ${outputVideoUrl},
      completed_at = CURRENT_TIMESTAMP
    WHERE id = ${job.id}::uuid
  `;

  console.log(`[processComposingJob] Job ${job.id} → completed`);
}

/**
 * Mark a job as failed and restore credits
 */
async function markJobAsFailed(jobId: string, errorMessage: string) {
  const jobResult = await sql`
    SELECT * FROM video_composition_jobs WHERE id = ${jobId}::uuid
  `;
  const job = Array.isArray(jobResult) && jobResult.length > 0 ? jobResult[0] as any : null;

  if (!job) return;

  await sql`
    UPDATE video_composition_jobs
    SET
      status = 'failed',
      error_message = ${errorMessage},
      completed_at = CURRENT_TIMESTAMP
    WHERE id = ${jobId}::uuid
  `;

  await sql`
    UPDATE video_sequences
    SET status = 'failed'
    WHERE id = ${job.sequence_id}::uuid
  `;

  await restoreCreditsForFailedJob(job);
}

/**
 * Restore credits for a failed job
 */
async function restoreCreditsForFailedJob(job: any) {
  try {
    await addCredits(
      job.wallet_address,
      job.credits_charged,
      'video_composition_refund',
      { job_id: job.id, sequence_id: job.sequence_id }
    );
    console.log(`[restoreCredits] Restored ${job.credits_charged} credits to ${job.wallet_address}`);
  } catch (error) {
    console.error('[restoreCredits] Failed to restore credits:', error);
  }
}

// Allow POST as well for manual triggering
export async function POST() {
  return GET();
}
