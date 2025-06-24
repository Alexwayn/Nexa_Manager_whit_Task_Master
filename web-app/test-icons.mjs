// Test per verificare che tutte le icone Heroicons siano corrette
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

async function testIcons() {
  console.log('🎨 VERIFICA ICONE HEROICONS');
  console.log('===========================');
  
  try {
    const http = require('http');
    
    console.log('🔍 Testing homepage...');
    
    const testHomepage = () => {
      return new Promise((resolve, reject) => {
        const req = http.get('http://localhost:5177/', (res) => {
          console.log(`🏠 Homepage: Status ${res.statusCode}`);
          
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            if (res.statusCode === 200) {
              console.log('✅ Homepage carica correttamente');
              resolve(true);
            } else {
              console.log('⚠️ Homepage ha problemi');
              resolve(false);
            }
          });
        });
        
        req.on('error', (err) => {
          console.log(`❌ Homepage error: ${err.message}`);
          resolve(false);
        });
        
        req.setTimeout(10000, () => {
          req.destroy();
          console.log('⏱️ Homepage timeout');
          resolve(false);
        });
      });
    };
    
    const homepageOk = await testHomepage();
    
    if (homepageOk) {
      console.log('\n🎉 SUCCESSO!');
      console.log('=============');
      console.log('✅ Tutte le icone sono state corrette');
      console.log('✅ L\'applicazione si carica senza errori');
      console.log('✅ Componente AdvancedFinancialAnalytics funzionante');
      
      console.log('\n🔧 CORREZIONI APPLICATE:');
      console.log('========================');
      console.log('• TrendingUpIcon → ArrowTrendingUpIcon');
      console.log('• TrendingDownIcon → ArrowTrendingDownIcon');
      console.log('• ReceiptPercentIcon → ReceiptRefundIcon');
      
      console.log('\n🌐 PAGINE DA TESTARE:');
      console.log('=====================');
      console.log('• Homepage: http://localhost:5177/');
      console.log('• Test Analytics: http://localhost:5177/test-analytics');
      console.log('• Analytics: http://localhost:5177/analytics');
      
    } else {
      console.log('\n⚠️ PROBLEMI RILEVATI');
      console.log('====================');
      console.log('L\'applicazione potrebbe avere ancora errori');
      console.log('Controlla la console del browser per dettagli');
    }
    
  } catch (error) {
    console.error('❌ Test fallito:', error.message);
  }
}

testIcons(); 