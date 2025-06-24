# ReceiptUpload Component

Un componente React per gestire l'upload delle ricevute con funzionalità avanzate di drag & drop, anteprima e validazione.

## Caratteristiche

- ✅ **Drag & Drop**: Trascina e rilascia i file direttamente nell'area di upload
- ✅ **Multi-file**: Supporta il caricamento di più file contemporaneamente
- ✅ **Anteprima**: Mostra l'anteprima delle immagini prima del caricamento
- ✅ **Validazione**: Controlla tipo di file, dimensione e duplicati
- ✅ **Progress feedback**: Mostra lo stato di caricamento e i risultati
- ✅ **Dark mode**: Supporta il tema scuro
- ✅ **Responsive**: Ottimizzato per dispositivi mobili e desktop

## Formati Supportati

- **Immagini**: JPG, PNG, GIF
- **Documenti**: PDF
- **Dimensione massima**: 10MB per file (configurabile)

## Utilizzo

```jsx
import ReceiptUpload from '@components/ReceiptUpload';

function MyComponent() {
  const [showUpload, setShowUpload] = useState(false);

  const handleUploadComplete = (uploadedFiles) => {
    console.log('File caricati:', uploadedFiles);
    // Gestisci i file caricati
  };

  return (
    <div>
      <button onClick={() => setShowUpload(true)}>Carica Ricevute</button>

      <ReceiptUpload
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        onUploadComplete={handleUploadComplete}
      />
    </div>
  );
}
```

## Props

| Prop               | Tipo       | Default                                                       | Descrizione                                                        |
| ------------------ | ---------- | ------------------------------------------------------------- | ------------------------------------------------------------------ |
| `isOpen`           | `boolean`  | -                                                             | Controlla la visibilità del modal                                  |
| `onClose`          | `function` | -                                                             | Callback chiamata quando il modal viene chiuso                     |
| `onUploadComplete` | `function` | -                                                             | Callback chiamata al completamento dell'upload con i file caricati |
| `maxFiles`         | `number`   | `5`                                                           | Numero massimo di file per upload                                  |
| `allowedTypes`     | `string[]` | `['image/jpeg', 'image/png', 'image/gif', 'application/pdf']` | Tipi di file consentiti                                            |
| `maxFileSize`      | `number`   | `10485760`                                                    | Dimensione massima per file in bytes (10MB)                        |
| `title`            | `string`   | `"Carica Ricevute"`                                           | Titolo del modal                                                   |
| `description`      | `string`   | `"Carica le tue ricevute..."`                                 | Descrizione mostrata nel modal                                     |

## Callback onUploadComplete

La funzione `onUploadComplete` riceve un array di oggetti con i seguenti campi:

```javascript
[
  {
    name: 'ricevuta-1.jpg',
    url: 'https://storage.url/path/to/file',
    path: 'user123/receipts/1234567890-ricevuta-1.jpg',
  },
  // ... altri file
];
```

## Integrazione con StorageService

Il componente utilizza automaticamente il `StorageService` esistente per:

- Upload dei file nel bucket `receipts`
- Validazione dei tipi di file
- Generazione degli URL pubblici
- Gestione degli errori

## Esempi di Personalizzazione

### Upload di documenti generici

```jsx
<ReceiptUpload
  title="Carica Documenti"
  description="Carica i tuoi documenti aziendali"
  allowedTypes={['application/pdf', 'image/jpeg', 'image/png']}
  maxFiles={3}
  maxFileSize={5242880} // 5MB
/>
```

### Solo immagini

```jsx
<ReceiptUpload
  title="Carica Foto"
  allowedTypes={['image/jpeg', 'image/png', 'image/gif']}
  maxFiles={10}
/>
```

## Styling

Il componente utilizza Tailwind CSS e supporta automaticamente:

- Tema scuro/chiaro
- Responsive design
- Animazioni smooth
- Stati hover e focus

## Dipendenze

- React 18+
- @headlessui/react
- @heroicons/react
- Tailwind CSS
- StorageService (incluso nel progetto)
- uiUtils (per le notifiche)

## Note Tecniche

- I file vengono caricati sequenzialmente per evitare sovraccarico
- Le anteprime delle immagini sono generate client-side
- La validazione avviene sia client-side che server-side
- Gli errori vengono mostrati con dettagli specifici
- Il componente gestisce automaticamente la pulizia della memoria
