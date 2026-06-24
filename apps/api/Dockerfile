# ==========================================
# STAGE 1: Build NestJS API & Prisma Client
# ==========================================
FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY nx.json ./
COPY tsconfig.base.json ./

RUN npm ci

COPY . .

ARG DATABASE_URL

RUN npx nx run database:prisma-generate
RUN npx nx build api --prod

# ==========================================
# STAGE 2: Production Runner
# ==========================================
FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Bước 1: Copy file package.json đã được Nx prune (lọc) riêng cho ứng dụng API
COPY --from=builder /app/dist/apps/api/package*.json ./

# Bước 2: Cài đặt các dependencies cho API (ví dụ: @prisma/client, @prisma/adapter-pg...)
RUN npm ci --only=production

# 🔥 SỬA ĐỔI QUAN TRỌNG: Cài đặt prisma cục bộ thay vì global 
# Việc này giúp file prisma.config.ts có thể resolve được import { defineConfig } from "prisma/config"
RUN npm install prisma@7.8.0 --save-prod
RUN npm install @prisma/client

# Bước 3: Copy source code đã compile và thư mục database cấu hình
COPY --from=builder /app/dist/apps/api ./
COPY --from=builder /app/libs/backend/database ./libs/backend/database

EXPOSE 5000

# 🔥 SỬA ĐỔI QUAN TRỌNG: Dùng 'npx prisma' để gọi CLI cục bộ vừa cài ở trên
CMD npx prisma migrate deploy --config=./libs/backend/database/prisma.config.ts && node main.js