# ==========================================
# STAGE 1: Build Next.js App
# ==========================================
FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY nx.json ./
COPY tsconfig.base.json ./

RUN npm ci

COPY . .

# Khai báo các biến môi trường cần thiết tại thời điểm Build (Build-time Env)
# NEXT_PUBLIC_SOCKET_URL được baked vào bundle client JS tại lúc build
ARG NEXT_PUBLIC_SOCKET_URL
ENV NEXT_PUBLIC_SOCKET_URL=${NEXT_PUBLIC_SOCKET_URL}

# Tiến hành build ứng dụng Next.js thông qua Nx
RUN npx nx build web --prod

# ==========================================
# STAGE 2: Production Runner
# ==========================================
FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_SERVER_API_BASE_URL=${NEXT_SERVER_API_BASE_URL}

# Thiết lập User không có quyền root (Non-root) nhằm nâng cao bảo mật hệ thống
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Sao chép các thư mục tĩnh và môi trường standalone từ stage builder
COPY --from=builder /app/dist/apps/web/public ./dist/apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/dist/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/dist/apps/web/.next/static ./dist/apps/web/.next/static

# Chuyển quyền thực thi sang user 'nextjs'
USER nextjs

EXPOSE 3000

# Khởi chạy Next.js Server Standalone
# Ghi chú: File khởi chạy chính sẽ nằm ở đường dẫn apps/web/server.js bên trong folder build
CMD ["node", "apps/web/server.js"]
