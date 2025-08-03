# syntax=docker/dockerfile:1
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -g 1001 -S nodejs \
  && adduser -S nodeuser -G nodejs -u 1001 \
  && apk add --no-cache ffmpeg curl
COPY --from=deps /app/node_modules ./node_modules
COPY . .
USER nodeuser
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s CMD curl -f http://localhost:4000/ || exit 1
CMD ["node", "index.js"]
