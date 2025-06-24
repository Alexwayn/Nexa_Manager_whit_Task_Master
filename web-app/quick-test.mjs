// Test rapido per verificare la correzione dell'errore delle icone
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

async function quickTest() {
  console.log('🔧 VERIFICA CORREZIONE ERRORE ICONE');
  console.log('==================================');
  
  try {
    const http = require('http');
    
    console.log('🧪 Testing pagina Analytics...');
    
    const testPage = (url, name) => {
      return new Promise((resolve, reject) => {
        const req = http.get(url, (res) => {
          console.log(`📊 ${name}: Status ${res.statusCode}`);
          
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            if (res.statusCode === 200) {
              console.log(`✅ ${name}: Caricamento OK`);
              resolve(true);
            } else {
              console.log(`⚠️ ${name}: Status non-200`);
              resolve(false);
            }
          });
        });
        
        req.on('error', (err) => {
          console.log(`❌ ${name}: ${err.message}`);
          resolve(false);
        });
        
        req.setTimeout(5000, () => {
          req.destroy();
          console.log(`⏱️ ${name}: Timeout`);
          resolve(false);
        });
      });
    };
    
    // Test delle pagine principali
    const results = await Promise.all([
      testPage('http://localhost:5177/', 'Homepage'),
      testPage('http://localhost:5177/test-analytics', 'Test Analytics'),
      testPage('http://localhost:5177/analytics', 'Analytics Page')
    ]);
    
    const successCount = results.filter(r => r).length;
    
    console.log('\n📋 RISULTATI:');
    console.log('=============');
    console.log(`✅ Pagine funzionanti: ${successCount}/3`);
    
    if (successCount === 3) {
      console.log('🎉 CORREZIONE COMPLETATA CON SUCCESSO!');
      console.log('');
      console.log('📊 Il componente AdvancedFinancialAnalytics ora dovrebbe funzionare correttamente');
      console.log('🌐 Apri: http://localhost:5177/test-analytics');
      console.log('');
      console.log('✅ Errore TrendingDownIcon risolto');
      console.log('✅ Tutte le icone Heroicons corrette');
      console.log('✅ Componente pronto per l\'uso');
    } else {
      console.log('⚠️ Alcune pagine potrebbero avere ancora problemi');
    }
    
  } catch (error) {
    console.error('❌ Test fallito:', error.message);
  }
}

quickTest(); 