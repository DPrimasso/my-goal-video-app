FROM node:22-alpine AS builder
WORKDIR /app

COPY client/package*.json ./client/
WORKDIR /app/client
RUN npm ci

COPY lambda/shared /app/lambda/shared
COPY assets/s3/gol/gol/TuskerGrotesk-3500Medium.woff2 /app/assets/s3/gol/gol/TuskerGrotesk-3500Medium.woff2
COPY client/ /app/client/

ARG VITE_LINEUP_IMAGE_URL
ARG VITE_GOAL_IMAGE_URL
ARG VITE_FINAL_RESULT_IMAGE_URL
ARG VITE_INSTAGRAM_PUBLISH_URL
ENV VITE_LINEUP_IMAGE_URL=$VITE_LINEUP_IMAGE_URL
ENV VITE_GOAL_IMAGE_URL=$VITE_GOAL_IMAGE_URL
ENV VITE_FINAL_RESULT_IMAGE_URL=$VITE_FINAL_RESULT_IMAGE_URL
ENV VITE_INSTAGRAM_PUBLISH_URL=$VITE_INSTAGRAM_PUBLISH_URL

RUN npm run build

FROM nginx:1.29-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/client/dist /usr/share/nginx/html
EXPOSE 10000
