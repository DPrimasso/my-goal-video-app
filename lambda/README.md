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

Il rendering reale con Chromium deve essere verificato nel preview AWS prima del passaggio dell'alias `live`.

## Publisher Instagram

`instagram-story-publisher/` è un pacchetto Lambda indipendente: riceve il PNG generato, verifica PIN, destinazione Instagram e idempotenza atomica, converte in JPEG 1080×1920 e pubblica una Storia tramite Instagram API. Attende l’elaborazione Meta fino a cinque minuti e consente di recuperare un tentativo interrotto senza duplicarlo. Il relativo stack è `infra/instagram-publisher-template.yaml`; configurazione e attivazione sono descritte in `docs/instagram-publishing.md`.
