# GĐ4 — implementation plan

> Spec: [spec.md](spec.md) · Quyết định: [decision.md](decision.md) · Research: [research.md](research.md).
> Mỗi task: test đỏ trước, rồi code, rồi xanh (rule testing-boundaries). Mỗi milestone kết thúc bằng
> `npx nx test api --runInBand --skip-nx-cache`, `npx tsc --build apps/api/tsconfig.app.json`, `npx nx lint api`,
> `npm run test:web`, `npm run typecheck:web`, `npm run lint:web`, `NODE_ENV=production npx nx build web` (rồi
> `git checkout apps/web/next-env.d.ts`), và E2E của milestone trên `docker-compose.test.yml`.

**Global constraints:** user-facing strings tiếng Việt, log tiếng Anh; enum Prisma mới chép tay sang `enums.ts` cùng
commit; không `defaultJobOptions` trong `registerQueue`; co-pilot không bao giờ tự đổi trạng thái (ADR 0002); không sửa
`docker-compose.yml` prod hay `nginx/`; migration mới có timestamp sau `20261109000000`.

**Nhánh (D11):** M1 `feat/gd4-p1-video-interview` từ `feat/gd3-consistency-measurement`; M2 `feat/gd4-p2-copilot` từ M1;
M3 `feat/gd4-p3-analytics` từ M2. Mỗi PR base `dev`.

## M1 — Phòng phỏng vấn trực tuyến

### Task 1.1: Khung giờ và quyền vào phòng (hàm thuần)
- [x] Test đỏ (C3): `joinWindow(startAt, duration)` trả `[start−15', end+30']`; `assertCanJoinNow` đúng biên ±1 giây, onsite / huỷ / xong → đúng thông báo.
- [x] Implement `apps/api/src/app/interviews/room/interview-room.rules.ts`. Xanh.

### Task 1.2: Link phòng nội bộ khi tạo/sửa lịch
- [x] Test đỏ (C1): `resolveInterviewPlace` cho online không link; `createSchedule` sinh `interviewId` trước và ghi link phòng; có link ngoài giữ nguyên; sửa onsite → online không link → link nội bộ.
- [x] Implement (DTO bỏ bắt buộc link khi online, link có thì vẫn phải http(s)). Xanh; cập nhật test web của modal nếu đổi chữ.

### Task 1.3: `LiveKitService` + endpoint `join`
- [x] Cài `livekit-server-sdk@2.19.2`; đọc `.d.ts` của `AccessToken`, ghi vào `research.md`.
- [x] Test đỏ (C2, C4, C5): ai được vào; token giải mã bằng secret đúng room/identity/quyền/exp; thiếu cấu hình → 503.
- [x] Implement `LiveKitService` (đọc `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `LIVEKIT_PUBLIC_URL`, tuỳ chọn trong env validation), `InterviewRoomService.join`, route `POST /interviews/schedules/:id/join`. Xanh.

### Task 1.4: LiveKit trong compose dev/test
- [x] Thêm service `livekit` (`livekit/livekit-server:v1.13.10`, `--dev`, cổng 7880/7881/7882-udp, `NODE_IP=127.0.0.1`) vào `docker-compose-dev.yml` và `docker-compose.test.yml` (cổng test riêng); API nhận 3 biến; `.env.example` ghi biến mới.
- [x] Boot stack test: API healthy, `GET http://localhost:<port>` của LiveKit trả 200.

### Task 1.5: Web — trang phòng họp và nút vào phòng
- [x] Cài `livekit-client@2.23.0`, `@livekit/components-react@2.9.24`, `@livekit/components-styles@1.2.0`.
- [x] Test đỏ (C6): trang hiện lỗi đúng chữ cho 403/400/503; có token → render phòng (LiveKit mock ở biên module); nút "Vào phòng phỏng vấn" bật trong khung giờ, tắt ngoài khung.
- [x] Implement server action `joinInterviewRoomAction`, route group `(interview-room)/interview-room/[interviewId]`, `InterviewRoomClient` (`PreJoin` → `LiveKitRoom` + `VideoConference`), nút trong `MyInterviewsClient` và `ScheduleDetailDrawer`; `role-policy` thêm `/interview-room` cho staff và ứng viên. Xanh.

### Task 1.6: E2E hai người trong một phòng
- [x] Fixture: một lịch online đang trong khung giờ giữa recruiter và ứng viên mẫu.
- [x] Journey (C7): hai browser context có thiết bị giả, recruiter và ứng viên vào phòng, mỗi bên thấy tên người kia trong phòng.
- [x] Toàn bộ kiểm tra của milestone; PR M1.

## M2 — AI co-pilot

### Task 2.1: Luật gợi ý (hàm thuần)
- [x] Test đỏ (C8): mỗi luật một ca khớp và ca biên (điểm = ngưỡng, 6/7 ngày, 13/14 ngày), trạng thái cuối, lịch sắp tới, điểm/ngưỡng null.
- [x] Implement `apps/api/src/app/copilot/copilot-rules.ts`. Xanh.

### Task 2.2: Schema `CopilotDecision` + loại log `copilot`
- [x] Migration: bảng `copilot_decisions`, enum `CopilotDecisionType` (`accepted`, `dismissed`), thêm `copilot` vào `AiActionType`; chép enum sang `enums.ts`. Probe migration trên Postgres dùng một lần.

### Task 2.3: API co-pilot
- [x] Test đỏ (C9, C10, C11): danh sách theo tin bỏ gợi ý đã bỏ qua; `apply` 409/400/403, đi qua `updateStatus`, ghi decision; `run_screening` gọi luồng sàng lọc; `dismiss`; `explain` lỗi → 503.
- [x] Implement `CopilotModule` (facts loader, service, controller), `LlmService.explainSuggestion` + prompt. Xanh.

### Task 2.4: Web — gợi ý trên Kanban
- [x] Test đỏ (C12): thẻ hiện "Gợi ý: …"; dialog có lý do, nút chính đúng action, "Bỏ qua", "AI giải thích"; áp dụng gọi action.
- [x] Implement server actions, `CopilotSuggestionDialog`, nối vào `KanbanClient`/`KanbanCard`. Xanh.

### Task 2.5: E2E áp dụng gợi ý
- [x] Journey (C13): đơn ở `screening` có điểm ≥ ngưỡng → thẻ có "Gợi ý: Mời phỏng vấn" → áp dụng → thẻ sang cột Phỏng vấn.
- [x] Toàn bộ kiểm tra; PR M2.

## M3 — Thống kê và chi phí AI

### Task 3.1: Funnel, thời gian ở giai đoạn, chi phí (hàm thuần)
- [x] Test đỏ (C14, C16): funnel rỗng/một đơn/revert/nhảy cóc; thời gian ở giai đoạn bỏ lượt chưa kết thúc; chi phí đúng 6 chữ số thập phân, thiếu giá → null.
- [x] Implement `apps/api/src/app/analytics/recruitment-metrics.ts`, `ai-cost.ts`. Xanh.

### Task 3.2: Schema `AiUsageLog.organizationId` + `AiModelPrice`
- [x] Migration (cột, index, điền ngược `cv_scoring` qua `cv_screenings`, bảng giá). Probe DB (C17).
- [x] Test đỏ rồi sửa `LlmService.run`/`AiUsageLogsService.create`/`EmbeddingService.embed` nhận `organizationId`; truyền ở chấm CV, embedding của lần chấm, phân tích JD, giải thích co-pilot.

### Task 3.3: API thống kê
- [x] Test đỏ (C15): phạm vi recruiter/org_admin/admin; `from > to` → 400; `organizationId` khác của org_admin → 403; đơn mới nhất lấy bằng `take 6`.
- [x] Implement `AnalyticsModule` (`GET /analytics/recruitment`), `GET /ai-usage-logs/summary`, `GET/PUT /ai-usage-logs/prices`. Xanh.

### Task 3.4: Web — dashboard và bảng giá
- [x] Test đỏ (C18): dashboard hiện KPI, funnel, thời gian ở giai đoạn, đơn mới nhất; khối chi phí chỉ org_admin/admin; admin sửa giá.
- [x] Implement server actions, nâng cấp `components/dashboard/*`, `AiModelPricesPanel`. Bỏ `dashboard.action.ts` cũ (A-04). Xanh.

### Task 3.5: E2E dashboard
- [x] Journey (C19): seed đơn ở nhiều giai đoạn → dashboard hiện đúng số funnel.
- [x] Toàn bộ kiểm tra; PR M3.

## M4 — Phòng chờ và thông báo (bổ sung 13/11)

Nhánh `feat/gd4-p4-waiting-room` từ M3, PR base `dev`.

### Task 4.1: Schema trạng thái chờ
- [x] Migration thêm `candidate_waiting_at`, `candidate_admitted_at` vào `interview_schedules`.

### Task 4.2: API phòng chờ
- [x] Test đỏ (C20, C21, R28): `join` hai trạng thái, sự kiện và thông báo lần đầu; `admit` quyền, khung giờ, idempotent; sửa giờ xoá trạng thái chờ.
- [x] Implement `InterviewRoomService.join`/`admit`, route `POST /interviews/schedules/:id/admit`. Xanh.

### Task 4.3: Nhắc lịch và phòng đã mở
- [x] Test đỏ (C22): thời điểm job, bỏ job khi đã qua, onsite, job cũ bị bỏ qua, người nhận.
- [x] Implement queue `interview-reminders`, `InterviewRemindersService`, processor; gọi khi tạo/sửa lịch. Xanh.

### Task 4.4: Web phòng chờ
- [x] Test đỏ (C23): màn chờ, chuyển sang kiểm tra thiết bị khi được cho vào; banner + nút Cho vào.
- [x] Implement. Xanh.

### Task 4.5: E2E + PR
- [x] Journey (C24) trong `gd4-interview-room.e2e.ts`; toàn bộ kiểm tra; PR vào `dev`.

## Kết thúc

- [x] `operation.md`: chạy thật từng vai trò, các đường lỗi, bước deploy prod cho LiveKit (chờ đồng ý).
- [x] `docs/deliveries/gd4.md` thêm mục as-built; roadmap thêm GĐ5 vào khối đối chiếu đề cương, cập nhật GĐ4.
- [x] Báo cáo cuối + checklist kiểm thử tay.

## Ghi chú thực thi (12/11/2026)

- **D11 thực tế:** M1 cắt từ `feat/gd3-consistency-measurement`; M2 từ M1, M3 từ M2; commit sửa của nhánh trước được merge xuôi (`merge: bring … into …`).
- **Task 1.3:** route vào phòng nằm ở controller riêng `InterviewRoomController` (cùng tiền tố `interviews`) để không đổi chữ ký `InterviewsController`. `exp` của token = đồng hồ thật + `ttl` (research #9).
- **Task 1.4:** compose dùng `LIVEKIT_CONFIG` thay cho `--dev`, khoá riêng; cổng media giữ cùng số trong và ngoài container.
- **Task 1.6:** fixture phải ghi `start_at` theo UTC (`$n::timestamptz AT TIME ZONE 'UTC'`); bản đầu lệch +7 giờ.
- **Task 2.1:** bảng luật đổi so với spec ban đầu: đơn `applied` được gợi ý "Chuyển sang vòng Sàng lọc" vì API chỉ cho chạy sàng lọc AI ở `screening` (spec đã sửa).
- **Task 2.3:** API áp dụng trả về đơn đã cập nhật để Kanban thay thẻ như khi kéo thả.
- **Task 3.3:** API chi phí và bảng giá đặt dưới `/analytics/ai-cost` và `/analytics/ai-model-prices` (spec đã sửa) vì `GET /ai-usage-logs/:referenceId` sẽ bắt mất đường dẫn.
- **Task 3.4:** lỗi thật tìm bởi E2E: server component lấy hằng từ module `'use client'`; sửa bằng `lib/dashboard-periods.ts` (test đỏ `78ef629`, sửa `532f13f`).
- **E2E:** API chạy trên máy thay vì container (image build đứng ở `npm ci`); xem `operation.md`.

## Ghi chú thực thi M4 (13/11/2026)

- **Task 4.2:** thứ tự kiểm của `join` thêm bước cuối "chờ": ứng viên không bị đưa vào phòng chờ khi LiveKit chưa cấu hình (503 trước).
- **Task 4.3:** `jobId` dùng `-` vì BullMQ 5.76.5 từ chối id có `:` (đọc trong `node_modules/bullmq/dist/cjs/classes/job.js`).
- **Task 4.4:** thêm tự hỏi lại mỗi 20 giây ở phía người phỏng vấn (spec R27 đã sửa): nếu socket rớt, ứng viên không bị kẹt ở phòng chờ.
- **Task 4.5:** lần chạy đầu R2 nhận 429 ở `/auth/login` do test mới đăng nhập thêm; gom đăng nhập vào `beforeAll`. Full web suite trên máy đang 100% CPU: 3 test cũ timeout 5 s (đối chứng trên M3 cũng timeout); chạy lại với `--testTimeout=20000` thì 84/84 file pass.
