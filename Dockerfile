# Deploy ke Railway (atau host Docker long-lived lainnya) - LIHAT README.md
# bagian "Deployment": app ini butuh proses Node yang tetap hidup (Puppeteer
# browser pool warm + storage/render-cache berbasis filesystem lokal), BUKAN
# platform serverless seperti Vercel.

FROM node:20-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# --ignore-scripts: skip "postinstall" (prisma generate) di stage ini - schema
# belum di-copy, jalankan lagi secara eksplisit di stage builder setelah
# source ikut ter-copy.
RUN npm ci --ignore-scripts

FROM node:20-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
# Chromium sistem untuk Puppeteer (lebih kecil & stabil daripada bundel
# Chromium hasil download Puppeteer di image final) + font dasar supaya teks
# PDF (termasuk karakter Indonesia) render dengan benar.
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-liberation \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
