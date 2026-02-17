/**
 * Movie Mode Individual Sequence API
 * Handles GET, UPDATE, DELETE for a specific sequence
 */

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/database';
import type { UpdateSequenceRequest } from '@/types/movie-mode';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/movie-mode/sequences/[id]
 * Get sequence details with clips
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const wallet_address = searchParams.get('wallet_address');

    if (!wallet_address) {
      return NextResponse.json({ error: 'wallet_address parameter is required' }, { status: 400 });
    }

    // Get sequence
    const sequenceResult = await sql`
      SELECT * FROM video_sequences
      WHERE id = ${id}::uuid AND wallet_address = ${wallet_address}
    `;

    const sequence = Array.isArray(sequenceResult) && sequenceResult.length > 0
      ? sequenceResult[0]
      : null;

    if (!sequence) {
      return NextResponse.json({ error: 'Sequence not found' }, { status: 404 });
    }

    // Get clips with video details from promotion_jobs
    const clipsResult = await sql`
      SELECT
        c.*,
        pj.image_url as video_url,
        pj.subject_actions->>'aspect_ratio' as video_aspect_ratio
      FROM video_sequence_clips c
      LEFT JOIN promotion_jobs pj ON c.promotion_job_id = pj.id
      WHERE c.sequence_id = ${id}::uuid
      ORDER BY c.clip_order ASC
    `;

    const clips = Array.isArray(clipsResult) ? clipsResult : [];

    // Get composition job if exists
    const jobResult = await sql`
      SELECT * FROM video_composition_jobs
      WHERE sequence_id = ${id}::uuid
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const compositionJob = Array.isArray(jobResult) && jobResult.length > 0
      ? jobResult[0]
      : null;

    return NextResponse.json({
      sequence,
      clips,
      composition_job: compositionJob,
    });
  } catch (error) {
    console.error('[GET /api/movie-mode/sequences/[id]] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sequence', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/movie-mode/sequences/[id]
 * Update sequence (name, composition_mode)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: UpdateSequenceRequest & { wallet_address: string } = await request.json();

    const { wallet_address, name, composition_mode } = body;

    if (!wallet_address) {
      return NextResponse.json({ error: 'wallet_address is required' }, { status: 400 });
    }

    // Verify ownership
    const existingResult = await sql`
      SELECT * FROM video_sequences
      WHERE id = ${id}::uuid AND wallet_address = ${wallet_address}
    `;

    if (!Array.isArray(existingResult) || existingResult.length === 0) {
      return NextResponse.json({ error: 'Sequence not found' }, { status: 404 });
    }

    const existing = existingResult[0] as any;

    // Don't allow updates if sequence is processing or completed
    if (existing.status === 'processing') {
      return NextResponse.json({ error: 'Cannot update sequence while processing' }, { status: 400 });
    }

    // Build update query
    const updates: string[] = [];
    const values: any[] = [];

    if (name !== undefined && name.trim().length > 0) {
      updates.push('name = $' + (values.length + 1));
      values.push(name.trim());
    }

    if (composition_mode !== undefined) {
      if (!['simple', 'transitions'].includes(composition_mode)) {
        return NextResponse.json({ error: 'Invalid composition_mode' }, { status: 400 });
      }
      updates.push('composition_mode = $' + (values.length + 1));
      values.push(composition_mode);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');

    // Execute update
    values.push(id);
    const updateQuery = `
      UPDATE video_sequences
      SET ${updates.join(', ')}
      WHERE id = $${values.length}::uuid
      RETURNING *
    `;

    const result = await sql.unsafe(updateQuery, values);
    const updatedSequence = Array.isArray(result) && result.length > 0 ? result[0] : null;

    console.log('[PUT /api/movie-mode/sequences/[id]] Updated sequence:', id);

    return NextResponse.json({ sequence: updatedSequence });
  } catch (error) {
    console.error('[PUT /api/movie-mode/sequences/[id]] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update sequence', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/movie-mode/sequences/[id]
 * Delete sequence (and all clips via CASCADE)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const wallet_address = searchParams.get('wallet_address');

    if (!wallet_address) {
      return NextResponse.json({ error: 'wallet_address parameter is required' }, { status: 400 });
    }

    // Verify ownership
    const existingResult = await sql`
      SELECT * FROM video_sequences
      WHERE id = ${id}::uuid AND wallet_address = ${wallet_address}
    `;

    if (!Array.isArray(existingResult) || existingResult.length === 0) {
      return NextResponse.json({ error: 'Sequence not found' }, { status: 404 });
    }

    const existing = existingResult[0] as any;

    // Don't allow deletion if sequence is processing
    if (existing.status === 'processing') {
      return NextResponse.json({ error: 'Cannot delete sequence while processing' }, { status: 400 });
    }

    // Delete sequence (CASCADE will delete clips and composition jobs)
    await sql`
      DELETE FROM video_sequences
      WHERE id = ${id}::uuid
    `;

    console.log('[DELETE /api/movie-mode/sequences/[id]] Deleted sequence:', id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/movie-mode/sequences/[id]] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete sequence', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
