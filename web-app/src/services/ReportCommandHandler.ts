import { reportingService } from '@shared/services';
import Logger from '@/utils/Logger';

/**
 * ReportCommandHandler - Handles voice commands for report generation and management
 * Supports revenue reports, client reports, tax reports, aging reports, and custom reports
 */

export const reportCommands = {
    // Revenue report commands
    'generate revenue report': { action: 'generateRevenue', type: 'revenue' },
    'create revenue report': { action: 'generateRevenue', type: 'revenue' },
    'revenue report': { action: 'generateRevenue', type: 'revenue' },
    'show revenue report': { action: 'generateRevenue', type: 'revenue' },
    'monthly revenue report': { action: 'generateRevenue', type: 'revenue', groupBy: 'monthly' },
    'weekly revenue report': { action: 'generateRevenue', type: 'revenue', groupBy: 'weekly' },
    'daily revenue report': { action: 'generateRevenue', type: 'revenue', groupBy: 'daily' },

    // Client report commands
    'generate client report': { action: 'generateClient', type: 'client' },
    'create client report': { action: 'generateClient', type: 'client' },
    'client report': { action: 'generateClient', type: 'client' },
    'client analytics': { action: 'generateClient', type: 'client' },
    'show client analytics': { action: 'generateClient', type: 'client' },

    // Tax report commands
    'generate tax report': { action: 'generateTax', type: 'tax' },
    'create tax report': { action: 'generateTax', type: 'tax' },
    'tax report': { action: 'generateTax', type: 'tax' },
    'show tax report': { action: 'generateTax', type: 'tax' },
    'tax analytics': { action: 'generateTax', type: 'tax' },

    // Aging report commands
    'generate aging report': { action: 'generateAging', type: 'aging' },
    'create aging report': { action: 'generateAging', type: 'aging' },
    'aging report': { action: 'generateAging', type: 'aging' },
    'overdue report': { action: 'generateAging', type: 'aging' },
    'show aging report': { action: 'generateAging', type: 'aging' },

    // Financial analytics commands
    'financial analytics': { action: 'getAnalytics', type: 'analytics' },
    'show financial analytics': { action: 'getAnalytics', type: 'analytics' },
    'financial dashboard': { action: 'getAnalytics', type: 'analytics' },
    'get financial overview': { action: 'getAnalytics', type: 'analytics' },

    // Forecast commands
    'financial forecast': { action: 'getForecast', type: 'forecast' },
    'cash flow forecast': { action: 'getForecast', type: 'forecast' },
    'show forecast': { action: 'getForecast', type: 'forecast' },
    'get forecast data': { action: 'getForecast', type: 'forecast' },

    // Custom report commands
    'create custom report': { action: 'generateCustom', type: 'custom' },
    'generate custom report': { action: 'generateCustom', type: 'custom' },
    'custom report': { action: 'generateCustom', type: 'custom' },

    // Report scheduling commands
    'schedule report': { action: 'scheduleReport', type: 'schedule' },
    'schedule revenue report': { action: 'scheduleReport', type: 'schedule', reportType: 'revenue' },
    'schedule client report': { action: 'scheduleReport', type: 'schedule', reportType: 'client' },
    'show scheduled reports': { action: 'getScheduled', type: 'scheduled' },
    'list scheduled reports': { action: 'getScheduled', type: 'scheduled' },

    // Export format commands
    'export as pdf': { action: 'setFormat', format: 'pdf' },
    'export as csv': { action: 'setFormat', format: 'csv' },
    'export as excel': { action: 'setFormat', format: 'excel' },
    'download pdf': { action: 'setFormat', format: 'pdf' },
    'download csv': { action: 'setFormat', format: 'csv' },

    // Navigation commands
    'go to reports': { action: 'navigate', destination: '/reports' },
    'open reports': { action: 'navigate', destination: '/reports' },
    'show reports': { action: 'navigate', destination: '/reports' },
    'reports page': { action: 'navigate', destination: '/reports' },
    'reports dashboard': { action: 'navigate', destination: '/reports' },
};

export const searchCommands = [
    'find report', 'search report', 'look for report', 'show me report',
    'get report', 'display report', 'view report'
];

export const helpCommands = [
    'report help', 'help with reports', 'report commands', 'what reports can I generate',
    'how to create report', 'report options', 'available reports'
];

export const allReportCommands = Object.keys(reportCommands);

export async function processReportCommand(command: string): Promise<any> {
    try {
      const normalizedCommand = command.toLowerCase().trim();
      
      // Check for exact matches first
      if (reportCommands[normalizedCommand]) {
        return await executeReportCommand(reportCommands[normalizedCommand], command);
      }

      // Check for partial matches
      const partialMatch = findPartialMatch(normalizedCommand);
      if (partialMatch) {
        return await executeReportCommand(partialMatch, command);
      }

      // Check for search commands
      const searchMatch = searchCommands.find(searchCmd => 
        normalizedCommand.includes(searchCmd)
      );
      if (searchMatch) {
        return handleSearchCommand(normalizedCommand);
      }

      // Check for help commands
      const helpMatch = helpCommands.find(helpCmd => 
        normalizedCommand.includes(helpCmd)
      );
      if (helpMatch) {
        return handleHelpCommand();
      }

      return {
        success: false,
        message: "I didn't understand that report command. Try saying 'report help' for available options."
      };

    } catch (error) {
      Logger.error('Error processing report command:', error);
      return {
        success: false,
        message: 'Sorry, there was an error processing your report command.'
      };
    }
  }

function findPartialMatch(command: string) {
    for (const [key, value] of Object.entries(reportCommands)) {
      if (command.includes(key) || key.includes(command)) {
        return value;
      }
    }
    return null;
  }

export async function executeReportCommand(commandConfig: any, originalCommand: string) {
    try {
      switch (commandConfig.action) {
        case 'generateRevenue':
          return await handleGenerateRevenue(commandConfig, originalCommand);
        
        case 'generateClient':
          return await handleGenerateClient(commandConfig, originalCommand);
        
        case 'generateTax':
          return await handleGenerateTax(commandConfig, originalCommand);
        
        case 'generateAging':
          return await handleGenerateAging(commandConfig, originalCommand);
        
        case 'getAnalytics':
          return await handleGetAnalytics();
        
        case 'getForecast':
          return await handleGetForecast();
        
        case 'generateCustom':
          return await handleGenerateCustom(originalCommand);
        
        case 'scheduleReport':
          return await handleScheduleReport(commandConfig, originalCommand);
        
        case 'getScheduled':
          return await handleGetScheduled();
        
        case 'navigate':
          return handleNavigation(commandConfig.destination);
        
        case 'setFormat':
          return handleSetFormat(commandConfig.format);
        
        default:
          return {
            success: false,
            message: 'Unknown report command action.'
          };
      }
    } catch (error) {
      Logger.error('Error executing report command:', error);
      return {
        success: false,
        message: 'Error executing report command.'
      };
    }
  }

  /**
   * Handle revenue report generation
   */
  async function handleGenerateRevenue(config: any, command: string) {
    try {
      // Extract date range from command if present
      const dateRange = extractDateRange(command);
      const format = extractFormat(command) || 'pdf';
      const groupBy = config.groupBy || extractGroupBy(command) || 'monthly';

      const result = await reportingService.generateRevenueReport(
        dateRange.startDate,
        dateRange.endDate,
        format,
        groupBy
      );

      if (result.success) {
        return {
          success: true,
          message: `Revenue report generated successfully in ${format.toUpperCase()} format.`,
          data: result,
          action: 'reportGenerated',
          reportType: 'revenue'
        };
      } else {
        return {
          success: false,
          message: `Failed to generate revenue report: ${String(result.error ?? 'Unknown error')}`
        };
      }
    } catch (error) {
      Logger.error('Error generating revenue report:', error);
      return {
        success: false,
        message: 'Error generating revenue report.'
      };
    }
  }

  /**
   * Handle client report generation
   */
  async function handleGenerateClient(config: any, command: string) {
    try {
      const dateRange = this.extractDateRange(command);
      const format = this.extractFormat(command) || 'pdf';

      const result = await reportingService.generateClientReport(
        dateRange.startDate,
        dateRange.endDate,
        format
      );

      if (result.success) {
        return {
          success: true,
          message: `Client analytics report generated successfully in ${format.toUpperCase()} format.`,
          data: result,
          action: 'reportGenerated',
          reportType: 'client'
        };
      } else {
        return {
          success: false,
          message: `Failed to generate client report: ${String(result.error ?? 'Unknown error')}`
        };
      }
    } catch (error) {
      Logger.error('Error generating client report:', error);
      return {
        success: false,
        message: 'Error generating client report.'
      };
    }
  }

  /**
   * Handle tax report generation
   */
  async function handleGenerateTax(config: any, command: string) {
    try {
      const dateRange = this.extractDateRange(command);
      const format = this.extractFormat(command) || 'pdf';

      const result = await reportingService.generateTaxReport(
        dateRange.startDate,
        dateRange.endDate,
        format
      );

      if (result.success) {
        return {
          success: true,
          message: `Tax report generated successfully in ${format.toUpperCase()} format.`,
          data: result,
          action: 'reportGenerated',
          reportType: 'tax'
        };
      } else {
        return {
          success: false,
          message: `Failed to generate tax report: ${String(result.error ?? 'Unknown error')}`
        };
      }
    } catch (error) {
      Logger.error('Error generating tax report:', error);
      return {
        success: false,
        message: 'Error generating tax report.'
      };
    }
  }

  /**
   * Handle aging report generation
   */
  async function handleGenerateAging(config: any, command: string) {
    try {
      const format = this.extractFormat(command) || 'pdf';

      const result = await reportingService.generateAgingReport(format);

      if (result.success) {
        return {
          success: true,
          message: `Aging report generated successfully in ${format.toUpperCase()} format.`,
          data: result,
          action: 'reportGenerated',
          reportType: 'aging'
        };
      } else {
        return {
          success: false,
          message: `Failed to generate aging report: ${String(result.error ?? 'Unknown error')}`
        };
      }
    } catch (error) {
      Logger.error('Error generating aging report:', error);
      return {
        success: false,
        message: 'Error generating aging report.'
      };
    }
  }

  /**
   * Handle financial analytics request
   */
  async function handleGetAnalytics() {
    try {
      const result = await reportingService.getFinancialAnalytics();

      if (result.success) {
        return {
          success: true,
          message: 'Financial analytics retrieved successfully.',
          data: result.data,
          action: 'analyticsRetrieved'
        };
      } else {
        return {
          success: false,
          message: `Failed to get financial analytics: ${String(result.error ?? 'Unknown error')}`
        };
      }
    } catch (error) {
      Logger.error('Error getting financial analytics:', error);
      return {
        success: false,
        message: 'Error retrieving financial analytics.'
      };
    }
  }

  /**
   * Handle forecast data request
   */
  async function handleGetForecast() {
    try {
      const result = await reportingService.getForecastData();

      if (result.success) {
        return {
          success: true,
          message: 'Forecast data retrieved successfully.',
          data: result.data,
          action: 'forecastRetrieved'
        };
      } else {
        return {
          success: false,
          message: `Failed to get forecast data: ${String(result.error ?? 'Unknown error')}`
        };
      }
    } catch (error) {
      Logger.error('Error getting forecast data:', error);
      return {
        success: false,
        message: 'Error retrieving forecast data.'
      };
    }
  }

  /**
   * Handle custom report generation
   */
  async function handleGenerateCustom(command: string) {
    try {
      // For custom reports, we'll need to guide the user through configuration
      return {
        success: true,
        message: 'To create a custom report, please specify the report type (revenue, client, or tax), date range, and format. For example: "Generate custom revenue report for last month in PDF format"',
        action: 'customReportPrompt'
      };
    } catch (error) {
      Logger.error('Error handling custom report:', error);
      return {
        success: false,
        message: 'Error setting up custom report.'
      };
    }
  }

  /**
   * Handle report scheduling
   */
  async function handleScheduleReport(config: any, command: string) {
    try {
      const reportType = config.reportType || extractReportType(command);
      const frequency = extractFrequency(command) || 'monthly';
      const format = this.extractFormat(command) || 'pdf';

      if (!reportType) {
        return {
          success: false,
          message: 'Please specify which type of report to schedule (revenue, client, tax, or aging).'
        };
      }

      const scheduleConfig = {
        reportType,
        format,
        frequency,
        email: 'user@example.com' // This should be extracted from user context
      };

      const result = await reportingService.scheduleReport(scheduleConfig);

      return {
        success: true,
        message: `${reportType} report scheduled successfully to run ${frequency}.`,
        data: result,
        action: 'reportScheduled'
      };
    } catch (error) {
      Logger.error('Error scheduling report:', error);
      return {
        success: false,
        message: 'Error scheduling report.'
      };
    }
  }

  /**
   * Handle getting scheduled reports
   */
  async function handleGetScheduled() {
    try {
      const result = await reportingService.getScheduledReports();

      const count = result?.length || 0;
      return {
        success: true,
        message: `Found ${count} scheduled report${count !== 1 ? 's' : ''}.`,
        data: result,
        action: 'scheduledReportsRetrieved'
      };
    } catch (error) {
      Logger.error('Error getting scheduled reports:', error);
      return {
        success: false,
        message: 'Error retrieving scheduled reports.'
      };
    }
  }

  /**
   * Handle navigation to reports page
   */
  function handleNavigation(destination: string) {
    return {
      success: true,
      message: `Navigating to ${destination}`,
      action: 'navigate',
      destination
    };
  }

  /**
   * Handle format setting
   */
  async function handleSetFormat(format: string) {
    if (!format) {
      return {
        success: false,
        message: 'No format specified. Please specify a format like PDF, CSV, or Excel.'
      };
    }
    return {
      success: true,
      message: `Export format set to ${format.toUpperCase()}`,
      action: 'formatSet',
      format: format
    };
  }

  /**
   * Handle search commands
   */
  function handleSearchCommand(command: string) {
    const searchTerm = command.replace(/find report|search report|look for report|show me report|get report|display report|view report/g, '').trim();
    
    return {
      success: true,
      message: searchTerm ? `Searching for reports related to: ${searchTerm}` : 'What type of report are you looking for?',
      action: 'searchReports',
      searchTerm
    };
  }

  /**
   * Handle help commands
   */
  function handleHelpCommand() {
    const helpMessage = `
Available report commands:
• "Generate revenue report" - Create revenue analytics
• "Generate client report" - Create client analytics  
• "Generate tax report" - Create tax compliance report
• "Generate aging report" - Create overdue invoice report
• "Financial analytics" - View financial dashboard
• "Cash flow forecast" - View forecast data
• "Schedule report" - Set up automatic reports
• "Show scheduled reports" - View scheduled reports
• "Go to reports" - Navigate to reports page

You can also specify:
• Format: "in PDF format", "as CSV", "as Excel"
• Time period: "for last month", "this year", "last quarter"
• Frequency: "daily", "weekly", "monthly" (for scheduling)
    `;

    return {
      success: true,
      message: helpMessage.trim(),
      action: 'helpProvided'
    };
  }

  // Utility methods for extracting information from commands

  function extractDateRange(command: string) {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    // Default to current month
    let startDate = new Date(currentYear, currentMonth, 1);
    let endDate = new Date(currentYear, currentMonth + 1, 0);

    if (command.includes('last month')) {
      startDate = new Date(currentYear, currentMonth - 1, 1);
      endDate = new Date(currentYear, currentMonth, 0);
    } else if (command.includes('this year')) {
      startDate = new Date(currentYear, 0, 1);
      endDate = new Date(currentYear, 11, 31);
    } else if (command.includes('last year')) {
      startDate = new Date(currentYear - 1, 0, 1);
      endDate = new Date(currentYear - 1, 11, 31);
    } else if (command.includes('last quarter')) {
      const quarterStart = Math.floor(currentMonth / 3) * 3 - 3;
      startDate = new Date(currentYear, quarterStart, 1);
      endDate = new Date(currentYear, quarterStart + 3, 0);
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  }

  function extractFormat(command: string): string | null {
    if (command.includes('pdf') || command.includes('PDF')) return 'pdf';
    if (command.includes('csv') || command.includes('CSV')) return 'csv';
    if (command.includes('excel') || command.includes('Excel')) return 'excel';
    return null;
  }

  function extractGroupBy(command: string): string | null {
    if (command.includes('daily')) return 'daily';
    if (command.includes('weekly')) return 'weekly';
    if (command.includes('monthly')) return 'monthly';
    return null;
  }

  function extractReportType(command: string): string | null {
    if (command.includes('revenue')) return 'revenue';
    if (command.includes('client')) return 'client';
    if (command.includes('tax')) return 'tax';
    if (command.includes('aging')) return 'aging';
    return null;
  }

  function extractFrequency(command: string): string | null {
    if (command.includes('daily')) return 'daily';
    if (command.includes('weekly')) return 'weekly';
    if (command.includes('monthly')) return 'monthly';
    return null;
  }
