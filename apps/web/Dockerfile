# ==========================================
# STAGE 1: Build Next.js App
# ==========================================
FROM node:24-bookworm-slim AS builder

WORKDIR /app

COPY package*.json ./
COPY nx.json ./
COPY tsconfig.base.json ./

RUN npm ci

COPY . .

# Khai báo các biến môi trường cần thiết tại thời điểm Build (Build-time Env)
# NEXT_PUBLIC_SOCKET_URL được baked vào bundle client JS tại lúc build
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_SOCKET_URL
ARG DATABASE_URL
ENV NODE_ENV=production
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
ENV NEXT_PUBLIC_SOCKET_URL=${NEXT_PUBLIC_SOCKET_URL}
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

# Tiến hành build ứng dụng Next.js thông qua Nx
RUN npx nx run database:prisma-generate
RUN npx nx build types
RUN npx nx build web --prod

# ==========================================
# STAGE 2: Production Runner
# ==========================================
FROM node:24-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
# API_INTERNAL_URL is provided at runtime for SSR/actions; public URLs are build args.

# Thiết lập User không có quyền root (Non-root) nhằm nâng cao bảo mật hệ thống
RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 --gid nodejs nextjs

# Sao chép các thư mục tĩnh và môi trường standalone từ stage builder
COPY --from=builder /app/dist/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/dist/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/dist/apps/web/.next/static ./dist/apps/web/.next/static

# Chuyển quyền thực thi sang user 'nextjs'
USER nextjs

EXPOSE 3000

# Khởi chạy Next.js Server Standalone
# Ghi chú: File khởi chạy chính sẽ nằm ở đường dẫn apps/web/server.js bên trong folder build
CMD ["node", "apps/web/server.js"]
