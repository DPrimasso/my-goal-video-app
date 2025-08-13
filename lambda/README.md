# Lambda - My Goal Video App

Funzioni AWS Lambda per la generazione video in produzione.

## 🏗️ Architettura Lambda

```
lambda/
├── start-render/           # Avvia generazione video
│   └── index.js           # Handler principale
├── render-status/          # Controlla stato generazione
│   └── index.js           # Handler status
├── package.json            # Dipendenze Lambda
└── app-bundle.zip          # Bundle Remotion per Lambda
```

## 🚀 Funzioni Lambda

### **1. start-render**
**Endpoint**: `POST /start-render`

**Funzione**: Avvia la generazione di un video personalizzato

**Input**:
```json
{
  "compositionId": "GoalComp",
  "inputProps": {
    "playerName": "Davide Fava",
    "minuteGoal": 35,
    "partialScore": "2-1",
    "s3PlayerUrl": "https://...",
    "overlayImage": "https://...",
    "goalClip": "https://..."
  }
}
```

**Output**:
```json
{
  "renderId": "abc123",
  "bucketName": "video-bucket",
  "status": "rendering"
}
```

### **2. render-status**
**Endpoint**: `GET /render-status?bucketName=...&renderId=...`

**Funzione**: Controlla lo stato di generazione di un video

**Input**:
- `bucketName`: Nome bucket S3
- `renderId`: ID del render

**Output**:
```json
{
  "overallProgress": 0.75,
  "outputFile": "video.mp4",
  "outKey": "videos/video.mp4",
  "outBucket": "video-bucket",
  "errors": []
}
```

## 🔧 Configurazione AWS

### **Variabili d'Ambiente Lambda**
```bash
# Remotion
REMOTION_LAMBDA_FUNCTION_NAME=your-function-name
REMOTION_SERVE_URL=https://your-bucket.s3.region.amazonaws.com/sites/deploy-id

# S3
S3_BUCKET=your-video-bucket
S3_REGION=eu-west-1

# API Gateway
API_GATEWAY_URL=https://your-api-gateway-url.com
```

### **IAM Permissions**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::your-video-bucket/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "lambda:InvokeFunction"
      ],
      "Resource": "arn:aws:lambda:region:account:function:*"
    }
  ]
}
```

## 📦 Deploy

### **1. Installazione Dipendenze**
```bash
cd lambda
npm install
```

### **2. Creazione Bundle Remotion**
```bash
# Dal client directory
npm run build:lambda
# Genera app-bundle.zip per Lambda
```

### **3. Deploy Lambda Functions**
```bash
# start-render
zip -r start-render.zip start-render/ node_modules/ package.json

# render-status  
zip -r render-status.zip render-status/ node_modules/ package.json

# Upload su AWS Lambda
```

### **4. Configurazione API Gateway**
- **HTTP API** con CORS abilitato
- **Route**: `POST /start-render` → start-render Lambda
- **Route**: `GET /render-status` → render-status Lambda

## 🎬 Generazione Video

### **Workflow Completo**
1. **Client** invia richiesta a `start-render`
2. **Lambda** avvia render con Remotion
3. **Client** polla `render-status` per progresso
4. **Lambda** completa render e salva su S3
5. **Client** riceve URL video finale

### **Composizioni Video Supportate**
- **`GoalComp`**: Video gol personalizzato
- **`FormationComp`**: Video formazione squadra
- **`FinalResultComp`**: Video risultato finale

## 🔍 Monitoraggio

### **CloudWatch Logs**
- **start-render**: Log generazione video
- **render-status**: Log controllo stato

### **Metriche Importanti**
- Durata generazione video
- Tasso di successo
- Errori comuni
- Utilizzo memoria/CPU

## 🚨 Troubleshooting

### **Errori Comuni**
- **Timeout**: Aumenta timeout Lambda (max 15 min)
- **Memoria**: Aumenta memoria Lambda (min 1024 MB)
- **S3 Permissions**: Verifica IAM policies
- **Bundle Size**: Ottimizza app-bundle.zip

### **Debug**
```bash
# Controlla log CloudWatch
aws logs tail /aws/lambda/start-render

# Test locale con SAM
sam local invoke start-render -e event.json
```

## 📊 Performance

### **Ottimizzazioni**
- **Cold Start**: Bundle minimo
- **Memory**: 2048 MB per video HD
- **Timeout**: 10 minuti per video complessi
- **Concurrency**: Limite per account

### **Costi Stimati**
- **Lambda**: $0.0000166667 per 100ms
- **S3**: $0.023 per GB
- **Data Transfer**: $0.09 per GB

## 🔒 Sicurezza

### **Best Practices**
- **CORS**: Configurato per dominio specifico
- **Input Validation**: Sanitizzazione parametri
- **S3 Bucket**: Privato con accesso controllato
- **API Gateway**: Rate limiting abilitato

### **Autenticazione**
- **API Keys**: Per accesso controllato
- **JWT**: Per utenti autenticati
- **IAM**: Per servizi AWS

## 📚 Risorse

- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)
- [Remotion Lambda Documentation](https://www.remotion.dev/docs/lambda)
- [API Gateway Documentation](https://docs.aws.amazon.com/apigateway/)
- [S3 Documentation](https://docs.aws.amazon.com/s3/)
