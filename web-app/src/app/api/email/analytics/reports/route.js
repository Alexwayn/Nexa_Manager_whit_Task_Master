import { NextResponse } from 'next/server';
import emailAnalyticsService from '@/lib/emailAnalyticsService';
import { auth } from '@clerk/nextjs';
import Logger from '@/utils/Logger';

/**
 * Generate and download email reports
 * GET /api/email/analytics/reports?format=csv&type=comprehensive&dateFrom=xxx&dateTo=xxx
 */
export async function GET(request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    const type = searchParams.get('type') || 'comprehensive';
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const options = { format };
    if (dateFrom) options.dateFrom = dateFrom;
    if (dateTo) options.dateTo = dateTo;

    let result;

    switch (type) {
      case 'comprehensive':
        result = await emailAnalyticsService.generateComprehensiveReport(userId, options);
        break;

      case 'usage':
        result = await emailAnalyticsService.getUsageReports(userId, options);
        break;

      case 'performance':
        result = await emailAnalyticsService.getPerformanceMetrics(userId, options);
        break;

      case 'clients':
        result = await emailAnalyticsService.getClientCommunicationMetrics(userId, options);
        break;

      default:
        return NextResponse.json(
          { error: `Unsupported report type: ${type}` },
          { status: 400 }
        );
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    // Handle different formats
    if (format === 'csv') {
      const csvData = convertToCSV(result.data, type);
      return new NextResponse(csvData, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="email-${type}-report-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    } else if (format === 'pdf') {
      // For PDF generation, you would typically use a library like puppeteer or jsPDF
      // For now, return JSON with a note
      return NextResponse.json({
        message: 'PDF generation not implemented yet',
        data: result.data
      });
    } else {
      // Return JSON
      return NextResponse.json(result.data);
    }
  } catch (error) {
    Logger.error('Error generating email report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Convert data to CSV format
 */
function convertToCSV(data, reportType) {
  try {
    switch (reportType) {
      case 'comprehensive':
        return convertComprehensiveReportToCSV(data);
      case 'usage':
        return convertUsageReportToCSV(data);
      case 'performance':
        return convertPerformanceReportToCSV(data);
      case 'clients':
        return convertClientReportToCSV(data);
      default:
        return convertGenericToCSV(data);
    }
  } catch (error) {
    Logger.error('Error converting to CSV:', error);
    return 'Error generating CSV report';
  }
}

function convertComprehensiveReportToCSV(data) {
  const lines = [];
  
  // Header
  lines.push('Email Analytics Report');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');
  
  // Overview metrics
  lines.push('OVERVIEW METRICS');
  lines.push('Metric,Value');
  lines.push(`Total Emails,${data.overview?.totalEmails || 0}`);
  lines.push(`Emails Sent,${data.overview?.emailsSent || 0}`);
  lines.push(`Emails Received,${data.overview?.emailsReceived || 0}`);
  lines.push(`Open Rate,${data.overview?.openRate || 0}%`);
  lines.push(`Click Rate,${data.overview?.clickRate || 0}%`);
  lines.push(`Response Rate,${data.overview?.responseRate || 0}%`);
  lines.push('');
  
  // Performance metrics
  if (data.performance) {
    lines.push('PERFORMANCE METRICS');
    lines.push('Template,Delivery Rate,Open Rate,Click Rate,Response Rate');
    
    if (data.performance.templatePerformance) {
      data.performance.templatePerformance.forEach(template => {
        lines.push(`${template.template_name},${template.delivery_rate}%,${template.open_rate}%,${template.click_rate}%,${template.response_rate}%`);
      });
    }
    lines.push('');
  }
  
  return lines.join('\n');
}

function convertUsageReportToCSV(data) {
  const lines = [];
  
  lines.push('Email Usage Report');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');
  
  if (data.groupedUsage) {
    lines.push('USAGE BY PERIOD');
    lines.push('Period,Emails Sent,Emails Received,Storage Used');
    
    data.groupedUsage.forEach(usage => {
      lines.push(`${usage.period},${usage.emails_sent},${usage.emails_received},${usage.storage_used}`);
    });
  }
  
  return lines.join('\n');
}

function convertPerformanceReportToCSV(data) {
  const lines = [];
  
  lines.push('Email Performance Report');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');
  
  if (data.templatePerformance) {
    lines.push('TEMPLATE PERFORMANCE');
    lines.push('Template Name,Total Sent,Delivery Rate,Open Rate,Click Rate,Response Rate');
    
    data.templatePerformance.forEach(template => {
      lines.push(`${template.template_name},${template.total_sent},${template.delivery_rate}%,${template.open_rate}%,${template.click_rate}%,${template.response_rate}%`);
    });
  }
  
  return lines.join('\n');
}

function convertClientReportToCSV(data) {
  const lines = [];
  
  lines.push('Client Communication Report');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');
  
  if (data.topClients) {
    lines.push('TOP CLIENTS BY EMAIL VOLUME');
    lines.push('Client Name,Emails Sent,Emails Received,Engagement Score,Last Contact');
    
    data.topClients.forEach(client => {
      lines.push(`${client.client_name},${client.total_emails_sent},${client.total_emails_received},${client.engagement_score},${client.last_email_sent}`);
    });
  }
  
  return lines.join('\n');
}

function convertGenericToCSV(data) {
  if (Array.isArray(data) && data.length > 0) {
    const headers = Object.keys(data[0]);
    const lines = [headers.join(',')];
    
    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      });
      lines.push(values.join(','));
    });
    
    return lines.join('\n');
  }
  
  return 'No data available';
}
