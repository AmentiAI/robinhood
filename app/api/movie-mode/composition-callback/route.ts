/**
 * Movie Mode Composition Callback
 * Receives Kie AI callbacks for transition video generation
 */

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/database';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/movie-mode/composition-callback
 * Handle Kie AI callback for transition generation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log('[Composition Callback] Received callback:', JSON.stringify(body, null, 2));

    // Kie AI callback format:
    // {
    //   code: 200,
    //   msg: "success",
    //   data: {
    //     taskId: "...",
    //     successFlag: 1,  // 0=processing, 1=success, 2+=failure
    //     response: {
    //       resultUrls: ["video_url"],
    //       originUrls: ["reference_url"],
    //       resolution: "1080p"
    //     }
    //   }
    // }

    const { data } = body;

    if (!data || !data.taskId) {
      console.error('[Composition Callback] Invalid callback - missing taskId');
      return NextResponse.json({ error: 'Invalid callback data' }, { status: 400 });
    }

    const { taskId, successFlag, response } = data;

    // Find composition job with this taskId
    const jobResult = await sql`
      SELECT * FROM video_composition_jobs
      WHERE kie_ai_task_ids::jsonb ? ${taskId}
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const job = Array.isArray(jobResult) && jobResult.length > 0 ? jobResult[0] as any : null;

    if (!job) {
      console.log(`[Composition Callback] No job found for taskId: ${taskId}`);
      return NextResponse.json({ error: 'Job not found for this taskId' }, { status: 404 });
    }

    console.log(`[Composition Callback] Processing callback for job: ${job.id}`);

    // Handle success
    if (successFlag === 1) {
      const videoUrl = response?.resultUrls?.[0];

      if (!videoUrl) {
        console.error('[Composition Callback] Success but no video URL in response');
        // Don't fail the job yet, might be a temporary issue
        return NextResponse.json({ received: true });
      }

      console.log(`[Composition Callback] Transition video ready: ${videoUrl}`);
      console.log(`[Composition Callback] TaskId: ${taskId}`);

      // Store transition video URL
      // Note: In full implementation, we'd update a transitions table or job metadata
      // For now, we'll just log it and let the cron job handle composition

      return NextResponse.json({ received: true, status: 'completed' });
    }

    // Handle failure
    if (successFlag >= 2) {
      const errorMessage = response?.message || 'Transition generation failed';
      console.error(`[Composition Callback] Transition failed for taskId ${taskId}:`, errorMessage);

      // Mark job as failed
      await sql`
        UPDATE video_composition_jobs
        SET
          status = 'failed',
          error_message = ${`Transition generation failed: ${errorMessage}`},
          completed_at = CURRENT_TIMESTAMP
        WHERE id = ${job.id}::uuid
      `;

      await sql`
        UPDATE video_sequences
        SET status = 'failed'
        WHERE id = ${job.sequence_id}::uuid
      `;

      // Restore credits
      const { addCredits } = await import('@/lib/credits/credits');
      await addCredits(
        job.wallet_address,
        job.credits_charged,
        'video_composition_refund',
        { job_id: job.id, sequence_id: job.sequence_id, reason: errorMessage }
      );

      return NextResponse.json({ received: true, status: 'failed' });
    }

    // Still processing
    console.log(`[Composition Callback] Transition still processing for taskId: ${taskId}`);
    return NextResponse.json({ received: true, status: 'processing' });
  } catch (error) {
    console.error('[Composition Callback] Error processing callback:', error);
    return NextResponse.json(
      { error: 'Failed to process callback', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
