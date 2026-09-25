FROM node:20-alpine AS base

FROM base AS prepare
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN npm install -g turbo@^2
COPY . .
RUN turbo prune host --docker

FROM base AS installer
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY --from=prepare /app/out/json/ .
COPY --from=prepare /app/out/package-lock.json ./package-lock.json
RUN npm ci

COPY --from=prepare /app/out/full/ .

ARG TRANSACTIONS_URL
ENV TRANSACTIONS_URL=$TRANSACTIONS_URL
ENV NEXT_TELEMETRY_DISABLED=1

RUN npx turbo run build --filter=host

FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

COPY --from=installer --chown=nextjs:nodejs /app/apps/host/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/host/.next/static ./apps/host/.next/static

EXPOSE 3002
ENV PORT=3002
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/host/server.js"]