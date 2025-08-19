const { defineConfig, devices } = require('@playwright/test');

/**
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './../../web-app/src/__tests__/e2e',
  testMatch: ['**/*.spec.ts'],
  testIgnore: ['**/*.test.js'],
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }]
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3001',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Take screenshot on failure */
    screenshot: 'only-on-failure',

    /* Record video on failure */
    video: 'retain-on-failure',

    /* Global test timeout */
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    /* Test against branded browsers. */
    {
      name: 'Microsoft Edge',
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
    },
    {
      name: 'Google Chrome',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev -- --port 3001',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },

  /* Global setup and teardown */
  // Use ESM global setup/teardown files (.js under type: module)
  globalSetup: require.resolve('./../../web-app/src/__tests__/shared/global-setup.js'),
  globalTeardown: require.resolve('./../../web-app/src/__tests__/shared/global-teardown.js'),

  /* Test timeout */
  timeout: 30000,
  expect: {
    timeout: 5000,
  },

  /* Output directory for test results */
  outputDir: 'test-results/',

  /* Folder for test artifacts such as screenshots, videos, traces, etc. */
  testDir: './../../web-app/src/__tests__/e2e',

  /* Maximum time one test can run for. */
  timeout: 30 * 1000,

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Configure global test fixtures */
  use: {
    /* Maximum time each action such as `click()` can take. Defaults to 0 (no limit). */
    actionTimeout: 0,

    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3001',

    /* Collect trace when retrying the failed test. */
    trace: 'on-first-retry',

    /* Take screenshot on failure */
    screenshot: 'only-on-failure',

    /* Record video on failure */
    video: 'retain-on-failure',

    /* Emulate user locale */
    locale: 'it-IT',

    /* Emulate timezone */
    timezoneId: 'Europe/Rome',

    /* Viewport used for all pages */
    viewport: { width: 1280, height: 720 },

    /* Ignore HTTPS errors */
    ignoreHTTPSErrors: true,

    /* Whether to automatically download files */
    acceptDownloads: true,

    /* Close context after each test */
    contextOptions: {
      // Ignore certificate errors
      ignoreHTTPSErrors: true,
      // Set permissions
      permissions: ['notifications'],
      // Set geolocation
      geolocation: { longitude: 9.1900, latitude: 45.4642 }, // Milan
    },
  },

  /* Expect configuration */
  expect: {
    /* Maximum time expect() should wait for the condition to be met. */
    timeout: 5000,

    /* Threshold for pixel comparisons */
    threshold: 0.2,

    /* Animation handling */
    animations: 'disabled',
  },

  /* Test metadata */
  metadata: {
    'test-type': 'e2e',
    'app-version': process.env.npm_package_version || '1.0.0',
    'environment': process.env.NODE_ENV || 'test',
  },
});