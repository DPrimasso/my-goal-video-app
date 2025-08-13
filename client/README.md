# Client - My Goal Video App

Frontend React con server Express integrato per la generazione locale di video.

> **💡 IMPORTANTE**: Tutti i comandi npm si eseguono da questa cartella (`client/`).

## 🏗️ Architettura

```
client/
├── src/                    # Codice sorgente React
│   ├── components/         # Componenti UI riutilizzabili
│   ├── pages/             # Pagine dell'applicazione
│   ├── services/          # Servizi per video e API
│   ├── hooks/             # Custom hooks React
│   ├── config/            # Configurazione unificata
│   ├── types/             # Definizioni TypeScript
│   └── remotion/          # Composizioni video Remotion
├── public/                 # Asset statici
├── server.js              # Server Express per generazione video
└── package.json           # Dipendenze e script
```

## 🚀 Avvio Sviluppo

### **Installazione Dipendenze**
```bash
npm install
```

### **Avvio Frontend (React)**
```bash
npm start
# Avvia su http://localhost:3000
```

### **Avvio Server Video (Express)**
```bash
node server.js
# Avvia su http://localhost:4000
```

### **Avvio Completo (Entrambi)**
```bash
# Opzione 1: Comando unico (raccomandato)
npm run dev

# Opzione 2: Comandi separati
# Terminal 1
npm start

# Terminal 2  
npm run server
```

### **Comandi Utili**
```bash
npm run dev          # Avvia tutto (React + Server)
npm run start:full   # Alias per npm run dev
npm run clean-start  # Ferma tutto e riavvia
npm run kill-ports   # Ferma tutti i processi
npm run check-ports  # Controlla porte in uso
```

## 🎯 Funzionalità Frontend

### **Pagina Goal**
- Selezione giocatore
- Inserimento minuto gol
- Gestione punteggio parziale
- Generazione video personalizzato
- Anteprima video in tempo reale
- Download video generato

### **Pagina Formazione**
- Visualizzazione formazione squadra
- Posizionamento giocatori
- Generazione video formazione

### **Pagina Risultato Finale**
- Visualizzazione punteggio finale
- Generazione video risultato

## 🔧 Configurazione

### **Configurazione Unificata**
Tutta la configurazione è centralizzata in `src/config/environment.ts`:

```typescript
export const APP_CONFIG = {
  environment: 'dev' | 'prod',
  startRenderUrl: string,      // URL Lambda per produzione
  renderStatusUrl: string,     // URL status Lambda per produzione
  pollIntervalMs: number,      // Intervallo polling
  maxPollAttempts: number,    // Max tentativi polling
  ports: { ... },             // Porte server
  serverUrls: { ... }         // URL server
};
```

### **Modalità di Esecuzione**
- **`dev`**: Generazione locale con server Express
- **`prod`**: Generazione Lambda AWS

## 🎬 Generazione Video

### **Modalità Locale (Development)**
1. **Input**: Dati giocatore, minuto, punteggio
2. **Processo**: Invio a server Express locale
3. **Generazione**: Remotion su server locale
4. **Output**: File salvato in `public/generated/`
5. **Anteprima**: URL `http://localhost:4000/videos/filename.mp4`

### **Modalità Lambda (Production)**
1. **Input**: Dati giocatore, minuto, punteggio
2. **Processo**: Invio a AWS Lambda
3. **Generazione**: Remotion su AWS
4. **Output**: File salvato su S3
5. **Anteprima**: URL S3 pubblico

## 🛠️ Tecnologie

- **React 18** + TypeScript
- **Remotion** per generazione video
- **Express.js** per server locale
- **CSS Modules** per styling
- **Custom Hooks** per gestione stato

## 📁 Struttura Dettagliata

### **`src/components/`**
- **`layout/`**: Header, PageTemplate
- **`ui/`**: Button, Input, Select riutilizzabili

### **`src/pages/`**
- **`Goal.tsx`**: Generazione video gol
- **`Formazione.tsx`**: Visualizzazione formazione
- **`RisultatoFinale.tsx`**: Risultato finale

### **`src/services/`**
- **`localVideoService.ts`**: Generazione locale
- **`videoService.ts`**: Gestione video (locale + Lambda)

### **`src/hooks/`**
- **`useVideoGeneration.ts`**: Hook per generazione video

### **`src/remotion/`**
- **`MyGoalVideo.tsx`**: Composizione video gol
- **`FormationVideo.tsx`**: Composizione video formazione
- **`FinalResultVideo.tsx`**: Composizione video risultato

## 🔄 Workflow Sviluppo

1. **Modifica codice** in `src/`
2. **Hot reload** automatico su `localhost:3000`
3. **Test generazione** video su `localhost:4000`
4. **Debug** con console browser e server

## 🚨 Troubleshooting

### **Porta 3000 occupata**
```bash
# Usa porta diversa
PORT=3001 npm start
```

### **Porta 4000 occupata**
```bash
# Ferma processi esistenti
pkill -f "node server.js"
```

### **Errori di compilazione**
```bash
# Pulisci cache
rm -rf node_modules package-lock.json
npm install
```

## 📦 Build Produzione

```bash
npm run build
# Genera cartella build/ ottimizzata
```

## 🔍 Debug

### **Log Console**
- Frontend: Console browser (F12)
- Server: Terminal con `node server.js`

### **File Video Generati**
- **Locale**: `public/generated/`
- **Produzione**: S3 bucket configurato

## 📚 Risorse

- [React Documentation](https://react.dev/)
- [Remotion Documentation](https://www.remotion.dev/)
- [Express.js Documentation](https://expressjs.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
