import { chromium } from '@playwright/test';

/**
 * Global setup for Playwright tests
 * This runs once before all tests
 */
async function globalSetup() {
  console.log('🚀 Starting global setup for E2E tests...');

  // Launch browser for setup
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Wait for the development server to be ready
    console.log('⏳ Waiting for development server...');
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
    console.log('✅ Development server is ready');

    // Setup test data if needed
    await setupTestData(page);

    // Setup authentication if needed
    await setupAuthentication(page);

    console.log('✅ Global setup completed successfully');
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

/**
 * Setup test data in the database
 */
async function setupTestData(page) {
  console.log('📊 Setting up test data...');

  // Mock data for testing
  const testData = {
    reports: [
      {
        id: 'test-report-1',
        name: 'Test Revenue Report',
        type: 'revenue',
        format: 'PDF',
        status: 'completed',
        createdAt: new Date().toISOString(),
        filePath: '/test/reports/revenue_test.pdf'
      },
      {
        id: 'test-report-2',
        name: 'Test Expenses Report',
        type: 'expenses',
        format: 'Excel',
        status: 'completed',
        createdAt: new Date().toISOString(),
        filePath: '/test/reports/expenses_test.xlsx'
      }
    ],
    schedules: [
      {
        id: 'test-schedule-1',
        name: 'Test Weekly Report',
        reportType: 'revenue',
        frequency: 'weekly',
        dayOfWeek: 1,
        time: '09:00',
        email: 'test@example.com',
        enabled: true
      }
    ],
    metrics: {
      totalRevenue: 125000.50,
      totalExpenses: 87500.25,
      netProfit: 37500.25,
      revenueGrowth: 12.5,
      expenseGrowth: -5.2,
      profitMargin: 30.0
    }
  };

  // Store test data in localStorage for mock services
  await page.evaluate((data) => {
    localStorage.setItem('test-reports', JSON.stringify(data.reports));
    localStorage.setItem('test-schedules', JSON.stringify(data.schedules));
    localStorage.setItem('test-metrics', JSON.stringify(data.metrics));
    localStorage.setItem('e2e-test-mode', 'true');
  }, testData);

  console.log('✅ Test data setup completed');
}

/**
 * Setup authentication for tests
 */
async function setupAuthentication(page) {
  console.log('🔐 Setting up authentication...');

  // Mock authentication token
  const mockToken = 'test-jwt-token-' + Date.now();
  const mockUser = {
    id: 'test-user-1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'admin',
    permissions: ['reports:read', 'reports:write', 'reports:delete']
  };

  // Store auth data in localStorage
  await page.evaluate((token, user) => {
    localStorage.setItem('auth-token', token);
    localStorage.setItem('user-data', JSON.stringify(user));
    localStorage.setItem('auth-expires', (Date.now() + 24 * 60 * 60 * 1000).toString());
  }, mockToken, mockUser);

  console.log('✅ Authentication setup completed');
}

/**
 * Setup mock WebSocket server for real-time notifications
 */
async function setupMockWebSocket() {
  console.log('🔌 Setting up mock WebSocket server...');

  // This would typically start a mock WebSocket server
  // For now, we'll just set a flag to use mock WebSocket in tests
  process.env.MOCK_WEBSOCKET = 'true';

  console.log('✅ Mock WebSocket setup completed');
}

/**
 * Setup test database
 */
async function setupTestDatabase() {
  console.log('🗄️ Setting up test database...');

  // In a real scenario, you might:
  // 1. Create a test database
  // 2. Run migrations
  // 3. Seed with test data
  // 4. Setup cleanup procedures

  // For this example, we'll use localStorage as our "database"
  console.log('✅ Test database setup completed');
}

/**
 * Setup environment variables for testing
 */
function setupEnvironment() {
  console.log('🌍 Setting up test environment...');

  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.REACT_APP_TEST_MODE = 'true';
  process.env.REACT_APP_API_URL = 'http://localhost:3001/api';
  process.env.REACT_APP_WS_URL = 'ws://localhost:3001/ws';

  console.log('✅ Test environment setup completed');
}

/**
 * Cleanup function for graceful shutdown
 */
process.on('SIGINT', async () => {
  console.log('\n🧹 Cleaning up test environment...');
  // Perform any necessary cleanup
  process.exit(0);
});

// Initialize environment setup
setupEnvironment();

export default globalSetup;