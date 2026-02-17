/**
 * Movie Mode Composition Trigger API
 * Triggers the video composition process for a sequence
 */

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/database';
import { deductCredits } from '@/lib/credits/credits';
import { calculateCompositionCost } from '@/types/movie-mode';
import type { TransitionType } from '@/types/movie-mode';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/movie-mode/sequences/[id]/compose
 * Trigger composition for a sequence
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sequenceId } = await params;
    const { wallet_address } = await request.json();

    if (!wallet_address) {
      return NextResponse.json({ error: 'wallet_address is required' }, { status: 400 });
    }

    // Get sequence with clips
    const sequenceResult = await sql`
      SELECT * FROM video_sequences
      WHERE id = ${sequenceId}::uuid AND wallet_address = ${wallet_address}
    `;

    if (!Array.isArray(sequenceResult) || sequenceResult.length === 0) {
      return NextResponse.json({ error: 'Sequence not found' }, { status: 404 });
    }

    const sequence = sequenceResult[0] as any;

    // Validate sequence status
    if (sequence.status === 'processing') {
      return NextResponse.json({ error: 'Sequence is already being processed' }, { status: 400 });
    }

    if (sequence.status === 'completed') {
      return NextResponse.json({ error: 'Sequence is already completed. Create a new sequence to compose again.' }, { status: 400 });
    }

    // Get clips
    const clipsResult = await sql`
      SELECT * FROM video_sequence_clips
      WHERE sequence_id = ${sequenceId}::uuid
      ORDER BY clip_order ASC
    `;

    const clips = Array.isArray(clipsResult) ? clipsResult : [];

    // Validation
    if (clips.length === 0) {
      return NextResponse.json({ error: 'Sequence has no clips. Add at least one video clip.' }, { status: 400 });
    }

    if (clips.length === 1) {
      return NextResponse.json({ error: 'Sequence must have at least 2 clips to compose.' }, { status: 400 });
    }

    // Calculate cost
    const transitionTypes = clips.map((c: any) => c.transition_type as TransitionType);
    const costEstimate = calculateCompositionCost(
      sequence.composition_mode,
      clips.length,
      transitionTypes
    );

    // Deduct credits
    const deductResult = await deductCredits(
      wallet_address,
      costEstimate.total_cost,
      'video_composition',
      {
        sequence_id: sequenceId,
        clip_count: clips.length,
        composition_mode: sequence.composition_mode,
        breakdown: costEstimate.breakdown,
      }
    );

    if (!deductResult.success) {
      return NextResponse.json(
        { error: deductResult.message || 'Insufficient credits' },
        { status: 402 }
      );
    }

    // Create composition job
    const jobResult = await sql`
      INSERT INTO video_composition_jobs (
        sequence_id,
        wallet_address,
        status,
        current_stage,
        credits_charged
      )
      VALUES (
        ${sequenceId}::uuid,
        ${wallet_address},
        'pending',
        'Queued for processing',
        ${costEstimate.total_cost}
      )
      RETURNING *
    `;

    const job = Array.isArray(jobResult) && jobResult.length > 0 ? jobResult[0] : null;

    if (!job) {
      throw new Error('Failed to create composition job');
    }

    // Update sequence status
    await sql`
      UPDATE video_sequences
      SET
        status = 'processing',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${sequenceId}::uuid
    `;

    console.log('[POST /api/movie-mode/sequences/[id]/compose] Composition job created:', (job as any).id);
    console.log('  Credits charged:', costEstimate.total_cost);
    console.log('  Clips:', clips.length);
    console.log('  Mode:', sequence.composition_mode);

    return NextResponse.json({
      success: true,
      composition_job: job,
      credits_charged: costEstimate.total_cost,
      cost_breakdown: costEstimate.breakdown,
    }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/movie-mode/sequences/[id]/compose] Error:', error);
    return NextResponse.json(
      { error: 'Failed to trigger composition', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
