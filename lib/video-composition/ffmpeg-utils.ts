/**
 * Video Frame Extraction and Manipulation Utilities
 * Uses Cloudinary API to avoid FFmpeg dependency on Vercel
 */

import { put } from '@vercel/blob';

/**
 * Extract the last frame from a video using Cloudinary
 * @param videoUrl - URL of the video
 * @returns URL of the extracted frame image
 */
export async function extractLastFrame(videoUrl: string): Promise<string> {
  try {
    // Use Cloudinary transformation to extract last frame
    // fl_get_frame:duration_p99 gets frame at 99% of video duration (effectively last frame)

    // If video is already on Cloudinary, we can transform it directly
    if (videoUrl.includes('cloudinary.com')) {
      // Parse Cloudinary URL and insert transformation
      const lastFrameUrl = videoUrl.replace('/upload/', '/upload/fl_get_frame:duration_p99/');
      return lastFrameUrl;
    }

    // If video is external (like Kie AI), we need to fetch and extract
    // For now, return a placeholder - will implement full extraction in Phase 3
    console.log('[extractLastFrame] External video detected, using fallback method:', videoUrl);

    // Fallback: Use Cloudinary fetch + transformation
    const cloudinaryBaseUrl = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
      ? `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/video/upload`
      : null;

    if (!cloudinaryBaseUrl) {
      throw new Error('Cloudinary cloud name not configured');
    }

    // Use Cloudinary fetch API to extract frame from external video
    const transformedUrl = `${cloudinaryBaseUrl}/fl_get_frame:duration_p99/${encodeURIComponent(videoUrl)}`;

    // Download the extracted frame and upload to Vercel Blob
    const response = await fetch(transformedUrl);
    if (!response.ok) {
      throw new Error(`Failed to extract frame: ${response.statusText}`);
    }

    const blob = await response.blob();
    const filename = `frame-${Date.now()}.jpg`;

    const uploadedBlob = await put(filename, blob, {
      access: 'public',
      addRandomSuffix: true,
    });

    return uploadedBlob.url;
  } catch (error) {
    console.error('[extractLastFrame] Error extracting last frame:', error);
    throw new Error(`Failed to extract last frame: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract a frame at a specific timestamp from a video
 * @param videoUrl - URL of the video
 * @param timestamp - Timestamp in seconds
 * @returns URL of the extracted frame image
 */
export async function extractFrameAtTimestamp(videoUrl: string, timestamp: number): Promise<string> {
  try {
    // Use Cloudinary transformation to extract frame at specific time
    const cloudinaryBaseUrl = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
      ? `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/video/upload`
      : null;

    if (!cloudinaryBaseUrl) {
      throw new Error('Cloudinary cloud name not configured');
    }

    // Extract frame at specific timestamp
    const transformedUrl = `${cloudinaryBaseUrl}/so_${timestamp}/${encodeURIComponent(videoUrl)}`;

    // Download and upload to Vercel Blob
    const response = await fetch(transformedUrl);
    if (!response.ok) {
      throw new Error(`Failed to extract frame: ${response.statusText}`);
    }

    const blob = await response.blob();
    const filename = `frame-${timestamp}s-${Date.now()}.jpg`;

    const uploadedBlob = await put(filename, blob, {
      access: 'public',
      addRandomSuffix: true,
    });

    return uploadedBlob.url;
  } catch (error) {
    console.error('[extractFrameAtTimestamp] Error:', error);
    throw new Error(`Failed to extract frame at ${timestamp}s: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get video duration using Cloudinary API
 * Note: This is a placeholder - actual implementation would use Cloudinary Admin API
 * @param videoUrl - URL of the video
 * @returns Duration in seconds
 */
export async function getVideoDuration(videoUrl: string): Promise<number> {
  try {
    // For videos from Kie AI, we'll need to fetch metadata
    // This is a simplified version - in production, use Cloudinary Admin API or video metadata API

    // Placeholder: assume 5 seconds per video (typical Kie AI Veo 3.1 output)
    // TODO: Implement proper duration detection
    console.log('[getVideoDuration] Estimating duration for:', videoUrl);
    return 5; // Default 5 seconds
  } catch (error) {
    console.error('[getVideoDuration] Error:', error);
    return 5; // Fallback to 5 seconds
  }
}

/**
 * Concatenate multiple videos using Cloudinary Video API
 * @param videoUrls - Array of video URLs to concatenate
 * @param transitionType - Type of transition (currently supports 'none', 'fade', 'dissolve')
 * @returns URL of the composed video
 */
export async function concatenateVideos(
  videoUrls: string[],
  transitionType: 'none' | 'fade' | 'dissolve' | 'cut' = 'none'
): Promise<string> {
  try {
    if (videoUrls.length === 0) {
      throw new Error('No videos provided for concatenation');
    }

    if (videoUrls.length === 1) {
      return videoUrls[0]; // Single video, no concatenation needed
    }

    // Use Cloudinary Video API for concatenation
    const cloudinaryCloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const cloudinaryApiKey = process.env.CLOUDINARY_API_KEY;
    const cloudinaryApiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudinaryCloudName || !cloudinaryApiKey || !cloudinaryApiSecret) {
      throw new Error('Cloudinary credentials not configured. Please set CLOUDINARY environment variables.');
    }

    // Build Cloudinary splice transformation
    // Example: fl_splice,l_video:my_video2/fl_layer_apply,so_5/l_video:my_video3/fl_layer_apply,so_10

    // For now, return a placeholder URL
    // TODO: Implement actual Cloudinary Video API concatenation
    console.log('[concatenateVideos] Concatenating videos:', videoUrls.length, 'with transition:', transitionType);

    throw new Error('Video concatenation not yet implemented - requires Cloudinary Video API setup');
  } catch (error) {
    console.error('[concatenateVideos] Error:', error);
    throw new Error(`Failed to concatenate videos: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Download video from URL to local buffer
 * Useful for processing external videos
 * @param videoUrl - URL of the video to download
 * @returns Video as Blob
 */
export async function downloadVideo(videoUrl: string): Promise<Blob> {
  try {
    const response = await fetch(videoUrl);
    if (!response.ok) {
      throw new Error(`Failed to download video: ${response.statusText}`);
    }

    return await response.blob();
  } catch (error) {
    console.error('[downloadVideo] Error:', error);
    throw new Error(`Failed to download video: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Upload video blob to Vercel Blob storage
 * @param videoBlob - Video as Blob
 * @param filename - Optional filename
 * @returns URL of uploaded video
 */
export async function uploadVideoBlob(videoBlob: Blob, filename?: string): Promise<string> {
  try {
    const name = filename || `video-${Date.now()}.mp4`;

    const uploadedBlob = await put(name, videoBlob, {
      access: 'public',
      addRandomSuffix: true,
    });

    return uploadedBlob.url;
  } catch (error) {
    console.error('[uploadVideoBlob] Error:', error);
    throw new Error(`Failed to upload video: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
