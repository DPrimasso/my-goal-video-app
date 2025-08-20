# My Goal Video App - Lambda Functions

Questo repository contiene le AWS Lambda functions per il rendering video utilizzando Remotion 4.0.333.

## 🚀 Funzionalità

### start-render Lambda
Avvia il processo di rendering di un video Remotion su AWS Lambda.

**Parametri di input supportati:**
- `composition` / `compositionId`: ID della composizione da renderizzare
- `inputProps`: Props personalizzati per la composizione
- `outName`: Nome del file di output
- `codec`: Codec video (default: 'h264')
- `jpegQuality`: Qualità JPEG per immagini (default: 80, range: 0-100)
- `frameRange`: Range di frame specifico
- `numberOfGifLoops`: Numero di loop per GIF
- `audioBitrate`: Bitrate audio personalizzato
- `videoBitrate`: Bitrate video personalizzato
- `crf`: Costant Rate Factor per la compressione
- `pixelFormat`: Formato pixel
- `audioCodec`: Codec audio
- `videoCodec`: Codec video
- `height`: Altezza personalizzata
- `width`: Larghezza personalizzata
- `fps`: FPS personalizzati
- `durationInFrames`: Durata in frame

**Risposta di successo:**
```json
{
  "success": true,
  "bucketName": "remotion-render-xxx",
  "renderId": "render-xxx",
  "message": "Render started successfully"
}
```

### render-status Lambda
Controlla lo stato di un rendering in corso.

**Parametri di input:**
- `renderId`: ID del rendering da controllare
- `bucketName`: Nome del bucket S3 (opzionale)

**Risposta di successo:**
```json
{
  "success": true,
  "renderId": "render-xxx",
  "bucketName": "remotion-render-xxx",
  "status": {
    "renderId": "render-xxx",
    "status": "rendering",
    "progress": 0.5
  }
}
```

## 🔧 Configurazione

### Variabili d'ambiente richieste:
- `REMOTION_LAMBDA_FUNCTION_NAME`: Nome della funzione Lambda Remotion
- `REMOTION_SERVE_URL` o `REMOTION_SITE_NAME`: URL o nome del sito Remotion
- `ASSET_BUCKET`: Bucket S3 per gli asset dinamici (opzionale)
- `AWS_REGION`: Regione AWS (default: eu-west-1)

### Variabili d'ambiente opzionali:
- `DEFAULT_COMPOSITION_ID`: Composizione di default (default: 'GoalComp')

## 📦 Installazione e Deploy

1. **Installazione dipendenze:**
   ```bash
   npm install
   ```

2. **Build del bundle:**
   ```bash
   cd ../client
   npm run build:lambda
   ```

3. **Deploy su AWS Lambda:**
   - Carica il file `app-bundle.zip` come layer per la funzione Lambda
   - Configura le variabili d'ambiente
   - Imposta i timeout appropriati (raccomandato: 15 minuti)

## 🆕 Novità in Remotion 4.0.333

- **Migliore gestione degli errori** con stack trace dettagliati
- **Headers HTTP standardizzati** per tutte le risposte
- **Logging migliorato** per debugging
- **Supporto per parametri avanzati** di rendering
- **Gestione automatica dei bucket** S3
- **Validazione dei parametri** migliorata

## 🐛 Troubleshooting

### Version mismatch
Se vedi errori di version mismatch:
```bash
cd client
npm run build:lambda:check
```

### Clean build
Per un build pulito:
```bash
cd client
npm run build:lambda:clean
npm run build:lambda
```

### Logs
Controlla i CloudWatch logs per:
- Errori di parsing dei parametri
- Problemi di connessione S3
- Timeout delle funzioni

## 📊 Monitoraggio

- **CloudWatch Metrics**: Durata, errori, throttling
- **CloudWatch Logs**: Log dettagliati di ogni esecuzione
- **X-Ray**: Tracciamento delle chiamate tra servizi

## 🔒 Sicurezza

- **IAM**: Utilizza il principio del minimo privilegio
- **VPC**: Configura le funzioni in una VPC privata se necessario
- **Encryption**: Abilita la crittografia in transito e a riposo
- **Logging**: Abilita CloudTrail per audit

## 📝 Note di Sviluppo

- Le funzioni sono ottimizzate per Node.js 18+
- Utilizza il caching di Remotion per build più veloci
- Supporta sia JSON che form-encoded nei body delle richieste
- Gestisce automaticamente i bucket S3 per il rendering
