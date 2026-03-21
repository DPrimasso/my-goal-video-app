# Setup una tantum: Lambda `final-result-image`

## 1. Crea la funzione (console AWS)

1. **Lambda** → Create function → Author from scratch  
   - Name: `final-result-image`  
   - Runtime: **Node.js 20.x**  
   - Architecture: **x86_64**  
   - Execution role: stesso tipo di `goal-image` (permessi base Lambda + lettura S3 sul bucket asset se serve).

2. **Codice**: carica uno zip minimo (o fai prima deploy da GitHub Actions / `./deploy.sh` dopo aver creato la funzione vuota con handler `index.handler`).

3. **Handler**: `index.handler`

4. **Environment variables**
   - `ASSET_BUCKET` = es. `casalpoglio-social-assets` (stesso di goal-image)

5. **General configuration**
   - Timeout: **60 s** (o 90)
   - Memory: **1024 MB**

6. **Layers**: se usi lo stesso approccio di `goal-image` con Chromium, aggiungi lo stesso layer (es. `@sparticuz/chromium` è nel `node_modules` dello zip — allinea a `goal-image`).

7. **Function URL**
   - Configuration → Function URL → Create  
   - Auth: **NONE** (come goal-image, il payload è pubblico)  
   - CORS: consenti `POST` + origin del tuo sito Render (o `*` per test).

Copia l’URL (es. `https://xxxx.lambda-url.eu-west-1.on.aws/`).

## 2. Variabile Render (build)

Nel servizio statico / Docker su **Render**, aggiungi:

```text
REACT_APP_FINAL_RESULT_IMAGE_URL=https://<LA_TUA_FUNCTION_URL>/
```

(`REACT_APP_ENVIRONMENT=prod` come già fai.)

Poi **Manual Deploy** o push su `main` se il build è collegato al repo.

## 3. Deploy codice successivi

- **Locale** (profilo AWS configurato):  
  `cd lambda/final-result-image && ./deploy.sh`

- **CI**: push su `main` che tocca `lambda/final-result-image/**` esegue `.github/workflows/deploy-final-result-image.yml` (richiede secrets `AWS_ACCESS_KEY_ID` e `AWS_SECRET_ACCESS_KEY` nel repo o nell’environment `production`).
