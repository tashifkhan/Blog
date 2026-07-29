# Pressroom editor — multi-stage image for home-server / Tailscale hosting.
# Build context: this directory (editor/).

FROM oven/bun:1.2-alpine AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM oven/bun:1.2-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Skip tsc in the image; production runtime only needs the Nitro output.
ENV NODE_ENV=production
RUN bunx vite build

FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3100

# Non-root user
RUN addgroup -S pressroom && adduser -S pressroom -G pressroom

COPY --from=build --chown=pressroom:pressroom /app/.output ./.output
COPY --from=build --chown=pressroom:pressroom /app/package.json ./package.json

USER pressroom
EXPOSE 3100

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3100/ >/dev/null || exit 1

CMD ["node", ".output/server/index.mjs"]
