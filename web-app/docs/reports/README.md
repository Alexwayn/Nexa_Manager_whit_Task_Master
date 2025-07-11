# Sistema di Reporting - Documentazione

## Panoramica

Il sistema di reporting di Nexa Manager fornisce funzionalità complete per la generazione, visualizzazione e gestione di report aziendali. Include dashboard interattive, generazione automatica di report, schedulazione e notifiche in tempo reale.

## Caratteristiche Principali

### 📊 Dashboard Interattiva
- Visualizzazione di metriche chiave in tempo reale
- Grafici interattivi per entrate, spese e profitti
- Filtri avanzati per tipo di report e periodo
- Esportazione dati in formato CSV/Excel

### 📄 Generazione Report
- Generazione automatica di report in PDF/Excel
- Template personalizzabili
- Validazione avanzata dei parametri
- Download diretto dei file generati

### ⏰ Schedulazione Automatica
- Programmazione di report ricorrenti
- Frequenze personalizzabili (giornaliera, settimanale, mensile)
- Invio automatico via email
- Gestione completa del ciclo di vita degli schedule

### 🔔 Notifiche in Tempo Reale
- Aggiornamenti WebSocket per stato generazione
- Notifiche di completamento/errore
- Indicatori di progresso in tempo reale

## Struttura del Progetto

```
src/
├── components/reports/
│   ├── Reports.jsx              # Dashboard principale
│   ├── ReportGenerator.jsx      # Generatore di report
│   ├── ReportScheduler.jsx      # Gestione schedulazione
│   └── __tests__/              # Test dei componenti
├── services/
│   ├── reportingService.js      # API per reporting
│   └── __tests__/              # Test dei servizi
├── hooks/
│   ├── useReports.js           # Hook personalizzati
│   └── __tests__/              # Test degli hook
└── providers/
    └── NotificationProvider.jsx # Provider notifiche
```

## Installazione e Setup

### Prerequisiti
- Node.js 18+
- React 18+
- Supabase configurato
- WebSocket server attivo

### Configurazione

1. **Variabili d'ambiente**:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
VITE_WEBSOCKET_URL=ws://localhost:8080
```

2. **Database Setup**:
```sql
-- Tabella per i report
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  type VARCHAR NOT NULL,
  format VARCHAR NOT NULL,
  file_path VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabella per le schedulazioni
CREATE TABLE report_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  report_type VARCHAR NOT NULL,
  frequency VARCHAR NOT NULL,
  day_of_week INTEGER,
  time TIME NOT NULL,
  email VARCHAR NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

3. **Installazione dipendenze**:
```bash
npm install @supabase/supabase-js
npm install recharts
npm install react-query
npm install lucide-react
```

## Utilizzo

### Dashboard Reports

```jsx
import { Reports } from './components/reports/Reports';

function App() {
  return (
    <div className="app">
      <Reports />
    </div>
  );
}
```

### Generazione Report

```jsx
import { ReportGenerator } from './components/reports/ReportGenerator';

function ReportPage() {
  const handleReportGenerated = (report) => {
    console.log('Report generato:', report);
  };

  return (
    <ReportGenerator 
      onReportGenerated={handleReportGenerated}
      defaultType="revenue"
    />
  );
}
```

### Schedulazione Report

```jsx
import { ReportScheduler } from './components/reports/ReportScheduler';

function SchedulerPage() {
  return (
    <ReportScheduler 
      onScheduleCreated={(schedule) => {
        console.log('Schedule creato:', schedule);
      }}
    />
  );
}
```

### Hook Personalizzati

```jsx
import { useReports, useReportGeneration } from './hooks/useReports';

function MyComponent() {
  const { data: reports, isLoading } = useReports();
  const generateReport = useReportGeneration();

  const handleGenerate = async () => {
    try {
      const report = await generateReport.mutateAsync({
        type: 'revenue',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        format: 'PDF'
      });
      console.log('Report generato:', report);
    } catch (error) {
      console.error('Errore:', error);
    }
  };

  if (isLoading) return <div>Caricamento...</div>;

  return (
    <div>
      <button onClick={handleGenerate}>Genera Report</button>
      {reports.map(report => (
        <div key={report.id}>{report.name}</div>
      ))}
    </div>
  );
}
```

## API Reference

### ReportingService

#### `getReports(filters?)`
Recupera la lista dei report.

**Parametri:**
- `filters` (opzionale): Oggetto con filtri per tipo, data, ecc.

**Ritorna:** `Promise<Report[]>`

#### `generateReport(params)`
Genera un nuovo report.

**Parametri:**
- `type`: Tipo di report ('revenue', 'expenses', 'profit')
- `startDate`: Data inizio (ISO string)
- `endDate`: Data fine (ISO string)
- `format`: Formato output ('PDF', 'Excel')
- `customName` (opzionale): Nome personalizzato

**Ritorna:** `Promise<Report>`

#### `getReportMetrics()`
Recupera le metriche per la dashboard.

**Ritorna:** `Promise<Metrics>`

#### `getChartData(type, period?)`
Recupera dati per i grafici.

**Parametri:**
- `type`: Tipo di grafico ('revenue', 'expenses')
- `period` (opzionale): Periodo ('week', 'month', 'year')

**Ritorna:** `Promise<ChartData[]>`

### Schedulazione

#### `getSchedules()`
Recupera tutte le schedulazioni.

**Ritorna:** `Promise<Schedule[]>`

#### `createSchedule(schedule)`
Crea una nuova schedulazione.

**Parametri:**
- `name`: Nome della schedulazione
- `reportType`: Tipo di report
- `frequency`: Frequenza ('daily', 'weekly', 'monthly')
- `dayOfWeek`: Giorno della settimana (0-6)
- `time`: Ora di esecuzione (HH:mm)
- `email`: Email destinatario

**Ritorna:** `Promise<Schedule>`

#### `updateSchedule(id, updates)`
Aggiorna una schedulazione esistente.

**Ritorna:** `Promise<Schedule>`

#### `deleteSchedule(id)`
Elimina una schedulazione.

**Ritorna:** `Promise<void>`

## Tipi TypeScript

```typescript
interface Report {
  id: string;
  name: string;
  type: 'revenue' | 'expenses' | 'profit';
  format: 'PDF' | 'Excel';
  filePath?: string;
  createdAt: string;
  updatedAt: string;
}

interface Metrics {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  revenueGrowth: number;
  expenseGrowth: number;
  profitMargin: number;
}

interface ChartData {
  date: string;
  value: number;
  category?: string;
}

interface Schedule {
  id: string;
  name: string;
  reportType: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  dayOfWeek?: number;
  time: string;
  email: string;
  enabled: boolean;
  createdAt: string;
}

interface ReportGenerationParams {
  type: 'revenue' | 'expenses' | 'profit';
  startDate: string;
  endDate: string;
  format: 'PDF' | 'Excel';
  customName?: string;
}
```

## Testing

### Esecuzione Test

```bash
# Test unitari
npm test

# Test con coverage
npm run test:coverage

# Test E2E
npm run test:e2e

# Test specifici
npm test -- --testPathPattern=reports
```

### Struttura Test

- **Unit Tests**: Test per componenti, hook e servizi
- **Integration Tests**: Test per flussi completi
- **E2E Tests**: Test end-to-end con Playwright

### Mock e Fixtures

I test utilizzano mock per:
- Supabase client
- WebSocket connections
- File downloads
- API responses

## Performance

### Ottimizzazioni Implementate

1. **Lazy Loading**: Componenti caricati on-demand
2. **Memoization**: React.memo per componenti pesanti
3. **Virtual Scrolling**: Per liste lunghe di report
4. **Debouncing**: Per ricerche e filtri
5. **Caching**: React Query per cache intelligente

### Metriche Performance

- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Time to Interactive**: < 3s
- **Cumulative Layout Shift**: < 0.1

## Accessibilità

### Standard Implementati

- **WCAG 2.1 AA**: Conformità completa
- **Keyboard Navigation**: Supporto completo
- **Screen Readers**: ARIA labels e roles
- **Color Contrast**: Ratio minimo 4.5:1
- **Focus Management**: Indicatori visibili

### Test Accessibilità

```bash
# Test automatici accessibilità
npm run test:a11y

# Audit con axe-core
npm run audit:a11y
```

## Troubleshooting

### Problemi Comuni

#### 1. Report non si genera
**Sintomi**: Errore durante generazione
**Soluzioni**:
- Verificare connessione Supabase
- Controllare permessi database
- Verificare formato date

#### 2. WebSocket non funziona
**Sintomi**: Notifiche non arrivano
**Soluzioni**:
- Verificare URL WebSocket
- Controllare firewall
- Verificare stato server WebSocket

#### 3. Schedulazione non funziona
**Sintomi**: Report non vengono inviati
**Soluzioni**:
- Verificare configurazione cron
- Controllare servizio email
- Verificare fuso orario

### Debug

```javascript
// Abilitare debug mode
localStorage.setItem('debug', 'reports:*');

// Logs dettagliati
console.log('Report generation params:', params);
console.log('WebSocket status:', wsStatus);
```

## Contribuire

### Guidelines

1. **Code Style**: Seguire ESLint config
2. **Testing**: Coverage minimo 80%
3. **Documentation**: Documentare nuove API
4. **Accessibility**: Test a11y obbligatori

### Processo

1. Fork del repository
2. Creare feature branch
3. Implementare con test
4. Eseguire tutti i test
5. Creare Pull Request

## Roadmap

### Versione 2.0
- [ ] Report personalizzati con drag & drop
- [ ] Dashboard builder visuale
- [ ] Integrazione con servizi esterni
- [ ] Machine learning per insights

### Versione 2.1
- [ ] Mobile app companion
- [ ] API pubblica
- [ ] Plugin system
- [ ] Multi-tenant support

## Supporto

- **Documentation**: [docs.nexamanager.com](https://docs.nexamanager.com)
- **Issues**: [GitHub Issues](https://github.com/nexamanager/issues)
- **Discord**: [Community Server](https://discord.gg/nexamanager)
- **Email**: support@nexamanager.com

## Licenza

MIT License - vedere [LICENSE](LICENSE) per dettagli.