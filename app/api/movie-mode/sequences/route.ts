/**
 * Movie Mode Sequences API
 * Handles CRUD operations for video sequences
 */

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/database';
import type { VideoSequence, CreateSequenceRequest } from '@/types/movie-mode';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/movie-mode/sequences
 * List user's video sequences
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet_address = searchParams.get('wallet_address');
    const status = searchParams.get('status'); // Filter by status (optional)
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!wallet_address) {
      return NextResponse.json(
        { error: 'wallet_address parameter is required' },
        { status: 400 }
      );
    }

    // Build query with optional status filter
    let query;
    if (status) {
      query = sql`
        SELECT
          s.*,
          COUNT(c.id) as clip_count,
          j.status as composition_status,
          j.current_stage,
          j.error_message
        FROM video_sequences s
        LEFT JOIN video_sequence_clips c ON s.id = c.sequence_id
        LEFT JOIN video_composition_jobs j ON s.id = j.sequence_id
        WHERE s.wallet_address = ${wallet_address}
          AND s.status = ${status}
        GROUP BY s.id, j.id
        ORDER BY s.created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `;
    } else {
      query = sql`
        SELECT
          s.*,
          COUNT(c.id) as clip_count,
          j.status as composition_status,
          j.current_stage,
          j.error_message
        FROM video_sequences s
        LEFT JOIN video_sequence_clips c ON s.id = c.sequence_id
        LEFT JOIN video_composition_jobs j ON s.id = j.sequence_id
        WHERE s.wallet_address = ${wallet_address}
        GROUP BY s.id, j.id
        ORDER BY s.created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `;
    }

    const sequences = await query;

    // Get total count
    const countResult = status
      ? await sql`SELECT COUNT(*) as total FROM video_sequences WHERE wallet_address = ${wallet_address} AND status = ${status}`
      : await sql`SELECT COUNT(*) as total FROM video_sequences WHERE wallet_address = ${wallet_address}`;

    const total = Array.isArray(countResult) && countResult.length > 0
      ? parseInt((countResult[0] as any).total)
      : 0;

    return NextResponse.json({
      sequences,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('[GET /api/movie-mode/sequences] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sequences', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/movie-mode/sequences
 * Create a new video sequence
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateSequenceRequest & { wallet_address: string } = await request.json();

    const { wallet_address, name, collection_id, composition_mode, aspect_ratio } = body;

    // Validation
    if (!wallet_address) {
      return NextResponse.json({ error: 'wallet_address is required' }, { status: 400 });
    }

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    if (!composition_mode || !['simple', 'transitions'].includes(composition_mode)) {
      return NextResponse.json({ error: 'Invalid composition_mode. Must be "simple" or "transitions"' }, { status: 400 });
    }

    if (!aspect_ratio || !['16:9', '9:16', '1:1'].includes(aspect_ratio)) {
      return NextResponse.json({ error: 'Invalid aspect_ratio. Must be "16:9", "9:16", or "1:1"' }, { status: 400 });
    }

    // Create sequence
    const result = await sql`
      INSERT INTO video_sequences (
        wallet_address,
        name,
        collection_id,
        composition_mode,
        aspect_ratio,
        status
      )
      VALUES (
        ${wallet_address},
        ${name.trim()},
        ${collection_id || null},
        ${composition_mode},
        ${aspect_ratio},
        'draft'
      )
      RETURNING *
    `;

    const sequence = Array.isArray(result) && result.length > 0 ? result[0] : null;

    if (!sequence) {
      throw new Error('Failed to create sequence');
    }

    console.log('[POST /api/movie-mode/sequences] Created sequence:', (sequence as any).id);

    return NextResponse.json({ sequence }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/movie-mode/sequences] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create sequence', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
