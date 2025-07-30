/**
 * Business Email Integration Verification Script
 * Tests the integration between email management system and existing business services
 */

import getBusinessEmailIntegration from './businessEmailIntegration.js';
const businessEmailIntegration = getBusinessEmailIntegration();
import { InvoiceService } from '../../financial/services/invoiceService.js';
import { QuoteService } from '../../financial/services/quoteService.js';

import Logger from '@/utils/Logger';

class BusinessEmailIntegrationVerifier {
  constructor() {
    this.testResults = [];
    this.userId = 'test-user-id';
    this.clientId = 'test-client-id';
    this.invoiceId = 'test-invoice-id';
    this.quoteId = 'test-quote-id';
  }

  /**
   * Run all verification tests
   */
  async runAllTests() {
    console.log('🚀 Starting Business Email Integration Verification...\n');

    try {
      // Test 1: Invoice Email Integration
      await this.testInvoiceEmailIntegration();

      // Test 2: Quote Email Integration
      await this.testQuoteEmailIntegration();

      // Test 3: Client Email History
      await this.testClientEmailHistory();

      // Test 4: Email Activity Logging
      await this.testEmailActivityLogging();

      // Test 5: Business Email Analytics
      await this.testBusinessEmailAnalytics();

      // Test 6: Client Communication Summary
      await this.testClientCommunicationSummary();

      // Print results
      this.printResults();

    } catch (error) {
      console.error('❌ Verification failed:', error);
      Logger.error('Business email integration verification failed:', error);
    }
  }

  /**
   * Test invoice email integration
   */
  async testInvoiceEmailIntegration() {
    console.log('📧 Testing Invoice Email Integration...');

    try {
      // Test sending invoice email
      const emailResult = await businessEmailIntegration.sendInvoiceEmail(
        this.userId,
        this.invoiceId,
        'test@example.com',
        {
          templateId: 'invoice',
          customMessage: 'Test invoice email',
          useNewSystem: true,
        }
      );

      this.addTestResult('Invoice Email Sending', emailResult.success, emailResult.error);

      // Test payment reminder
      const reminderResult = await businessEmailIntegration.sendPaymentReminder(
        this.userId,
        this.invoiceId,
        'gentle',
        {
          customMessage: 'Test payment reminder',
        }
      );

      this.addTestResult('Payment Reminder', reminderResult.success, reminderResult.error);

      // Test invoice email history
      const historyResult = await InvoiceService.getInvoiceEmailHistory(this.invoiceId, this.userId);
      this.addTestResult('Invoice Email History', historyResult.success, historyResult.error);

    } catch (error) {
      this.addTestResult('Invoice Email Integration', false, error.message);
    }
  }

  /**
   * Test quote email integration
   */
  async testQuoteEmailIntegration() {
    console.log('📝 Testing Quote Email Integration...');

    try {
      // Test sending quote email
      const emailResult = await businessEmailIntegration.sendQuoteEmail(
        this.userId,
        this.quoteId,
        'test@example.com',
        {
          templateId: 'quote',
          customMessage: 'Test quote email',
          useNewSystem: true,
        }
      );

      this.addTestResult('Quote Email Sending', emailResult.success, emailResult.error);

      // Test quote reminder
      const reminderResult = await QuoteService.sendQuoteReminder(
        this.quoteId,
        this.userId,
        {
          customMessage: 'Test quote reminder',
        }
      );

      this.addTestResult('Quote Reminder', reminderResult.success, reminderResult.error);

      // Test quote email history
      const historyResult = await QuoteService.getQuoteEmailHistory(this.quoteId, this.userId);
      this.addTestResult('Quote Email History', historyResult.success, historyResult.error);

    } catch (error) {
      this.addTestResult('Quote Email Integration', false, error.message);
    }
  }

  /**
   * Test client email history functionality
   */
  async testClientEmailHistory() {
    console.log('👤 Testing Client Email History...');

    try {
      // Test getting client email history
      const clientEmailService = await businessEmailIntegration.getClientEmailService();
      const historyResult = await clientEmailService.getClientEmailHistory(
        this.userId,
        this.clientId,
        {
          limit: 10,
          type: ['invoice_sent', 'quote_sent'],
          includeDetails: true,
        }
      );

      this.addTestResult('Client Email History', historyResult.success, historyResult.error);

      // Test client email analytics
      const analyticsResult = await clientEmailService.getClientEmailAnalytics(
        this.userId,
        this.clientId
      );

      this.addTestResult('Client Email Analytics', analyticsResult.success, analyticsResult.error);

      // Test client email filters
      const filtersResult = await clientEmailService.getClientEmailFilters(
        this.userId,
        this.clientId
      );

      this.addTestResult('Client Email Filters', filtersResult.success, filtersResult.error);

    } catch (error) {
      this.addTestResult('Client Email History', false, error.message);
    }
  }

  /**
   * Test email activity logging
   */
  async testEmailActivityLogging() {
    console.log('📊 Testing Email Activity Logging...');

    try {
      // Test logging invoice email activity
      const businessEmailLogger = await businessEmailIntegration.getBusinessEmailLogger();
      const invoiceLogResult = await businessEmailLogger.logInvoiceEmail(
        this.userId,
        this.invoiceId,
        {
          type: 'invoice_sent',
          status: 'sent',
          recipientEmail: 'test@example.com',
          subject: 'Test Invoice Email',
          templateType: 'invoice',
          details: {
            test: true,
            invoice_number: 'TEST-001',
          },
        }
      );

      this.addTestResult('Invoice Email Logging', invoiceLogResult.success, invoiceLogResult.error);

      // Test logging quote email activity
      const quoteLogResult = await businessEmailLogger.logQuoteEmail(
        this.userId,
        this.quoteId,
        {
          type: 'quote_sent',
          status: 'sent',
          recipientEmail: 'test@example.com',
          subject: 'Test Quote Email',
          templateType: 'quote',
          details: {
            test: true,
            quote_number: 'QUO-001',
          },
        }
      );

      this.addTestResult('Quote Email Logging', quoteLogResult.success, quoteLogResult.error);

      // Test getting document email history
      const docHistoryResult = await businessEmailLogger.getDocumentEmailHistory(
        this.userId,
        'invoice',
        this.invoiceId
      );

      this.addTestResult('Document Email History', docHistoryResult.success, docHistoryResult.error);

    } catch (error) {
      this.addTestResult('Email Activity Logging', false, error.message);
    }
  }

  /**
   * Test business email analytics
   */
  async testBusinessEmailAnalytics() {
    console.log('📈 Testing Business Email Analytics...');

    try {
      // Test comprehensive business email analytics
      const historyResult = await businessEmailIntegration.getBusinessDocumentEmailAnalytics(
        this.userId,
        {
          dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Last 30 days
          documentType: null, // All document types
        }
      );

      this.addTestResult('Business Email Analytics', analyticsResult.success, analyticsResult.error);

      // Test client business email filters
      const filtersResult = await businessEmailIntegration.getClientBusinessEmailFilters(
        this.userId,
        this.clientId
      );

      this.addTestResult('Client Business Email Filters', filtersResult.success, filtersResult.error);

      // Test email statistics
      const statsResult = await businessEmailLogger.getEmailStatistics(
        this.userId,
        {
          dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        }
      );

      this.addTestResult('Email Statistics', statsResult.success, statsResult.error);

    } catch (error) {
      this.addTestResult('Business Email Analytics', false, error.message);
    }
  }

  /**
   * Test client communication summary
   */
  async testClientCommunicationSummary() {
    console.log('📋 Testing Client Communication Summary...');

    try {
      // Test invoice communication summary
      const invoiceSummaryResult = await InvoiceService.getClientInvoiceCommunicationSummary(
        this.clientId,
        this.userId
      );

      this.addTestResult('Invoice Communication Summary', invoiceSummaryResult.success, invoiceSummaryResult.error);

      // Test quote communication summary
      const quoteSummaryResult = await QuoteService.getClientQuoteCommunicationSummary(
        this.clientId,
        this.userId
      );

      this.addTestResult('Quote Communication Summary', quoteSummaryResult.success, quoteSummaryResult.error);

      // Test comprehensive client communication summary
      const clientSummaryResult = await clientEmailService.getClientCommunicationSummary(
        this.userId,
        this.clientId
      );

      this.addTestResult('Client Communication Summary', clientSummaryResult.success, clientSummaryResult.error);

    } catch (error) {
      this.addTestResult('Client Communication Summary', false, error.message);
    }
  }

  /**
   * Add test result
   */
  addTestResult(testName, success, error = null) {
    this.testResults.push({
      testName,
      success,
      error,
      timestamp: new Date().toISOString(),
    });

    const status = success ? '✅' : '❌';
    const errorMsg = error ? ` - ${error}` : '';
    console.log(`  ${status} ${testName}${errorMsg}`);
  }

  /**
   * Print final results
   */
  printResults() {
    console.log('\n📊 Business Email Integration Verification Results:');
    console.log('=' .repeat(60));

    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;

    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests} ✅`);
    console.log(`Failed: ${failedTests} ❌`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

    if (failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults
        .filter(r => !r.success)
        .forEach(result => {
          console.log(`  - ${result.testName}: ${result.error}`);
        });
    }

    console.log('\n🎉 Verification completed!');
  }
}

// Export for use in other modules
export default BusinessEmailIntegrationVerifier;

// Run verification if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const verifier = new BusinessEmailIntegrationVerifier();
  verifier.runAllTests().catch(console.error);
}