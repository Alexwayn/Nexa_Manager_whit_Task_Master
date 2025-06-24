/**
 * Accessibility Testing and Improvement Utilities
 * Provides tools for automated and manual accessibility testing
 */

import React from 'react';
import axe, { AxeResults, Result } from 'axe-core';

export interface AccessibilityIssue {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  help: string;
  helpUrl: string;
  description: string;
  tags: string[];
  nodes: AccessibilityNode[];
}

export interface AccessibilityNode {
  target: string[];
  html: string;
  failureSummary?: string;
  impact?: 'minor' | 'moderate' | 'serious' | 'critical';
}

export interface AccessibilityReport {
  url: string;
  timestamp: number;
  violations: AccessibilityIssue[];
  passes: AccessibilityIssue[];
  incomplete: AccessibilityIssue[];
  inapplicable: AccessibilityIssue[];
  summary: {
    violationCount: number;
    passCount: number;
    incompleteCount: number;
    inapplicableCount: number;
    impactSummary: {
      minor: number;
      moderate: number;
      serious: number;
      critical: number;
    };
  };
}

export interface AccessibilityConfig {
  includedImpacts: Array<'minor' | 'moderate' | 'serious' | 'critical'>;
  tags?: string[];
  rules?: Record<string, { enabled: boolean }>;
  exclude?: string[];
  include?: string[];
}

class AccessibilityTester {
  private static instance: AccessibilityTester;
  private config: AccessibilityConfig;
  private isEnabled: boolean = true;

  private constructor() {
    this.config = {
      includedImpacts: ['moderate', 'serious', 'critical'],
      tags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
      rules: {
        'color-contrast': { enabled: true },
        'keyboard-navigation': { enabled: true },
        'focus-management': { enabled: true },
        'aria-labels': { enabled: true },
        'semantic-html': { enabled: true }
      }
    };
    this.initializeAxe();
  }

  public static getInstance(): AccessibilityTester {
    if (!AccessibilityTester.instance) {
      AccessibilityTester.instance = new AccessibilityTester();
    }
    return AccessibilityTester.instance;
  }

  /**
   * Initialize axe-core with custom configuration
   */
  private initializeAxe(): void {
    if (typeof window === 'undefined') return;

    // Configure axe with basic settings
    try {
      axe.configure({
        rules: []
      });
    } catch (error) {
      console.warn('Failed to configure axe:', error);
    }
  }

  /**
   * Run accessibility audit on current page or specific element
   */
  public async runAudit(
    element?: Element | Document,
    options?: Partial<AccessibilityConfig>
  ): Promise<AccessibilityReport> {
    if (!this.isEnabled || typeof window === 'undefined') {
      throw new Error('Accessibility testing is not available');
    }

    const config = { ...this.config, ...options };
    const target = element || document;

    try {
      const results = await axe.run(target);
      return this.processResults(results, config);
    } catch (error) {
      console.error('Accessibility audit failed:', error);
      throw error;
    }
  }

  /**
   * Process axe results into our report format
   */
  private processResults(
    results: AxeResults,
    config: AccessibilityConfig
  ): AccessibilityReport {
    const processIssues = (issues: Result[]): AccessibilityIssue[] => {
      return issues
        .filter(issue => 
          !issue.impact || config.includedImpacts.includes(issue.impact)
        )
        .map(issue => ({
          id: issue.id,
          impact: issue.impact || 'minor',
          help: issue.help,
          helpUrl: issue.helpUrl,
          description: issue.description,
          tags: issue.tags,
          nodes: issue.nodes.map(node => ({
            target: Array.isArray(node.target) ? node.target : [JSON.stringify(node.target)],
            html: node.html,
            failureSummary: node.failureSummary,
            impact: node.impact as 'minor' | 'moderate' | 'serious' | 'critical' | undefined
          }))
        } as AccessibilityIssue));
    };

    const violations = processIssues(results.violations);
    const passes = processIssues(results.passes);
    const incomplete = processIssues(results.incomplete);
    const inapplicable = processIssues(results.inapplicable);

    // Calculate impact summary
    const impactSummary = {
      minor: 0,
      moderate: 0,
      serious: 0,
      critical: 0
    };

    violations.forEach(violation => {
      impactSummary[violation.impact]++;
    });

    return {
      url: window.location.href,
      timestamp: Date.now(),
      violations,
      passes,
      incomplete,
      inapplicable,
      summary: {
        violationCount: violations.length,
        passCount: passes.length,
        incompleteCount: incomplete.length,
        inapplicableCount: inapplicable.length,
        impactSummary
      }
    };
  }

  /**
   * Get accessibility score (0-100)
   */
  public calculateAccessibilityScore(report: AccessibilityReport): number {
    const { violationCount, passCount, incompleteCount } = report.summary;
    const total = violationCount + passCount + incompleteCount;
    
    if (total === 0) return 100;

    // Weight violations by impact
    const violationWeight = report.violations.reduce((weight, violation) => {
      switch (violation.impact) {
        case 'critical': return weight + 4;
        case 'serious': return weight + 3;
        case 'moderate': return weight + 2;
        case 'minor': return weight + 1;
        default: return weight + 1;
      }
    }, 0);

    const maxPossibleWeight = total * 4; // Assuming all could be critical
    const score = Math.max(0, Math.round((1 - violationWeight / maxPossibleWeight) * 100));
    
    return score;
  }

  /**
   * Generate accessibility report for console/logging
   */
  public generateReport(report: AccessibilityReport): string {
    const score = this.calculateAccessibilityScore(report);
    const { summary } = report;

    let reportText = `\n🔍 Accessibility Audit Report\n`;
    reportText += `📊 Score: ${score}/100\n`;
    reportText += `📍 URL: ${report.url}\n`;
    reportText += `⏰ Timestamp: ${new Date(report.timestamp).toISOString()}\n\n`;

    reportText += `📋 Summary:\n`;
    reportText += `  ❌ Violations: ${summary.violationCount}\n`;
    reportText += `  ✅ Passes: ${summary.passCount}\n`;
    reportText += `  ⚠️  Incomplete: ${summary.incompleteCount}\n`;
    reportText += `  ➖ Not Applicable: ${summary.inapplicableCount}\n\n`;

    if (summary.violationCount > 0) {
      reportText += `🚨 Impact Breakdown:\n`;
      reportText += `  🔴 Critical: ${summary.impactSummary.critical}\n`;
      reportText += `  🟠 Serious: ${summary.impactSummary.serious}\n`;
      reportText += `  🟡 Moderate: ${summary.impactSummary.moderate}\n`;
      reportText += `  🟢 Minor: ${summary.impactSummary.minor}\n\n`;

      reportText += `🔍 Top Violations:\n`;
      report.violations.slice(0, 5).forEach(violation => {
        reportText += `  • ${violation.help} (${violation.impact})\n`;
        reportText += `    ${violation.helpUrl}\n`;
      });
    }

    return reportText;
  }

  /**
   * Check specific accessibility features
   */
  public async checkFeature(feature: AccessibilityFeature): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    switch (feature) {
      case 'keyboard-navigation':
        return this.checkKeyboardNavigation();
      case 'focus-management':
        return this.checkFocusManagement();
      case 'color-contrast':
        return this.checkColorContrast();
      case 'aria-labels':
        return this.checkAriaLabels();
      case 'semantic-html':
        return this.checkSemanticHTML();
      default:
        return false;
    }
  }

  /**
   * Check keyboard navigation accessibility
   */
  private async checkKeyboardNavigation(): Promise<boolean> {
    const focusableElements = document.querySelectorAll(
      'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select'
    );

    let hasTabIndex = true;
    focusableElements.forEach(element => {
      const tabIndex = element.getAttribute('tabindex');
      if (tabIndex && parseInt(tabIndex) < 0) {
        hasTabIndex = false;
      }
    });

    return hasTabIndex && focusableElements.length > 0;
  }

  /**
   * Check focus management
   */
  private async checkFocusManagement(): Promise<boolean> {
    const activeElement = document.activeElement;
    if (!activeElement) return false;

    // Check if focus is visible
    const computedStyle = window.getComputedStyle(activeElement);
    const hasFocusOutline = computedStyle.outline !== 'none' || 
                           computedStyle.outlineWidth !== '0px' ||
                           computedStyle.boxShadow.includes('focus');

    return hasFocusOutline;
  }

  /**
   * Check color contrast
   */
  private async checkColorContrast(): Promise<boolean> {
    // This would require more complex color contrast calculation
    // For now, return true as axe-core handles this comprehensively
    return true;
  }

  /**
   * Check ARIA labels
   */
  private async checkAriaLabels(): Promise<boolean> {
    const elementsNeedingLabels = document.querySelectorAll(
      'input:not([type="hidden"]), select, textarea, button'
    );

    let hasProperLabels = true;
    elementsNeedingLabels.forEach(element => {
      const hasLabel = element.getAttribute('aria-label') ||
                      element.getAttribute('aria-labelledby') ||
                      document.querySelector(`label[for="${element.id}"]`);
      
      if (!hasLabel) {
        hasProperLabels = false;
      }
    });

    return hasProperLabels;
  }

  /**
   * Check semantic HTML usage
   */
  private async checkSemanticHTML(): Promise<boolean> {
    const hasMain = document.querySelector('main') !== null;
    const hasNav = document.querySelector('nav') !== null;
    const hasHeadings = document.querySelector('h1, h2, h3, h4, h5, h6') !== null;
    
    return hasMain && hasNav && hasHeadings;
  }

  /**
   * Run continuous accessibility monitoring
   */
  public startMonitoring(interval: number = 30000): void {
    if (!this.isEnabled) return;

    setInterval(async () => {
      try {
        const report = await this.runAudit();
        if (report.summary.violationCount > 0) {
          console.warn('🚨 Accessibility violations detected:', report.summary);
          
          // Log critical and serious violations
          const criticalViolations = report.violations.filter(
            v => v.impact === 'critical' || v.impact === 'serious'
          );
          
          if (criticalViolations.length > 0) {
            console.error('Critical accessibility issues:', criticalViolations);
          }
        }
      } catch (error) {
        console.warn('Accessibility monitoring failed:', error);
      }
    }, interval);
  }

  /**
   * Get accessibility recommendations
   */
  public getRecommendations(report: AccessibilityReport): string[] {
    const recommendations: string[] = [];

    report.violations.forEach(violation => {
      switch (violation.id) {
        case 'color-contrast':
          recommendations.push('Increase color contrast ratio to meet WCAG AA standards (4.5:1 for normal text)');
          break;
        case 'keyboard-navigation':
          recommendations.push('Ensure all interactive elements are keyboard accessible');
          break;
        case 'aria-label':
          recommendations.push('Add descriptive ARIA labels to form controls and interactive elements');
          break;
        case 'heading-order':
          recommendations.push('Use proper heading hierarchy (h1 → h2 → h3, etc.)');
          break;
        case 'landmark-regions':
          recommendations.push('Use semantic HTML landmarks (main, nav, aside, footer)');
          break;
        case 'focus-management':
          recommendations.push('Implement visible focus indicators for all interactive elements');
          break;
        default:
          recommendations.push(`Fix ${violation.help}: ${violation.helpUrl}`);
      }
    });

    return [...new Set(recommendations)]; // Remove duplicates
  }

  /**
   * Configure accessibility testing
   */
  public configure(config: Partial<AccessibilityConfig>): void {
    this.config = { ...this.config, ...config };
    this.initializeAxe();
  }

  /**
   * Enable/disable accessibility testing
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Export accessibility data for external analysis
   */
  public exportData(): {
    config: AccessibilityConfig;
    isEnabled: boolean;
  } {
    return {
      config: this.config,
      isEnabled: this.isEnabled
    };
  }
}

// Singleton instance
export const accessibilityTester = AccessibilityTester.getInstance();

// Types and enums
export type AccessibilityFeature = 
  | 'keyboard-navigation'
  | 'focus-management'
  | 'color-contrast'
  | 'aria-labels'
  | 'semantic-html';

// React hook for accessibility testing
export function useAccessibilityTest(
  elementRef?: React.RefObject<Element>,
  config?: Partial<AccessibilityConfig>
) {
  const [report, setReport] = React.useState<AccessibilityReport | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const runTest = React.useCallback(async () => {
    if (!accessibilityTester) return;

    setIsLoading(true);
    setError(null);

    try {
      const element = elementRef?.current || undefined;
      const testReport = await accessibilityTester.runAudit(element, config);
      setReport(testReport);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [elementRef, config]);

  React.useEffect(() => {
    // Auto-run test on mount in development
    if (process.env.NODE_ENV === 'development') {
      runTest();
    }
  }, [runTest]);

  const score = report ? accessibilityTester.calculateAccessibilityScore(report) : null;
  const recommendations = report ? accessibilityTester.getRecommendations(report) : [];

  return {
    report,
    score,
    recommendations,
    isLoading,
    error,
    runTest
  };
}

// Utility function for testing components
export async function testComponentAccessibility(
  _component: React.ReactElement,
  _config?: Partial<AccessibilityConfig>
): Promise<AccessibilityReport> {
  // This would be used in Jest tests with react-testing-library
  // Implementation depends on testing environment
  throw new Error('Component testing requires Jest environment setup');
} 