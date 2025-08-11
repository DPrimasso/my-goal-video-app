# ---- build ----
FROM node:20-alpine AS builder
WORKDIR /app

# copia solo i manifest per sfruttare la cache
COPY client/package*.json ./
RUN npm ci

# copia il resto del codice del client e builda
COPY client/ .
RUN npm run build

# ---- serve statici con nginx unprivileged ----
FROM nginxinc/nginx-unprivileged:stable-alpine

# conf per SPA (fallback su index.html)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# copia la build
COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE 8080
USER 101