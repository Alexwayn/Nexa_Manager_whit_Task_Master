import { test, expect } from '@playwright/test';

// Test configuration
test.describe('Reports E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to reports page
    await page.goto('/reports');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test.describe('Reports Dashboard', () => {
    test('displays reports dashboard correctly', async ({ page }) => {
      // Check main heading
      await expect(page.locator('h1')).toContainText('Report');
      
      // Check metrics cards are visible
      await expect(page.locator('[data-testid="metrics-card"]')).toHaveCount(6);
      
      // Check charts are rendered
      await expect(page.locator('[data-testid="revenue-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="expenses-chart"]')).toBeVisible();
      
      // Check recent reports list
      await expect(page.locator('[data-testid="recent-reports"]')).toBeVisible();
    });

    test('filters reports by type', async ({ page }) => {
      // Wait for reports to load
      await page.waitForSelector('[data-testid="report-item"]');
      
      const initialReportCount = await page.locator('[data-testid="report-item"]').count();
      
      // Click revenue filter
      await page.click('[data-testid="filter-revenue"]');
      
      // Wait for filter to apply
      await page.waitForTimeout(500);
      
      // Check that only revenue reports are shown
      const filteredReports = page.locator('[data-testid="report-item"]');
      const count = await filteredReports.count();
      
      // Should have fewer or equal reports after filtering
      expect(count).toBeLessThanOrEqual(initialReportCount);
      
      // All visible reports should be revenue type
      for (let i = 0; i < count; i++) {
        const reportType = await filteredReports.nth(i).locator('[data-testid="report-type"]').textContent();
        expect(reportType).toContain('Entrate');
      }
    });

    test('searches reports by name', async ({ page }) => {
      // Wait for reports to load
      await page.waitForSelector('[data-testid="report-item"]');
      
      // Type in search box
      await page.fill('[data-testid="search-input"]', 'Revenue');
      
      // Wait for search to apply
      await page.waitForTimeout(500);
      
      // Check that search results contain the search term
      const searchResults = page.locator('[data-testid="report-item"]');
      const count = await searchResults.count();
      
      for (let i = 0; i < count; i++) {
        const reportName = await searchResults.nth(i).locator('[data-testid="report-name"]').textContent();
        expect(reportName.toLowerCase()).toContain('revenue');
      }
    });

    test('exports chart data', async ({ page }) => {
      // Set up download promise before clicking
      const downloadPromise = page.waitForEvent('download');
      
      // Click export button
      await page.click('[data-testid="export-chart-btn"]');
      
      // Wait for download
      const download = await downloadPromise;
      
      // Check download properties
      expect(download.suggestedFilename()).toMatch(/chart-data.*\.(csv|xlsx)$/);
    });
  });

  test.describe('Report Generation', () => {
    test('generates a new report successfully', async ({ page }) => {
      // Click generate report button
      await page.click('[data-testid="generate-report-btn"]');
      
      // Wait for modal to open
      await expect(page.locator('[data-testid="report-generator-modal"]')).toBeVisible();
      
      // Fill form
      await page.selectOption('[data-testid="report-type-select"]', 'revenue');
      await page.fill('[data-testid="start-date-input"]', '2024-01-01');
      await page.fill('[data-testid="end-date-input"]', '2024-01-31');
      await page.selectOption('[data-testid="format-select"]', 'PDF');
      
      // Submit form
      await page.click('[data-testid="generate-submit-btn"]');
      
      // Wait for success message
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Report generato con successo');
      
      // Check that download link appears
      await expect(page.locator('[data-testid="download-link"]')).toBeVisible();
    });

    test('validates form before submission', async ({ page }) => {
      // Click generate report button
      await page.click('[data-testid="generate-report-btn"]');
      
      // Try to submit without filling required fields
      await page.click('[data-testid="generate-submit-btn"]');
      
      // Check validation errors
      await expect(page.locator('[data-testid="type-error"]')).toContainText('Seleziona un tipo di report');
      await expect(page.locator('[data-testid="start-date-error"]')).toContainText('Seleziona data inizio');
      await expect(page.locator('[data-testid="end-date-error"]')).toContainText('Seleziona data fine');
    });

    test('validates date range', async ({ page }) => {
      // Click generate report button
      await page.click('[data-testid="generate-report-btn"]');
      
      // Fill form with invalid date range
      await page.selectOption('[data-testid="report-type-select"]', 'revenue');
      await page.fill('[data-testid="start-date-input"]', '2024-01-31');
      await page.fill('[data-testid="end-date-input"]', '2024-01-01');
      
      // Submit form
      await page.click('[data-testid="generate-submit-btn"]');
      
      // Check date range validation error
      await expect(page.locator('[data-testid="date-range-error"]'))
        .toContainText('La data fine deve essere successiva alla data inizio');
    });

    test('shows loading state during generation', async ({ page }) => {
      // Click generate report button
      await page.click('[data-testid="generate-report-btn"]');
      
      // Fill form
      await page.selectOption('[data-testid="report-type-select"]', 'revenue');
      await page.fill('[data-testid="start-date-input"]', '2024-01-01');
      await page.fill('[data-testid="end-date-input"]', '2024-01-31');
      
      // Submit form
      await page.click('[data-testid="generate-submit-btn"]');
      
      // Check loading state
      await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
      await expect(page.locator('[data-testid="generate-submit-btn"]')).toBeDisabled();
      await expect(page.locator('[data-testid="loading-text"]')).toContainText('Generazione in corso');
    });

    test('downloads generated report', async ({ page }) => {
      // Generate a report first
      await page.click('[data-testid="generate-report-btn"]');
      await page.selectOption('[data-testid="report-type-select"]', 'revenue');
      await page.fill('[data-testid="start-date-input"]', '2024-01-01');
      await page.fill('[data-testid="end-date-input"]', '2024-01-31');
      await page.click('[data-testid="generate-submit-btn"]');
      
      // Wait for generation to complete
      await expect(page.locator('[data-testid="download-link"]')).toBeVisible();
      
      // Set up download promise
      const downloadPromise = page.waitForEvent('download');
      
      // Click download link
      await page.click('[data-testid="download-link"]');
      
      // Wait for download
      const download = await downloadPromise;
      
      // Check download properties
      expect(download.suggestedFilename()).toMatch(/.*\.pdf$/);
    });
  });

  test.describe('Report Scheduling', () => {
    test('navigates to scheduler', async ({ page }) => {
      // Click scheduler tab or button
      await page.click('[data-testid="scheduler-tab"]');
      
      // Check scheduler interface is visible
      await expect(page.locator('[data-testid="scheduler-interface"]')).toBeVisible();
      await expect(page.locator('h2')).toContainText('Programmazione Report');
    });

    test('creates new schedule', async ({ page }) => {
      // Navigate to scheduler
      await page.click('[data-testid="scheduler-tab"]');
      
      // Click new schedule button
      await page.click('[data-testid="new-schedule-btn"]');
      
      // Wait for form to appear
      await expect(page.locator('[data-testid="schedule-form"]')).toBeVisible();
      
      // Fill form
      await page.fill('[data-testid="schedule-name-input"]', 'Weekly Revenue Report');
      await page.selectOption('[data-testid="schedule-type-select"]', 'revenue');
      await page.selectOption('[data-testid="schedule-frequency-select"]', 'weekly');
      await page.selectOption('[data-testid="schedule-day-select"]', '1'); // Monday
      await page.fill('[data-testid="schedule-time-input"]', '09:00');
      await page.fill('[data-testid="schedule-email-input"]', 'admin@company.com');
      
      // Submit form
      await page.click('[data-testid="save-schedule-btn"]');
      
      // Check success message
      await expect(page.locator('[data-testid="success-message"]'))
        .toContainText('Schedule creato con successo');
      
      // Check schedule appears in list
      await expect(page.locator('[data-testid="schedule-item"]')).toContainText('Weekly Revenue Report');
    });

    test('edits existing schedule', async ({ page }) => {
      // Navigate to scheduler
      await page.click('[data-testid="scheduler-tab"]');
      
      // Wait for schedules to load
      await page.waitForSelector('[data-testid="schedule-item"]');
      
      // Click edit button on first schedule
      await page.click('[data-testid="edit-schedule-btn"]:first-child');
      
      // Wait for edit form
      await expect(page.locator('[data-testid="schedule-form"]')).toBeVisible();
      
      // Modify schedule name
      await page.fill('[data-testid="schedule-name-input"]', 'Updated Schedule Name');
      
      // Save changes
      await page.click('[data-testid="save-schedule-btn"]');
      
      // Check updated name appears
      await expect(page.locator('[data-testid="schedule-item"]')).toContainText('Updated Schedule Name');
    });

    test('toggles schedule enabled/disabled', async ({ page }) => {
      // Navigate to scheduler
      await page.click('[data-testid="scheduler-tab"]');
      
      // Wait for schedules to load
      await page.waitForSelector('[data-testid="schedule-item"]');
      
      // Get initial state
      const toggleBtn = page.locator('[data-testid="toggle-schedule-btn"]:first-child');
      const initialState = await toggleBtn.getAttribute('aria-checked');
      
      // Click toggle
      await toggleBtn.click();
      
      // Wait for state change
      await page.waitForTimeout(500);
      
      // Check state has changed
      const newState = await toggleBtn.getAttribute('aria-checked');
      expect(newState).not.toBe(initialState);
    });

    test('deletes schedule with confirmation', async ({ page }) => {
      // Navigate to scheduler
      await page.click('[data-testid="scheduler-tab"]');
      
      // Wait for schedules to load
      await page.waitForSelector('[data-testid="schedule-item"]');
      
      // Get initial count
      const initialCount = await page.locator('[data-testid="schedule-item"]').count();
      
      // Set up dialog handler
      page.on('dialog', dialog => dialog.accept());
      
      // Click delete button
      await page.click('[data-testid="delete-schedule-btn"]:first-child');
      
      // Wait for deletion
      await page.waitForTimeout(500);
      
      // Check count decreased
      const newCount = await page.locator('[data-testid="schedule-item"]').count();
      expect(newCount).toBe(initialCount - 1);
    });
  });

  test.describe('Report Details', () => {
    test('views report details', async ({ page }) => {
      // Wait for reports to load
      await page.waitForSelector('[data-testid="report-item"]');
      
      // Click on first report
      await page.click('[data-testid="report-item"]:first-child');
      
      // Check details page loads
      await expect(page.locator('[data-testid="report-details"]')).toBeVisible();
      await expect(page.locator('[data-testid="report-title"]')).toBeVisible();
      await expect(page.locator('[data-testid="report-metadata"]')).toBeVisible();
    });

    test('downloads report from details page', async ({ page }) => {
      // Navigate to report details
      await page.waitForSelector('[data-testid="report-item"]');
      await page.click('[data-testid="report-item"]:first-child');
      
      // Set up download promise
      const downloadPromise = page.waitForEvent('download');
      
      // Click download button
      await page.click('[data-testid="download-report-btn"]');
      
      // Wait for download
      const download = await downloadPromise;
      
      // Check download
      expect(download.suggestedFilename()).toMatch(/.*\.(pdf|xlsx)$/);
    });
  });

  test.describe('Responsive Design', () => {
    test('works on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Check mobile layout
      await expect(page.locator('[data-testid="mobile-menu-btn"]')).toBeVisible();
      
      // Check metrics cards stack vertically
      const metricsCards = page.locator('[data-testid="metrics-card"]');
      const firstCard = metricsCards.first();
      const secondCard = metricsCards.nth(1);
      
      const firstCardBox = await firstCard.boundingBox();
      const secondCardBox = await secondCard.boundingBox();
      
      // Second card should be below first card (higher y position)
      expect(secondCardBox.y).toBeGreaterThan(firstCardBox.y + firstCardBox.height - 10);
    });

    test('works on tablet devices', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      
      // Check tablet layout
      await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
      
      // Check charts are responsive
      const chart = page.locator('[data-testid="revenue-chart"]');
      const chartBox = await chart.boundingBox();
      
      // Chart should take appropriate width for tablet
      expect(chartBox.width).toBeGreaterThan(300);
      expect(chartBox.width).toBeLessThan(600);
    });
  });

  test.describe('Performance', () => {
    test('loads reports page within performance budget', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/reports');
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);
    });

    test('handles large datasets efficiently', async ({ page }) => {
      // Navigate to reports with large dataset
      await page.goto('/reports?limit=100');
      
      const startTime = Date.now();
      await page.waitForSelector('[data-testid="report-item"]');
      const renderTime = Date.now() - startTime;
      
      // Should render within 2 seconds even with 100 reports
      expect(renderTime).toBeLessThan(2000);
      
      // Check that virtual scrolling or pagination is working
      const visibleReports = await page.locator('[data-testid="report-item"]:visible').count();
      expect(visibleReports).toBeLessThanOrEqual(50); // Should not render all 100 at once
    });
  });

  test.describe('Accessibility', () => {
    test('meets accessibility standards', async ({ page }) => {
      // Check for proper heading structure
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBe(1);
      
      // Check for alt text on images
      const images = page.locator('img');
      const imageCount = await images.count();
      
      for (let i = 0; i < imageCount; i++) {
        const alt = await images.nth(i).getAttribute('alt');
        expect(alt).toBeTruthy();
      }
      
      // Check for proper form labels
      const inputs = page.locator('input');
      const inputCount = await inputs.count();
      
      for (let i = 0; i < inputCount; i++) {
        const input = inputs.nth(i);
        const id = await input.getAttribute('id');
        const ariaLabel = await input.getAttribute('aria-label');
        
        if (id) {
          const label = page.locator(`label[for="${id}"]`);
          const labelExists = await label.count() > 0;
          expect(labelExists || ariaLabel).toBeTruthy();
        } else {
          expect(ariaLabel).toBeTruthy();
        }
      }
    });

    test('supports keyboard navigation', async ({ page }) => {
      // Tab through interactive elements
      await page.keyboard.press('Tab');
      
      // Check focus is visible
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
      
      // Continue tabbing and check focus moves
      await page.keyboard.press('Tab');
      const secondFocusedElement = page.locator(':focus');
      
      // Focus should have moved to a different element
      const firstElementId = await focusedElement.getAttribute('id');
      const secondElementId = await secondFocusedElement.getAttribute('id');
      expect(firstElementId).not.toBe(secondElementId);
    });

    test('supports screen readers', async ({ page }) => {
      // Check for proper ARIA labels
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      
      for (let i = 0; i < buttonCount; i++) {
        const button = buttons.nth(i);
        const ariaLabel = await button.getAttribute('aria-label');
        const text = await button.textContent();
        
        // Button should have either text content or aria-label
        expect(ariaLabel || text?.trim()).toBeTruthy();
      }
      
      // Check for proper role attributes
      const charts = page.locator('[data-testid*="chart"]');
      const chartCount = await charts.count();
      
      for (let i = 0; i < chartCount; i++) {
        const chart = charts.nth(i);
        const role = await chart.getAttribute('role');
        const ariaLabel = await chart.getAttribute('aria-label');
        
        // Charts should have proper roles and labels for screen readers
        expect(role).toBeTruthy();
        expect(ariaLabel).toBeTruthy();
      }
    });
  });
});