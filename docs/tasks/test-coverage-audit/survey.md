# Khảo sát test ATS Platform

Kiểm tra ngày 2026-09-29 · nhánh `feat/org-admin-enforcement` · HEAD `8ec4751`.

## Bằng chứng ban đầu

- Working tree sạch trước khảo sát.
- `npx nx test api --runInBand --coverage --skip-nx-cache`: 314/314 test, 51/51 suite.
- Coverage mặc định chỉ đo file được import: lines 80.80%, branches 61.54%.
- `apps/web/project.json` không có target test; không tìm thấy Playwright/Cypress/FE test.
- `apps/api-e2e/src/api/api.spec.ts` chỉ kiểm tra lời chào, không kiểm tra tuyển dụng.
- CI chỉ chạy unit BE, lint, build; chưa chạy FE hoặc E2E.
- Docker Desktop engine chưa chạy trong phiên kiểm tra; chưa có bằng chứng E2E với database/Redis thật.
- Unit BE dùng Prisma mock; chưa có test tự khởi động database.

## Định tuyến case trước khi bổ sung

| Hành vi                                                    | Mức test   | File sẽ bổ sung              | Giới hạn                                                     |
| ---------------------------------------------------------- | ---------- | ---------------------------- | ------------------------------------------------------------ |
| Mọi chuyển trạng thái hồ sơ, kể cả trạng thái cuối         | Unit BE    | applications.service.spec.ts | Không chứng minh giao dịch DB/concurrency                    |
| JSON Gemini, metadata tùy chọn, lỗi API, timeout           | Unit BE    | gemini.service.spec.ts       | Không gọi dịch vụ AI thật                                    |
| CV parsing thành công/thất bại/retry                       | Unit BE    | cv-parsing.processor.spec.ts | Không chạy BullMQ/Redis thật                                 |
| Socket join trong lúc xác thực chưa hoàn tất               | Unit BE    | socket-io.service.spec.ts    | Tái hiện thứ tự gọi; chưa đo browser/network                 |
| Dependency health không phản hồi                           | Unit BE    | health.service.spec.ts       | Mốc 5 giây là tiêu chí chẩn đoán; SLA cần thống nhất khi sửa |
| Hủy/đóng/tạo cấu hình AI, tổng trọng số                    | Hành vi FE | AddProfileModal.test.tsx     | jsdom, server action giả lập; không phải E2E                 |
| Quyền/redirect khi token còn hạn và khi refresh            | Logic FE   | proxy.test.ts                | NextRequest/NextResponse thật, fetch giả lập                 |
| Admin đăng nhập, hủy/tạo cấu hình, reload từ DB, đăng xuất | E2E FE     | e2e/ai-configuration.e2e.ts  | API/DB/Redis local thật; yêu cầu tài khoản và org test       |

## Dấu hiệu cần tái hiện

- Gemini destructure `response.usageMetadata` dù kiểu SDK đánh dấu optional; ghi success trước JSON.parse.
- CV parser ghi failed và thông báo thất bại trên mọi attempt, dù BullMQ còn retry.
- Socket handler join đọc `client.data.user` trong khi handleConnection còn await.
- HealthService không giới hạn thời gian chờ dependency.
- Nút Hủy/X trong form cấu hình AI không có `type="button"`.
- Proxy refresh trả next trước khi áp lại quyền; nhánh auth redirect mọi role về department-management.

Các dòng này là dấu hiệu từ code, chưa được coi là lỗi tái hiện cho tới khi có assertion thất bại.
