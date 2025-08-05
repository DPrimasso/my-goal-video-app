# My Goal Video App

## Prerequisiti
- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/)

Assicurati che entrambi i comandi `docker` e `docker-compose` siano disponibili nella tua shell.

## Configurazione `.env`
Crea un file `.env` nella radice del progetto con le variabili necessarie:

```
REACT_APP_ASSET_BASE=https://<bucket>.s3.<regione>.amazonaws.com
ASSET_BASE=https://<bucket>.s3.<regione>.amazonaws.com
ASSET_BUCKET=<bucket-name>
AWS_REGION=<your-region>
GOAL_CLIP=s3://<bucket-name>/clips/goal.mov
PORT=4000
```

Le variabili che iniziano con `REACT_APP_` vengono incluse nel bundle del client.
Configura inoltre `AWS_ACCESS_KEY_ID` e `AWS_SECRET_ACCESS_KEY` nell'ambiente del server.

## Comandi principali
Costruisci e avvia tutti i servizi:

```bash
docker-compose up --build
```

Ferma e rimuovi i container:

```bash
docker-compose down
```

Costruisci le immagini dei singoli componenti:

```bash
cd server && npm run docker:build
cd client && npm run docker:build
```

## Sviluppo con `docker-compose.override.yml`
Il file `docker-compose.override.yml` viene caricato automaticamente da `docker-compose`
e fornisce configurazioni utili per lo sviluppo:
monta il codice sorgente locale e usa comandi come `npm run dev` per il server e
`npm start` per il client. In questo modo le modifiche vengono ricaricate in tempo reale.

Per avviare l'ambiente di sviluppo è sufficiente:

```bash
docker-compose up --build
```

Per avviare i servizi **senza** l'override (ad esempio per testare le immagini prodotte):

```bash
docker-compose -f docker-compose.yml up --build
```

