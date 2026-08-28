# Deploy e rollback

## Prerequisiti una tantum

1. Collegare il servizio Render al repository GitHub e al branch `main`.
2. Importare o ricreare il servizio tramite `render.yaml`, verificando che il nome corrisponda al servizio esistente.
3. Configurare su Render le tre variabili `VITE_*_IMAGE_URL`.
4. Creare un ruolo IAM assumibile da GitHub Actions tramite OIDC e salvarne l’ARN nel secret `AWS_DEPLOY_ROLE_ARN`.
5. Configurare le repository variables `ASSETS_BUCKET_NAME` e `RENDER_ORIGIN`.

Non applicare il Blueprint finché il commit mostrato nel pannello Render non coincide con il commit atteso di `main`.

## Flusso ordinario

1. La pull request esegue lint, type-check, test frontend, test browser sulle due viewport, test Lambda, build, budget dimensionale e validazione SAM.
2. Dopo il merge, il workflow AWS sincronizza `assets/s3`, pubblica nuove versioni Lambda e aggiorna gli alias `live`.
3. Render attende il completamento della CI e costruisce il Dockerfile direttamente dal commit di `main`.
4. Verificare `/health` e generare una formazione, un goal e un risultato finale.

Le variabili Vite sono valori pubblici incorporati nel bundle, quindi non devono contenere segreti.

## Prima attivazione dello stack SAM

Lo stack introduce Function URL associate agli alias `live`, quindi gli URL possono differire da quelli storici. Eseguire prima il deploy AWS, provarne gli output, aggiornare le variabili Render e solo dopo pubblicare il frontend.

AWS SAM crea le policy pubbliche necessarie a `AuthType: NONE`. CORS ammette soltanto l’origine Render configurata; questo limita i browser ma non costituisce autenticazione.

## Rollback

- Frontend: usare la funzione Rollback di Render verso il deploy precedente.
- Lambda: spostare l’alias `live` alla versione precedente oppure effettuare il rollback dello stack CloudFormation.
- Endpoint: ripristinare temporaneamente su Render i precedenti URL e avviare una nuova build.
- Asset: gli upload non eliminano file remoti; ripubblicare la versione Git precedente dell’asset interessato.

Le vecchie funzioni e i vecchi endpoint vanno eliminati solo dopo uno smoke test completo e un periodo di osservazione.
