import { NextResponse } from 'next/server';
import emailTrackingService from '@/lib/emailTrackingService';
import Logger from '@/utils/Logger';

/**
 * Handle click tracking requests
 * GET /api/email/track/click/[trackingId]
 */
export async function GET(request, { params }) {
  try {
    const { trackingId } = params;
    
    // Extract tracking data from the encoded ID
    let trackingData;
    try {
      trackingData = JSON.parse(atob(trackingId));
    } catch (error) {
      Logger.warn('Invalid click tracking request:', { trackingId });
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Get client information from request
    const userAgent = request.headers.get('user-agent');
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ipAddress = forwardedFor?.split(',')[0] || realIp || 'unknown';

    // Track the email click
    await emailTrackingService.trackEmailClicked(trackingData.email_id || trackingData.message_id, {
      linkUrl: trackingData.original_url,
      linkText: trackingData.link_text,
      clickPosition: trackingData.link_index,
      userAgent,
      ipAddress
    });

    // Redirect to the original URL
    const originalUrl = trackingData.original_url;
    if (originalUrl && isValidUrl(originalUrl)) {
      return NextResponse.redirect(originalUrl);
    } else {
      Logger.warn('Invalid original URL in tracking data:', { originalUrl });
      return NextResponse.redirect(new URL('/', request.url));
    }
  } catch (error) {
    Logger.error('Error processing click tracking:', error);
    
    // Redirect to home page on error
    return NextResponse.redirect(new URL('/', request.url));
  }
}

/**
 * Helper function to validate URLs
 */
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}