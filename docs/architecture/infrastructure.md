# Hạ tầng (Infrastructure)

> Snapshot: 2026-07-16. Nguồn: `docker-compose.yml`, `docker-compose-dev.yml`, `apps/api/Dockerfile`, `apps/web/Dockerfile`, `nginx/`, `apps/api/src/app/health/`, và quan sát trực tiếp instance chạy local trong phiên làm việc này. (§1-§7 re-verify 2026-07-16: không có commit nào chạm `docker-compose*.yml`/`Dockerfile`/`nginx/` kể từ 2026-07-11 — nội dung các mục đó giữ nguyên, chỉ thêm §8 health check endpoint là mới.)

## 1. Hai topology riêng biệt

- **`docker-compose-dev.yml`** — chỉ Postgres + Redis. Dùng khi chạy app trực tiếp trên máy qua `npx nx serve api` / `npx nx dev web`. Đây là cách phát triển hàng ngày.
- **`docker-compose.yml`** (prod-shaped) — 5 container đầy đủ: `postgres`, `redis`, `api`, `web`, `gateway` (Nginx). Không chạy local trừ khi chủ đích test bản build prod.

## 2. Container & networking (docker-compose.yml)

```
Internet ──80/443──► gateway (Nginx, container ats-gateway)
                          │  (network nội bộ gateway_net, không expose ra ngoài)
                          ├──► api (ats-api, expose 5000)
                          └──► web (ats-web, expose 3000)
api ──► postgres (ats-postgres, expose 5432)
api ──► redis (ats-redis, expose 6379)
```

Chỉ `gateway` có `ports:` map ra host (80, 443). Các service còn lại dùng `expose:` (chỉ nội bộ network `gateway_net`) — không truy cập trực tiếp từ ngoài được, kể cả khi biết IP host.

`depends_on` có `condition: service_healthy` cho `postgres`/`redis` (dựa trên healthcheck `pg_isready`/`redis-cli ping`) — `api` chỉ khởi động sau khi 2 service này healthy.

## 3. Storage

- `postgres_data` — named volume, dữ liệu Postgres persist qua restart container.
- `./uploads:/app/uploads` — **bind mount trực tiếp vào ổ đĩa host**, không phải object storage (S3/GCS/R2). Đây là nơi lưu file CV upload. Đáng lưu ý cho Phase 4: khi `cv-service` tách thành container riêng, nếu chạy nhiều instance hoặc trên node khác, cần chuyển sang shared volume hoặc object storage — ổ đĩa cục bộ của 1 container sẽ không dùng chung được nữa.
- Redis: chưa bật AOF persistence (nằm trong Phase 5 checklist, chưa làm) — nếu Redis container mất, toàn bộ job đang chờ trong BullMQ queue mất theo (mất dữ liệu ở lớp queue, không phải DB).

## 4. SSL / Reverse proxy

Nginx (`nginx/Dockerfile`, `nginx/nginx.conf`) mount 2 thư mục từ host:

```
/etc/letsencrypt      (chứng chỉ SSL thật)
/var/www/certbot      (dùng cho renew certbot)
```

Nghĩa là chứng chỉ SSL được quản lý ở tầng **host VM**, không nằm trong image/container — renew certbot chạy trên host, không phải trong container Nginx.

## 5. Build & deploy — không có CI/CD tự động

`.github/workflows/cd.yml` **rỗng** (0 byte). `.github/workflows/ci.yml` chỉ chạy `nx affected` lint/build + `nx test api` khi có PR vào `dev` — không deploy gì cả.

→ Mọi lần deploy lên GCP là thao tác **thủ công**: SSH vào VM, chạy `docker-compose -f docker-compose.yml up --build -d` (đúng như README hướng dẫn). Không có staging environment, không có approve gate, không có rollback tự động.

## 6. Sự cố hạ tầng gần nhất — đã fix, đang chờ verify

Container `ats-api` từng crash-loop (ExitCode 1/137, restart liên tục) do `@napi-rs/canvas` (dependency phụ của `pdf-parse`) cài nhầm bản glibc trong khi base image là `node:24-alpine` (musl). Đã đổi base image `apps/api/Dockerfile` sang `node:24-bookworm-slim`. Chi tiết đầy đủ (bối cảnh, lý do, lựa chọn đã loại, đánh đổi): [`docs/architecture-decisions/0001-docker-base-image-glibc.md`](../architecture-decisions/0001-docker-base-image-glibc.md).

**Chưa xác nhận trên GCP** — fix này chỉ mới verify trên máy dev local, chưa biết instance GCP thật có gặp lỗi tương tự không (không có quyền truy cập trực tiếp vào VM đó).

## 7. Biến môi trường cần cho `docker-compose.yml`

Container `api` cần: `DATABASE_URL`, `REDIS_HOST`, `REDIS_PORT`, `SERVER_PORT`, `JWT_SECRET`, `GOOGLE_API_KEY`, `SMTP_*` (email), `CLIENT_URL`. Container `web` cần: `NODE_ENV`, `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_SOCKET_URL`. Tất cả đọc từ `.env` ở host lúc `docker-compose up`.

**Lưu ý đã biết**: `GOOGLE_API_KEY` trong `.env` môi trường dev từng hết credit thật (`RESOURCE_EXHAUSTED`) trong lúc test — không phải lỗi cấu hình, cần theo dõi billing nếu deploy lại.

## 8. Health check endpoint (thêm 2026-07-14, Phase 0.5)

`GET /health` (`apps/api/src/app/health/health.controller.ts`, `health.service.ts`) ping thật PostgreSQL (`prisma.$queryRaw` `SELECT 1`) và Redis (`redis.ping()`) song song, trả `{ status, uptimeSeconds, dependencies: { database, redis } }`. Trả **200** nếu cả hai `up`, **503** nếu bất kỳ cái nào `down` — đúng kiểu health check đọc được qua status code, không cần orchestrator parse body.

**Chưa gắn vào Docker healthcheck của container `api`**: `docker-compose.yml`/`docker-compose-dev.yml` chỉ có `healthcheck:` cho `postgres`/`redis` (§2) — service `api` chưa có mục `healthcheck:` trỏ vào endpoint này, nên `depends_on: condition: service_healthy` hiện không áp dụng cho chính `api`. Endpoint tồn tại và verify PASS thủ công, nhưng chưa được dùng để tự động gate traffic ở tầng orchestrator.

**Lỗi thật, chưa sửa** (`docs/audit/2026-07-14-phase-0.5-verification.md`, mục Nhóm 4): khi Redis bị đóng băng (mô phỏng bằng `docker pause`, khác với tắt hẳn — kết nối vẫn "còn" nhưng không phản hồi) thay vì trả 503, health check **treo luôn, không bao giờ trả về** — vì `redis.ping()` trong `checkRedis()` không có timeout. Đường "mọi thứ bình thường" (200, cả hai `up`) đã verify PASS trên instance thật. Khuyến nghị đã ghi trong audit: bọc `Promise.race` với timeout ~2-3s quanh `redis.ping()`, chưa làm ở đợt Phase 0.5 này (đúng quy tắc verify: chỉ báo cáo, không tự vá).

## 9. Liên quan tới kế hoạch migrate

- Phase 4 (Microservices): mỗi service tách ra sẽ cần Dockerfile + entry riêng trong `docker-compose.yml` — hiện tại `api` là 1 container duy nhất chạy toàn bộ 15 module, cấu trúc compose file sẽ phải mở rộng đáng kể (9 service thay vì 1).
- Phase 4 Step 1 (NATS): cần thêm 1 service NATS vào `docker-compose.yml`, cùng network `gateway_net`.
- Phase 3 (LiveKit): tương tự, thêm 1 service LiveKit + `livekit.yaml` config.
- §3 (storage cục bộ) là rào cản cụ thể cần giải quyết trước khi tách `cv-service` thật sự chạy độc lập nhiều instance.
- §8 (health check): mẫu hình `GET /health` hiện tại (ping thật dependency, trả 503 khi hỏng) là điểm khởi đầu tốt cho health check per-service ở Phase 4 — nhưng phần timeout còn thiếu (§8) nên sửa trước khi nhân bản ra 9 service.
- Phase 5 (Production Hardening): CI/CD tự động, Redis AOF — vẫn là khoảng trống thật, chưa làm gì. Backup Postgres **không còn hoàn toàn trống**: `scripts/backup-db.sh` (pg_dump → gzip → `./backups`, prune theo tuổi, thêm 2026-07-14 Phase 0.5) đã chạy được thủ công/qua cron local — phần còn thiếu là tự động hoá + upload S3/R2 + test restore định kỳ (`docs/migration-roadmap.md` Phase 5).
