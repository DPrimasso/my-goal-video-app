# syntax=docker/dockerfile:1

FROM node:20-alpine AS build
WORKDIR /app
# Ensure compatibility with dependencies expecting legacy OpenSSL
ENV NODE_OPTIONS=--openssl-legacy-provider
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
# Ensure compatibility with dependencies expecting legacy OpenSSL
ENV NODE_OPTIONS=--openssl-legacy-provider
RUN apk add --no-cache ffmpeg
COPY --from=build /app ./
RUN npm prune --omit=dev
EXPOSE 4000
CMD ["npm", "run", "start:server"]
