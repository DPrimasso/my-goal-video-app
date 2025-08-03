# syntax=docker/dockerfile:1

FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -g 1001 -S app \
    && adduser -S app -G app -u 1001 \
    && apk add --no-cache ffmpeg \
    && rm -rf /var/cache/apk/*
COPY --from=build /app ./
RUN npm prune --omit=dev \
    && chown -R app:app /app
USER app
EXPOSE 4000
CMD ["npm", "run", "start:server"]
