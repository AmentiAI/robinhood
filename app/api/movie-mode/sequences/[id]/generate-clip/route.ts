/**
 * Movie Mode - Generate Clip API
 * Generates a new video clip directly in Movie Mode with automatic frame continuity
 *
 * KEY FEATURE: Automatically uses the last frame of the previous clip as a reference image
 * to ensure visual continuity between scenes.
 */

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/database';
import { deductCredits } from '@/lib/credits/credits';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for video generation

/**
 * POST /api/movie-mode/sequences/[id]/generate-clip
 *
 * Generates a new clip for the sequence
 * - For the FIRST clip: User can optionally provide reference images or generate from prompt only
 * - For SUBSEQUENT clips: Automatically uses last frame of previous clip as reference
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sequenceId } = await params;
    const body = await request.json();

    const {
      wallet_address,
      video_scene,
      video_actions,
      video_speech,
      reference_images, // Optional for first clip only
      transition_type = 'none',
      transition_duration = 0.5,
    } = body;

    // Validation
    if (!wallet_address) {
      return NextResponse.json({ error: 'wallet_address is required' }, { status: 400 });
    }

    if (!video_scene || !video_actions) {
      return NextResponse.json({
        error: 'video_scene and video_actions are required',
      }, { status: 400 });
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

    // Don't allow generation if sequence is processing
    if (sequence.status === 'processing') {
      return NextResponse.json({
        error: 'Cannot generate clips while sequence is being composed',
      }, { status: 400 });
    }

    // Get existing clips to determine order and previous frame
    const clipsResult = await sql`
      SELECT
        c.*,
        pj.image_url as video_url
      FROM video_sequence_clips c
      LEFT JOIN promotion_jobs pj ON c.promotion_job_id = pj.id
      WHERE c.sequence_id = ${sequenceId}::uuid
      ORDER BY c.clip_order DESC
      LIMIT 1
    `;

    const lastClip = Array.isArray(clipsResult) && clipsResult.length > 0
      ? clipsResult[0] as any
      : null;

    const nextClipOrder = lastClip ? lastClip.clip_order + 1 : 0;
    const isFirstClip = !lastClip;

    // Build reference images array
    let finalReferenceImages: string[] = [];

    if (isFirstClip) {
      // First clip: Use user-provided reference images (if any)
      if (reference_images && Array.isArray(reference_images)) {
        finalReferenceImages = reference_images;
      }
    } else {
      // Subsequent clips: AUTOMATICALLY use last frame of previous clip
      const previousFrameUrl = lastClip.last_frame_url;

      if (!previousFrameUrl) {
        return NextResponse.json({
          error: 'Previous clip has no last frame extracted. Please wait for frame extraction to complete.',
        }, { status: 400 });
      }

      finalReferenceImages = [previousFrameUrl];

      console.log('[generate-clip] Using automatic continuity from previous clip:', {
        sequenceId,
        previousClipOrder: lastClip.clip_order,
        previousFrameUrl,
      });
    }

    // Deduct credits (4 credits per video clip)
    const creditCost = 4;
    const deductResult = await deductCredits(
      wallet_address,
      creditCost,
      'video_generation',
      {
        sequence_id: sequenceId,
        clip_order: nextClipOrder,
        is_first_clip: isFirstClip,
        has_automatic_continuity: !isFirstClip,
      }
    );

    if (!deductResult.success) {
      return NextResponse.json(
        { error: deductResult.message || 'Insufficient credits' },
        { status: 402 }
      );
    }

    // Create promotion job for video generation
    const subjectActions = {
      content_type: 'video',
      video_scene,
      video_actions,
      video_speech: video_speech || '',
      aspect_ratio: sequence.aspect_ratio,
      reference_images: finalReferenceImages,
    };

    // Insert promotion job
    const jobResult = await sql`
      INSERT INTO promotion_jobs (
        wallet_address,
        status,
        subject_actions
      )
      VALUES (
        ${wallet_address},
        'pending',
        ${JSON.stringify(subjectActions)}
      )
      RETURNING *
    `;

    const promotionJob = Array.isArray(jobResult) && jobResult.length > 0
      ? jobResult[0] as any
      : null;

    if (!promotionJob) {
      // Refund credits if job creation failed
      await deductCredits(wallet_address, -creditCost, 'refund', {
        reason: 'Failed to create promotion job',
      });
      throw new Error('Failed to create promotion job');
    }

    // Call Kie AI to generate video
    const kieApiKey = process.env.KIE_AI_API_KEY;
    if (!kieApiKey) {
      // Refund credits
      await deductCredits(wallet_address, -creditCost, 'refund', {
        reason: 'KIE_AI_API_KEY not configured',
      });
      throw new Error('KIE_AI_API_KEY not configured');
    }

    const callbackUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/promotion/kie-ai-callback`;

    const kiePayload: any = {
      prompt: `${video_scene}. ${video_actions}${video_speech ? '. ' + video_speech : ''}`,
      model: 'veo3_fast',
      callBackUrl: callbackUrl,
      enableTranslation: true,
      aspectRatio: sequence.aspect_ratio,
    };

    // Add reference images if present (for continuity)
    if (finalReferenceImages.length > 0) {
      kiePayload.generationType = 'REFERENCE_2_VIDEO';
      kiePayload.imageUrls = finalReferenceImages;
    } else {
      kiePayload.generationType = 'PROMPT_2_VIDEO';
    }

    console.log('[generate-clip] Calling Kie AI:', {
      promotionJobId: promotionJob.id,
      sequenceId,
      clipOrder: nextClipOrder,
      generationType: kiePayload.generationType,
      hasReferenceImages: finalReferenceImages.length > 0,
      aspectRatio: sequence.aspect_ratio,
    });

    const kieResponse = await fetch('https://api.kie.ai/api/v1/veo/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${kieApiKey}`,
      },
      body: JSON.stringify(kiePayload),
    });

    if (!kieResponse.ok) {
      const errorData = await kieResponse.json().catch(() => ({ message: kieResponse.statusText }));
      console.error('[generate-clip] Kie AI error:', errorData);

      // Refund credits
      await deductCredits(wallet_address, -creditCost, 'refund', {
        reason: 'Kie AI API error',
        error: errorData.message,
      });

      throw new Error(`Kie AI error: ${errorData.message || kieResponse.statusText}`);
    }

    const kieData = await kieResponse.json();
    const taskId = kieData.data?.taskId;

    if (!taskId) {
      // Refund credits
      await deductCredits(wallet_address, -creditCost, 'refund', {
        reason: 'No taskId from Kie AI',
      });
      throw new Error('Kie AI did not return a taskId');
    }

    // Update promotion job with task ID and mark as processing
    await sql`
      UPDATE promotion_jobs
      SET
        kie_ai_task_id = ${taskId},
        status = 'processing',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${promotionJob.id}::uuid
    `;

    // Add clip to sequence
    const clipResult = await sql`
      INSERT INTO video_sequence_clips (
        sequence_id,
        promotion_job_id,
        clip_order,
        transition_type,
        transition_duration
      )
      VALUES (
        ${sequenceId}::uuid,
        ${promotionJob.id}::uuid,
        ${nextClipOrder},
        ${transition_type},
        ${transition_duration}
      )
      RETURNING *
    `;

    const clip = Array.isArray(clipResult) && clipResult.length > 0
      ? clipResult[0]
      : null;

    // Update sequence updated_at
    await sql`
      UPDATE video_sequences
      SET updated_at = CURRENT_TIMESTAMP
      WHERE id = ${sequenceId}::uuid
    `;

    console.log('[generate-clip] Clip generation started:', {
      sequenceId,
      clipId: clip?.id,
      clipOrder: nextClipOrder,
      promotionJobId: promotionJob.id,
      taskId,
      automaticContinuity: !isFirstClip,
    });

    return NextResponse.json({
      success: true,
      promotion_job: promotionJob,
      clip,
      task_id: taskId,
      clip_order: nextClipOrder,
      automatic_continuity: !isFirstClip,
      message: isFirstClip
        ? 'First clip generation started'
        : 'Clip generation started with automatic continuity from previous clip',
    }, { status: 201 });

  } catch (error) {
    console.error('[POST /api/movie-mode/sequences/[id]/generate-clip] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate clip',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
