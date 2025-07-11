# API Documentation - Sistema di Reporting

## Panoramica

Questa documentazione descrive tutte le API disponibili per il sistema di reporting di Nexa Manager. Le API sono organizzate in diverse categorie: Reports, Metrics, Scheduling e Notifications.

## Base URL

```
Production: https://api.nexamanager.com/v1
Development: http://localhost:3001/api/v1
```

## Autenticazione

Tutte le API richiedono autenticazione tramite JWT token:

```http
Authorization: Bearer <your_jwt_token>
```

## Rate Limiting

- **Standard**: 100 richieste/minuto
- **Report Generation**: 10 richieste/minuto
- **Bulk Operations**: 5 richieste/minuto

## Formato Risposte

Tutte le risposte seguono questo formato:

```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

In caso di errore:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid parameters provided",
    "details": {
      "field": "startDate",
      "reason": "Date format invalid"
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## Reports API

### GET /reports

Recupera la lista dei report.

**Parametri Query:**
- `type` (string, opzionale): Filtra per tipo (`revenue`, `expenses`, `profit`)
- `format` (string, opzionale): Filtra per formato (`PDF`, `Excel`)
- `startDate` (string, opzionale): Data inizio filtro (ISO 8601)
- `endDate` (string, opzionale): Data fine filtro (ISO 8601)
- `limit` (number, opzionale): Numero massimo risultati (default: 20, max: 100)
- `offset` (number, opzionale): Offset per paginazione (default: 0)
- `sortBy` (string, opzionale): Campo ordinamento (`createdAt`, `name`, `type`)
- `sortOrder` (string, opzionale): Direzione ordinamento (`asc`, `desc`)

**Esempio Richiesta:**
```http
GET /reports?type=revenue&limit=10&sortBy=createdAt&sortOrder=desc
```

**Risposta:**
```json
{
  "success": true,
  "data": {
    "reports": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Revenue Report Q1 2024",
        "type": "revenue",
        "format": "PDF",
        "filePath": "/reports/revenue_q1_2024.pdf",
        "fileSize": 2048576,
        "status": "completed",
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T10:35:00Z",
        "metadata": {
          "startDate": "2024-01-01",
          "endDate": "2024-03-31",
          "totalRecords": 1250,
          "generationTime": 45.2
        }
      }
    ],
    "pagination": {
      "total": 156,
      "limit": 10,
      "offset": 0,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### GET /reports/{id}

Recupera i dettagli di un report specifico.

**Parametri Path:**
- `id` (string, required): ID del report

**Risposta:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Revenue Report Q1 2024",
    "type": "revenue",
    "format": "PDF",
    "filePath": "/reports/revenue_q1_2024.pdf",
    "fileSize": 2048576,
    "status": "completed",
    "downloadUrl": "https://api.nexamanager.com/v1/reports/550e8400-e29b-41d4-a716-446655440000/download",
    "expiresAt": "2024-01-22T10:30:00Z",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:35:00Z",
    "metadata": {
      "startDate": "2024-01-01",
      "endDate": "2024-03-31",
      "totalRecords": 1250,
      "generationTime": 45.2,
      "parameters": {
        "includeCharts": true,
        "includeDetails": true,
        "currency": "EUR"
      }
    }
  }
}
```

### POST /reports/generate

Genera un nuovo report.

**Body:**
```json
{
  "type": "revenue",
  "format": "PDF",
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "customName": "Revenue Report Gennaio 2024",
  "options": {
    "includeCharts": true,
    "includeDetails": true,
    "currency": "EUR",
    "template": "standard"
  }
}
```

**Validazione:**
- `type`: Required, enum [`revenue`, `expenses`, `profit`]
- `format`: Required, enum [`PDF`, `Excel`]
- `startDate`: Required, ISO 8601 date
- `endDate`: Required, ISO 8601 date, must be after startDate
- `customName`: Optional, string, max 100 characters
- `options`: Optional object

**Risposta:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "status": "processing",
    "estimatedTime": 60,
    "progressUrl": "ws://api.nexamanager.com/v1/reports/550e8400-e29b-41d4-a716-446655440001/progress"
  },
  "message": "Report generation started"
}
```

### GET /reports/{id}/download

Scarica un report completato.

**Parametri Path:**
- `id` (string, required): ID del report

**Parametri Query:**
- `inline` (boolean, opzionale): Se true, apre il file nel browser invece di scaricarlo

**Risposta:**
- Content-Type: `application/pdf` o `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- Content-Disposition: `attachment; filename="report.pdf"`
- File binario

### DELETE /reports/{id}

Elimina un report.

**Parametri Path:**
- `id` (string, required): ID del report

**Risposta:**
```json
{
  "success": true,
  "message": "Report deleted successfully"
}
```

---

## Metrics API

### GET /metrics

Recupera le metriche per la dashboard.

**Parametri Query:**
- `period` (string, opzionale): Periodo (`week`, `month`, `quarter`, `year`)
- `startDate` (string, opzionale): Data inizio personalizzata
- `endDate` (string, opzionale): Data fine personalizzata
- `currency` (string, opzionale): Valuta (`EUR`, `USD`)

**Risposta:**
```json
{
  "success": true,
  "data": {
    "totalRevenue": 125000.50,
    "totalExpenses": 87500.25,
    "netProfit": 37500.25,
    "revenueGrowth": 12.5,
    "expenseGrowth": -5.2,
    "profitMargin": 30.0,
    "period": {
      "startDate": "2024-01-01",
      "endDate": "2024-01-31"
    },
    "currency": "EUR",
    "lastUpdated": "2024-01-15T10:30:00Z"
  }
}
```

### GET /metrics/charts

Recupera dati per i grafici.

**Parametri Query:**
- `type` (string, required): Tipo grafico (`revenue`, `expenses`, `profit`)
- `period` (string, opzionale): Periodo (`week`, `month`, `quarter`, `year`)
- `granularity` (string, opzionale): Granularità (`day`, `week`, `month`)
- `startDate` (string, opzionale): Data inizio
- `endDate` (string, opzionale): Data fine

**Risposta:**
```json
{
  "success": true,
  "data": {
    "type": "revenue",
    "period": "month",
    "granularity": "day",
    "data": [
      {
        "date": "2024-01-01",
        "value": 4250.00,
        "category": "Vendite"
      },
      {
        "date": "2024-01-02",
        "value": 3890.50,
        "category": "Servizi"
      }
    ],
    "summary": {
      "total": 125000.50,
      "average": 4032.27,
      "min": 2100.00,
      "max": 8750.00
    }
  }
}
```

---

## Scheduling API

### GET /schedules

Recupera tutte le schedulazioni.

**Parametri Query:**
- `enabled` (boolean, opzionale): Filtra per stato abilitato
- `reportType` (string, opzionale): Filtra per tipo report
- `frequency` (string, opzionale): Filtra per frequenza

**Risposta:**
```json
{
  "success": true,
  "data": {
    "schedules": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "name": "Weekly Revenue Report",
        "reportType": "revenue",
        "frequency": "weekly",
        "dayOfWeek": 1,
        "time": "09:00",
        "email": "admin@company.com",
        "enabled": true,
        "lastRun": "2024-01-08T09:00:00Z",
        "nextRun": "2024-01-15T09:00:00Z",
        "createdAt": "2024-01-01T10:00:00Z",
        "options": {
          "format": "PDF",
          "includeCharts": true
        }
      }
    ]
  }
}
```

### POST /schedules

Crea una nuova schedulazione.

**Body:**
```json
{
  "name": "Monthly Profit Report",
  "reportType": "profit",
  "frequency": "monthly",
  "dayOfMonth": 1,
  "time": "08:00",
  "email": "ceo@company.com",
  "options": {
    "format": "Excel",
    "includeCharts": true,
    "includeDetails": false
  }
}
```

**Validazione:**
- `name`: Required, string, max 100 characters
- `reportType`: Required, enum [`revenue`, `expenses`, `profit`]
- `frequency`: Required, enum [`daily`, `weekly`, `monthly`]
- `dayOfWeek`: Required if frequency=weekly, 0-6 (0=Sunday)
- `dayOfMonth`: Required if frequency=monthly, 1-31
- `time`: Required, HH:mm format
- `email`: Required, valid email format

**Risposta:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440003",
    "name": "Monthly Profit Report",
    "reportType": "profit",
    "frequency": "monthly",
    "dayOfMonth": 1,
    "time": "08:00",
    "email": "ceo@company.com",
    "enabled": true,
    "nextRun": "2024-02-01T08:00:00Z",
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "message": "Schedule created successfully"
}
```

### PUT /schedules/{id}

Aggiorna una schedulazione esistente.

**Parametri Path:**
- `id` (string, required): ID della schedulazione

**Body:** Stesso formato di POST, tutti i campi opzionali

### DELETE /schedules/{id}

Elimina una schedulazione.

**Parametri Path:**
- `id` (string, required): ID della schedulazione

### POST /schedules/{id}/toggle

Attiva/disattiva una schedulazione.

**Parametri Path:**
- `id` (string, required): ID della schedulazione

**Risposta:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440003",
    "enabled": false
  },
  "message": "Schedule disabled successfully"
}
```

---

## WebSocket API

### Connessione

```javascript
const ws = new WebSocket('ws://api.nexamanager.com/v1/ws');

// Autenticazione
ws.send(JSON.stringify({
  type: 'auth',
  token: 'your_jwt_token'
}));
```

### Eventi Report Generation

**Sottoscrizione:**
```javascript
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'report_progress',
  reportId: '550e8400-e29b-41d4-a716-446655440001'
}));
```

**Eventi ricevuti:**

1. **Progress Update:**
```json
{
  "type": "report_progress",
  "reportId": "550e8400-e29b-41d4-a716-446655440001",
  "progress": 45,
  "stage": "generating_charts",
  "message": "Generazione grafici in corso..."
}
```

2. **Completion:**
```json
{
  "type": "report_completed",
  "reportId": "550e8400-e29b-41d4-a716-446655440001",
  "downloadUrl": "https://api.nexamanager.com/v1/reports/550e8400-e29b-41d4-a716-446655440001/download",
  "fileSize": 2048576
}
```

3. **Error:**
```json
{
  "type": "report_error",
  "reportId": "550e8400-e29b-41d4-a716-446655440001",
  "error": {
    "code": "GENERATION_FAILED",
    "message": "Insufficient data for the selected period"
  }
}
```

---

## Codici di Errore

### Client Errors (4xx)

| Codice | Descrizione | Dettagli |
|--------|-------------|----------|
| 400 | Bad Request | Parametri richiesta invalidi |
| 401 | Unauthorized | Token mancante o invalido |
| 403 | Forbidden | Permessi insufficienti |
| 404 | Not Found | Risorsa non trovata |
| 409 | Conflict | Conflitto con stato attuale |
| 422 | Unprocessable Entity | Validazione fallita |
| 429 | Too Many Requests | Rate limit superato |

### Server Errors (5xx)

| Codice | Descrizione | Dettagli |
|--------|-------------|----------|
| 500 | Internal Server Error | Errore interno del server |
| 502 | Bad Gateway | Errore gateway |
| 503 | Service Unavailable | Servizio temporaneamente non disponibile |
| 504 | Gateway Timeout | Timeout gateway |

### Codici Errore Specifici

| Codice | Descrizione |
|--------|-------------|
| INVALID_DATE_RANGE | Range di date invalido |
| REPORT_NOT_FOUND | Report non trovato |
| GENERATION_FAILED | Generazione report fallita |
| SCHEDULE_CONFLICT | Conflitto schedulazione |
| INVALID_EMAIL | Email invalida |
| FILE_TOO_LARGE | File troppo grande |
| UNSUPPORTED_FORMAT | Formato non supportato |

---

## Esempi di Utilizzo

### JavaScript/React

```javascript
// Generazione report con progress tracking
async function generateReportWithProgress(params) {
  // Avvia generazione
  const response = await fetch('/api/v1/reports/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(params)
  });
  
  const { data } = await response.json();
  const reportId = data.id;
  
  // Connetti WebSocket per progress
  const ws = new WebSocket('ws://api.nexamanager.com/v1/ws');
  
  ws.onopen = () => {
    ws.send(JSON.stringify({ type: 'auth', token }));
    ws.send(JSON.stringify({
      type: 'subscribe',
      channel: 'report_progress',
      reportId
    }));
  };
  
  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    
    switch (message.type) {
      case 'report_progress':
        console.log(`Progress: ${message.progress}%`);
        break;
      case 'report_completed':
        console.log('Report completed:', message.downloadUrl);
        ws.close();
        break;
      case 'report_error':
        console.error('Report error:', message.error);
        ws.close();
        break;
    }
  };
}
```

### cURL

```bash
# Genera report
curl -X POST "https://api.nexamanager.com/v1/reports/generate" \
  -H "Authorization: Bearer your_token" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "revenue",
    "format": "PDF",
    "startDate": "2024-01-01",
    "endDate": "2024-01-31"
  }'

# Scarica report
curl -X GET "https://api.nexamanager.com/v1/reports/{id}/download" \
  -H "Authorization: Bearer your_token" \
  -o "report.pdf"

# Crea schedulazione
curl -X POST "https://api.nexamanager.com/v1/schedules" \
  -H "Authorization: Bearer your_token" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Weekly Report",
    "reportType": "revenue",
    "frequency": "weekly",
    "dayOfWeek": 1,
    "time": "09:00",
    "email": "admin@company.com"
  }'
```

---

## Versioning

L'API utilizza versioning semantico:

- **Major**: Cambiamenti breaking
- **Minor**: Nuove funzionalità backward-compatible
- **Patch**: Bug fixes

**Versione Attuale**: v1.2.0

### Deprecation Policy

- Le versioni sono supportate per 12 mesi
- Deprecation notice 6 mesi prima della rimozione
- Header `X-API-Deprecated` per endpoint deprecati

---

## Rate Limiting

### Headers di Risposta

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642248000
X-RateLimit-Window: 60
```

### Gestione Rate Limit

```javascript
if (response.status === 429) {
  const resetTime = response.headers.get('X-RateLimit-Reset');
  const waitTime = resetTime * 1000 - Date.now();
  
  setTimeout(() => {
    // Riprova la richiesta
  }, waitTime);
}
```

---

## Sicurezza

### Best Practices

1. **Token Storage**: Usa secure storage per JWT
2. **HTTPS Only**: Tutte le richieste devono usare HTTPS
3. **Input Validation**: Valida sempre i parametri
4. **Error Handling**: Non esporre informazioni sensibili

### Headers di Sicurezza

```http
Strict-Transport-Security: max-age=31536000
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
```

---

## Supporto

- **API Status**: [status.nexamanager.com](https://status.nexamanager.com)
- **Documentation**: [docs.nexamanager.com/api](https://docs.nexamanager.com/api)
- **Support**: api-support@nexamanager.com
- **Changelog**: [docs.nexamanager.com/changelog](https://docs.nexamanager.com/changelog)