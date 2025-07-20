import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  PlayIcon,
  DocumentTextIcon,
  EyeIcon,
  BellIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import {
  accessibilityTester,
  useAccessibilityTest,
  auditPageAccessibility,
  checkColorContrast,
  validateHeadingHierarchy,
  addSkipLinks,
  announceToScreenReader,
} from '../../utils/AccessibilityTester';

/**
 * AccessibilitySettings Component
 * Provides controls for all accessibility features including:
 * - High contrast mode
 * - Font size scaling
 * - Color blindness simulation
 * - Reduced motion preferences
 * - Contrast auditing tools
 */
const AccessibilitySettings = () => {
  const { t } = useTranslation('settings');
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [currentReport, setCurrentReport] = useState(null);
  const [monitoringEnabled, setMonitoringEnabled] = useState(false);
  const [alertsEnabled, setAlertsEnabled] = useState(false);
  const [testHistory, setTestHistory] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const contentRef = useRef(null);

  // Use the accessibility test hook
  const { report, isLoading, error, runTest } = useAccessibilityTest(contentRef);

  useEffect(() => {
    // Load saved settings
    const savedSettings = localStorage.getItem('accessibility-settings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setMonitoringEnabled(settings.monitoring || false);
      setAlertsEnabled(settings.alerts || false);
    }

    // Load test history
    const savedHistory = localStorage.getItem('accessibility-test-history');
    if (savedHistory) {
      setTestHistory(JSON.parse(savedHistory));
    }
  }, []);

  const saveSettings = newSettings => {
    localStorage.setItem('accessibility-settings', JSON.stringify(newSettings));
  };

  const runAccessibilityTest = async () => {
    setIsTestRunning(true);
    announceToScreenReader('Starting accessibility test', 'polite');

    try {
      const tester = accessibilityTester;
      const newReport = await tester.runAudit();
      setCurrentReport(newReport);

      // Add to history
      const newHistory = [newReport, ...testHistory.slice(0, 9)]; // Keep last 10 reports
      setTestHistory(newHistory);
      localStorage.setItem('accessibility-test-history', JSON.stringify(newHistory));

      announceToScreenReader(
        `Accessibility test completed. Found ${newReport.summary.violationCount} violations`,
        'polite',
      );
    } catch (error) {
      console.error('Accessibility test failed:', error);
      announceToScreenReader('Accessibility test failed', 'assertive');
    } finally {
      setIsTestRunning(false);
    }
  };

  const runQuickAudit = () => {
    const quickReport = auditPageAccessibility();
    setCurrentReport(quickReport);
    announceToScreenReader(
      `Quick audit completed. Overall score: ${quickReport.overallScore}%`,
      'polite',
    );
  };

  const toggleMonitoring = enabled => {
    setMonitoringEnabled(enabled);
    const settings = { monitoring: enabled, alerts: alertsEnabled };
    saveSettings(settings);

    const tester = accessibilityTester;
    if (enabled) {
      tester.startMonitoring(30000); // Check every 30 seconds
      announceToScreenReader('Accessibility monitoring enabled', 'polite');
    } else {
      announceToScreenReader('Accessibility monitoring disabled', 'polite');
    }
  };

  const toggleAlerts = enabled => {
    setAlertsEnabled(enabled);
    const settings = { monitoring: monitoringEnabled, alerts: enabled };
    saveSettings(settings);
    announceToScreenReader(`Accessibility alerts ${enabled ? 'enabled' : 'disabled'}`, 'polite');
  };

  const exportReport = () => {
    if (!currentReport) return;

    const dataStr = JSON.stringify(currentReport, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportFileDefaultName = `accessibility-report-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    announceToScreenReader('Accessibility report exported', 'polite');
  };

  const enhancePageAccessibility = () => {
    // Add skip links if not present
    addSkipLinks();

    // Check heading hierarchy
    const headingIssues = validateHeadingHierarchy();
    if (headingIssues.length > 0) {
      console.warn('Heading hierarchy issues:', headingIssues);
    }

    announceToScreenReader('Page accessibility enhancements applied', 'polite');
  };

  const getScoreColor = score => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = score => {
    if (score >= 90) return 'bg-green-100';
    if (score >= 70) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const formatTimestamp = timestamp => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div ref={contentRef} className='space-y-8'>
      {/* Header */}
      <div>
        <h3 className='text-lg font-medium text-gray-900 mb-2'>
          {t('accessibility.title', 'Accessibility Testing & Monitoring')}
        </h3>
        <p className='text-sm text-gray-600'>
          {t(
            'accessibility.description',
            'Monitor and improve the accessibility of your application with automated testing and real-time monitoring.',
          )}
        </p>
      </div>

      {/* Quick Actions */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <button
          onClick={runAccessibilityTest}
          disabled={isTestRunning}
          className='flex flex-col items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500'
        >
          <PlayIcon className='w-8 h-8 text-blue-600 mb-2' />
          <span className='text-sm font-medium text-blue-900'>
            {isTestRunning
              ? t('accessibility.testing', 'Testing...')
              : t('accessibility.runTest', 'Run Full Test')}
          </span>
        </button>

        <button
          onClick={runQuickAudit}
          className='flex flex-col items-center p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500'
        >
          <EyeIcon className='w-8 h-8 text-green-600 mb-2' />
          <span className='text-sm font-medium text-green-900'>
            {t('accessibility.quickAudit', 'Quick Audit')}
          </span>
        </button>

        <button
          onClick={enhancePageAccessibility}
          className='flex flex-col items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500'
        >
          <CheckCircleIcon className='w-8 h-8 text-purple-600 mb-2' />
          <span className='text-sm font-medium text-purple-900'>
            {t('accessibility.enhance', 'Enhance Page')}
          </span>
        </button>

        <button
          onClick={exportReport}
          disabled={!currentReport}
          className='flex flex-col items-center p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed'
        >
          <ArrowDownTrayIcon className='w-8 h-8 text-gray-600 mb-2' />
          <span className='text-sm font-medium text-gray-900'>
            {t('accessibility.export', 'Export Report')}
          </span>
        </button>
      </div>

      {/* Settings */}
      <div className='bg-white p-6 rounded-lg border border-gray-200'>
        <h4 className='text-md font-medium text-gray-900 mb-4'>
          {t('accessibility.settings', 'Monitoring Settings')}
        </h4>

        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div>
              <label className='text-sm font-medium text-gray-700'>
                {t('accessibility.realTimeMonitoring', 'Real-time Monitoring')}
              </label>
              <p className='text-xs text-gray-500'>
                {t('accessibility.monitoringDesc', 'Continuously monitor accessibility issues')}
              </p>
            </div>
            <button
              onClick={() => toggleMonitoring(!monitoringEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                monitoringEnabled ? 'bg-blue-600' : 'bg-gray-200'
              }`}
              role='switch'
              aria-checked={monitoringEnabled}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  monitoringEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className='flex items-center justify-between'>
            <div>
              <label className='text-sm font-medium text-gray-700'>
                {t('accessibility.alerts', 'Accessibility Alerts')}
              </label>
              <p className='text-xs text-gray-500'>
                {t('accessibility.alertsDesc', 'Get notified when issues are detected')}
              </p>
            </div>
            <button
              onClick={() => toggleAlerts(!alertsEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                alertsEnabled ? 'bg-blue-600' : 'bg-gray-200'
              }`}
              role='switch'
              aria-checked={alertsEnabled}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  alertsEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Current Report */}
      {currentReport && (
        <div className='bg-white p-6 rounded-lg border border-gray-200'>
          <div className='flex items-center justify-between mb-4'>
            <h4 className='text-md font-medium text-gray-900'>
              {t('accessibility.latestReport', 'Latest Accessibility Report')}
            </h4>
            <span className='text-xs text-gray-500'>
              {formatTimestamp(currentReport.timestamp)}
            </span>
          </div>

          {/* Score Overview */}
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
            <div className={`p-4 rounded-lg ${getScoreBgColor(currentReport.overallScore || 0)}`}>
              <div className='text-center'>
                <div
                  className={`text-2xl font-bold ${getScoreColor(currentReport.overallScore || 0)}`}
                >
                  {currentReport.overallScore || 0}%
                </div>
                <div className='text-sm text-gray-600'>Overall Score</div>
              </div>
            </div>

            <div className='p-4 rounded-lg bg-red-50'>
              <div className='text-center'>
                <div className='text-2xl font-bold text-red-600'>
                  {currentReport.summary?.violationCount || currentReport.totalIssues || 0}
                </div>
                <div className='text-sm text-gray-600'>Violations</div>
              </div>
            </div>

            <div className='p-4 rounded-lg bg-green-50'>
              <div className='text-center'>
                <div className='text-2xl font-bold text-green-600'>
                  {currentReport.summary?.passCount || 0}
                </div>
                <div className='text-sm text-gray-600'>Passes</div>
              </div>
            </div>

            <div className='p-4 rounded-lg bg-yellow-50'>
              <div className='text-center'>
                <div className='text-2xl font-bold text-yellow-600'>
                  {currentReport.summary?.incompleteCount || 0}
                </div>
                <div className='text-sm text-gray-600'>Incomplete</div>
              </div>
            </div>
          </div>

          {/* Issues List */}
          {currentReport.violations && currentReport.violations.length > 0 && (
            <div>
              <h5 className='text-sm font-medium text-gray-900 mb-3'>Critical Issues</h5>
              <div className='space-y-3'>
                {currentReport.violations.slice(0, 5).map((violation, index) => (
                  <div key={index} className='p-3 bg-red-50 rounded-md border border-red-200'>
                    <div className='flex items-start'>
                      <XCircleIcon className='w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0' />
                      <div className='flex-1'>
                        <p className='text-sm font-medium text-red-900'>{violation.help}</p>
                        <p className='text-xs text-red-700 mt-1'>{violation.description}</p>
                        <div className='flex items-center mt-2'>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              violation.impact === 'critical'
                                ? 'bg-red-100 text-red-800'
                                : violation.impact === 'serious'
                                  ? 'bg-orange-100 text-orange-800'
                                  : violation.impact === 'moderate'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {violation.impact}
                          </span>
                          <span className='text-xs text-red-600 ml-2'>
                            {violation.nodes?.length || 0} elements affected
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {currentReport.violations.length > 5 && (
                  <p className='text-sm text-gray-600 text-center'>
                    And {currentReport.violations.length - 5} more violations...
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Quick Fixes */}
          {currentReport.results && (
            <div className='mt-6'>
              <h5 className='text-sm font-medium text-gray-900 mb-3'>Quick Fixes Available</h5>
              <div className='space-y-2'>
                {currentReport.results.slice(0, 3).map((result, index) => (
                  <div key={index} className='p-3 bg-blue-50 rounded-md border border-blue-200'>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm text-blue-900'>
                        {result.suggestions?.[0] || 'Improvement suggestion available'}
                      </span>
                      <button className='text-xs text-blue-600 hover:text-blue-800 font-medium'>
                        Apply Fix
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Test History */}
      {testHistory.length > 0 && (
        <div className='bg-white p-6 rounded-lg border border-gray-200'>
          <h4 className='text-md font-medium text-gray-900 mb-4'>
            {t('accessibility.testHistory', 'Test History')}
          </h4>

          <div className='space-y-3'>
            {testHistory.slice(0, 5).map((historyReport, index) => (
              <div
                key={index}
                className='flex items-center justify-between p-3 bg-gray-50 rounded-md'
              >
                <div className='flex items-center'>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${getScoreBgColor(historyReport.overallScore || 0)}`}
                  >
                    <span
                      className={`text-xs font-medium ${getScoreColor(historyReport.overallScore || 0)}`}
                    >
                      {historyReport.overallScore || 0}
                    </span>
                  </div>
                  <div className='ml-3'>
                    <p className='text-sm font-medium text-gray-900'>
                      {formatTimestamp(historyReport.timestamp)}
                    </p>
                    <p className='text-xs text-gray-500'>
                      {historyReport.summary?.violationCount || historyReport.totalIssues || 0}{' '}
                      violations found
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setCurrentReport(historyReport)}
                  className='text-sm text-blue-600 hover:text-blue-800 font-medium'
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live Region for Screen Reader Announcements */}
      <div
        aria-live='polite'
        aria-atomic='true'
        className='sr-only'
        id='accessibility-announcements'
      />
    </div>
  );
};

export default AccessibilitySettings;
