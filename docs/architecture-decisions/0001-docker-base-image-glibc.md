# 0001. Đổi base image apps/api/Dockerfile từ node:24-alpine sang node:24-bookworm-slim

## Trạng thái

Accepted

## Ngày

2026-07-11

## Bối cảnh (Context)

Container `ats-api` (docker-compose.yml, prod-shaped) crash-loop ngay khi khởi động (ExitCode 1/137, restart liên tục, xác nhận qua `docker inspect` — RestartCount tăng liên tục). Root cause xác định bằng cách chạy thử trực tiếp trong image:

```
docker run --rm --entrypoint sh ats-platform-api -c "node -e \"require('pdf-parse')\""
→ Warning: Cannot load "@napi-rs/canvas" package: "Error: Failed to load native binding".
→ CRASH_MESSAGE: DOMMatrix is not defined
```

`pdf-parse` (qua pdf.js) dùng `@napi-rs/canvas` để polyfill `DOMMatrix`/`ImageData`/`Path2D` cho Node. Kiểm tra `node_modules/@napi-rs/` trong image cho thấy npm đã cài `@napi-rs/canvas-linux-x64-gnu` (bản glibc) thay vì `-musl`, trong khi base image là `node:24-alpine` (musl libc) — native binding không load được. `pdf-parse` chỉ in warning rồi vẫn cố dùng `DOMMatrix` như global có sẵn → `ReferenceError` ngay tại `require()`-time, tức lúc NestJS bootstrap, không phải lúc thực sự có ai upload CV.

`PdfService` (`apps/api/src/common/pdf/pdf.service.ts`) chỉ gọi `.getText()` — trích text thuần, không cần khả năng render canvas thật.

## Quyết định (Decision)

Đổi `FROM node:24-alpine` → `FROM node:24-bookworm-slim` ở cả 2 stage (`builder` và `runner`) trong `apps/api/Dockerfile`.

## Lý do (Rationale)

Bản `@napi-rs/canvas-linux-x64-gnu` đã có sẵn trong image (npm tự chọn khi build, cả 2 biến thể `-gnu`/`-musl` đều có trong `package-lock.json`) — chỉ cần đổi OS runtime sang glibc-based (Debian) để binary đã cài sẵn chạy được, không cần sửa dependency, lockfile, hay code nào khác. Đây là fix tối thiểu, đúng vào gốc vấn đề (mismatch giữa binary đã cài và libc của OS), không phải vá triệu chứng.

## Lựa chọn khác đã cân nhắc (Alternatives considered)

- **Ép cài `@napi-rs/canvas-linux-x64-musl` thủ công trong Dockerfile** — vẫn phụ thuộc vào việc npm tự nhận diện đúng libc của môi trường build (`detect-libc`), và đây chính là cơ chế đã chọn sai ngay từ đầu — không đáng tin cậy, không chắc lần build sau có đúng lại không.
- **Polyfill giả `DOMMatrix`/`ImageData`/`Path2D`** (định nghĩa global rỗng trước khi `require('pdf-parse')`) — che triệu chứng nhanh, nhưng không chắc các nhánh code khác của `pdf-parse`/pdf.js có âm thầm phụ thuộc vào canvas hoạt động đúng ở use case khác (rủi ro lỗi ẩn khó phát hiện hơn ReferenceError rõ ràng hiện tại).

## Đánh đổi (Trade-offs)

- **Được**: fix đúng gốc, không đụng `package.json`/lockfile/code nghiệp vụ; `PdfService` không cần canvas thật nên không mất tính năng gì.
- **Mất**: `node:24-bookworm-slim` nặng hơn `node:24-alpine` (Debian slim so với Alpine) — tăng nhẹ thời gian pull/build image và dung lượng image cuối. Chấp nhận được vì kích thước image không phải mục tiêu đang tối ưu ở giai đoạn này.

## Hệ quả (Consequences)

- `apps/api/Dockerfile` không còn dùng Alpine — nếu sau này thêm dependency native khác (native binding tương tự `@napi-rs/canvas`), không cần lo lại vấn đề musl/glibc mismatch này nữa.
- `apps/web/Dockerfile` vẫn dùng `node:24-alpine` — đã kiểm tra `package.json`, không có dependency native (`sharp`/`canvas`/`napi`) nên chưa cần đổi theo. Rà lại nếu sau này web thêm dependency loại này.
- Repo không có CI/CD tự động deploy (`.github/workflows/cd.yml` rỗng) — bản deploy GCP trước đó của dự án là thao tác thủ công, tách biệt hoàn toàn khỏi máy dev local; **fix này chưa được xác nhận trên GCP**, chỉ mới verify local.
- Cần rebuild + verify lại: `docker-compose -f docker-compose.yml up --build -d ats-api`, sau đó `docker logs -f ats-api` xác nhận không còn warning `@napi-rs/canvas` và container ở trạng thái `Up` thay vì `Restarting`. **Việc này đang chờ người dùng tự chạy, chưa có kết quả xác nhận.**
