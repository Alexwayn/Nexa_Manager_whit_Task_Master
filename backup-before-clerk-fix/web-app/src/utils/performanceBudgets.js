import Logger from '@utils/Logger';

/**
 * Performance Budget Configuration
 * Defines thresholds for various performance metrics
 */
export const PERFORMANCE_BUDGETS = {
  // Bundle size budgets (in KB)
  bundles: {
    main: 1000, // Main bundle should be under 1MB
    vendor: 500, // Vendor bundles under 500KB
    component: 100, // Individual component chunks under 100KB
    total: 2000, // Total JS bundle size under 2MB
  },

  // Load time budgets (in milliseconds)
  loadTimes: {
    firstContentfulPaint: 1500, // FCP under 1.5s
    largestContentfulPaint: 2500, // LCP under 2.5s
    firstInputDelay: 100, // FID under 100ms
    cumulativeLayoutShift: 0.1, // CLS under 0.1
  },

  // Component performance budgets (in milliseconds)
  components: {
    mountTime: 200, // Component mount under 200ms
    renderTime: 50, // Individual renders under 50ms
    updateTime: 30, // Component updates under 30ms
  },

  // Network budgets
  network: {
    totalRequestCount: 50, // Under 50 total requests
    imageSize: 500, // Images under 500KB each
    fontSize: 100, // Fonts under 100KB each
    totalAssetSize: 3000, // Total assets under 3MB
  },
};

/**
 * Budget violation severity levels
 */
export const SEVERITY_LEVELS = {
  WARNING: 'warning', // 10-25% over budget
  ERROR: 'error', // 25-50% over budget
  CRITICAL: 'critical', // 50%+ over budget
};

/**
 * Calculate severity level based on budget violation
 */
const getSeverityLevel = (actual, budget) => {
  const overagePercent = ((actual - budget) / budget) * 100;

  if (overagePercent >= 50) return SEVERITY_LEVELS.CRITICAL;
  if (overagePercent >= 25) return SEVERITY_LEVELS.ERROR;
  if (overagePercent >= 10) return SEVERITY_LEVELS.WARNING;

  return null; // Within budget
};

/**
 * Check bundle size against budgets
 */
export const checkBundleBudgets = bundleStats => {
  const violations = [];

  // Check individual bundle sizes
  bundleStats.forEach(bundle => {
    const sizeKB = Math.round(bundle.size / 1024);
    let budget;

    // Determine budget based on bundle type
    if (bundle.name.includes('vendor') || bundle.name.includes('react')) {
      budget = PERFORMANCE_BUDGETS.bundles.vendor;
    } else if (bundle.name.includes('main') || bundle.name.includes('index')) {
      budget = PERFORMANCE_BUDGETS.bundles.main;
    } else {
      budget = PERFORMANCE_BUDGETS.bundles.component;
    }

    if (sizeKB > budget) {
      const severity = getSeverityLevel(sizeKB, budget);
      violations.push({
        type: 'bundle',
        bundle: bundle.name,
        actual: sizeKB,
        budget: budget,
        severity,
        message: `Bundle ${bundle.name} is ${sizeKB}KB (budget: ${budget}KB)`,
      });
    }
  });

  // Check total bundle size
  const totalSize = bundleStats.reduce((total, bundle) => total + bundle.size, 0);
  const totalSizeKB = Math.round(totalSize / 1024);

  if (totalSizeKB > PERFORMANCE_BUDGETS.bundles.total) {
    const severity = getSeverityLevel(totalSizeKB, PERFORMANCE_BUDGETS.bundles.total);
    violations.push({
      type: 'total-bundle',
      actual: totalSizeKB,
      budget: PERFORMANCE_BUDGETS.bundles.total,
      severity,
      message: `Total bundle size is ${totalSizeKB}KB (budget: ${PERFORMANCE_BUDGETS.bundles.total}KB)`,
    });
  }

  return violations;
};

/**
 * Check Core Web Vitals against budgets
 */
export const checkWebVitalsBudgets = metrics => {
  const violations = [];

  // First Contentful Paint
  if (metrics.fcp && metrics.fcp > PERFORMANCE_BUDGETS.loadTimes.firstContentfulPaint) {
    const severity = getSeverityLevel(
      metrics.fcp,
      PERFORMANCE_BUDGETS.loadTimes.firstContentfulPaint,
    );
    violations.push({
      type: 'web-vital',
      metric: 'First Contentful Paint',
      actual: `${metrics.fcp}ms`,
      budget: `${PERFORMANCE_BUDGETS.loadTimes.firstContentfulPaint}ms`,
      severity,
      message: `FCP is ${metrics.fcp}ms (budget: ${PERFORMANCE_BUDGETS.loadTimes.firstContentfulPaint}ms)`,
    });
  }

  // Largest Contentful Paint
  if (metrics.lcp && metrics.lcp > PERFORMANCE_BUDGETS.loadTimes.largestContentfulPaint) {
    const severity = getSeverityLevel(
      metrics.lcp,
      PERFORMANCE_BUDGETS.loadTimes.largestContentfulPaint,
    );
    violations.push({
      type: 'web-vital',
      metric: 'Largest Contentful Paint',
      actual: `${metrics.lcp}ms`,
      budget: `${PERFORMANCE_BUDGETS.loadTimes.largestContentfulPaint}ms`,
      severity,
      message: `LCP is ${metrics.lcp}ms (budget: ${PERFORMANCE_BUDGETS.loadTimes.largestContentfulPaint}ms)`,
    });
  }

  // First Input Delay
  if (metrics.fid && metrics.fid > PERFORMANCE_BUDGETS.loadTimes.firstInputDelay) {
    const severity = getSeverityLevel(metrics.fid, PERFORMANCE_BUDGETS.loadTimes.firstInputDelay);
    violations.push({
      type: 'web-vital',
      metric: 'First Input Delay',
      actual: `${metrics.fid}ms`,
      budget: `${PERFORMANCE_BUDGETS.loadTimes.firstInputDelay}ms`,
      severity,
      message: `FID is ${metrics.fid}ms (budget: ${PERFORMANCE_BUDGETS.loadTimes.firstInputDelay}ms)`,
    });
  }

  // Cumulative Layout Shift
  if (metrics.cls && metrics.cls > PERFORMANCE_BUDGETS.loadTimes.cumulativeLayoutShift) {
    const severity = getSeverityLevel(
      metrics.cls,
      PERFORMANCE_BUDGETS.loadTimes.cumulativeLayoutShift,
    );
    violations.push({
      type: 'web-vital',
      metric: 'Cumulative Layout Shift',
      actual: metrics.cls.toFixed(3),
      budget: PERFORMANCE_BUDGETS.loadTimes.cumulativeLayoutShift,
      severity,
      message: `CLS is ${metrics.cls.toFixed(3)} (budget: ${PERFORMANCE_BUDGETS.loadTimes.cumulativeLayoutShift})`,
    });
  }

  return violations;
};

/**
 * Check component performance against budgets
 */
export const checkComponentBudgets = componentMetrics => {
  const violations = [];

  // Check mount time
  if (componentMetrics.mountTime > PERFORMANCE_BUDGETS.components.mountTime) {
    const severity = getSeverityLevel(
      componentMetrics.mountTime,
      PERFORMANCE_BUDGETS.components.mountTime,
    );
    violations.push({
      type: 'component',
      component: componentMetrics.componentName,
      metric: 'Mount Time',
      actual: `${componentMetrics.mountTime}ms`,
      budget: `${PERFORMANCE_BUDGETS.components.mountTime}ms`,
      severity,
      message: `${componentMetrics.componentName} mount time is ${componentMetrics.mountTime}ms (budget: ${PERFORMANCE_BUDGETS.components.mountTime}ms)`,
    });
  }

  // Check average render time
  if (componentMetrics.averageRenderTime > PERFORMANCE_BUDGETS.components.renderTime) {
    const severity = getSeverityLevel(
      componentMetrics.averageRenderTime,
      PERFORMANCE_BUDGETS.components.renderTime,
    );
    violations.push({
      type: 'component',
      component: componentMetrics.componentName,
      metric: 'Render Time',
      actual: `${componentMetrics.averageRenderTime.toFixed(2)}ms`,
      budget: `${PERFORMANCE_BUDGETS.components.renderTime}ms`,
      severity,
      message: `${componentMetrics.componentName} average render time is ${componentMetrics.averageRenderTime.toFixed(2)}ms (budget: ${PERFORMANCE_BUDGETS.components.renderTime}ms)`,
    });
  }

  // Check average update time
  if (componentMetrics.averageUpdateTime > PERFORMANCE_BUDGETS.components.updateTime) {
    const severity = getSeverityLevel(
      componentMetrics.averageUpdateTime,
      PERFORMANCE_BUDGETS.components.updateTime,
    );
    violations.push({
      type: 'component',
      component: componentMetrics.componentName,
      metric: 'Update Time',
      actual: `${componentMetrics.averageUpdateTime.toFixed(2)}ms`,
      budget: `${PERFORMANCE_BUDGETS.components.updateTime}ms`,
      severity,
      message: `${componentMetrics.componentName} average update time is ${componentMetrics.averageUpdateTime.toFixed(2)}ms (budget: ${PERFORMANCE_BUDGETS.components.updateTime}ms)`,
    });
  }

  return violations;
};

/**
 * Log budget violations with appropriate severity
 */
export const logBudgetViolations = violations => {
  if (violations.length === 0) {
    Logger.info('✅ All performance budgets met!');
    return;
  }

  violations.forEach(violation => {
    const emoji =
      {
        [SEVERITY_LEVELS.WARNING]: '⚠️',
        [SEVERITY_LEVELS.ERROR]: '❌',
        [SEVERITY_LEVELS.CRITICAL]: '🚨',
      }[violation.severity] || '⚠️';

    const logMethod =
      {
        [SEVERITY_LEVELS.WARNING]: Logger.warn,
        [SEVERITY_LEVELS.ERROR]: Logger.error,
        [SEVERITY_LEVELS.CRITICAL]: Logger.error,
      }[violation.severity] || Logger.warn;

    logMethod(`${emoji} Performance Budget Violation: ${violation.message}`);
  });

  // Summary
  const criticalCount = violations.filter(v => v.severity === SEVERITY_LEVELS.CRITICAL).length;
  const errorCount = violations.filter(v => v.severity === SEVERITY_LEVELS.ERROR).length;
  const warningCount = violations.filter(v => v.severity === SEVERITY_LEVELS.WARNING).length;

  Logger.info(
    `📊 Performance Budget Summary: ${criticalCount} critical, ${errorCount} errors, ${warningCount} warnings`,
  );
};

/**
 * Generate performance report
 */
export const generatePerformanceReport = allMetrics => {
  const report = {
    timestamp: new Date().toISOString(),
    budgets: PERFORMANCE_BUDGETS,
    violations: [],
    summary: {
      totalViolations: 0,
      criticalViolations: 0,
      budgetsMet: true,
    },
  };

  // Check all budget categories
  if (allMetrics.bundles) {
    report.violations.push(...checkBundleBudgets(allMetrics.bundles));
  }

  if (allMetrics.webVitals) {
    report.violations.push(...checkWebVitalsBudgets(allMetrics.webVitals));
  }

  if (allMetrics.components) {
    allMetrics.components.forEach(component => {
      report.violations.push(...checkComponentBudgets(component));
    });
  }

  // Update summary
  report.summary.totalViolations = report.violations.length;
  report.summary.criticalViolations = report.violations.filter(
    v => v.severity === SEVERITY_LEVELS.CRITICAL,
  ).length;
  report.summary.budgetsMet = report.violations.length === 0;

  return report;
};

export default {
  PERFORMANCE_BUDGETS,
  SEVERITY_LEVELS,
  checkBundleBudgets,
  checkWebVitalsBudgets,
  checkComponentBudgets,
  logBudgetViolations,
  generatePerformanceReport,
};
