# syntax=docker.io/docker/dockerfile:1

FROM node:22-alpine

# Install dependencies only when needed
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* .npmrc* ./
RUN \
    if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
    elif [ -f package-lock.json ]; then npm install; \
    elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
    else echo "Lockfile not found." && exit 1; \
    fi

# RUN npm install @next/swc-linux-x64-musl
# RUN npm install @next/swc-linux-x64-gnu

# Copy the rest of the application
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
ENV NEXT_TELEMETRY_DISABLED=1

EXPOSE 5555
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create a non-root user
# RUN addgroup --system --gid 1001 nodejs
# RUN adduser --system --uid 1001 nextjs

# # Set proper permissions
# RUN chown -R nextjs:nodejs /app

# Switch to non-root user
# USER nextjs

# Start the application
CMD ["npm", "run", "dev"]
