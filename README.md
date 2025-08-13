# My Goal Video App

Un'applicazione per la generazione di video personalizzati di gol calcistici con animazioni e overlay personalizzati.

## 🏗️ Architettura del Progetto

```
my-goal-video-app/
├── client/          # Frontend React + Server Express locale
├── lambda/          # Funzioni AWS Lambda per produzione
├── build/           # Build di produzione
└── dist/            # Distribuzione
```

## 🚀 Modalità di Esecuzione

### **Development (Locale)**
- **Frontend**: React app su `localhost:3000`
- **Backend**: Server Express su `localhost:4000`
- **Generazione Video**: Locale con Remotion
- **Storage**: File system locale

### **Production (AWS Lambda)**
- **Frontend**: Build statico su CDN/S3
- **Backend**: Funzioni AWS Lambda
- **Generazione Video**: Serverless su AWS
- **Storage**: Amazon S3

## 🛠️ Tecnologie Utilizzate

- **Frontend**: React + TypeScript
- **Video Generation**: Remotion
- **Backend Locale**: Express.js
- **Backend Production**: AWS Lambda
- **Storage**: File System (dev) / S3 (prod)

## 📁 Struttura Principale

- **`client/`**: Applicazione React completa con server Express integrato
- **`lambda/`**: Funzioni AWS Lambda per la generazione video in produzione
- **`build/`**: Build ottimizzato per produzione
- **`dist/`**: Distribuzione finale

## 🚦 Avvio Rapido

### **Sviluppo Locale**
```bash
cd client
npm install
npm run dev        # Avvia tutto (React + Server)
```

### **Produzione**
```bash
cd client
npm run build     # Build per produzione
# Deploy su AWS Lambda + S3
```

## 🔧 Configurazione

### **Variabili d'Ambiente**
- `REACT_APP_ENVIRONMENT`: `dev` (locale) | `prod` (Lambda)
- `REACT_APP_START_RENDER_URL`: URL Lambda per produzione
- `REACT_APP_RENDER_STATUS_URL`: URL status Lambda per produzione

### **Porte**
- **React App**: 3000
- **Video Server**: 4000
- **Lambda**: 443 (HTTPS)

## 📚 Documentazione Dettagliata

- **`client/README.md`**: Documentazione frontend e server locale
- **`lambda/README.md`**: Documentazione funzioni Lambda

## 🎯 Funzionalità

- ✅ Generazione video personalizzati con overlay
- ✅ Selezione giocatori e minuti gol
- ✅ Gestione punteggi parziali
- ✅ Anteprima video in tempo reale
- ✅ Download video generati
- ✅ Modalità locale e produzione

## 🔄 Workflow

1. **Input**: Selezione giocatore, minuto, punteggio
2. **Generazione**: Creazione video con Remotion
3. **Output**: Video personalizzato con overlay
4. **Download**: Salvataggio video generato

## 📝 Licenza

Progetto privato per uso interno.
