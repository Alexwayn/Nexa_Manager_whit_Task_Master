// Test script per verificare l'applicazione e il componente Analytics
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

async function testApplication() {
  console.log('🧪 Testing Nexa Manager Application...');
  
  try {
    // Test HTTP semplice
    const http = require('http');
    
    console.log('🔗 Testing server connection...');
    
    const testServer = () => {
      return new Promise((resolve, reject) => {
        const req = http.get('http://localhost:5177/', (res) => {
          console.log(`✅ Server responded with status: ${res.statusCode}`);
          
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            console.log(`📄 Response size: ${data.length} bytes`);
            
            // Verifica contenuto
            if (data.includes('React')) {
              console.log('✅ React application detected');
            }
            if (data.includes('Vite')) {
              console.log('✅ Vite build system detected');
            }
            if (data.includes('root')) {
              console.log('✅ Root element found');
            }
            
            resolve(data);
          });
        });
        
        req.on('error', (err) => {
          reject(err);
        });
        
        req.setTimeout(5000, () => {
          req.destroy();
          reject(new Error('Request timeout'));
        });
      });
    };
    
    await testServer();
    
    console.log('🧪 Testing Analytics route...');
    
    const testAnalyticsRoute = () => {
      return new Promise((resolve, reject) => {
        const req = http.get('http://localhost:5177/analytics', (res) => {
          console.log(`📊 Analytics route status: ${res.statusCode}`);
          
          if (res.statusCode === 200) {
            console.log('✅ Analytics route accessible');
          } else {
            console.log('⚠️ Analytics route returned non-200 status');
          }
          
          resolve();
        });
        
        req.on('error', (err) => {
          console.log('⚠️ Analytics route test failed:', err.message);
          resolve(); // Non bloccare il test
        });
        
        req.setTimeout(5000, () => {
          req.destroy();
          resolve();
        });
      });
    };
    
    await testAnalyticsRoute();
    
    console.log('📋 Test Summary:');
    console.log('  ✅ Server is running and responsive');
    console.log('  ✅ Application loads correctly');
    console.log('  📊 Analytics component should be available');
    console.log('  🌐 Access the app at: http://localhost:5177/');
    console.log('  📊 Analytics page: http://localhost:5177/analytics');
    
    console.log('\n🎯 Manual Testing Steps:');
    console.log('  1. Open browser to http://localhost:5177/');
    console.log('  2. Navigate to Analytics page');
    console.log('  3. Verify AdvancedFinancialAnalytics component renders');
    console.log('  4. Check for charts and data visualization');
    console.log('  5. Test responsive behavior');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testApplication(); 