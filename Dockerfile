# syntax=docker.io/docker/dockerfile:1

FROM node:22-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_APP_NAME
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_SUPPORT_MAIL
ARG NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
ARG NEXT_PUBLIC_USER_MAP_ID
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_PRICING_FREE_MONTHLY
ARG NEXT_PUBLIC_PRICING_FREE_YEARLY
ARG NEXT_PUBLIC_PRICING_EFFICIENT_MONTHLY
ARG NEXT_PUBLIC_PRICING_EFFICIENT_YEARLY
ARG NEXT_PUBLIC_PRICING_PRO_MONTHLY
ARG NEXT_PUBLIC_PRICING_PRO_YEARLY
ARG NEXT_PUBLIC_PRICING_BASIC_MONTHLY
ARG NEXT_PUBLIC_PRICING_BASIC_YEARLY
ARG GCP_PROJECT_ID
ARG GCP_BUCKET_NAME

ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_SUPPORT_MAIL=$NEXT_PUBLIC_SUPPORT_MAIL
ENV NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=$NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
ENV NEXT_PUBLIC_USER_MAP_ID=$NEXT_PUBLIC_USER_MAP_ID
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_PRICING_FREE_MONTHLY=$NEXT_PUBLIC_PRICING_FREE_MONTHLY
ENV NEXT_PUBLIC_PRICING_FREE_YEARLY=$NEXT_PUBLIC_PRICING_FREE_YEARLY
ENV NEXT_PUBLIC_PRICING_EFFICIENT_MONTHLY=$NEXT_PUBLIC_PRICING_EFFICIENT_MONTHLY
ENV NEXT_PUBLIC_PRICING_EFFICIENT_YEARLY=$NEXT_PUBLIC_PRICING_EFFICIENT_YEARLY
ENV NEXT_PUBLIC_PRICING_PRO_MONTHLY=$NEXT_PUBLIC_PRICING_PRO_MONTHLY
ENV NEXT_PUBLIC_PRICING_PRO_YEARLY=$NEXT_PUBLIC_PRICING_PRO_YEARLY
ENV NEXT_PUBLIC_PRICING_BASIC_MONTHLY=$NEXT_PUBLIC_PRICING_BASIC_MONTHLY
ENV NEXT_PUBLIC_PRICING_BASIC_YEARLY=$NEXT_PUBLIC_PRICING_BASIC_YEARLY
ENV GCP_PROJECT_ID=$GCP_PROJECT_ID
ENV GCP_BUCKET_NAME=$GCP_BUCKET_NAME
ENV DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build
ENV BETTER_AUTH_SECRET=ci-build-placeholder-secret-not-used-at-runtime
ENV BETTER_AUTH_URL=http://localhost:3000
ENV AUTH_SECRET=ci-build-placeholder-secret-not-used-at-runtime
ENV CSRF_SECRET=ci-build-placeholder-secret-not-used-at-runtime
ENV STRIPE_SECRET_KEY=sk_test_build_placeholder_not_used_at_runtime
ENV STRIPE_SUBSCRIBE_WEBHOOK_SECRET=whsec_build_placeholder_not_used_at_runtime
ENV OAUTH_GOOGLE_CLIENT_ID=build-placeholder-oauth-client-id
ENV OAUTH_GOOGLE_CLIENT_SECRET=build-placeholder-oauth-secret

RUN npm run build

FROM base AS runner
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates ffmpeg \
    && rm -rf /var/lib/apt/lists/* \
    && addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME=0.0.0.0
ENV FFMPEG_PATH=/usr/bin/ffmpeg

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/messages ./messages
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

USER nextjs
EXPOSE 8080

CMD ["node", "server.js"]
