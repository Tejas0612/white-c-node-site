# Native Poppler is required by the catalogue PDF importer.
FROM node:24-bookworm-slim AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM dependencies AS builder
ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
COPY . .
# Build-only placeholders let Next inspect server routes without embedding real
# service credentials in Docker build arguments. Real secrets are runtime-only.
RUN SUPABASE_SERVICE_ROLE_KEY=build-only-placeholder OPENAI_API_KEY=build-only-placeholder RESEND_API_KEY=re_build_placeholder npm run build -- --webpack

FROM node:24-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=10000
RUN apt-get update && apt-get install -y --no-install-recommends poppler-utils ca-certificates fonts-dejavu-core && rm -rf /var/lib/apt/lists/*
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
USER node
EXPOSE 10000
CMD ["node", "server.js"]
