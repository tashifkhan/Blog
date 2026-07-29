# Pressroom editor — multi-stage image for home-server / Tailscale hosting.
# Build context: this directory (editor/).
#
# Built with Bun; Nitro emits a Bun.serve entry when the build host is Bun,
# so the runner must also be Bun (Node hits "Bun is not defined").

FROM oven/bun:1.2-alpine AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM oven/bun:1.2-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
RUN bunx vite build

FROM oven/bun:1.2-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3100

RUN addgroup -S pressroom && adduser -S pressroom -G pressroom

COPY --from=build --chown=pressroom:pressroom /app/.output ./.output
COPY --from=build --chown=pressroom:pressroom /app/package.json ./package.json

USER pressroom
EXPOSE 3100

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3100/ >/dev/null || exit 1

CMD ["bun", "run", ".output/server/index.mjs"]
