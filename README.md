# Casalpoglio Official

Applicazione interna, accessibile tramite URL senza login, per generare tre grafiche PNG:

- formazione titolare;
- goal;
- risultato finale.

La sorgente applicativa ufficiale è il branch `main`. Render costruisce direttamente il Dockerfile del repository dopo il superamento della CI; le tre funzioni AWS sono definite in `infra/template.yaml`.

## Sviluppo

Richiede Node.js 22.17 o successivo.

```bash
cd client
npm ci
cp .env.example .env.local
npm run dev
```

Le tre variabili `VITE_*_IMAGE_URL` sono obbligatorie. Non esistono endpoint hardcoded o server di generazione locale.

## Verifiche

```bash
node scripts/validate-assets.mjs
cd client && npm run lint && npm run type-check && npm test && npm run test:e2e && npm run build
cd ../lambda && npm test && npm run check
```

I test end-to-end usano Chromium e coprono i tre flussi sia a 390×844 sia a 1440×900, simulando esclusivamente la risposta PNG delle API.

## Struttura

- `client/`: SPA React, TypeScript e Vite.
- `lambda/`: handler dei tre generatori e moduli condivisi.
- `assets/s3/`: fonte versionata degli asset sincronizzati sul bucket.
- `infra/`: stack AWS SAM con alias `live`, Function URL e allarmi.
- `render.yaml`: servizio Docker collegato a GitHub `main`.
- `docs/deployment.md`: configurazione, rilascio e rollback.

Il catalogo canonico di giocatori e squadre è `lambda/shared/catalog.json` ed è importato anche dal frontend.
