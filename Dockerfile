# -----------------------------
# 1️⃣ Dependencies Stage
# -----------------------------
FROM node:20-slim AS deps

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

# -----------------------------
# 2️⃣ Builder Stage
# -----------------------------
FROM node:20-slim AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# -----------------------------
# 3️⃣ Runtime Stage
# -----------------------------
FROM node:20-slim

WORKDIR /app

ENV NODE_ENV=production

RUN useradd -m appuser

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts

RUN chown -R appuser:appuser /app

USER appuser

EXPOSE 8888

CMD ["npx", "next", "start", "-p", "8888"]
