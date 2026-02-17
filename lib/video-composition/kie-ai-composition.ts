/**
 * Kie AI Video Composition Utilities
 * Uses Kie AI Veo 3.1 for AI-generated transitions between video clips
 */

/**
 * Generate an AI transition video between two frames using Kie AI Veo 3.1
 * Uses FIRST_AND_LAST_FRAMES_2_VIDEO generation type
 *
 * @param startFrameUrl - URL of the last frame from first video
 * @param endFrameUrl - URL of the first frame from second video (or specific frame)
 * @param prompt - Optional prompt to guide the transition
 * @param aspectRatio - Aspect ratio of the transition video
 * @param callbackUrl - URL for Kie AI to send completion callback
 * @returns Kie AI task ID for tracking
 */
export async function generateTransitionVideo(
  startFrameUrl: string,
  endFrameUrl: string,
  prompt?: string,
  aspectRatio: '16:9' | '9:16' = '16:9',
  callbackUrl?: string
): Promise<string> {
  try {
    const kieApiKey = process.env.KIE_AI_API_KEY;
    if (!kieApiKey) {
      throw new Error('KIE_AI_API_KEY environment variable not set');
    }

    // Build transition prompt
    const transitionPrompt = prompt ||
      'Smooth cinematic transition between the two frames, maintaining visual continuity, fluid camera movement';

    // Call Kie AI Veo 3.1 API with FIRST_AND_LAST_FRAMES_2_VIDEO mode
    const response = await fetch('https://api.kie.ai/api/v1/veo/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${kieApiKey}`,
      },
      body: JSON.stringify({
        prompt: transitionPrompt,
        imageUrls: [startFrameUrl, endFrameUrl],
        model: 'veo3_fast', // Use fast model for cost efficiency
        generationType: 'FIRST_AND_LAST_FRAMES_2_VIDEO',
        aspectRatio: aspectRatio,
        callBackUrl: callbackUrl,
        enableTranslation: true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`Kie AI API error: ${errorData.message || response.statusText}`);
    }

    const data = await response.json();

    if (!data.data?.taskId) {
      throw new Error('Kie AI API did not return a taskId');
    }

    console.log('[generateTransitionVideo] Transition generation started:', {
      taskId: data.data.taskId,
      startFrame: startFrameUrl,
      endFrame: endFrameUrl,
      aspectRatio,
    });

    return data.data.taskId;
  } catch (error) {
    console.error('[generateTransitionVideo] Error:', error);
    throw new Error(`Failed to generate transition video: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check the status of a Kie AI video generation task
 *
 * @param taskId - Kie AI task ID
 * @returns Task status and result URLs if completed
 */
export async function checkTransitionStatus(taskId: string): Promise<{
  status: 'processing' | 'completed' | 'failed';
  videoUrl?: string;
  errorMessage?: string;
}> {
  try {
    const kieApiKey = process.env.KIE_AI_API_KEY;
    if (!kieApiKey) {
      throw new Error('KIE_AI_API_KEY environment variable not set');
    }

    const response = await fetch(`https://api.kie.ai/api/v1/veo/record-info?taskId=${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${kieApiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Kie AI status check failed: ${response.statusText}`);
    }

    const data = await response.json();

    // Parse Kie AI response format
    // successFlag: 0 = processing, 1 = success, 2+ = failure
    if (!data.data) {
      return { status: 'processing' };
    }

    const successFlag = data.data.successFlag;

    if (successFlag === 0) {
      return { status: 'processing' };
    }

    if (successFlag === 1) {
      const videoUrl = data.data.response?.resultUrls?.[0];
      if (!videoUrl) {
        return { status: 'failed', errorMessage: 'No video URL in successful response' };
      }

      return { status: 'completed', videoUrl };
    }

    // successFlag 2+ means failure
    return {
      status: 'failed',
      errorMessage: data.data.response?.message || 'Unknown error from Kie AI',
    };
  } catch (error) {
    console.error('[checkTransitionStatus] Error:', error);
    return {
      status: 'failed',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate multiple transitions in parallel for a sequence
 *
 * @param framePairs - Array of {startFrame, endFrame} pairs
 * @param aspectRatio - Aspect ratio for all transitions
 * @param callbackUrl - Callback URL for completion notifications
 * @returns Array of Kie AI task IDs
 */
export async function generateMultipleTransitions(
  framePairs: Array<{ startFrame: string; endFrame: string; prompt?: string }>,
  aspectRatio: '16:9' | '9:16' = '16:9',
  callbackUrl?: string
): Promise<string[]> {
  try {
    const taskIds: string[] = [];

    // Generate transitions sequentially to avoid rate limiting
    // In production, could batch these with proper rate limiting
    for (const pair of framePairs) {
      const taskId = await generateTransitionVideo(
        pair.startFrame,
        pair.endFrame,
        pair.prompt,
        aspectRatio,
        callbackUrl
      );

      taskIds.push(taskId);

      // Small delay to avoid rate limiting
      if (framePairs.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log('[generateMultipleTransitions] Generated transitions:', taskIds.length);
    return taskIds;
  } catch (error) {
    console.error('[generateMultipleTransitions] Error:', error);
    throw new Error(`Failed to generate transitions: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Wait for all transition tasks to complete
 * Polls Kie AI API until all tasks are done
 *
 * @param taskIds - Array of Kie AI task IDs
 * @param maxWaitTime - Maximum time to wait in milliseconds (default: 10 minutes)
 * @returns Array of completed video URLs
 */
export async function waitForTransitions(
  taskIds: string[],
  maxWaitTime: number = 10 * 60 * 1000 // 10 minutes
): Promise<string[]> {
  const startTime = Date.now();
  const videoUrls: string[] = [];
  const completedTasks = new Set<string>();

  console.log('[waitForTransitions] Waiting for', taskIds.length, 'transitions...');

  while (completedTasks.size < taskIds.length) {
    // Check if timeout exceeded
    if (Date.now() - startTime > maxWaitTime) {
      throw new Error(`Transition generation timeout after ${maxWaitTime}ms`);
    }

    // Check status of pending tasks
    for (const taskId of taskIds) {
      if (completedTasks.has(taskId)) continue;

      const status = await checkTransitionStatus(taskId);

      if (status.status === 'completed' && status.videoUrl) {
        videoUrls.push(status.videoUrl);
        completedTasks.add(taskId);
        console.log('[waitForTransitions] Transition completed:', taskId, '→', status.videoUrl);
      } else if (status.status === 'failed') {
        throw new Error(`Transition failed for task ${taskId}: ${status.errorMessage}`);
      }
    }

    // If not all completed, wait before next check
    if (completedTasks.size < taskIds.length) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
    }
  }

  console.log('[waitForTransitions] All transitions completed:', videoUrls.length);
  return videoUrls;
}
