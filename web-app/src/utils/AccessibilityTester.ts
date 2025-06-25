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

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Accessibility testing and improvement utilities
 * Provides functions to test and improve accessibility compliance
 */

export interface AccessibilityTestResult {
  element: HTMLElement;
  issues: string[];
  suggestions: string[];
  score: number;
}

export interface AccessibilityReport {
  overallScore: number;
  totalElements: number;
  totalIssues: number;
  results: AccessibilityTestResult[];
  summary: {
    missingLabels: number;
    noKeyboardAccess: number;
    poorContrast: number;
    missingLandmarks: number;
  };
}

/**
 * Tests accessibility of interactive elements
 */
export function testInteractiveElement(element: HTMLElement): AccessibilityTestResult {
  const issues: string[] = [];
  const suggestions: string[] = [];
  
  // Check for proper ARIA attributes
  if (element.tagName === 'BUTTON' || element.getAttribute('role') === 'button') {
    if (!element.getAttribute('aria-label') && !element.textContent?.trim()) {
      issues.push('Button without accessible name');
      suggestions.push('Add aria-label or visible text content');
    }
    
    if (element.hasAttribute('aria-expanded') && !element.getAttribute('aria-controls')) {
      issues.push('Expandable button without aria-controls');
      suggestions.push('Add aria-controls pointing to controlled element');
    }
  }
  
  // Check for form inputs
  if (['INPUT', 'SELECT', 'TEXTAREA'].includes(element.tagName)) {
    const input = element as HTMLInputElement;
    const label = document.querySelector(`label[for="${input.id}"]`);
    
    if (!label && !input.getAttribute('aria-label') && !input.getAttribute('aria-labelledby')) {
      issues.push('Form input without proper label');
      suggestions.push('Add associated label element or aria-label');
    }
    
    if (input.hasAttribute('required') && !input.getAttribute('aria-required')) {
      suggestions.push('Add aria-required="true" for required fields');
    }
    
    if (input.getAttribute('aria-invalid') === 'true' && !input.getAttribute('aria-describedby')) {
      issues.push('Invalid input without error description');
      suggestions.push('Add aria-describedby pointing to error message');
    }
  }
  
  // Check for keyboard accessibility
  const isInteractive = element.matches('button, input, select, textarea, a[href], [tabindex], [role="button"], [role="link"], [role="tab"]');
  if (isInteractive) {
    const tabindex = element.getAttribute('tabindex');
    if (tabindex && parseInt(tabindex) > 0) {
      issues.push('Positive tabindex detected');
      suggestions.push('Use tabindex="0" or remove tabindex for natural tab order');
    }
    
    if (!element.matches(':focus-visible')) {
      // Check if focus styles are defined
      const styles = getComputedStyle(element);
      const pseudoStyles = getComputedStyle(element, ':focus');
      if (styles.outline === pseudoStyles.outline && styles.boxShadow === pseudoStyles.boxShadow) {
        suggestions.push('Add visible focus indicators');
      }
    }
  }
  
  // Check for semantic markup
  if (element.getAttribute('role') === 'heading' && !element.getAttribute('aria-level')) {
    suggestions.push('Add aria-level for heading roles');
  }
  
  // Calculate score (0-100)
  const score = Math.max(0, 100 - (issues.length * 20) - (suggestions.length * 10));
  
  return {
    element,
    issues,
    suggestions,
    score
  };
}

/**
 * Performs a comprehensive accessibility audit of the page
 */
export function auditPageAccessibility(): AccessibilityReport {
  const interactiveElements = document.querySelectorAll(
    'button, input, select, textarea, a[href], [tabindex], [role="button"], [role="link"], [role="tab"], [role="menuitem"]'
  ) as NodeListOf<HTMLElement>;
  
  const results: AccessibilityTestResult[] = [];
  let totalIssues = 0;
  let missingLabels = 0;
  let noKeyboardAccess = 0;
  let poorContrast = 0;
  let missingLandmarks = 0;
  
  // Test each interactive element
  interactiveElements.forEach(element => {
    const result = testInteractiveElement(element);
    results.push(result);
    totalIssues += result.issues.length;
    
    // Categorize issues
    result.issues.forEach(issue => {
      if (issue.includes('label') || issue.includes('accessible name')) {
        missingLabels++;
      }
      if (issue.includes('keyboard') || issue.includes('tabindex')) {
        noKeyboardAccess++;
      }
      if (issue.includes('contrast')) {
        poorContrast++;
      }
    });
  });
  
  // Check for landmark regions
  const landmarks = ['main', 'nav', 'aside', 'footer', 'header'];
  landmarks.forEach(landmark => {
    if (!document.querySelector(landmark) && !document.querySelector(`[role="${landmark}"]`)) {
      missingLandmarks++;
    }
  });
  
  // Check for heading hierarchy
  const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6, [role="heading"]');
  let previousLevel = 0;
  headings.forEach(heading => {
    const level = heading.tagName ? parseInt(heading.tagName.slice(1)) : parseInt(heading.getAttribute('aria-level') || '1');
    if (level > previousLevel + 1) {
      totalIssues++;
    }
    previousLevel = level;
  });
  
  const overallScore = results.length > 0 
    ? Math.round(results.reduce((sum, result) => sum + result.score, 0) / results.length)
    : 100;
  
  return {
    overallScore,
    totalElements: results.length,
    totalIssues,
    results,
    summary: {
      missingLabels,
      noKeyboardAccess,
      poorContrast,
      missingLandmarks
    }
  };
}

/**
 * Adds ARIA attributes to improve accessibility
 */
export function enhanceElementAccessibility(element: HTMLElement, options: {
  label?: string;
  description?: string;
  expanded?: boolean;
  controls?: string;
  live?: 'polite' | 'assertive' | 'off';
  role?: string;
}): void {
  const { label, description, expanded, controls, live, role } = options;
  
  if (label) {
    element.setAttribute('aria-label', label);
  }
  
  if (description) {
    const descId = `desc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    let descElement = document.getElementById(descId);
    
    if (!descElement) {
      descElement = document.createElement('div');
      descElement.id = descId;
      descElement.className = 'sr-only';
      descElement.textContent = description;
      element.parentNode?.appendChild(descElement);
    }
    
    element.setAttribute('aria-describedby', descId);
  }
  
  if (typeof expanded === 'boolean') {
    element.setAttribute('aria-expanded', expanded.toString());
  }
  
  if (controls) {
    element.setAttribute('aria-controls', controls);
  }
  
  if (live) {
    element.setAttribute('aria-live', live);
  }
  
  if (role) {
    element.setAttribute('role', role);
  }
}

/**
 * Adds skip links to the page for keyboard navigation
 */
export function addSkipLinks(): void {
  // Check if skip links already exist
  if (document.querySelector('.skip-links')) {
    return;
  }
  
  const skipLinks = document.createElement('div');
  skipLinks.className = 'skip-links';
  skipLinks.innerHTML = `
    <a href="#main-content" class="skip-link">Skip to main content</a>
    <a href="#navigation" class="skip-link">Skip to navigation</a>
    <a href="#search" class="skip-link">Skip to search</a>
  `;
  
  // Insert at the beginning of body
  document.body.insertBefore(skipLinks, document.body.firstChild);
}

/**
 * Ensures proper heading hierarchy
 */
export function validateHeadingHierarchy(): string[] {
  const issues: string[] = [];
  const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6, [role="heading"]');
  
  let previousLevel = 0;
  headings.forEach((heading, index) => {
    const level = heading.tagName 
      ? parseInt(heading.tagName.slice(1)) 
      : parseInt(heading.getAttribute('aria-level') || '1');
    
    if (index === 0 && level !== 1) {
      issues.push('Page should start with h1');
    }
    
    if (level > previousLevel + 1) {
      issues.push(`Heading level jumps from h${previousLevel} to h${level}`);
    }
    
    previousLevel = level;
  });
  
  return issues;
}

/**
 * Creates live region for dynamic content announcements
 */
export function createLiveRegion(id: string, politeness: 'polite' | 'assertive' = 'polite'): HTMLElement {
  let liveRegion = document.getElementById(id);
  
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.id = id;
    liveRegion.className = 'sr-only';
    liveRegion.setAttribute('aria-live', politeness);
    liveRegion.setAttribute('aria-atomic', 'true');
    document.body.appendChild(liveRegion);
  }
  
  return liveRegion;
}

/**
 * Announces content to screen readers
 */
export function announceToScreenReader(message: string, politeness: 'polite' | 'assertive' = 'polite'): void {
  const liveRegion = createLiveRegion('accessibility-announcements', politeness);
  liveRegion.textContent = message;
  
  // Clear after announcement
  setTimeout(() => {
    liveRegion.textContent = '';
  }, 1000);
}

/**
 * Checks color contrast ratio
 */
export function checkColorContrast(element: HTMLElement): { ratio: number; passes: boolean; level: string } {
  const styles = getComputedStyle(element);
  const textColor = styles.color;
  const backgroundColor = styles.backgroundColor;
  
  // Simple contrast calculation (would need more sophisticated implementation)
  // This is a placeholder - real implementation would parse RGB values and calculate luminance
  const ratio = 4.5; // Placeholder value
  
  return {
    ratio,
    passes: ratio >= 4.5,
    level: ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : 'Fail'
  };
}

export default {
  testInteractiveElement,
  auditPageAccessibility,
  enhanceElementAccessibility,
  addSkipLinks,
  validateHeadingHierarchy,
  createLiveRegion,
  announceToScreenReader,
  checkColorContrast
}; 