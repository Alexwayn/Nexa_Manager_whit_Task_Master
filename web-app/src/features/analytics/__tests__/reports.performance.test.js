import { test, expect } from '@playwright/test';
import {
  PERFORMANCE_THRESHOLDS,
  PERFORMANCE_SCENARIOS,
  STRESS_TEST_CONFIG
} from './performance.config.js';

/**
 * Performance Tests for Reports System
 * Tests loading times, rendering performance, and resource usage
 */

test.describe('Reports Performance Tests', () => {
  let page;
  let performanceMetrics = {};

  test.beforeEach(async ({ browser }) => {
    // Create a new page with performance monitoring
    const context = await browser.newContext();
    page = await context.newPage();

    // Enable performance monitoring
    await page.addInitScript(() => {
      window.performanceMetrics = {
        navigationStart: performance.now(),
        marks: {},
        measures: {}
      };

      // Override performance.mark to capture custom metrics
      const originalMark = performance.mark;
      performance.mark = function(name) {
        window.performanceMetrics.marks[name] = performance.now();
        return originalMark.call(this, name);
      };

      // Override performance.measure to capture custom measures
      const originalMeasure = performance.measure;
      performance.measure = function(name, startMark, endMark) {
        const start = window.performanceMetrics.marks[startMark] || 0;
        const end = window.performanceMetrics.marks[endMark] || performance.now();
        window.performanceMetrics.measures[name] = end - start;
        return originalMeasure.call(this, name, startMark, endMark);
      };
    });

    // Navigate to reports page
    await page.goto('/reports');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async () => {
    // Collect final metrics
    performanceMetrics = await page.evaluate(() => {
      return {
        ...window.performanceMetrics,
        memory: performance.memory ? {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
        } : null,
        navigation: performance.getEntriesByType('navigation')[0],
        paint: performance.getEntriesByType('paint')
      };
    });

    // Log performance metrics
    console.log('Performance Metrics:', JSON.stringify(performanceMetrics, null, 2));
  });

  test('Dashboard loads within performance threshold', async () => {
    const startTime = Date.now();
    
    // Wait for dashboard to be fully loaded
    await page.waitForSelector('[data-testid="reports-dashboard"]');
    await page.waitForSelector('[data-testid="metrics-cards"]');
    await page.waitForSelector('[data-testid="recent-reports"]');
    
    const loadTime = Date.now() - startTime;
    
    // Assert load time is within threshold
    expect(loadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.pageLoad.acceptable);
    
    // Check for good performance
    if (loadTime < PERFORMANCE_THRESHOLDS.pageLoad.good) {
      console.log(`✅ Excellent dashboard load time: ${loadTime}ms`);
    } else {
      console.log(`⚠️ Dashboard load time: ${loadTime}ms (acceptable but could be improved)`);
    }
  });

  test('Chart rendering performance with different data sizes', async () => {
    const dataSizes = Object.entries(PERFORMANCE_SCENARIOS.dataSizes);
    
    for (const [sizeName, config] of dataSizes) {
      console.log(`Testing chart rendering with ${sizeName} dataset...`);
      
      // Generate test data
      const chartData = generateChartData(config.metrics * 10); // 10 data points per metric
      
      // Inject test data
      await page.evaluate((data) => {
        window.testChartData = data;
      }, chartData);
      
      // Measure chart rendering time
      const renderStart = Date.now();
      
      await page.evaluate(() => {
        // Trigger chart re-render with new data
        const event = new CustomEvent('updateChartData', {
          detail: window.testChartData
        });
        window.dispatchEvent(event);
      });
      
      // Wait for chart to finish rendering
      await page.waitForFunction(() => {
        const charts = document.querySelectorAll('[data-testid*="chart"]');
        return Array.from(charts).every(chart => 
          !chart.classList.contains('loading') && 
          chart.querySelector('canvas, svg')
        );
      });
      
      const renderTime = Date.now() - renderStart;
      
      // Assert rendering time based on data size
      const threshold = sizeName === 'xlarge' 
        ? PERFORMANCE_THRESHOLDS.componentRender.poor
        : PERFORMANCE_THRESHOLDS.componentRender.acceptable;
      
      expect(renderTime).toBeLessThan(threshold);
      
      console.log(`Chart rendering (${sizeName}): ${renderTime}ms`);
    }
  });

  test('Report generation performance', async () => {
    // Test different report types and formats
    const reportTypes = ['revenue', 'expenses', 'profit', 'comprehensive'];
    const formats = ['PDF', 'Excel', 'CSV'];
    
    for (const reportType of reportTypes) {
      for (const format of formats) {
        console.log(`Testing ${reportType} report generation in ${format} format...`);
        
        // Navigate to report generator
        await page.click('[data-testid="generate-report-btn"]');
        await page.waitForSelector('[data-testid="report-generator-form"]');
        
        // Fill form
        await page.selectOption('[data-testid="report-type"]', reportType);
        await page.selectOption('[data-testid="report-format"]', format);
        await page.fill('[data-testid="report-name"]', `Test ${reportType} Report`);
        
        // Measure generation time
        const generationStart = Date.now();
        
        await page.click('[data-testid="generate-btn"]');
        
        // Wait for generation to complete
        await page.waitForSelector('[data-testid="generation-complete"]', {
          timeout: 30000
        });
        
        const generationTime = Date.now() - generationStart;
        
        // Assert generation time
        expect(generationTime).toBeLessThan(PERFORMANCE_THRESHOLDS.apiResponse.poor);
        
        console.log(`${reportType} ${format} generation: ${generationTime}ms`);
        
        // Close modal
        await page.click('[data-testid="close-generator"]');
      }
    }
  });

  test('Memory usage during extended usage', async () => {
    const initialMemory = await page.evaluate(() => {
      return performance.memory ? performance.memory.usedJSHeapSize : 0;
    });
    
    // Simulate extended usage
    for (let i = 0; i < 50; i++) {
      // Navigate between different views
      await page.click('[data-testid="reports-tab"]');
      await page.waitForTimeout(100);
      
      await page.click('[data-testid="generator-tab"]');
      await page.waitForTimeout(100);
      
      await page.click('[data-testid="scheduler-tab"]');
      await page.waitForTimeout(100);
      
      // Trigger some data operations
      if (i % 10 === 0) {
        await page.click('[data-testid="refresh-data"]');
        await page.waitForTimeout(500);
      }
    }
    
    // Force garbage collection if available
    await page.evaluate(() => {
      if (window.gc) {
        window.gc();
      }
    });
    
    const finalMemory = await page.evaluate(() => {
      return performance.memory ? performance.memory.usedJSHeapSize : 0;
    });
    
    const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // MB
    
    console.log(`Memory increase after extended usage: ${memoryIncrease.toFixed(2)}MB`);
    
    // Assert memory increase is within acceptable limits
    expect(memoryIncrease).toBeLessThan(PERFORMANCE_THRESHOLDS.memoryUsage.acceptable);
  });

  test('Concurrent user simulation', async () => {
    const concurrentUsers = STRESS_TEST_CONFIG.concurrentUsers.medium;
    const promises = [];
    
    console.log(`Simulating ${concurrentUsers} concurrent users...`);
    
    // Create multiple browser contexts to simulate concurrent users
    for (let i = 0; i < Math.min(concurrentUsers, 10); i++) { // Limit to 10 for test performance
      const promise = (async () => {
        const context = await page.context().browser().newContext();
        const userPage = await context.newPage();
        
        try {
          const startTime = Date.now();
          
          await userPage.goto('/reports');
          await userPage.waitForLoadState('networkidle');
          
          // Simulate user interactions
          await userPage.click('[data-testid="generate-report-btn"]');
          await userPage.waitForSelector('[data-testid="report-generator-form"]');
          await userPage.fill('[data-testid="report-name"]', `User ${i} Report`);
          await userPage.click('[data-testid="close-generator"]');
          
          const endTime = Date.now();
          return endTime - startTime;
        } finally {
          await context.close();
        }
      })();
      
      promises.push(promise);
    }
    
    const results = await Promise.all(promises);
    const averageTime = results.reduce((sum, time) => sum + time, 0) / results.length;
    const maxTime = Math.max(...results);
    
    console.log(`Average response time: ${averageTime.toFixed(2)}ms`);
    console.log(`Max response time: ${maxTime}ms`);
    
    // Assert that even under load, response times are acceptable
    expect(averageTime).toBeLessThan(PERFORMANCE_THRESHOLDS.pageLoad.poor);
    expect(maxTime).toBeLessThan(PERFORMANCE_THRESHOLDS.pageLoad.poor * 2);
  });

  test('Large dataset handling', async () => {
    const largeDataset = generateLargeDataset(PERFORMANCE_SCENARIOS.dataSizes.xlarge);
    
    console.log('Testing large dataset handling...');
    
    // Inject large dataset
    await page.evaluate((dataset) => {
      window.largeTestDataset = dataset;
      
      // Trigger data update
      const event = new CustomEvent('updateTestData', {
        detail: dataset
      });
      window.dispatchEvent(event);
    }, largeDataset);
    
    const renderStart = Date.now();
    
    // Wait for UI to update with large dataset
    await page.waitForFunction(() => {
      const reportsList = document.querySelector('[data-testid="reports-list"]');
      return reportsList && reportsList.children.length > 100;
    }, { timeout: 30000 });
    
    const renderTime = Date.now() - renderStart;
    
    console.log(`Large dataset rendering time: ${renderTime}ms`);
    
    // Assert rendering time for large dataset
    expect(renderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.componentRender.poor * 5);
    
    // Test scrolling performance with large dataset
    const scrollStart = Date.now();
    
    for (let i = 0; i < 10; i++) {
      await page.mouse.wheel(0, 500);
      await page.waitForTimeout(50);
    }
    
    const scrollTime = Date.now() - scrollStart;
    
    console.log(`Scrolling performance with large dataset: ${scrollTime}ms`);
    
    // Assert scrolling remains smooth
    expect(scrollTime).toBeLessThan(1000); // Should complete in under 1 second
  });

  test('Network throttling impact', async () => {
    const networkConditions = PERFORMANCE_SCENARIOS.networkConditions;
    
    for (const [conditionName, condition] of Object.entries(networkConditions)) {
      if (conditionName === 'offline') continue; // Skip offline test
      
      console.log(`Testing with ${conditionName} network conditions...`);
      
      // Apply network throttling
      const client = await page.context().newCDPSession(page);
      await client.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: condition.downloadThroughput,
        uploadThroughput: condition.uploadThroughput,
        latency: condition.latency
      });
      
      const startTime = Date.now();
      
      // Reload page with throttled network
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      console.log(`Load time with ${conditionName}: ${loadTime}ms`);
      
      // Adjust expectations based on network conditions
      const expectedThreshold = conditionName === 'slow3g' 
        ? PERFORMANCE_THRESHOLDS.pageLoad.poor * 2
        : PERFORMANCE_THRESHOLDS.pageLoad.poor;
      
      expect(loadTime).toBeLessThan(expectedThreshold);
      
      // Disable throttling
      await client.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: -1,
        uploadThroughput: -1,
        latency: 0
      });
    }
  });
});

/**
 * Helper function to generate chart data
 */
function generateChartData(dataPoints) {
  const data = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - dataPoints);
  
  for (let i = 0; i < dataPoints; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    data.push({
      date: date.toISOString(),
      revenue: Math.random() * 10000 + 5000,
      expenses: Math.random() * 8000 + 3000,
      profit: Math.random() * 5000 + 1000
    });
  }
  
  return data;
}

/**
 * Helper function to generate large dataset
 */
function generateLargeDataset(config) {
  const dataset = {
    reports: [],
    schedules: [],
    metrics: []
  };
  
  // Generate reports
  for (let i = 0; i < config.reports; i++) {
    dataset.reports.push({
      id: `report-${i}`,
      name: `Test Report ${i}`,
      type: ['revenue', 'expenses', 'profit'][i % 3],
      format: ['PDF', 'Excel', 'CSV'][i % 3],
      status: ['completed', 'pending', 'failed'][i % 3],
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      size: Math.floor(Math.random() * 1000000) + 100000
    });
  }
  
  // Generate schedules
  for (let i = 0; i < config.schedules; i++) {
    dataset.schedules.push({
      id: `schedule-${i}`,
      name: `Scheduled Report ${i}`,
      reportType: ['revenue', 'expenses', 'profit'][i % 3],
      frequency: ['daily', 'weekly', 'monthly'][i % 3],
      enabled: Math.random() > 0.5,
      nextRun: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
    });
  }
  
  // Generate metrics
  for (let i = 0; i < config.metrics; i++) {
    dataset.metrics.push({
      id: `metric-${i}`,
      name: `Metric ${i}`,
      value: Math.random() * 100000,
      change: (Math.random() - 0.5) * 20,
      trend: Math.random() > 0.5 ? 'up' : 'down'
    });
  }
  
  return dataset;
}
