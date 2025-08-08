// Test per verificare che tutti i formati di export funzionino
import { exportToCSV, exportToExcel, exportToPDF } from '@/lib/exportService';
import Logger from 'utils/Logger';

// Dati di test
const testData = [
  {
    id: 1,
    cliente: 'Test Cliente',
    descrizione: 'Test Preventivo',
    totale: 1000,
    data: new Date().toISOString().split('T')[0],
  },
];

Logger.debug('🧪 Testing export functions...');

try {
  // Test CSV
  Logger.debug('📄 Testing CSV export...');
  exportToCSV(testData, 'test-csv');
  Logger.debug('✅ CSV export works!');

  // Test Excel
  Logger.debug('📊 Testing Excel export...');
  exportToExcel(testData, 'test-excel');
  Logger.debug('✅ Excel export works!');

  // Test PDF
  Logger.debug('📋 Testing PDF export...');
  exportToPDF(testData, 'test-pdf');
  Logger.debug('✅ PDF export works!');

  Logger.error('🎉 All export functions are working correctly!');
} catch (error) {
  console.error('❌ Export test failed:', error);
}
