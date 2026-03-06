# ── Stage 1: Build ──────────────────────────────────────────────────
FROM node:18-alpine AS builder

WORKDIR /app

# VITE_API_BASE defaults to "/" so all API calls are relative (same host via nginx proxy).
# Override at build time only if you serve the frontend and API on different domains.
ARG VITE_API_BASE=/
ENV VITE_API_BASE=$VITE_API_BASE

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Stage 2: Serve static files ─────────────────────────────────────
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
