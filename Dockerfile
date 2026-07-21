# syntax=docker/dockerfile:1

# ── Build (discarded after compile) ──
FROM node:22-bookworm-slim AS build
WORKDIR /app

# @infynox/pretheeksha-design comes from the public npm registry (no GITHUB_TOKEN).
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .

# Coolify: set these as build-time env / args per environment.
ARG SITE_URL=https://pretheeksha.com
ARG API_BASE_URL=http://127.0.0.1:8000/api/v1
ARG PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api/v1
ARG PUBLIC_BOOKING_APP_URL=http://localhost:3000/
ARG PUBLIC_LEAD_PURPOSE_CODE=marketing
ARG CONTENT_FAIL_CLOSED=true
ARG ALLOW_CONTENT_FALLBACK=false
ARG PUBLIC_ENABLE_BUG_REPORTS=

ENV SITE_URL=$SITE_URL \
    API_BASE_URL=$API_BASE_URL \
    PUBLIC_API_BASE_URL=$PUBLIC_API_BASE_URL \
    PUBLIC_BOOKING_APP_URL=$PUBLIC_BOOKING_APP_URL \
    PUBLIC_LEAD_PURPOSE_CODE=$PUBLIC_LEAD_PURPOSE_CODE \
    CONTENT_FAIL_CLOSED=$CONTENT_FAIL_CLOSED \
    ALLOW_CONTENT_FALLBACK=$ALLOW_CONTENT_FALLBACK \
    PUBLIC_ENABLE_BUG_REPORTS=$PUBLIC_ENABLE_BUG_REPORTS \
    NODE_ENV=production

RUN npm run build \
    && find dist -name '*.map' -delete 2>/dev/null || true

# ── Runtime: Alpine nginx, single worker, static files only ──
FROM nginx:1.27-alpine AS runner

# Drop default site + junk; keep image tiny.
RUN rm -rf /usr/share/nginx/html/* /etc/nginx/conf.d/default.conf

COPY nginx.main.conf /etc/nginx/nginx.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

# Non-root: nginx alpine master still needs root to bind :80;
# workers run as the nginx user via the default image entrypoint.
EXPOSE 80
STOPSIGNAL SIGQUIT
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
