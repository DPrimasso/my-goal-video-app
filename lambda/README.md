# Image generators

I tre handler espongono lo stesso contratto HTTP:

- `POST` valido: `200 image/png`, corpo base64 per Lambda Function URL;
- errore: JSON `{ "code": "...", "message": "..." }`;
- `OPTIONS`: `204`; gli header CORS vengono aggiunti dalla configurazione Function URL.

## Funzioni

- `goal-image/index.js`
- `lineup-image/index.js`
- `final-result-image/index.js`

Validazione, catalogo, risoluzione degli asset, risposte HTTP e ciclo di vita Chromium sono centralizzati in `shared/`.

Il client invia `playerId`; non sono accettati URL immagine. Gli handler ricavano le chiavi S3 esclusivamente dal catalogo e usano `players/player-fallback.svg` quando una fotografia non è disponibile.

## Test

```bash
npm ci
npm test
npm run check
```

Il rendering reale con Chromium deve essere verificato nel preview AWS prima del passaggio dell’alias `live`.
