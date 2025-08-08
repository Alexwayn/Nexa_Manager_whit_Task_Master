import { NextResponse } from 'next/server';
import emailTrackingService from '@/lib/emailTrackingService';
import { auth } from '@clerk/nextjs';
import Logger from '@/utils/Logger';

/**
 * Track email events
 * POST /api/email/track/events
 */
export async function POST(request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { eventType, emailId, eventData } = body;

    if (!eventType || !emailId) {
      return NextResponse.json(
        { error: 'Missing required fields: eventType, emailId' },
        { status: 400 }
      );
    }

    let result;

    switch (eventType) {
      case 'sent':
        result = await emailTrackingService.trackEmailSent({
          userId,
          emailId,
          ...eventData
        });
        break;

      case 'opened':
        result = await emailTrackingService.trackEmailOpened(emailId, eventData);
        break;

      case 'clicked':
        result = await emailTrackingService.trackEmailClicked(emailId, eventData);
        break;

      case 'replied':
        result = await emailTrackingService.trackEmailReplied(emailId, eventData);
        break;

      case 'bounced':
        result = await emailTrackingService.trackEmailBounced(emailId, eventData);
        break;

      default:
        return NextResponse.json(
          { error: `Unsupported event type: ${eventType}` },
          { status: 400 }
        );
    }

    if (result.success) {
      return NextResponse.json({ success: true, message: 'Event tracked successfully' });
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    Logger.error('Error tracking email event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Get email tracking statistics
 * GET /api/email/track/events?emailId=xxx
 */
export async function GET(request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const emailId = searchParams.get('emailId');

    if (!emailId) {
      return NextResponse.json(
        { error: 'Missing required parameter: emailId' },
        { status: 400 }
      );
    }

    const result = await emailTrackingService.getEmailTrackingStats(emailId);

    if (result.success) {
      return NextResponse.json(result.data);
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    Logger.error('Error getting email tracking stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
