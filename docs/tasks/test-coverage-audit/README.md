# Kiểm tra độ phủ test ATS Platform

> Cập nhật sau audit: các lỗi F1–F11 đã được sửa và kiểm chứng lại bằng Docker/browser.
> Xem [kết quả hiện tại](../test-defect-fixes/README.md). Số liệu RED bên dưới giữ làm lịch sử trước sửa.

**Ngày:** 2026-09-29 · **Nhánh:** `feat/org-admin-enforcement` · **HEAD:** `8ec4751`

## Kết luận nhanh

**Chưa phủ đủ các tình huống quan trọng.** Bộ cũ chạy xanh 314/314 test BE, nhưng chưa có test FE và chỉ có API E2E mẫu kiểm tra lời chào. Sau khi bổ sung 71 test BE và 17 test FE, có **14 assertion thất bại thuộc 11 nhóm vấn đề**. Đây là kết quả audit cần sửa tiếp; không phải một bộ test đã xanh để merge.

Nhãn: **🔴 tái hiện bằng unit/hành vi** · **🟢 đã chạy đạt** · **🟡 chưa xác minh với hệ thống thật** · **⭕ chưa có test**.

| Phần kiểm tra                          | Kết quả thực tế                                                                            | Bằng chứng                                                                                        |
| -------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| Unit BE mở rộng                        | 🔴 378 đạt / 7 lỗi, tổng 385 test / 52 suite; 0 suite lỗi khởi chạy                        | [JSON](results/be-tests.json), [output](results/be-test-output.txt)                               |
| Hành vi/logic FE                       | 🔴 10 đạt / 7 lỗi, tổng 17 test / 3 file                                                   | [JSON](results/fe-tests.json), [output](results/fe-test-output.txt)                               |
| E2E FE thật                            | 🟡 3 kịch bản được thu thập; **0 kịch bản chạy** vì API/database/Redis local chưa sẵn sàng | [preflight](results/e2e-preflight.txt), [kịch bản](../../../apps/web/e2e/ai-configuration.e2e.ts) |
| Kiểm tra kiểu dữ liệu FE và test/E2E   | 🟢 Cả hai lệnh tsc thoát 0                                                                 | [app](results/web-typecheck.txt), [test/E2E](results/web-test-typecheck.txt)                      |
| Lint API + web                         | 🟢 Thoát 0; còn warnings, không có error                                                   | [output](results/lint.txt)                                                                        |
| Thử độ nhạy của test chuyển trạng thái | 🟢 Sửa sai quy tắc `applied`: 2/49 case thất bại; khôi phục: 49/49 đạt                     | [sửa sai](results/mutation-tests.json), [khôi phục](results/restored-tests.json)                  |

Không sửa logic nghiệp vụ. Thay đổi sản phẩm chỉ là nối label với input và đặt tên truy cập cho nút X, để test có thể thao tác theo tên người dùng thấy. Các test phát hiện lỗi được giữ nguyên assertion, không skip để làm xanh. Chưa commit/push.

## Những lỗi test mới phát hiện

Kiểm tra thêm: đổi threshold form FE từ 60 → 61 làm test payload thất bại; khôi phục thì test đạt ([RED](results/fe-mutation-tests.json), [GREEN](results/fe-restored-tests.json)). Lockfile cũng qua `npm ci --dry-run --ignore-scripts` trên Windows/Node 24.11 ([output](results/lockfile-check.txt)); chưa kiểm chứng Docker build.

P1: ưu tiên phiên đăng nhập/quyền. P2: lỗi luồng hoặc độ tin cậy cần sửa tiếp. Mỗi dòng dưới đây có test chạy thất bại; mức kiểm chứng là **unit/component**, không suy diễn thành E2E đã đạt.

| ID  | Ưu tiên | Vấn đề và ảnh hưởng                                                                                                                                                                                                                        | Code / test chứng minh                                                                                                                                                                                                                                                                          |
| --- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1  | P1      | **Đăng xuất không gửi refresh token cho BE.** FE xóa cookie nhưng request logout chỉ có Authorization; BE chỉ thu hồi refresh token được đưa trong cookie. Việc thiếu header đã tái hiện; kiểm tra replay token trên DB thật còn chờ E2E.  | [FE logoutAction](../../../apps/web/src/servers/auth/auth.action.ts), [BE logout](../../../apps/api/src/app/auth/auth.service.ts), [test](../../../apps/web/src/servers/auth/auth.action.test.ts)                                                                                               |
| F2  | P1      | **Sau refresh, proxy không áp lại quyền trang.** Candidate với token còn hạn bị chặn khỏi AI configuration; sau refresh lại nhận `next`. Test chứng minh bypass ở web, chưa chứng minh lộ dữ liệu qua API.                                 | [proxy, nhánh refresh](../../../apps/web/src/proxy.ts), [test “same candidate denial”](../../../apps/web/src/proxy.test.ts)                                                                                                                                                                     |
| F3  | P1      | **Request hiện tại vẫn nhận cookie hết hạn sau refresh.** Response đặt cookie mới, nhưng header cookie chuyển cho server component vẫn là token cũ; lớp HTTP FE lấy token từ cookie nên có thể lại nhận 401.                               | [proxy](../../../apps/web/src/proxy.ts), [HTTP client](../../../apps/web/src/lib/http.ts), [test “forwards the refreshed access cookie”](../../../apps/web/src/proxy.test.ts)                                                                                                                   |
| F4  | P2      | **Hủy và X vẫn submit form cấu hình AI.** Với form hợp lệ, server action bị gọi đúng 1 lần khi bấm mỗi nút; hai nút thiếu `type="button"`.                                                                                                 | [AddProfileModal](../../../apps/web/src/components/ai-configuration/ui/AddProfileModal.tsx), [2 test](../../../apps/web/src/components/ai-configuration/ui/AddProfileModal.test.tsx)                                                                                                            |
| F5  | P2      | **Candidate/recruiter đã đăng nhập vào trang login bị chuyển sai trang.** Cả hai nhận department-management thay vì job-postings/dashboard. Candidate có thể tiếp tục bị đẩy về trang công khai, recruiter tiếp tục bị đẩy về dashboard.   | [proxy](../../../apps/web/src/proxy.ts), [2 test landing page](../../../apps/web/src/proxy.test.ts)                                                                                                                                                                                             |
| F6  | P2      | **Mất yêu cầu tham gia phòng Socket khi xác thực còn chạy.** Test gọi join trước khi JWT resolve: chỉ tham gia user room, không có job room dù user hợp lệ. FE hiện gửi join ngay khi socket connect. Chưa chạy lại với mạng/browser thật. | [gateway](../../../apps/api/src/common/socket-io/socket-io.service.ts), [test race](../../../apps/api/src/common/socket-io/socket-io.service.spec.ts), [store FE](../../../apps/web/src/stores/useSocketStore.ts), [InitSocketRoom](../../../apps/web/src/components/common/InitSocketRoom.tsx) |
| F7  | P2      | **CV parser báo thất bại quá sớm.** Attempt 1/3 đã ghi failed và thông báo thất bại, dù còn retry tự động; ứng viên có thể thấy CV lỗi rồi sau đó lại hoàn tất. Test nhận `processing, failed`, thay vì chỉ `processing`.                  | [processor](../../../apps/api/src/app/cvs/processors/cv-parsing.processor.ts), [test retry](../../../apps/api/src/app/cvs/processors/cv-parsing.processor.spec.ts), [mặc định 3 attempts](../../../apps/api/src/app/app.module.ts)                                                              |
| F8  | P2      | **Có thể chạy AI screening cho hồ sơ đã hủy.** triggerScreening chặn applied/hired/rejected nhưng bỏ sót cancelled; test nhận kết quả tạo screening thay vì từ chối.                                                                       | [triggerScreening](../../../apps/api/src/app/applications/applications.service.ts), [test cancelled](../../../apps/api/src/app/applications/applications.service.spec.ts)                                                                                                                       |
| F9  | P2      | **JSON AI hợp lệ vẫn lỗi nếu thiếu usageMetadata.** SDK cài trong repo đánh dấu trường này optional; service destructure trực tiếp nên nhận TypeError.                                                                                     | [GeminiService](../../../apps/api/src/common/external-apis/gemini/gemini.service.ts), [test optional metadata](../../../apps/api/src/common/external-apis/gemini/gemini.service.spec.ts)                                                                                                        |
| F10 | P2      | **JSON AI lỗi bị ghi cả success và failed.** Success log được gửi trước JSON.parse; cùng một cuộc gọi tạo 2 log, làm thống kê thành công/thất bại sai.                                                                                     | [generateContent](../../../apps/api/src/common/external-apis/gemini/gemini.service.ts), [test malformed JSON](../../../apps/api/src/common/external-apis/gemini/gemini.service.spec.ts)                                                                                                         |
| F11 | P2      | **Health check treo khi DB hoặc Redis không trả lời.** Hai test fake timer đi qua 5 giây vẫn không có report; code không có timeout. Mốc 5 giây là tiêu chí chẩn đoán, chưa phải SLA được thống nhất.                                      | [HealthService](../../../apps/api/src/app/health/health.service.ts), [2 test dependency stalled](../../../apps/api/src/app/health/health.service.spec.ts), [hợp đồng 503](../../../apps/api/src/app/health/health.controller.ts)                                                                |

Các assertion tương ứng, expected/received và stack trace nằm trong hai file output ở bảng kết quả.

## “Fill đầy đủ case” đến mức nào?

**Coverage** là phần code được chạy qua. **Case coverage** là phần tình huống nghiệp vụ đã có assertion đúng/sai. Hai chỉ số không thay thế nhau.

Coverage BE mới đo cả file chưa được import trong test, trừ entrypoint main và test helper: **69.86% dòng, 57.46% nhánh** ([số liệu](results/be-coverage-summary.json), [cấu hình](../../../apps/api/jest.config.ts)). Số cũ 80.80% dòng / 61.54% nhánh chỉ tính file đã được import, nên không thể đọc việc giảm tỷ lệ này như một regression của code.

Đáng chú ý: GeminiService và HealthService có coverage dòng 100% trong lần chạy mới, nhưng vẫn có test thất bại. Chạy qua một dòng không chứng minh kết quả dòng đó đúng.

| Nhóm nghiệp vụ                    | Đã có bằng chứng                                                                                                                                               | Còn thiếu để tăng độ tin cậy                                                                                                                        |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ranh giới tổ chức và quyền sở hữu | 🟢 Unit cho tenant caller, roles/ownership guard và nhiều service, gồm ID của tổ chức khác, spoof organization, staff thiếu organization, candidate chủ sở hữu | 🟡 FK/index/check thật sau migration; quyền qua HTTP + trang browser; org_admin chưa có luồng web hoàn chỉnh                                        |
| Chuyển trạng thái hồ sơ           | 🟢 **49/49 cặp trạng thái** đạt; trạng thái cuối, self-transition, lịch sử và số lần notification được pin; kiểm tra sửa sai chứng minh test có thể bắt lỗi    | ⭕ Đồng thời cập nhật cùng hồ sơ; rollback DB thật; phát sự kiện sau commit                                                                         |
| Ứng tuyển và CV                   | Unit kiểm tra job active, CV được parse/xác nhận, trùng hồ sơ, một candidate ứng tuyển hai org, một số quyền xóa/confirm                                       | ⭕ Hai request apply đồng thời; upload lỗi/parse lỗi/queue.add lỗi và cleanup file; ownership đầy đủ ở mọi route; hành trình candidate trên browser |
| AI parsing/screening              | Test mới pin 7 thao tác Gemini: model, action, token counts, JSON, timeout 120s; processor CV có success/final failure/unrelated job                           | 🔴 F7–F10; ⭕ payload AI sai cấu trúc nhưng vẫn là JSON, score ngoài miền, BullMQ retry/idempotency thật, queue mất kết nối                         |
| Phỏng vấn                         | Unit lịch chồng thời gian, quyền theo org, một số status cuối; mock interview generation/evaluation/sweep có test                                              | ⭕ Mọi biên thời gian và duration 15/480 phút, timezone, đổi interviewer, hai lịch tạo đồng thời, refresh/reconnect khi đang phỏng vấn; FE E2E      |
| Auth và phiên                     | Unit login, user inactive, refresh rotation, email verification, reset, thu hồi token; FE mới có proxy và logout test                                          | 🔴 F1–F3/F5; ⭕ refresh song song, replay thật sau logout/reset, session hết hạn qua browser, callback URL và role org_admin trên web               |
| Realtime và hạ tầng               | Unit một số room, Redis throttle, storage, exception filter; test mới bắt race/health treo                                                                     | 🔴 F6/F11; ⭕ reconnect/ack với browser thật, Redis/BullMQ lifecycle thật, mail worker, correlation/transaction propagation                         |
| Giao diện và CI                   | 17 test FE chạy; 3 E2E được viết; đã thêm target `web:test`                                                                                                    | 🟡 E2E chưa chạy; ⭕ các journey candidate/recruiter, CV/kanban/interview, mobile, lỗi API hiển thị; CI hiện vẫn chỉ chạy unit BE                   |

Tham khảo [khảo sát và ma trận mức test](survey.md), [CI](../../../.github/workflows/ci.yml).

### Rủi ro từ code, chưa được xác minh với DB thật

- **Apply đồng thời có thể tạo hai đơn hoạt động:** code đọc danh sách rồi create; [schema Application](../../../libs/backend/database/prisma/schema.prisma) chỉ có index organization; [migration](../../../libs/backend/database/prisma/migrations/20260430180818_remove_unique_constraint_from_application/migration.sql) đã bỏ unique cũ. Cần test hai request đồng thời trên PostgreSQL test; kết quả unit mock không chứng minh được constraint.
- **Đặt lịch đồng thời có thể vượt kiểm tra overlap:** [InterviewsService](../../../apps/api/src/app/interviews/interviews.service.ts) kiểm tra findMany rồi create/update; chưa thấy exclusion constraint tương ứng trong migrations. Cần test đồng thời và quyết định khóa/constraint.
- **Ghi DB rồi queue.add thất bại có thể để record pending/processing không được xử lý:** [CVsService](../../../apps/api/src/app/cvs/cvs.service.ts), [CvScreeningsService](../../../apps/api/src/app/cv-screenings/cv-screenings.service.ts). Cần fault injection và xác nhận cơ chế bù/truy hồi.

Các dòng này là rủi ro có căn cứ từ source; chưa gộp vào 11 nhóm lỗi đã có test thất bại.

## Thay đổi trong lần audit

- Thêm **71 case BE**, gồm 49 cặp chuyển trạng thái và test cho processor CV vốn chưa có suite.
- Thêm **17 case FE** bằng Vitest + Testing Library; mock server action/fetch, dùng NextRequest/NextResponse thật cho proxy.
- Thêm **3 E2E FE** bằng Playwright: admin login → hủy hoặc X không lưu; admin login → tạo → reload từ DB → logout → refresh token bị từ chối.
- E2E dùng API/database/Redis local thật, không intercept route/fake JWT/fake API. Runner tự mở web với API URL local cố định để tránh dùng nhầm cấu hình của một web server đang chạy.
- Cập nhật coverage thu thập cả source; bổ sung script/target chạy test; tách test và E2E khỏi typecheck/build sản phẩm, kèm tsconfig.spec riêng.
- Bổ sung label/input và tên nút X; cập nhật dependency/lockfile. Không sửa 11 nhóm logic đang lỗi.

## Chạy lại

Từ root repo:

```powershell
npm run test:api -- --skip-nx-cache
npm run test:web
npx tsc --noEmit -p apps/web/tsconfig.spec.json --incremental false
npm run test:e2e:web -- --list
```

**Hai lệnh unit/hành vi hiện trả exit 1 vì các lỗi ở trên.** File `*.e2e.ts` không được thu thập bởi Vitest/Jest; E2E là lệnh riêng.

Để chạy E2E thật:

1. Khởi động PostgreSQL/Redis và API **với database test riêng**, migration đúng nhánh. `http://localhost:5000/api/health` phải báo up. Cần có một tài khoản platform admin đã xác minh email và một organization test. Runner không seed database tự động.
2. Cài browser: `npx playwright install chromium`. Đặt các biến bên dưới trong terminal; dùng tài khoản test. FE được runner tự khởi động; cổng 3000 phải rảnh.
3. Chạy `npm run test:e2e:web`. Bản ghi có tên UUID riêng sẽ được cleanup theo đúng name + organization + isDefault=false. Trace/screenshot/report nằm trong thư mục gitignored của apps/web; không đưa vào bằng chứng công khai khi chứa thông tin phiên.

```powershell
$env:WEB_E2E_API_URL = 'http://localhost:5000/api'
$env:WEB_E2E_BASE_URL = 'http://localhost:3000'
$env:WEB_E2E_ADMIN_EMAIL = '<email admin test>'
$env:WEB_E2E_ADMIN_PASSWORD = '<mật khẩu test>'
$env:WEB_E2E_ORGANIZATION_ID = '<UUID tổ chức test>'
npm run test:e2e:web
```

**Chưa xác minh:** việc startup toàn bộ web/API khi dependencies sẵn sàng, browser execution, persistence/cleanup trên PostgreSQL, replay token sau logout và các màn hình còn lại. Trong phiên audit, Docker engine chưa chạy và cổng API test không có listener; runner dừng trước thao tác browser.

## Ba bước tiếp theo

1. **Sửa F1–F3 và F4/F5:** thu hồi phiên đúng, áp cùng quyền trước/sau refresh, chuyển cookie mới cho request hiện tại, sửa nút Hủy/X và landing page. Các test FE hiện đỏ là tiêu chí chấp nhận cụ thể.
2. **Sửa F6–F11 và thêm kiểm chứng DB:** giải quyết Socket/retry/timeout/cancelled/AI logging, thống nhất timeout health, xác minh constraint/concurrency. Chạy lại toàn bộ unit/hành vi cho tới xanh; sau đó thêm `test:web` vào CI.
3. **Dựng môi trường test riêng và chạy E2E:** hoàn tất 3 journey đã viết, rồi mở rộng candidate upload/xác nhận/apply, recruiter screening/kanban/schedule và hai tổ chức. Lúc đó mới đánh giá được độ tin cậy toàn luồng.
