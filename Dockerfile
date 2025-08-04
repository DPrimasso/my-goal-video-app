# syntax=docker/dockerfile:1

#################################
# 1) Build client (React)
#################################
FROM --platform=linux/amd64 node:20-bullseye-slim AS build-client
WORKDIR /app/client

# installa solo le dipendenze client
COPY client/package*.json ./
RUN npm ci

# copia il codice sorgente e builda la React app
COPY client/ ./
RUN npm run build

#################################
# 2) Build server + include client static
#################################
FROM --platform=linux/amd64 node:20-bullseye-slim AS build-server
WORKDIR /app/server

# prepara il server
COPY server/package*.json ./
RUN npm ci

# copia il resto del server
COPY server/ ./

# copia i file statici del client nella cartella 'public'
COPY --from=build-client /app/client/build ./public

#################################
# 3) Immagine finale per runtime
#################################
FROM --platform=linux/amd64 node:20-bullseye-slim
WORKDIR /app/server

ENV NODE_ENV=production

# crea un gruppo e utente non-root + installa ffmpeg e Google Chrome stable con codec H264
RUN groupadd -g 1001 app \
 && useradd -u 1001 -g app -M -s /usr/sbin/nologin app \
 && apt-get update \
 && apt-get install -y --no-install-recommends wget gnupg ca-certificates \
 && wget -q -O - https://dl.google.com/linux/linux_signing_key.pub \
      | gpg --dearmor -o /usr/share/keyrings/google-linux-signing-keyring.gpg \
 && echo "deb [arch=amd64 signed-by=/usr/share/keyrings/google-linux-signing-keyring.gpg] http://dl.google.com/linux/chrome/deb/ stable main" \
      > /etc/apt/sources.list.d/google-chrome.list \
 && apt-get update \
 && apt-get install -y --no-install-recommends \
      ffmpeg google-chrome-stable libnss3 libfreetype6 libharfbuzz0b fonts-freefont-ttf \
 && rm -rf /var/lib/apt/lists/*

# Configura Puppeteer/Remotion per usare Google Chrome di sistema
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# copia solo la cartella server già pronta con public
COPY --from=build-server /app/server ./

# rimuove devDependencies e setta permessi
RUN npm prune --omit=dev \
 && chown -R app:app /app/server

# prepara cartelle dati e permessi
RUN mkdir -p /app/videos \
 && chown -R app:app /app/videos

# copia il build di React nella posizione che il server si aspetta
COPY --from=build-client /app/client/build /app/client/build

# copia il sorgente client (Remotion) per il renderer
COPY --from=build-client /app/client/src /app/client/src

USER app
EXPOSE 4000

# avvia API + serve statici + Remotion
CMD ["npm", "run", "start"]