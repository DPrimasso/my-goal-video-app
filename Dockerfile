# ---- build (React dentro client/) ----
FROM node:20-alpine AS builder
WORKDIR /app

# copia solo i manifest per sfruttare la cache
COPY client/package*.json ./client/

# install
WORKDIR /app/client
# Se HAI package-lock.json in client:
RUN npm ci
# Se NON hai package-lock.json, sostituisci la riga sopra con:
# RUN npm install

# copia il codice del client e builda
COPY client/ /app/client

# variabili REACT_APP_ usate a build-time
ARG REACT_APP_START_RENDER_URL
ARG REACT_APP_RENDER_STATUS_URL
ARG REACT_APP_AWS_REGION
ARG REACT_APP_S3_PUBLIC_BASE
ENV REACT_APP_START_RENDER_URL=$REACT_APP_START_RENDER_URL
ENV REACT_APP_RENDER_STATUS_URL=$REACT_APP_RENDER_STATUS_URL
ENV REACT_APP_AWS_REGION=$REACT_APP_AWS_REGION
ENV REACT_APP_S3_PUBLIC_BASE=$REACT_APP_S3_PUBLIC_BASE

RUN npm run build

# ---- runtime con serve su 10000 ----
FROM node:20-alpine
WORKDIR /app
RUN npm i -g serve
COPY --from=builder /app/client/build /app/build
ENV PORT=10000
EXPOSE 10000
CMD ["serve", "-s", "build", "-l", "10000"]