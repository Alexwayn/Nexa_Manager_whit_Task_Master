import { NextResponse } from 'next/server';
import emailTrackingService from '@/lib/emailTrackingService';
import Logger from '@/utils/Logger';

/**
 * Handle tracking pixel requests for email opens
 * GET /api/email/track/pixel/[trackingId]
 */
export async function GET(request, { params }) {
  try {
    const { trackingId } = params;
    
    // Extract tracking data from the encoded ID
    let trackingData;
    try {
      trackingData = JSON.parse(atob(trackingId.replace('.png', '')));
    } catch (error) {
      Logger.warn('Invalid tracking pixel request:', { trackingId });
      return new NextResponse('Invalid tracking ID', { status: 400 });
    }

    // Get client information from request
    const userAgent = request.headers.get('user-agent');
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ipAddress = forwardedFor?.split(',')[0] || realIp || 'unknown';

    // Track the email open
    await emailTrackingService.trackEmailOpened(trackingData.email_id || trackingData.message_id, {
      userAgent,
      ipAddress,
      firstOpen: true,
      deviceType: getDeviceType(userAgent),
      emailClient: getEmailClient(userAgent)
    });

    // Return a 1x1 transparent pixel
    const pixel = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    );

    return new NextResponse(pixel, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Length': pixel.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    Logger.error('Error processing tracking pixel:', error);
    
    // Still return a pixel even on error to avoid broken images
    const pixel = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    );

    return new NextResponse(pixel, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Length': pixel.length.toString()
      }
    });
  }
}

/**
 * Helper function to detect device type from user agent
 */
function getDeviceType(userAgent) {
  if (!userAgent) return 'unknown';
  
  const ua = userAgent.toLowerCase();
  
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return 'mobile';
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    return 'tablet';
  } else {
    return 'desktop';
  }
}

/**
 * Helper function to detect email client from user agent
 */
function getEmailClient(userAgent) {
  if (!userAgent) return 'unknown';
  
  const ua = userAgent.toLowerCase();
  
  if (ua.includes('outlook')) return 'outlook';
  if (ua.includes('thunderbird')) return 'thunderbird';
  if (ua.includes('apple mail') || ua.includes('mail/')) return 'apple_mail';
  if (ua.includes('gmail')) return 'gmail';
  if (ua.includes('yahoo')) return 'yahoo';
  
  return 'unknown';
}