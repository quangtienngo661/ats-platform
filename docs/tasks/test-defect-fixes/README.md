# ATS Platform — sửa lỗi và kiểm chứng bằng Docker

**Ngày:** 2026-09-29 · **Nhánh:** `feat/org-admin-enforcement` · **Base:** `8ec4751`.
Thay đổi đang ở working tree; chưa commit/push.

## Kết quả

**11 nhóm lỗi F1–F11 đã được sửa; các assertion thất bại ban đầu đều đạt.**
Compose test chạy API đã build từ code sửa, PostgreSQL và Redis riêng.
Playwright mở FE local và dùng Chromium, API và database thật.

| Kiểm tra | Trước sửa | Sau sửa | Bằng chứng |
| --- | --- | --- | --- |
| Unit BE | 378 đạt / 7 lỗi, tổng 385 | **391/391 đạt**, 52 suites | [RED](results/be-red.json), [GREEN](results/be-green.json) |
| Hành vi/logic FE | 10 đạt / 7 lỗi, tổng 17 | **19/19 đạt** | [RED](results/fe-red.json), [GREEN](results/fe-green.json) |
| Browser E2E | 3/3 thất bại ở đúng hành vi | **5/5 đạt**, không retry/skip | [RED](results/e2e-red.txt), [GREEN](results/e2e-green-final.txt) |
| Docker API build + migrations | Build/API khởi động đạt | Build/API khởi động đạt | [Build sửa](results/compose-build-green.txt), [containers](results/compose-final.txt) |
| Build FE | — | Đạt | [Output](results/web-build.txt) |
| Kiểu dữ liệu app + test | — | Cả hai đạt | [App](results/web-typecheck.txt), [test](results/test-typecheck.txt) |
| Lint API + web | — | 0 error; còn warnings | [Output](results/lint.txt) |

Thêm 6 case BE và 2 case FE để bảo vệ các biên của sửa đổi: xác thực socket bị từ chối trong khi join đang chờ; health timeout đồng thời và cleanup timer; CV không retry/retry thành công; cookie refresh có/không rotation và giữ cookie khác.
Giữ nguyên các assertion RED từ audit. CI đã thêm [test FE](../../../.github/workflows/ci.yml); chưa chạy CI trên máy chủ.

## Các lỗi đã sửa

🟢 = đã đạt test; “runtime” = thêm kiểm chứng trên hệ thống chạy thật.
Gemini trong unit được giả lập; không gọi dịch vụ AI trả phí.

| ID | Sửa đổi | Mức bằng chứng / code |
| --- | --- | --- |
| F1 | Logout gửi refresh cookie để BE thu hồi phiên | 🟢 Unit + browser: replay đổi **201 → 401**; [logoutAction](../../../apps/web/src/servers/auth/auth.action.ts) |
| F2 | Dùng cùng một kiểm tra quyền trước và sau refresh | 🟢 Unit + browser candidate refresh phiên thật, bị chặn trang admin; [proxy](../../../apps/web/src/proxy.ts) |
| F3 | Chuyển cookie/header mới vào request hiện tại trước khi tạo response; giữ cookie khác | 🟢 Unit + browser admin thiếu access cookie vẫn đọc được trang ngay sau refresh; [proxy](../../../apps/web/src/proxy.ts) |
| F4 | Hủy và X có `type="button"` | 🟢 Component + browser/DB: trước sửa cả hai lưu bản ghi; sau sửa không lưu; [modal](../../../apps/web/src/components/ai-configuration/ui/AddProfileModal.tsx) |
| F5 | Trang login đưa candidate/recruiter/admin về đúng trang theo vai trò | 🟢 Unit cả ba vai trò; browser thêm candidate; [proxy](../../../apps/web/src/proxy.ts) |
| F6 | Job-room join chờ xác thực bất đồng bộ và kiểm tra tổ chức | 🟢 Unit race + runtime nhận event ứng tuyển thật; tổ chức khác bị từ chối; [gateway](../../../apps/api/src/common/socket-io/socket-io.service.ts) |
| F7 | CV chỉ ghi failed/thông báo thất bại khi hết lượt retry | 🟢 Unit transient, final failure, không retry và retry thành công; [processor](../../../apps/api/src/app/cvs/processors/cv-parsing.processor.ts) |
| F8 | Hồ sơ cancelled không được kích hoạt screening | 🟢 Unit + HTTP thật trả 400, không tạo screening record; [service](../../../apps/api/src/app/applications/applications.service.ts) |
| F9 | usageMetadata và số token optional có fallback 0 | 🟢 Unit SDK giả lập; [Gemini](../../../apps/api/src/common/external-apis/gemini/gemini.service.ts) |
| F10 | Parse JSON trước success log, JSON lỗi chỉ tạo một failed log | 🟢 Unit; sửa thông báo timeout thành đúng 120 giây; [Gemini](../../../apps/api/src/common/external-apis/gemini/gemini.service.ts) |
| F11 | Mỗi dependency health có deadline 3 giây; giải phóng timer | 🟢 Unit + pause dependency thật; [health](../../../apps/api/src/app/health/health.service.ts) |

Test mới và lịch sử lỗi nằm trong [audit](../test-coverage-audit/README.md).
Các hành trình browser nằm trong [AI configuration](../../../apps/web/e2e/ai-configuration.e2e.ts) và [session policy](../../../apps/web/e2e/session-policy.e2e.ts).

## Kiểm chứng runtime bổ sung

- Redis tạm dừng: trước sửa client timeout sau **4.510s**; sau sửa **503 sau 3.053s**.
- PostgreSQL tạm dừng: sau sửa **503 sau 3.043s**. Khôi phục cả hai: health trở về **up**.
  [RED](results/health-red.json), [Redis GREEN](results/health-green-redis.json), [Postgres GREEN](results/health-green-postgres.json), [khôi phục](results/health-restored.json).
- Socket join ngay tại sự kiện connect nhận đúng `application:application_created` từ HTTP apply thật; socket tổ chức khác bị từ chối và không nhận event.
- HTTP danh sách ứng tuyển: cùng tổ chức **200**, khác tổ chức **403**.
- PostgreSQL thật chặn org_admin thiếu organization bằng **23514**; chặn default AI thứ hai trong cùng organization bằng **23505**, nhưng cho phép hai tổ chức có default riêng.
- Rút đơn → gọi screening trả **400**; database có **0** screening cho đơn đó.
  [Kết quả 5 probes](results/runtime-probes.json), [harness](../../../apps/web/e2e/support/check-runtime.mjs).
- Cleanup cuối: **0** cấu hình E2E còn sót, **0** refresh token còn hoạt động, **0** job runtime còn sót. [Kết quả](results/cleanup-check.json).

Dữ liệu kiểm chứng dùng volume riêng; tài khoản admin/candidate và organization fixture giữ lại trong database test để chạy tiếp.
Stack dev sẵn có vẫn health up; không reset/delete volume của bạn.

## Chạy lại

Từ root repo, dùng Node 24:

```powershell
docker compose -f docker-compose.test.yml up -d --build
# Đợi API http://localhost:55000/api/health báo up.
node apps/web/e2e/support/prepare-local.mjs
npx playwright install chromium

$fixture = Get-Content docs/tasks/test-defect-fixes/results/local-fixture.json | ConvertFrom-Json
$env:WEB_E2E_API_URL = $fixture.api
$env:WEB_E2E_BASE_URL = 'http://localhost:3000'
$env:WEB_E2E_ADMIN_EMAIL = 'admin@ats.local'
$env:WEB_E2E_ADMIN_PASSWORD = 'Admin@123'
$env:WEB_E2E_CANDIDATE_EMAIL = 'candidate-e2e@ats.test'
$env:WEB_E2E_CANDIDATE_PASSWORD = 'Candidate@123'
$env:WEB_E2E_ORGANIZATION_ID = $fixture.organizationId

npm run test:api -- --skip-nx-cache
npm run test:web
npm run test:e2e:web
```

Các mật khẩu trên chỉ dành cho [Compose test local](../../../docker-compose.test.yml), được bind loopback.
Seeder chờ counter giới hạn đăng nhập hết hạn tự nhiên, không tắt hoặc xóa counter.
FE E2E cần cổng 3000 rảnh. Runner dùng URL API local rõ ràng.
Traces/screenshots chứa dữ liệu phiên được gitignore và loại khỏi Docker context.

Chạy probes riêng sau một lần chuẩn bị fixture mới:

```powershell
node apps/web/e2e/support/prepare-local.mjs
node apps/web/e2e/support/check-runtime.mjs
```

Dừng stack test khi không dùng: `docker compose -f docker-compose.test.yml stop`.
Hiện stack test vẫn chạy trên API **55000**, PostgreSQL **55432**, Redis **56379**; FE do Playwright mở và đóng theo từng lần chạy.

## Phần còn thiếu

**Test xanh chưa có nghĩa mọi case đã được bao phủ.** Coverage toàn source BE hiện **70.05% dòng / 57.82% nhánh** ([số liệu](results/be-coverage-summary.json)).
Chưa kiểm chứng Gemini/mail thật; retry BullMQ thật; toàn bộ upload CV và phỏng vấn trên browser; apply/đặt lịch đồng thời; lỗi queue sau khi ghi DB; refresh song song và web org_admin.
Deadline health giới hạn thời gian chờ response, không hủy query đang chạy.
Các rủi ro concurrency/queue từ audit vẫn là mục cần kiểm chứng, chưa được tuyên bố đã sửa.

Bước tiếp phù hợp: E2E candidate upload/xác nhận/apply → recruiter screening/kanban/phỏng vấn; sau đó test đồng thời trên database riêng.
