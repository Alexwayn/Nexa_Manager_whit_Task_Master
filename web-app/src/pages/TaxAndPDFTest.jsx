import React, { useState } from 'react';
import { TaxCalculator } from '@features/financial';
import { PDFGenerator } from '@features/documents';

const TaxAndPDFTest = () => {
  const [activeTab, setActiveTab] = useState('tax');

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='text-center mb-8'>
          <h1 className='text-3xl font-bold text-gray-900 mb-4'>
            Sistema Fiscale e Generazione PDF
          </h1>
          <p className='text-lg text-gray-600 max-w-3xl mx-auto'>
            Test completo del sistema di calcolo fiscale italiano (IVA, Reverse Charge, Ritenute) e
            generazione PDF professionale per fatture conformi alla normativa italiana.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className='flex justify-center mb-8'>
          <div className='bg-white rounded-lg shadow-sm p-1 flex'>
            <button
              onClick={() => setActiveTab('tax')}
              className={`px-6 py-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'tax'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              🧮 Calcolatore Fiscale
            </button>
            <button
              onClick={() => setActiveTab('pdf')}
              className={`px-6 py-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'pdf'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              📄 Generatore PDF
            </button>
            <button
              onClick={() => setActiveTab('info')}
              className={`px-6 py-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'info'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              ℹ️ Informazioni
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className='transition-all duration-300'>
          {activeTab === 'tax' && (
            <div className='animate-fadeIn'>
              <TaxCalculator />
            </div>
          )}

          {activeTab === 'pdf' && (
            <div className='animate-fadeIn'>
              <PDFGenerator />
            </div>
          )}

          {activeTab === 'info' && (
            <div className='animate-fadeIn'>
              <div className='max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8'>
                <h2 className='text-2xl font-bold text-gray-900 mb-6'>Informazioni sul Sistema</h2>

                {/* Tax System Info */}
                <div className='mb-8'>
                  <h3 className='text-xl font-semibold text-gray-800 mb-4'>
                    📊 Sistema di Calcolo Fiscale
                  </h3>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div className='p-4 bg-blue-50 rounded-md'>
                      <h4 className='font-medium text-blue-800 mb-2'>Aliquote IVA Supportate</h4>
                      <ul className='text-sm text-blue-700 space-y-1'>
                        <li>• 22% - Aliquota ordinaria (servizi standard)</li>
                        <li>• 10% - Aliquota ridotta (alimentari, libri)</li>
                        <li>• 4% - Aliquota super ridotta (beni prima necessità)</li>
                        <li>• 0% - Operazioni esenti o non soggette</li>
                      </ul>
                    </div>

                    <div className='p-4 bg-green-50 rounded-md'>
                      <h4 className='font-medium text-green-800 mb-2'>Ritenute d&apos;Acconto</h4>
                      <ul className='text-sm text-green-700 space-y-1'>
                        <li>• 20% - Professionisti (servizi intellettuali)</li>
                        <li>• 23% - Contribuenti minimi/forfettari</li>
                        <li>• 4% - Commissioni e provvigioni</li>
                        <li>• 0% - Nessuna ritenuta</li>
                      </ul>
                    </div>

                    <div className='p-4 bg-purple-50 rounded-md'>
                      <h4 className='font-medium text-purple-800 mb-2'>Reverse Charge</h4>
                      <ul className='text-sm text-purple-700 space-y-1'>
                        <li>• Operazioni UE B2B con partita IVA valida</li>
                        <li>• Operazioni extra-UE automatiche</li>
                        <li>• Verifica automatica codici paese</li>
                        <li>• Note di conformità automatiche</li>
                      </ul>
                    </div>

                    <div className='p-4 bg-yellow-50 rounded-md'>
                      <h4 className='font-medium text-yellow-800 mb-2'>Conformità Normativa</h4>
                      <ul className='text-sm text-yellow-700 space-y-1'>
                        <li>• DPR 633/72 (normativa IVA)</li>
                        <li>• DPR 600/73 (ritenute d&apos;acconto)</li>
                        <li>• Regolamento UE 282/2011 (reverse charge)</li>
                        <li>• Fatturazione elettronica compatibile</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* PDF System Info */}
                <div className='mb-8'>
                  <h3 className='text-xl font-semibold text-gray-800 mb-4'>
                    📄 Sistema di Generazione PDF
                  </h3>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div className='p-4 bg-indigo-50 rounded-md'>
                      <h4 className='font-medium text-indigo-800 mb-2'>Template Disponibili</h4>
                      <ul className='text-sm text-indigo-700 space-y-1'>
                        <li>
                          • <strong>Standard:</strong> Layout classico professionale
                        </li>
                        <li>
                          • <strong>Professionale:</strong> Design avanzato con branding
                        </li>
                        <li>
                          • <strong>Minimale:</strong> Layout pulito e essenziale
                        </li>
                        <li>
                          • <strong>Dettagliato:</strong> Informazioni fiscali estese
                        </li>
                      </ul>
                    </div>

                    <div className='p-4 bg-red-50 rounded-md'>
                      <h4 className='font-medium text-red-800 mb-2'>Caratteristiche PDF</h4>
                      <ul className='text-sm text-red-700 space-y-1'>
                        <li>• Codici QR per verifica digitale</li>
                        <li>• Bollettini di pagamento opzionali</li>
                        <li>• Filigrane personalizzabili</li>
                        <li>• Metadati completi per archiviazione</li>
                      </ul>
                    </div>

                    <div className='p-4 bg-teal-50 rounded-md'>
                      <h4 className='font-medium text-teal-800 mb-2'>Integrazione Sistema</h4>
                      <ul className='text-sm text-teal-700 space-y-1'>
                        <li>• Calcoli fiscali automatici integrati</li>
                        <li>• Informazioni azienda da profilo utente</li>
                        <li>• Supporto multi-lingua (italiano primario)</li>
                        <li>• API per integrazione con servizi email</li>
                      </ul>
                    </div>

                    <div className='p-4 bg-orange-50 rounded-md'>
                      <h4 className='font-medium text-orange-800 mb-2'>Conformità Legale</h4>
                      <ul className='text-sm text-orange-700 space-y-1'>
                        <li>• Formato fattura italiana standard</li>
                        <li>• Informazioni fiscali obbligatorie</li>
                        <li>• Tracciabilità e archiviazione</li>
                        <li>• Compatibilità fatturazione elettronica</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Technical Implementation */}
                <div className='mb-8'>
                  <h3 className='text-xl font-semibold text-gray-800 mb-4'>
                    ⚙️ Implementazione Tecnica
                  </h3>
                  <div className='p-6 bg-gray-50 rounded-md'>
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                      <div>
                        <h4 className='font-medium text-gray-800 mb-2'>Servizi Implementati</h4>
                        <ul className='text-sm text-gray-600 space-y-1'>
                          <li>• TaxCalculationService.js</li>
                          <li>• PDFGenerationService.js</li>
                          <li>• InvoiceService.js (aggiornato)</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className='font-medium text-gray-800 mb-2'>Dipendenze</h4>
                        <ul className='text-sm text-gray-600 space-y-1'>
                          <li>• jsPDF (generazione PDF)</li>
                          <li>• jspdf-autotable (tabelle)</li>
                          <li>• qrcode (codici QR)</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className='font-medium text-gray-800 mb-2'>Integrazione</h4>
                        <ul className='text-sm text-gray-600 space-y-1'>
                          <li>• Supabase per dati</li>
                          <li>• React per UI</li>
                          <li>• Tailwind per styling</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Usage Examples */}
                <div>
                  <h3 className='text-xl font-semibold text-gray-800 mb-4'>
                    💡 Esempi di Utilizzo
                  </h3>
                  <div className='space-y-4'>
                    <div className='p-4 border border-gray-200 rounded-md'>
                      <h4 className='font-medium text-gray-800 mb-2'>
                        Scenario 1: Fattura Standard
                      </h4>
                      <p className='text-sm text-gray-600'>
                        Servizio di consulenza €1000 + IVA 22% = €1220 totale. Generazione PDF con
                        template professionale e invio automatico via email.
                      </p>
                    </div>

                    <div className='p-4 border border-gray-200 rounded-md'>
                      <h4 className='font-medium text-gray-800 mb-2'>
                        Scenario 2: Reverse Charge UE
                      </h4>
                      <p className='text-sm text-gray-600'>
                        Cliente tedesco con partita IVA valida, operazione €1000 senza IVA italiana.
                        Note automatiche di reverse charge nel PDF.
                      </p>
                    </div>

                    <div className='p-4 border border-gray-200 rounded-md'>
                      <h4 className='font-medium text-gray-800 mb-2'>
                        Scenario 3: Professionista con Ritenuta
                      </h4>
                      <p className='text-sm text-gray-600'>
                        Servizio professionale €1000 + IVA 22% - Ritenuta 20% = €1020 netto a
                        pagare. Calcoli automatici e breakdown fiscale dettagliato.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style>{`
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default TaxAndPDFTest;
