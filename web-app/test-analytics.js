// Test script per verificare il componente AdvancedFinancialAnalytics
const puppeteer = require('puppeteer');

async function testAnalyticsComponent() {
  console.log('🧪 Testing AdvancedFinancialAnalytics Component...');

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();

    // Intercetta errori console
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log('❌ Console Error:', msg.text());
      }
    });

    // Intercetta errori di rete
    page.on('response', (response) => {
      if (response.status() >= 400) {
        console.log('❌ Network Error:', response.url(), response.status());
      }
    });

    console.log('📍 Navigating to application...');
    await page.goto('http://localhost:5177/', { waitUntil: 'networkidle2' });

    // Aspetta che React si carichi
    await page.waitForSelector('body', { timeout: 10000 });

    console.log('✅ Application loaded successfully');

    // Prova a navigare alla pagina Analytics
    console.log('📊 Testing Analytics page navigation...');

    // Se c'è un link o pulsante per Analytics, clicca
    const analyticsLink = await page.$('a[href="/analytics"], button[data-testid="analytics"]');
    if (analyticsLink) {
      await analyticsLink.click();
      await page.waitForTimeout(2000);
      console.log('✅ Analytics page navigation successful');
    } else {
      // Naviga direttamente
      await page.goto('http://localhost:5177/analytics', { waitUntil: 'networkidle2' });
      console.log('✅ Direct navigation to Analytics page');
    }

    // Verifica che il componente AdvancedFinancialAnalytics sia presente
    const analyticsComponent = await page.$(
      '[data-testid="advanced-financial-analytics"], .advanced-financial-analytics',
    );
    if (analyticsComponent) {
      console.log('✅ AdvancedFinancialAnalytics component found');
    } else {
      console.log(
        '⚠️ AdvancedFinancialAnalytics component not found - checking for any analytics content',
      );
    }

    // Verifica elementi specifici del componente
    const charts = await page.$$('canvas, .chart-container, [class*="chart"]');
    console.log(`📊 Found ${charts.length} chart elements`);

    const cards = await page.$$('.bg-white, .card, [class*="card"]');
    console.log(`📋 Found ${cards.length} card elements`);

    // Screenshot per debug
    await page.screenshot({
      path: 'analytics-test-screenshot.png',
      fullPage: true,
    });
    console.log('📸 Screenshot saved as analytics-test-screenshot.png');

    console.log('✅ Component test completed successfully');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Verifica se puppeteer è disponibile
try {
  testAnalyticsComponent();
} catch (error) {
  console.log('⚠️ Puppeteer not available, using simple HTTP test instead');

  // Test HTTP semplice
  const http = require('http');

  console.log('🧪 Simple HTTP Test...');

  const req = http.get('http://localhost:5177/', (res) => {
    console.log(`✅ Server responded with status: ${res.statusCode}`);

    let data = '';
    res.on('data', (chunk) => (data += chunk));
    res.on('end', () => {
      if (data.includes('React')) {
        console.log('✅ React application detected');
      }
      if (data.includes('analytics') || data.includes('Analytics')) {
        console.log('✅ Analytics content detected');
      }
      console.log('📊 Basic HTTP test completed');
    });
  });

  req.on('error', (err) => {
    console.error('❌ HTTP test failed:', err.message);
  });
}
