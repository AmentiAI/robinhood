/**
 * Movie Mode Individual Clip API
 * Handles UPDATE and DELETE for individual clips
 */

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/database';
import type { UpdateClipRequest } from '@/types/movie-mode';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * PUT /api/movie-mode/sequences/[id]/clips/[clipId]
 * Update clip (order, transition)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; clipId: string }> }
) {
  try {
    const { id: sequenceId, clipId } = await params;
    const body: UpdateClipRequest & { wallet_address: string } = await request.json();

    const { wallet_address, clip_order, transition_type, transition_duration } = body;

    if (!wallet_address) {
      return NextResponse.json({ error: 'wallet_address is required' }, { status: 400 });
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

    if (sequence.status === 'processing') {
      return NextResponse.json({ error: 'Cannot update clips while sequence is processing' }, { status: 400 });
    }

    // Get current clip
    const clipResult = await sql`
      SELECT * FROM video_sequence_clips
      WHERE id = ${clipId}::uuid AND sequence_id = ${sequenceId}::uuid
    `;

    if (!Array.isArray(clipResult) || clipResult.length === 0) {
      return NextResponse.json({ error: 'Clip not found' }, { status: 404 });
    }

    const currentClip = clipResult[0] as any;

    // Handle clip reordering if clip_order changed
    if (clip_order !== undefined && clip_order !== currentClip.clip_order) {
      // Shift clips between old and new positions
      if (clip_order > currentClip.clip_order) {
        // Moving forward: shift clips backward
        await sql`
          UPDATE video_sequence_clips
          SET clip_order = clip_order - 1
          WHERE sequence_id = ${sequenceId}::uuid
            AND clip_order > ${currentClip.clip_order}
            AND clip_order <= ${clip_order}
        `;
      } else {
        // Moving backward: shift clips forward
        await sql`
          UPDATE video_sequence_clips
          SET clip_order = clip_order + 1
          WHERE sequence_id = ${sequenceId}::uuid
            AND clip_order >= ${clip_order}
            AND clip_order < ${currentClip.clip_order}
        `;
      }
    }

    // Build update query
    const updates: string[] = [];
    const values: any[] = [];

    if (clip_order !== undefined) {
      updates.push('clip_order = $' + (values.length + 1));
      values.push(clip_order);
    }

    if (transition_type !== undefined) {
      if (!['none', 'fade', 'dissolve', 'cut', 'ai_transition'].includes(transition_type)) {
        return NextResponse.json({ error: 'Invalid transition_type' }, { status: 400 });
      }
      updates.push('transition_type = $' + (values.length + 1));
      values.push(transition_type);
    }

    if (transition_duration !== undefined) {
      updates.push('transition_duration = $' + (values.length + 1));
      values.push(transition_duration);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 });
    }

    // Execute update
    values.push(clipId);
    const updateQuery = `
      UPDATE video_sequence_clips
      SET ${updates.join(', ')}
      WHERE id = $${values.length}::uuid
      RETURNING *
    `;

    const result = await sql.unsafe(updateQuery, values);
    const updatedClip = Array.isArray(result) && result.length > 0 ? result[0] : null;

    // Update sequence updated_at
    await sql`
      UPDATE video_sequences
      SET updated_at = CURRENT_TIMESTAMP
      WHERE id = ${sequenceId}::uuid
    `;

    console.log('[PUT /api/movie-mode/sequences/[id]/clips/[clipId]] Updated clip:', clipId);

    return NextResponse.json({ clip: updatedClip });
  } catch (error) {
    console.error('[PUT /api/movie-mode/sequences/[id]/clips/[clipId]] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update clip', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/movie-mode/sequences/[id]/clips/[clipId]
 * Delete clip from sequence
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; clipId: string }> }
) {
  try {
    const { id: sequenceId, clipId } = await params;
    const { searchParams } = new URL(request.url);
    const wallet_address = searchParams.get('wallet_address');

    if (!wallet_address) {
      return NextResponse.json({ error: 'wallet_address parameter is required' }, { status: 400 });
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

    if (sequence.status === 'processing') {
      return NextResponse.json({ error: 'Cannot delete clips while sequence is processing' }, { status: 400 });
    }

    // Get clip to delete
    const clipResult = await sql`
      SELECT * FROM video_sequence_clips
      WHERE id = ${clipId}::uuid AND sequence_id = ${sequenceId}::uuid
    `;

    if (!Array.isArray(clipResult) || clipResult.length === 0) {
      return NextResponse.json({ error: 'Clip not found' }, { status: 404 });
    }

    const clip = clipResult[0] as any;

    // Delete clip
    await sql`
      DELETE FROM video_sequence_clips
      WHERE id = ${clipId}::uuid
    `;

    // Shift remaining clips to fill the gap
    await sql`
      UPDATE video_sequence_clips
      SET clip_order = clip_order - 1
      WHERE sequence_id = ${sequenceId}::uuid
        AND clip_order > ${clip.clip_order}
    `;

    // Update sequence updated_at
    await sql`
      UPDATE video_sequences
      SET updated_at = CURRENT_TIMESTAMP
      WHERE id = ${sequenceId}::uuid
    `;

    console.log('[DELETE /api/movie-mode/sequences/[id]/clips/[clipId]] Deleted clip:', clipId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/movie-mode/sequences/[id]/clips/[clipId]] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete clip', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
