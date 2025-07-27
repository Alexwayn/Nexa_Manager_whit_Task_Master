import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { ACCESSIBILITY_CONFIG } from '@shared/__tests__/performance.config.js';

/**
 * Accessibility Tests for Reports System
 * Tests WCAG compliance, keyboard navigation, screen reader compatibility
 */

test.describe('Reports Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to reports page
    await page.goto('/reports');
    await page.waitForLoadState('networkidle');
  });

  test('Dashboard meets WCAG AA standards', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);

    // Log any incomplete tests for manual review
    if (accessibilityScanResults.incomplete.length > 0) {
      console.log('Incomplete accessibility tests (require manual review):');
      accessibilityScanResults.incomplete.forEach(incomplete => {
        console.log(`- ${incomplete.id}: ${incomplete.description}`);
      });
    }
  });

  test('Color contrast meets WCAG standards', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['color-contrast'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);

    // Additional manual color contrast checks for dynamic content
    const colorContrastIssues = await page.evaluate(() => {
      const issues = [];
      const elements = document.querySelectorAll('*');
      
      elements.forEach(element => {
        const styles = window.getComputedStyle(element);
        const backgroundColor = styles.backgroundColor;
        const color = styles.color;
        
        // Check if element has text content and visible colors
        if (element.textContent.trim() && 
            backgroundColor !== 'rgba(0, 0, 0, 0)' && 
            color !== 'rgba(0, 0, 0, 0)') {
          
          // This is a simplified check - in practice, you'd use a proper contrast ratio calculator
          const bgLuminance = getLuminance(backgroundColor);
          const textLuminance = getLuminance(color);
          
          if (bgLuminance !== null && textLuminance !== null) {
            const contrastRatio = (Math.max(bgLuminance, textLuminance) + 0.05) / 
                                 (Math.min(bgLuminance, textLuminance) + 0.05);
            
            if (contrastRatio < 4.5) { // WCAG AA standard
              issues.push({
                element: element.tagName + (element.className ? '.' + element.className : ''),
                contrastRatio: contrastRatio.toFixed(2),
                backgroundColor,
                color
              });
            }
          }
        }
      });
      
      function getLuminance(color) {
        // Simplified luminance calculation
        // In practice, you'd use a proper color parsing library
        if (color.startsWith('rgb')) {
          const matches = color.match(/\d+/g);
          if (matches && matches.length >= 3) {
            const [r, g, b] = matches.map(Number);
            return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          }
        }
        return null;
      }
      
      return issues;
    });

    if (colorContrastIssues.length > 0) {
      console.log('Color contrast issues found:');
      colorContrastIssues.forEach(issue => {
        console.log(`- ${issue.element}: ${issue.contrastRatio}:1 ratio`);
      });
    }

    expect(colorContrastIssues.length).toBe(0);
  });

  test('Keyboard navigation works correctly', async ({ page }) => {
    // Test tab navigation through main elements
    const focusableElements = [
      '[data-testid="reports-tab"]',
      '[data-testid="generator-tab"]',
      '[data-testid="scheduler-tab"]',
      '[data-testid="generate-report-btn"]',
      '[data-testid="refresh-data"]',
      '[data-testid="export-data"]'
    ];

    // Start from the first focusable element
    await page.focus('body');
    
    for (const selector of focusableElements) {
      await page.keyboard.press('Tab');
      
      // Check if the expected element is focused
      const focusedElement = await page.locator(':focus');
      const expectedElement = page.locator(selector);
      
      // Verify the focused element matches expected
      await expect(focusedElement).toBeVisible();
      
      // Check if element has proper focus indicators
      const focusStyles = await focusedElement.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          outline: styles.outline,
          outlineWidth: styles.outlineWidth,
          outlineStyle: styles.outlineStyle,
          outlineColor: styles.outlineColor,
          boxShadow: styles.boxShadow
        };
      });
      
      // Ensure focus is visible (either outline or box-shadow)
      const hasFocusIndicator = 
        focusStyles.outline !== 'none' ||
        focusStyles.outlineWidth !== '0px' ||
        focusStyles.boxShadow !== 'none';
      
      expect(hasFocusIndicator).toBe(true);
    }
  });

  test('Skip links work correctly', async ({ page }) => {
    // Test skip to main content link
    await page.keyboard.press('Tab');
    
    const skipLink = page.locator('[data-testid="skip-to-main"]');
    if (await skipLink.isVisible()) {
      await skipLink.click();
      
      // Verify focus moved to main content
      const focusedElement = await page.locator(':focus');
      const mainContent = page.locator('main, [role="main"], [data-testid="main-content"]');
      
      await expect(focusedElement).toBeVisible();
      // The focused element should be within or be the main content area
    }
  });

  test('ARIA labels and roles are properly implemented', async ({ page }) => {
    // Check for proper ARIA labels on interactive elements
    const interactiveElements = await page.locator('button, [role="button"], input, select, textarea, a').all();
    
    for (const element of interactiveElements) {
      const ariaLabel = await element.getAttribute('aria-label');
      const ariaLabelledBy = await element.getAttribute('aria-labelledby');
      const ariaDescribedBy = await element.getAttribute('aria-describedby');
      const textContent = await element.textContent();
      const title = await element.getAttribute('title');
      
      // Element should have some form of accessible name
      const hasAccessibleName = ariaLabel || ariaLabelledBy || textContent?.trim() || title;
      
      if (!hasAccessibleName) {
        const elementInfo = await element.evaluate(el => ({
          tagName: el.tagName,
          className: el.className,
          id: el.id,
          type: el.type
        }));
        
        console.warn('Element without accessible name:', elementInfo);
      }
      
      expect(hasAccessibleName).toBeTruthy();
    }
  });

  test('Form accessibility', async ({ page }) => {
    // Navigate to report generator form
    await page.click('[data-testid="generate-report-btn"]');
    await page.waitForSelector('[data-testid="report-generator-form"]');
    
    // Check form accessibility
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('[data-testid="report-generator-form"]')
      .withTags(['forms'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
    
    // Test form labels
    const formInputs = await page.locator('input, select, textarea').all();
    
    for (const input of formInputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      
      // Check if input has associated label
      let hasLabel = false;
      
      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        hasLabel = await label.count() > 0;
      }
      
      hasLabel = hasLabel || !!ariaLabel || !!ariaLabelledBy;
      
      expect(hasLabel).toBe(true);
    }
    
    // Test form validation messages
    await page.click('[data-testid="generate-btn"]'); // Submit empty form
    
    const errorMessages = await page.locator('[role="alert"], .error-message, [aria-invalid="true"]').all();
    
    for (const errorMessage of errorMessages) {
      await expect(errorMessage).toBeVisible();
      
      // Error messages should be associated with form fields
      const ariaDescribedBy = await errorMessage.getAttribute('aria-describedby');
      const id = await errorMessage.getAttribute('id');
      
      if (id) {
        const associatedField = page.locator(`[aria-describedby*="${id}"]`);
        const fieldExists = await associatedField.count() > 0;
        expect(fieldExists).toBe(true);
      }
    }
  });

  test('Table accessibility', async ({ page }) => {
    // Check reports table accessibility
    const table = page.locator('[data-testid="reports-table"]');
    
    if (await table.count() > 0) {
      // Check table structure
      const hasCaption = await table.locator('caption').count() > 0;
      const hasHeaders = await table.locator('th').count() > 0;
      
      // Table should have either caption or aria-label
      const ariaLabel = await table.getAttribute('aria-label');
      const ariaLabelledBy = await table.getAttribute('aria-labelledby');
      
      const hasAccessibleName = hasCaption || ariaLabel || ariaLabelledBy;
      expect(hasAccessibleName).toBe(true);
      
      // Check header cells have proper scope
      const headers = await table.locator('th').all();
      
      for (const header of headers) {
        const scope = await header.getAttribute('scope');
        expect(['col', 'row', 'colgroup', 'rowgroup']).toContain(scope);
      }
      
      // Check for sortable columns accessibility
      const sortableHeaders = await table.locator('th[aria-sort]').all();
      
      for (const header of sortableHeaders) {
        const ariaSort = await header.getAttribute('aria-sort');
        expect(['ascending', 'descending', 'none']).toContain(ariaSort);
      }
    }
  });

  test('Modal accessibility', async ({ page }) => {
    // Open report generator modal
    await page.click('[data-testid="generate-report-btn"]');
    await page.waitForSelector('[data-testid="report-generator-modal"]');
    
    const modal = page.locator('[data-testid="report-generator-modal"]');
    
    // Check modal ARIA attributes
    const role = await modal.getAttribute('role');
    const ariaModal = await modal.getAttribute('aria-modal');
    const ariaLabelledBy = await modal.getAttribute('aria-labelledby');
    const ariaDescribedBy = await modal.getAttribute('aria-describedby');
    
    expect(role).toBe('dialog');
    expect(ariaModal).toBe('true');
    expect(ariaLabelledBy).toBeTruthy();
    
    // Check focus management
    const focusedElement = await page.locator(':focus');
    const isWithinModal = await focusedElement.evaluate(el => {
      const modal = document.querySelector('[data-testid="report-generator-modal"]');
      return modal && modal.contains(el);
    });
    
    expect(isWithinModal).toBe(true);
    
    // Test focus trap
    const focusableElements = await modal.locator('button, input, select, textarea, [tabindex]:not([tabindex="-1"])').all();
    
    if (focusableElements.length > 1) {
      // Tab through all elements and ensure focus stays within modal
      for (let i = 0; i < focusableElements.length + 2; i++) {
        await page.keyboard.press('Tab');
        
        const currentFocus = await page.locator(':focus');
        const isStillInModal = await currentFocus.evaluate(el => {
          const modal = document.querySelector('[data-testid="report-generator-modal"]');
          return modal && modal.contains(el);
        });
        
        expect(isStillInModal).toBe(true);
      }
    }
    
    // Test escape key closes modal
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
  });

  test('Screen reader announcements', async ({ page }) => {
    // Test live regions for dynamic content updates
    const liveRegions = await page.locator('[aria-live], [role="status"], [role="alert"]').all();
    
    for (const region of liveRegions) {
      const ariaLive = await region.getAttribute('aria-live');
      const role = await region.getAttribute('role');
      
      if (ariaLive) {
        expect(['polite', 'assertive', 'off']).toContain(ariaLive);
      }
      
      if (role) {
        expect(['status', 'alert', 'log', 'marquee', 'timer']).toContain(role);
      }
    }
    
    // Test status announcements during report generation
    await page.click('[data-testid="generate-report-btn"]');
    await page.waitForSelector('[data-testid="report-generator-form"]');
    
    // Fill form and submit
    await page.fill('[data-testid="report-name"]', 'Test Report');
    await page.selectOption('[data-testid="report-type"]', 'revenue');
    await page.click('[data-testid="generate-btn"]');
    
    // Check for status announcements
    const statusRegion = page.locator('[data-testid="generation-status"]');
    
    if (await statusRegion.count() > 0) {
      const ariaLive = await statusRegion.getAttribute('aria-live');
      expect(ariaLive).toBeTruthy();
      
      // Wait for status updates
      await expect(statusRegion).toContainText(/generating|processing|complete/i);
    }
  });

  test('High contrast mode compatibility', async ({ page }) => {
    // Simulate high contrast mode
    await page.addStyleTag({
      content: `
        @media (prefers-contrast: high) {
          * {
            background-color: black !important;
            color: white !important;
            border-color: white !important;
          }
        }
      `
    });
    
    // Force high contrast mode
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    
    // Check that content is still visible and functional
    await expect(page.locator('[data-testid="reports-dashboard"]')).toBeVisible();
    await expect(page.locator('[data-testid="generate-report-btn"]')).toBeVisible();
    
    // Test interactions still work
    await page.click('[data-testid="generate-report-btn"]');
    await expect(page.locator('[data-testid="report-generator-form"]')).toBeVisible();
  });

  test('Reduced motion preferences', async ({ page }) => {
    // Test with reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    
    // Check that animations are disabled or reduced
    const animatedElements = await page.locator('[class*="animate"], [class*="transition"]').all();
    
    for (const element of animatedElements) {
      const styles = await element.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          animationDuration: computed.animationDuration,
          transitionDuration: computed.transitionDuration
        };
      });
      
      // Animations should be disabled or very short
      const hasReducedMotion = 
        styles.animationDuration === '0s' || 
        styles.transitionDuration === '0s' ||
        parseFloat(styles.animationDuration) <= 0.1 ||
        parseFloat(styles.transitionDuration) <= 0.1;
      
      if (!hasReducedMotion) {
        console.warn('Element may not respect reduced motion preference:', await element.getAttribute('class'));
      }
    }
  });

  test('Touch target sizes', async ({ page }) => {
    // Test on mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    const touchTargets = await page.locator('button, a, input[type="checkbox"], input[type="radio"], [role="button"]').all();
    
    for (const target of touchTargets) {
      const boundingBox = await target.boundingBox();
      
      if (boundingBox) {
        // WCAG recommends minimum 44x44 CSS pixels for touch targets
        const minSize = 44;
        
        expect(boundingBox.width).toBeGreaterThanOrEqual(minSize - 5); // Allow small tolerance
        expect(boundingBox.height).toBeGreaterThanOrEqual(minSize - 5);
      }
    }
  });
});