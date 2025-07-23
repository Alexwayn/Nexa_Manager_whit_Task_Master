import { NextResponse } from 'next/server';
import emailAnalyticsService from '@/lib/emailAnalyticsService';
import { auth } from '@clerk/nextjs';
import Logger from '@/utils/Logger';

/**
 * Get email analytics dashboard data
 * GET /api/email/analytics/dashboard
 */
export async function GET(request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const options = {};
    if (dateFrom) options.dateFrom = dateFrom;
    if (dateTo) options.dateTo = dateTo;

    const result = await emailAnalyticsService.getDashboardAnalytics(userId, options);

    if (result.success) {
      return NextResponse.json(result.data);
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    Logger.error('Error getting dashboard analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Get specific analytics data
 * POST /api/email/analytics/dashboard
 */
export async function POST(request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, options = {} } = body;

    if (!type) {
      return NextResponse.json(
        { error: 'Missing required field: type' },
        { status: 400 }
      );
    }

    let result;

    switch (type) {
      case 'overview':
        result = await emailAnalyticsService.getEmailStatistics(userId, options);
        break;

      case 'activity':
        result = await emailAnalyticsService.getActivityMetrics(userId, options);
        break;

      case 'clients':
        result = await emailAnalyticsService.getClientCommunicationMetrics(userId, options);
        break;

      case 'performance':
        result = await emailAnalyticsService.getPerformanceMetrics(userId, options);
        break;

      case 'realtime':
        result = await emailAnalyticsService.getRealTimeMetrics(userId, options);
        break;

      case 'reports':
        result = await emailAnalyticsService.generateComprehensiveReport(userId, options);
        break;

      default:
        return NextResponse.json(
          { error: `Unsupported analytics type: ${type}` },
          { status: 400 }
        );
    }

    if (result.success) {
      return NextResponse.json(result.data);
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    Logger.error('Error getting analytics data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}