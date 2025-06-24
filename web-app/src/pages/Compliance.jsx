import React from 'react';
import {
  Shield,
  FileText,
  CheckCircle,
  Award,
  Globe,
  Users,
  Mail,
  Phone,
  Download,
} from 'lucide-react';

const Compliance = () => {
  const regulations = [
    {
      name: 'GDPR',
      fullName: 'General Data Protection Regulation',
      region: 'Unione Europea',
      status: 'Conforme',
      description: 'Regolamento sulla protezione dei dati personali',
      lastAudit: 'Novembre 2024',
      nextAudit: 'Maggio 2025',
      icon: '🇪🇺',
      color: 'bg-blue-100 text-blue-800',
    },
    {
      name: 'ISO 27001',
      fullName: 'Information Security Management',
      region: 'Internazionale',
      status: 'Certificato',
      description: 'Standard per la gestione della sicurezza delle informazioni',
      lastAudit: 'Settembre 2024',
      nextAudit: 'Settembre 2025',
      icon: '🏆',
      color: 'bg-green-100 text-green-800',
    },
    {
      name: 'SOC 2 Type II',
      fullName: 'Service Organization Control 2',
      region: 'USA/Internazionale',
      status: 'Certificato',
      description: 'Controlli per sicurezza, disponibilità e riservatezza',
      lastAudit: 'Agosto 2024',
      nextAudit: 'Agosto 2025',
      icon: '✅',
      color: 'bg-green-100 text-green-800',
    },
    {
      name: 'PCI DSS',
      fullName: 'Payment Card Industry Data Security Standard',
      region: 'Internazionale',
      status: 'Certificato',
      description: 'Standard di sicurezza per il trattamento dei dati di pagamento',
      lastAudit: 'Ottobre 2024',
      nextAudit: 'Ottobre 2025',
      icon: '💳',
      color: 'bg-green-100 text-green-800',
    },
    {
      name: 'CCPA',
      fullName: 'California Consumer Privacy Act',
      region: 'California, USA',
      status: 'Conforme',
      description: 'Legge sulla privacy dei consumatori della California',
      lastAudit: 'Dicembre 2024',
      nextAudit: 'Giugno 2025',
      icon: '🏛️',
      color: 'bg-blue-100 text-blue-800',
    },
    {
      name: 'HIPAA',
      fullName: 'Health Insurance Portability and Accountability Act',
      region: 'USA',
      status: 'Pronto',
      description: 'Protezione delle informazioni sanitarie (per clienti healthcare)',
      lastAudit: 'In corso',
      nextAudit: 'Marzo 2025',
      icon: '🏥',
      color: 'bg-yellow-100 text-yellow-800',
    },
  ];

  const auditHistory = [
    {
      date: 'Dicembre 2024',
      auditor: 'KPMG',
      scope: 'GDPR Compliance Assessment',
      result: 'Conforme',
      findings: '0 non-conformità critiche',
      status: 'success',
    },
    {
      date: 'Novembre 2024',
      auditor: 'Deloitte Cyber',
      scope: 'ISO 27001 Surveillance Audit',
      result: 'Certificazione Mantenuta',
      findings: '2 osservazioni minori',
      status: 'success',
    },
    {
      date: 'Ottobre 2024',
      auditor: 'PCI Security Standards Council',
      scope: 'PCI DSS Annual Assessment',
      result: 'Conforme',
      findings: '0 vulnerabilità critiche',
      status: 'success',
    },
    {
      date: 'Settembre 2024',
      auditor: 'Ernst & Young',
      scope: 'SOC 2 Type II Examination',
      result: 'Opinione Pulita',
      findings: 'Controlli efficaci',
      status: 'success',
    },
    {
      date: 'Agosto 2024',
      auditor: 'Internal Audit Team',
      scope: 'Quarterly Security Review',
      result: 'Soddisfacente',
      findings: '3 miglioramenti implementati',
      status: 'success',
    },
  ];

  const complianceFrameworks = [
    {
      category: 'Privacy e Protezione Dati',
      frameworks: ['GDPR (EU)', 'CCPA (California)', 'LGPD (Brasile)', 'PIPEDA (Canada)'],
      icon: <Shield className='h-6 w-6 text-blue-600' />,
    },
    {
      category: 'Sicurezza Informatica',
      frameworks: ['ISO 27001/27002', 'NIST Cybersecurity Framework', 'CIS Controls', 'COBIT 5'],
      icon: <FileText className='h-6 w-6 text-green-600' />,
    },
    {
      category: 'Audit e Controlli',
      frameworks: ['SOC 1/2/3', 'ISAE 3402', 'SSAE 18', 'CSA STAR'],
      icon: <CheckCircle className='h-6 w-6 text-purple-600' />,
    },
    {
      category: 'Settori Specifici',
      frameworks: [
        'PCI DSS (Pagamenti)',
        'HIPAA (Sanità)',
        'SOX (Finanziario)',
        'FedRAMP (Governo USA)',
      ],
      icon: <Award className='h-6 w-6 text-orange-600' />,
    },
  ];

  const complianceMetrics = [
    { metric: 'Conformità Normative', value: '100%', trend: 'stabile', color: 'text-green-600' },
    { metric: 'Audit Superati', value: '15/15', trend: '+1', color: 'text-green-600' },
    { metric: 'Certificazioni Attive', value: '8', trend: '+2', color: 'text-blue-600' },
    {
      metric: 'Tempo Medio Remediation',
      value: '2.3 giorni',
      trend: '-0.5',
      color: 'text-green-600',
    },
  ];

  const documents = [
    {
      title: 'Privacy Policy',
      description: 'Informativa completa sul trattamento dei dati personali',
      lastUpdated: 'Gennaio 2025',
      type: 'PDF',
      size: '2.1 MB',
    },
    {
      title: 'Data Processing Agreement (DPA)',
      description: 'Accordo per il trattamento dei dati per clienti B2B',
      lastUpdated: 'Dicembre 2024',
      type: 'PDF',
      size: '1.8 MB',
    },
    {
      title: 'SOC 2 Type II Report',
      description: 'Report completo sui controlli di sicurezza e disponibilità',
      lastUpdated: 'Settembre 2024',
      type: 'PDF',
      size: '4.2 MB',
    },
    {
      title: 'ISO 27001 Certificate',
      description: 'Certificato di conformità allo standard ISO 27001',
      lastUpdated: 'Settembre 2024',
      type: 'PDF',
      size: '0.5 MB',
    },
    {
      title: 'PCI DSS Attestation',
      description: 'Attestazione di conformità PCI DSS Level 1',
      lastUpdated: 'Ottobre 2024',
      type: 'PDF',
      size: '1.2 MB',
    },
    {
      title: 'Business Continuity Plan',
      description: 'Piano di continuità operativa e disaster recovery',
      lastUpdated: 'Novembre 2024',
      type: 'PDF',
      size: '3.1 MB',
    },
  ];

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <div className='bg-white border-b border-gray-200'>
        <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
          <div className='text-center'>
            <h1 className='text-4xl font-bold text-gray-900 mb-4'>Compliance e Conformità</h1>
            <p className='text-xl text-gray-600 mb-8'>
              Trasparenza totale sui nostri standard di conformità e certificazioni
            </p>
            <div className='bg-green-50 rounded-lg p-6 text-left max-w-3xl mx-auto'>
              <div className='flex items-center space-x-3 mb-4'>
                <Award className='h-8 w-8 text-green-600' />
                <span className='text-xl font-semibold text-green-800'>Conformità Globale</span>
              </div>
              <p className='text-green-700'>
                Nexa Manager mantiene le più rigorose certificazioni internazionali e si conforma a
                tutte le normative applicabili per garantire la massima protezione dei tuoi dati.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
        {/* Compliance Metrics */}
        <div className='mb-16'>
          <h2 className='text-3xl font-bold text-gray-900 mb-8 text-center'>
            Metriche di Conformità
          </h2>
          <div className='grid md:grid-cols-4 gap-6'>
            {complianceMetrics.map((metric, index) => (
              <div key={index} className='bg-white rounded-lg shadow-sm p-6 text-center'>
                <div className='flex items-center justify-between mb-2'>
                  <div className={`text-2xl font-bold ${metric.color}`}>{metric.value}</div>
                  <div className={`text-sm font-medium ${metric.color}`}>{metric.trend}</div>
                </div>
                <div className='text-sm text-gray-600'>{metric.metric}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Regulations and Certifications */}
        <div className='mb-16'>
          <h2 className='text-3xl font-bold text-gray-900 mb-8 text-center'>
            Normative e Certificazioni
          </h2>
          <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {regulations.map((reg, index) => (
              <div key={index} className='bg-white rounded-lg shadow-sm p-6'>
                <div className='flex items-start justify-between mb-4'>
                  <div className='flex items-center space-x-3'>
                    <span className='text-3xl'>{reg.icon}</span>
                    <div>
                      <h3 className='text-lg font-bold text-gray-900'>{reg.name}</h3>
                      <p className='text-sm text-gray-600'>{reg.region}</p>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${reg.color}`}>
                    {reg.status}
                  </div>
                </div>

                <p className='text-sm text-gray-700 mb-4'>{reg.description}</p>

                <div className='space-y-2 text-xs text-gray-500'>
                  <div className='flex justify-between'>
                    <span>Ultimo Audit:</span>
                    <span>{reg.lastAudit}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Prossimo Audit:</span>
                    <span>{reg.nextAudit}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Compliance Frameworks */}
        <div className='mb-16'>
          <h2 className='text-3xl font-bold text-gray-900 mb-8 text-center'>
            Framework di Conformità
          </h2>
          <div className='grid md:grid-cols-2 gap-8'>
            {complianceFrameworks.map((framework, index) => (
              <div key={index} className='bg-white rounded-lg shadow-sm p-8'>
                <div className='flex items-center space-x-3 mb-6'>
                  {framework.icon}
                  <h3 className='text-xl font-bold text-gray-900'>{framework.category}</h3>
                </div>
                <ul className='space-y-3'>
                  {framework.frameworks.map((item, itemIndex) => (
                    <li key={itemIndex} className='flex items-center space-x-3'>
                      <CheckCircle className='h-5 w-5 text-green-600 flex-shrink-0' />
                      <span className='text-gray-700'>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Audit History */}
        <div className='mb-16'>
          <h2 className='text-3xl font-bold text-gray-900 mb-8 text-center'>Cronologia Audit</h2>
          <div className='bg-white rounded-lg shadow-sm overflow-hidden'>
            <div className='overflow-x-auto'>
              <table className='min-w-full divide-y divide-gray-200'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Data
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Auditor
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Ambito
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Risultato
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Findings
                    </th>
                  </tr>
                </thead>
                <tbody className='bg-white divide-y divide-gray-200'>
                  {auditHistory.map((audit, index) => (
                    <tr key={index} className='hover:bg-gray-50'>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                        {audit.date}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                        {audit.auditor}
                      </td>
                      <td className='px-6 py-4 text-sm text-gray-900'>{audit.scope}</td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='flex items-center'>
                          <CheckCircle className='h-4 w-4 text-green-600 mr-2' />
                          <span className='text-sm text-gray-900'>{audit.result}</span>
                        </div>
                      </td>
                      <td className='px-6 py-4 text-sm text-gray-600'>{audit.findings}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Documents and Reports */}
        <div className='mb-16'>
          <h2 className='text-3xl font-bold text-gray-900 mb-8 text-center'>Documenti e Report</h2>
          <div className='bg-white rounded-lg shadow-sm p-8'>
            <p className='text-gray-600 mb-6 text-center'>
              Accedi ai nostri documenti di compliance e certificazioni ufficiali
            </p>
            <div className='grid md:grid-cols-2 gap-6'>
              {documents.map((doc, index) => (
                <div
                  key={index}
                  className='border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors'
                >
                  <div className='flex items-start justify-between'>
                    <div className='flex-1'>
                      <h4 className='font-semibold text-gray-900 mb-2'>{doc.title}</h4>
                      <p className='text-sm text-gray-600 mb-3'>{doc.description}</p>
                      <div className='flex items-center space-x-4 text-xs text-gray-500'>
                        <span>Aggiornato: {doc.lastUpdated}</span>
                        <span>
                          {doc.type} • {doc.size}
                        </span>
                      </div>
                    </div>
                    <button className='ml-4 p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors'>
                      <Download className='h-5 w-5' />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className='mt-6 p-4 bg-blue-50 rounded-lg'>
              <p className='text-sm text-blue-800'>
                <strong>Nota:</strong> Alcuni documenti potrebbero richiedere autorizzazione
                speciale. Contatta il nostro team compliance per accedere a report riservati.
              </p>
            </div>
          </div>
        </div>

        {/* Compliance Process */}
        <div className='mb-16'>
          <h2 className='text-3xl font-bold text-gray-900 mb-8 text-center'>
            Il Nostro Processo di Compliance
          </h2>
          <div className='grid md:grid-cols-4 gap-6'>
            <div className='text-center'>
              <div className='bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center'>
                <span className='text-2xl font-bold text-blue-600'>1</span>
              </div>
              <h3 className='font-semibold text-gray-900 mb-2'>Assessment</h3>
              <p className='text-sm text-gray-600'>
                Valutazione continua dei requisiti normativi e dei rischi
              </p>
            </div>
            <div className='text-center'>
              <div className='bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center'>
                <span className='text-2xl font-bold text-green-600'>2</span>
              </div>
              <h3 className='font-semibold text-gray-900 mb-2'>Implementation</h3>
              <p className='text-sm text-gray-600'>
                Implementazione di controlli e procedure di sicurezza
              </p>
            </div>
            <div className='text-center'>
              <div className='bg-purple-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center'>
                <span className='text-2xl font-bold text-purple-600'>3</span>
              </div>
              <h3 className='font-semibold text-gray-900 mb-2'>Monitoring</h3>
              <p className='text-sm text-gray-600'>
                Monitoraggio continuo e testing dell&apos;efficacia
              </p>
            </div>
            <div className='text-center'>
              <div className='bg-orange-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center'>
                <span className='text-2xl font-bold text-orange-600'>4</span>
              </div>
              <h3 className='font-semibold text-gray-900 mb-2'>Improvement</h3>
              <p className='text-sm text-gray-600'>
                Miglioramento continuo basato su audit e feedback
              </p>
            </div>
          </div>
        </div>

        {/* Contact Compliance Team */}
        <div className='bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-8'>
          <div className='text-center'>
            <h3 className='text-xl font-bold text-gray-900 mb-2'>Domande sulla Compliance?</h3>
            <p className='text-gray-600 mb-6'>
              Il nostro team compliance è disponibile per rispondere a qualsiasi domanda normativa
            </p>
            <div className='flex flex-col sm:flex-row gap-4 justify-center'>
              <a
                href='mailto:compliance@nexamanager.com'
                className='inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors'
              >
                <Mail className='h-5 w-5 mr-2' />
                compliance@nexamanager.com
              </a>
              <a
                href='tel:+39351693692'
                className='inline-flex items-center px-6 py-3 bg-white text-purple-600 border border-purple-600 rounded-lg hover:bg-purple-50 transition-colors'
              >
                <Phone className='h-5 w-5 mr-2' />
                +39 351 693 692
              </a>
            </div>

            <div className='mt-8 pt-6 border-t border-purple-200'>
              <p className='text-sm text-gray-600'>
                <strong>Compliance Officer:</strong> Dott.ssa Laura Verdi
                <br />
                <strong>Legal Team:</strong> Disponibile per consulenze normative
                <br />
                <strong>Audit Schedule:</strong>{' '}
                <a href='#' className='text-purple-600 hover:text-purple-700'>
                  Visualizza calendario audit
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Compliance;
