# Research — GĐ3 phần 1–4

Ngày đọc: 2026-10-30. Đánh dấu theo `rules/working-expectations.md`: **documented** = đọc ở nguồn chính thức trong
phiên này; **verified** = chạy trực tiếp ở đây; **unverified** = chưa kiểm.

## Task 1.1 — image PostgreSQL có pgvector

| # | Kết luận | Mức | Nguồn / bằng chứng |
|---|---|---|---|
| 1 | Image chính thức `pgvector/pgvector` có tag cho PostgreSQL 18: `pg18`, `0.8.1-pg18`, `pg18-trixie`. **Không có** tag alpine: `pg18-alpine` và `0.8.1-pg17-alpine` đều "not found". | verified | `docker buildx imagetools inspect pgvector/pgvector:<tag>` trên registry, 2026-10-30 |
| 2 | Image `pgvector/pgvector:pg18` dựa trên Debian 12 (glibc). | verified | `docker run … cat /etc/os-release` → "Debian GNU/Linux 12 (bookworm)"; có `vector.control` |
| 3 | DB dev hiện chạy trên Alpine/musl: `PostgreSQL 18.4 on x86_64-pc-linux-musl`, `datcollate = en_US.utf8`, `datlocprovider = c`. | verified | `psql` trong container `ats-postgres` |
| 4 | Vì vậy không đổi sang image Debian: gắn volume dev có sẵn (tạo trên musl) vào image glibc làm thứ tự sắp xếp chữ `en_US.utf8` đổi, có thể làm index chữ (vd. `users.email`) lệch thứ tự. Cơ chế này là kiến thức chung; hậu quả cụ thể trên dữ liệu của dự án **chưa được thử** (ASSUMPTION), nên chọn đường không cần thử. | **ASSUMPTION** (cơ chế) | — |
| 5 | Thay vào đó build pgvector `v0.8.1` trên đúng `postgres:18.4-alpine` (`docker/postgres/Dockerfile`, `OPTFLAGS=""` để binary không dính `-march=native`, `with_llvm=no`). Image build được; `CREATE EXTENSION vector` ra `0.8.1`; sắp xếp cosine đúng (`1 → 3 → 2` với `0, 0.0061, 1.0`). | verified | build + `psql` trên container dùng một lần, 2026-10-30 |
| 6 | `docker-compose.yml` (prod) **chưa đổi**: đổi image DB production là quyết định riêng (`CLAUDE.md` §7) và cần cùng một image có pgvector, nếu không M1 trở đi lỗi ở prod. | — | cần chủ dự án quyết |
| 7 | Prisma 7 với cột `Unsupported("vector(1536)")?`: `prisma generate` chạy; client thường tạo và đọc bản ghi `skills` bình thường và **không** trả cột `embedding`. | verified | `results/task-1.2-vector-search-probe.txt` (tạo `Skill` bằng `prisma.skill.create`, đọc bằng `findUnique`) |
| 8 | `prisma migrate dev` có tự sinh đúng SQL cho cột `Unsupported` hay không: không kiểm; migration được viết tay và áp bằng `migrate deploy` trên DB thật (cột `vector(1536)`, extension 0.8.1). | **unverified** cho `migrate dev` | `results/task-1.1-pgvector.txt` |
