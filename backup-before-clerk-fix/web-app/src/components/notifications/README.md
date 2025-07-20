# Sistema di Notifiche in Tempo Reale

Questo sistema fornisce notifiche in tempo reale per l'applicazione Nexa Manager utilizzando WebSocket.

## Componenti Principali

### 1. NotificationCenter
Componente React che visualizza e gestisce le notifiche in tempo reale.

**Caratteristiche:**
- Visualizzazione notifiche con icone e colori basati sul tipo
- Filtri per tipo di notifica (tutte, non lette, report, schedule)
- Conteggio notifiche non lette
- Azioni per marcare come lette e cancellare
- Formattazione tempo relativo
- Apertura/chiusura pannello notifiche

**Utilizzo:**
```jsx
import { NotificationCenter } from '../components/notifications';

// Nel componente
<NotificationCenter />
```

### 2. useRealtimeNotifications Hook
Hook personalizzato per gestire le notifiche in tempo reale.

**Caratteristiche:**
- Connessione WebSocket automatica
- Gestione stato notifiche (lette/non lette)
- Integrazione con react-hot-toast
- Conteggio notifiche non lette
- Funzioni per marcare come lette e rimuovere

**Utilizzo:**
```jsx
import { useRealtimeNotifications } from '../hooks/useRealtimeNotifications';

const {
  notifications,
  unreadCount,
  markAsRead,
  markAllAsRead,
  removeNotification,
  clearAll
} = useRealtimeNotifications();
```

### 3. WebSocketProvider
Provider React per gestire la connessione WebSocket globale.

**Caratteristiche:**
- Connessione WebSocket centralizzata
- Gestione riconnessione automatica
- Sottoscrizione a canali specifici
- Coda messaggi per connessioni instabili
- Gestione errori e stati di connessione

**Utilizzo:**
```jsx
import { WebSocketProvider } from '../providers/WebSocketProvider';

// Avvolgere l'app
<WebSocketProvider>
  <App />
</WebSocketProvider>
```

## Configurazione

### WebSocket Configuration
File: `src/config/websocket.js`

```javascript
export const WEBSOCKET_CONFIG = {
  development: {
    url: 'ws://localhost:8080/ws',
    reconnectInterval: 3000,
    maxReconnectAttempts: 5
  },
  production: {
    url: 'wss://api.nexamanager.com/ws',
    reconnectInterval: 5000,
    maxReconnectAttempts: 10
  }
};
```

### Real-time Configuration
File: `src/config/realtime.js`

```javascript
export const REALTIME_CONFIG = {
  notifications: {
    enabled: true,
    channels: ['notifications', 'user'],
    updateInterval: 1000,
    events: {
      NOTIFICATION_CREATED: 'notification:created',
      NOTIFICATION_READ: 'notification:read'
    }
  }
};
```

## Tipi di Notifiche

### Report Notifications
- `report:generated` - Report generato
- `report:scheduled` - Report programmato
- `report:exported` - Report esportato
- `report:shared` - Report condiviso

### Schedule Notifications
- `schedule:executed` - Schedule eseguito
- `schedule:failed` - Schedule fallito
- `schedule:created` - Nuovo schedule creato

### System Notifications
- `system:error` - Errore di sistema
- `system:warning` - Avviso di sistema
- `system:maintenance` - Modalità manutenzione

### Task Notifications
- `task:assigned` - Task assegnato
- `task:completed` - Task completato
- `task:overdue` - Task in ritardo

## Struttura Notifica

```javascript
{
  id: 'unique-id',
  type: 'report', // 'report', 'schedule', 'system', 'task'
  title: 'Titolo notifica',
  message: 'Messaggio dettagliato',
  timestamp: '2024-01-15T10:30:00Z',
  read: false,
  priority: 'high', // 'low', 'medium', 'high', 'critical'
  data: {
    // Dati aggiuntivi specifici per tipo
    reportId: 'report-123',
    userId: 'user-456'
  }
}
```

## Integrazione con Backend

### WebSocket Events
Il backend deve inviare eventi nel seguente formato:

```javascript
{
  type: 'notification:created',
  data: {
    id: 'notif-123',
    type: 'report',
    title: 'Report Generato',
    message: 'Il report mensile è stato generato con successo',
    timestamp: '2024-01-15T10:30:00Z',
    priority: 'medium',
    data: {
      reportId: 'report-456'
    }
  }
}
```

### API Endpoints
Endpoint REST per gestire le notifiche:

- `GET /api/notifications` - Recupera notifiche
- `PUT /api/notifications/:id/read` - Marca come letta
- `DELETE /api/notifications/:id` - Elimina notifica
- `PUT /api/notifications/read-all` - Marca tutte come lette

## Personalizzazione

### Stili CSS
Personalizza l'aspetto delle notifiche modificando le classi CSS:

```css
.notification-center {
  /* Stili pannello notifiche */
}

.notification-item {
  /* Stili singola notifica */
}

.notification-unread {
  /* Stili notifica non letta */
}
```

### Icone e Colori
Modifica le icone e i colori per tipo in `NotificationCenter.jsx`:

```javascript
const getNotificationIcon = (type) => {
  switch (type) {
    case 'report': return <DocumentTextIcon />;
    case 'schedule': return <ClockIcon />;
    case 'system': return <ExclamationTriangleIcon />;
    default: return <BellIcon />;
  }
};
```

## Performance

### Ottimizzazioni
- Debouncing degli aggiornamenti
- Batch processing delle notifiche
- Lazy loading delle notifiche più vecchie
- Caching locale con localStorage

### Limiti
- Massimo 100 notifiche in memoria
- Riconnessione automatica dopo 5 tentativi falliti
- Timeout connessione: 30 secondi

## Debugging

### Console Logs
Abilita i log di debug:

```javascript
// In development
window.DEBUG_WEBSOCKET = true;
window.DEBUG_NOTIFICATIONS = true;
```

### WebSocket Status
Monitora lo stato della connessione:

```javascript
const { connectionStatus, error } = useWebSocketContext();
console.log('WebSocket Status:', connectionStatus);
```

## Esempi d'Uso

### Notifica Personalizzata
```javascript
// Invia notifica personalizzata
const sendCustomNotification = () => {
  const notification = {
    type: 'custom',
    title: 'Azione Completata',
    message: 'L\'operazione è stata eseguita con successo',
    priority: 'medium'
  };
  
  // Tramite WebSocket
  websocket.send(JSON.stringify({
    type: 'notification:created',
    data: notification
  }));
};
```

### Filtro Notifiche
```javascript
// Filtra notifiche per tipo
const reportNotifications = notifications.filter(n => n.type === 'report');
const unreadNotifications = notifications.filter(n => !n.read);
```

### Gestione Errori
```javascript
// Gestisci errori WebSocket
const { error } = useWebSocketContext();

if (error) {
  console.error('WebSocket Error:', error);
  // Mostra messaggio di errore all'utente
}
```

## Troubleshooting

### Problemi Comuni

1. **Notifiche non arrivano**
   - Verifica connessione WebSocket
   - Controlla configurazione URL
   - Verifica sottoscrizione ai canali

2. **Riconnessione continua**
   - Controlla stabilità rete
   - Verifica configurazione backend
   - Aumenta intervallo riconnessione

3. **Performance lente**
   - Riduci frequenza aggiornamenti
   - Abilita batch processing
   - Limita numero notifiche in memoria

### Log di Debug
```javascript
// Abilita logging dettagliato
localStorage.setItem('debug', 'websocket,notifications');
```