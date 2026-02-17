/**
 * Movie Mode Clips Management API
 * Handles adding and managing clips within a sequence
 */

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/database';
import type { AddClipRequest } from '@/types/movie-mode';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/movie-mode/sequences/[id]/clips
 * Add a clip to a sequence
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sequenceId } = await params;
    const body: AddClipRequest & { wallet_address: string } = await request.json();

    const {
      wallet_address,
      promotion_job_id,
      clip_order,
      transition_type = 'none',
      transition_duration = 0.5,
    } = body;

    // Validation
    if (!wallet_address) {
      return NextResponse.json({ error: 'wallet_address is required' }, { status: 400 });
    }

    if (!promotion_job_id) {
      return NextResponse.json({ error: 'promotion_job_id is required' }, { status: 400 });
    }

    if (clip_order === undefined || clip_order < 0) {
      return NextResponse.json({ error: 'clip_order must be >= 0' }, { status: 400 });
    }

    // Verify sequence ownership
    const sequenceResult = await sql`
      SELECT * FROM video_sequences
      WHERE id = ${sequenceId}::uuid AND wallet_address = ${wallet_address}
    `;

    if (!Array.isArray(sequenceResult) || sequenceResult.length === 0) {
      return NextResponse.json({ error: 'Sequence not found' }, { status: 404 });
    }

    const sequence = sequenceResult[0] as any;

    // Don't allow adding clips if sequence is processing
    if (sequence.status === 'processing') {
      return NextResponse.json({ error: 'Cannot add clips while sequence is processing' }, { status: 400 });
    }

    // Verify promotion job exists and belongs to user
    const jobResult = await sql`
      SELECT * FROM promotion_jobs
      WHERE id = ${promotion_job_id}::uuid
        AND wallet_address = ${wallet_address}
        AND status = 'completed'
    `;

    if (!Array.isArray(jobResult) || jobResult.length === 0) {
      return NextResponse.json({ error: 'Promotion job not found or not completed' }, { status: 404 });
    }

    const job = jobResult[0] as any;

    // Verify it's a video job
    const subjectActions = typeof job.subject_actions === 'string'
      ? JSON.parse(job.subject_actions)
      : job.subject_actions;

    if (subjectActions?.content_type !== 'video') {
      return NextResponse.json({ error: 'Promotion job is not a video' }, { status: 400 });
    }

    // Check aspect ratio matches sequence
    const jobAspectRatio = subjectActions?.aspect_ratio || '16:9';
    if (jobAspectRatio !== sequence.aspect_ratio) {
      return NextResponse.json({
        error: `Video aspect ratio (${jobAspectRatio}) does not match sequence aspect ratio (${sequence.aspect_ratio})`,
      }, { status: 400 });
    }

    // Check if clip already exists in sequence
    const existingClipResult = await sql`
      SELECT * FROM video_sequence_clips
      WHERE sequence_id = ${sequenceId}::uuid
        AND promotion_job_id = ${promotion_job_id}::uuid
    `;

    if (Array.isArray(existingClipResult) && existingClipResult.length > 0) {
      return NextResponse.json({ error: 'This video is already in the sequence' }, { status: 400 });
    }

    // Shift existing clips at this position and after
    await sql`
      UPDATE video_sequence_clips
      SET clip_order = clip_order + 1
      WHERE sequence_id = ${sequenceId}::uuid
        AND clip_order >= ${clip_order}
    `;

    // Add clip
    const result = await sql`
      INSERT INTO video_sequence_clips (
        sequence_id,
        promotion_job_id,
        clip_order,
        transition_type,
        transition_duration
      )
      VALUES (
        ${sequenceId}::uuid,
        ${promotion_job_id}::uuid,
        ${clip_order},
        ${transition_type},
        ${transition_duration}
      )
      RETURNING *
    `;

    const clip = Array.isArray(result) && result.length > 0 ? result[0] : null;

    if (!clip) {
      throw new Error('Failed to create clip');
    }

    // Update sequence updated_at
    await sql`
      UPDATE video_sequences
      SET updated_at = CURRENT_TIMESTAMP
      WHERE id = ${sequenceId}::uuid
    `;

    console.log('[POST /api/movie-mode/sequences/[id]/clips] Added clip:', (clip as any).id);

    return NextResponse.json({ clip }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/movie-mode/sequences/[id]/clips] Error:', error);
    return NextResponse.json(
      { error: 'Failed to add clip', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
