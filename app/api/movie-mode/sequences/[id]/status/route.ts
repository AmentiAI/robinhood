/**
 * Movie Mode Composition Status API
 * Get real-time status of a composition job
 */

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/database';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/movie-mode/sequences/[id]/status
 * Get composition status for a sequence
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sequenceId } = await params;
    const { searchParams } = new URL(request.url);
    const wallet_address = searchParams.get('wallet_address');

    if (!wallet_address) {
      return NextResponse.json({ error: 'wallet_address parameter is required' }, { status: 400 });
    }

    // Get sequence
    const sequenceResult = await sql`
      SELECT * FROM video_sequences
      WHERE id = ${sequenceId}::uuid AND wallet_address = ${wallet_address}
    `;

    if (!Array.isArray(sequenceResult) || sequenceResult.length === 0) {
      return NextResponse.json({ error: 'Sequence not found' }, { status: 404 });
    }

    const sequence = sequenceResult[0] as any;

    // Get latest composition job
    const jobResult = await sql`
      SELECT * FROM video_composition_jobs
      WHERE sequence_id = ${sequenceId}::uuid
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const compositionJob = Array.isArray(jobResult) && jobResult.length > 0
      ? jobResult[0]
      : null;

    // Get clips count
    const clipsCountResult = await sql`
      SELECT COUNT(*) as count FROM video_sequence_clips
      WHERE sequence_id = ${sequenceId}::uuid
    `;

    const clipsCount = Array.isArray(clipsCountResult) && clipsCountResult.length > 0
      ? parseInt((clipsCountResult[0] as any).count)
      : 0;

    // Calculate progress percentage
    let progressPercentage = 0;
    if (compositionJob) {
      const job = compositionJob as any;
      switch (job.status) {
        case 'pending':
          progressPercentage = 0;
          break;
        case 'extracting_frames':
          progressPercentage = 25;
          break;
        case 'generating_transitions':
          progressPercentage = 50;
          break;
        case 'composing':
          progressPercentage = 75;
          break;
        case 'completed':
          progressPercentage = 100;
          break;
        case 'failed':
          progressPercentage = 0;
          break;
      }
    }

    return NextResponse.json({
      sequence: {
        id: sequence.id,
        name: sequence.name,
        status: sequence.status,
        output_video_url: sequence.output_video_url,
        composition_mode: sequence.composition_mode,
        clip_count: clipsCount,
      },
      composition_job: compositionJob,
      progress: {
        percentage: progressPercentage,
        current_stage: compositionJob ? (compositionJob as any).current_stage : null,
        status: compositionJob ? (compositionJob as any).status : null,
      },
    });
  } catch (error) {
    console.error('[GET /api/movie-mode/sequences/[id]/status] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch composition status', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
