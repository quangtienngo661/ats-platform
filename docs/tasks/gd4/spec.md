# GĐ4 — Phỏng vấn trực tuyến, AI co-pilot, thống kê — spec (13/11/2026)

Đề cương ĐA2, GĐ4 (23/11–13/12): video call LiveKit tự host gắn với lịch phỏng vấn; AI co-pilot trên Kanban (gợi ý
bước tiếp theo, recruiter duyệt, AI không tự thực hiện); dashboard funnel + chi phí AI, sửa A-04. Quyết định và các
phương án đã cân nhắc: [`decision.md`](decision.md). Sự thật về LiveKit đã đọc/chạy: [`research.md`](research.md).

Nền code: nhánh GĐ3 cuối (`feat/gd3-consistency-measurement`), vì GĐ3 chưa merge vào `dev` lúc viết spec (D11).

## Phạm vi

| Phần | Nội dung | Milestone |
|---|---|---|
| 1 | Phòng phỏng vấn trực tuyến: LiveKit server trong compose dev/test, API cấp token theo lịch, trang phòng họp cho recruiter và ứng viên | M1 |
| 2 | AI co-pilot: luật gợi ý bước tiếp theo, hiện trên thẻ Kanban, áp dụng hoặc bỏ qua có ghi nhận, giải thích bằng LLM theo yêu cầu | M2 |
| 3 | Thống kê: API funnel, thời gian ở mỗi giai đoạn, đơn mới nhất (A-04); chi phí AI theo tổ chức với bảng giá do admin nhập | M3 |

## Ngoài phạm vi

Ghi hình cuộc gọi, phòng chờ, voice AI cho phỏng vấn thử, Judge0 (GĐ5 tuỳ chọn). Sửa `docker-compose.yml` prod và
`nginx/` cho LiveKit (cần chủ dự án đồng ý, ghi trong `operation.md` như bước deploy). Co-pilot tự đổi trạng thái hoặc
gợi ý từ chối bằng một cú bấm (ADR 0002). Thống kê theo thời gian thực qua socket.

## Phần 1 — Phòng phỏng vấn trực tuyến

### Yêu cầu

| # | Yêu cầu |
|---|---|
| R1 | Lịch `online` không còn bắt buộc link ngoài. Không nhập link → hệ thống ghi `onlineMeetingLink = <CLIENT_URL>/interview-room/<interviewId>`; có link http(s) → giữ link đó (phòng nội bộ vẫn dùng được). Email, thẻ lịch, drawer không đổi vì vẫn đọc `onlineMeetingLink`. |
| R2 | `POST /interviews/schedules/:id/join` trả `{ serverUrl, token, roomName, identity, displayName, role, expiresAt }`. Chỉ ứng viên của đơn, người phỏng vấn, người tạo lịch được vào; người khác 403 "Bạn không tham gia buổi phỏng vấn này". |
| R3 | Chỉ vào được khi lịch `online`, `status = scheduled`, và thời điểm hiện tại trong `[startAt − 15 phút, startAt + durationMinutes + 30 phút]`. Sớm hơn → 400 "Phòng mở lúc HH:mm"; muộn hơn → 400 "Buổi phỏng vấn đã kết thúc"; lịch onsite → 400; huỷ/đã xong → 400. |
| R4 | Token LiveKit: `identity = userId`, `name = fullName`, quyền `roomJoin` cho đúng phòng `interview-<interviewId>`, `canPublish`, `canSubscribe`, `canPublishData` (chat); hết hạn tại cuối khung giờ R3; `metadata` ghi vai trò (`candidate` / `interviewer`). |
| R5 | Thiếu `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET` / `LIVEKIT_PUBLIC_URL` → 503 "Phòng phỏng vấn trực tuyến chưa được cấu hình"; API vẫn khởi động. |
| R6 | Trang `/interview-room/[interviewId]` (ứng viên và staff): màn kiểm tra thiết bị (`PreJoin`), rồi phòng họp (`VideoConference`: camera, mic, chia sẻ màn hình, chat). Lỗi R2/R3/R5 hiện thông báo tiếng Việt kèm nút quay lại. Rời phòng → về trang lịch của vai trò. |
| R7 | Nút "Vào phòng phỏng vấn" trên thẻ lịch của ứng viên và drawer lịch của recruiter khi lịch online dùng phòng nội bộ; nút chỉ bật trong khung giờ R3. |
| R8 | Compose dev và test thêm service `livekit` (image `livekit/livekit-server` ghim phiên bản), khoá dev; API trong compose đọc 3 biến R5. |

## Phần 2 — AI co-pilot

### Yêu cầu

| # | Yêu cầu |
|---|---|
| R9 | Hàm thuần `suggestNextStep(facts)` quyết định gợi ý từ: trạng thái đơn, số ngày ở giai đoạn, kết quả chấm (trạng thái, điểm hiệu lực, đã duyệt), ngưỡng của cấu hình AI đã chấm, các lịch phỏng vấn (trạng thái, thời điểm) và scorecard. LLM không quyết định. |
| R10 | Bảng luật (lần lượt, luật đầu tiên khớp thắng): xem bảng *Luật co-pilot* dưới đây. Mỗi gợi ý có `ruleId`, `title`, `reasons[]` (câu tiếng Việt có số liệu), `action` (`move_status` kèm trạng thái đích / `run_screening` / `schedule_interview` / `open_profile` / không có), và `key = ruleId:status:currentStageSince`. |
| R11 | `GET /applications/job/:jobId/copilot` trả `{ [applicationId]: Suggestion }` cho mọi đơn của tin mà caller xem được (cùng phạm vi `board/:jobId`); bỏ đơn có gợi ý đã bị bỏ qua với cùng `key`. |
| R12 | `POST /applications/:id/copilot/apply { key }`: tính lại gợi ý; `key` khác → 409 "Gợi ý đã thay đổi, hãy tải lại"; action không phải `move_status`/`run_screening` → 400. `move_status` gọi `ApplicationsService.updateStatus` (FSM, lịch sử, thông báo ứng viên như cũ, `notes = "Áp dụng gợi ý co-pilot: <title>"`); `run_screening` gọi luồng `trigger-screening` sẵn có. Ghi `CopilotDecision(accepted)`. |
| R13 | `POST /applications/:id/copilot/dismiss { key }` ghi `CopilotDecision(dismissed)`; gợi ý ẩn cho tới khi `key` đổi (trạng thái hoặc `currentStageSince` đổi). |
| R14 | `POST /applications/:id/copilot/explain` gọi `LlmService.explainSuggestion` (tier flash, loại log `copilot`) với dữ kiện đã tính, trả 2–4 câu tiếng Việt; LLM lỗi hoặc thiếu key → 503 "Chưa tạo được giải thích, hãy dùng các lý do bên dưới". Không lưu kết quả. |
| R15 | Web: thẻ Kanban hiện dòng "Gợi ý: <title>" (màu nhấn) khi có gợi ý; bấm mở dialog: lý do, nút chính theo action ("Áp dụng" / "Chạy sàng lọc" / "Đặt lịch" / "Mở hồ sơ"), "Bỏ qua", "AI giải thích". Áp dụng xong → làm mới board. |
| R16 | Quyền: recruiter (phạm vi phòng ban như Kanban), org_admin, admin. Ứng viên không gọi được. |

### Luật co-pilot

| Thứ tự | `ruleId` | Khi | Gợi ý | Action |
|---|---|---|---|---|
| 1 | `screening_missing` | trạng thái `applied`/`screening`, chưa có kết quả chấm hoặc chấm `failed` | "Chạy sàng lọc AI" | `run_screening` |
| 2 | `screening_running` | chấm `pending`/`processing` | không gợi ý | — |
| 3 | `advance_after_screening` | `applied`, chấm `completed`, điểm hiệu lực ≥ ngưỡng | "Chuyển sang Sàng lọc" | `move_status → screening` |
| 4 | `invite_interview` | `screening`, chấm `completed`, điểm ≥ ngưỡng | "Mời phỏng vấn" | `move_status → interview` |
| 5 | `below_threshold` | `applied`/`screening`, chấm `completed`, điểm < ngưỡng | "Xem lại hồ sơ: điểm dưới ngưỡng" | `open_profile` |
| 6 | `schedule_needed` | `interview`, không có lịch `scheduled` hay `completed` | "Đặt lịch phỏng vấn" | `schedule_interview` |
| 7 | `scorecard_needed` | `interview`, có lịch `completed` hoặc lịch `scheduled` đã qua giờ kết thúc, chưa có scorecard | "Nhập đánh giá buổi phỏng vấn" | `open_profile` |
| 8 | `offer_ready` | `interview`, mọi scorecard đã có đều `yes`/`strong_yes` | "Gửi đề nghị (Offer)" | `move_status → offer` |
| 9 | `interview_concerns` | `interview`, có scorecard `no`/`strong_no` | "Xem lại: người phỏng vấn không đề xuất" | `open_profile` |
| 10 | `offer_waiting` | `offer`, ở giai đoạn ≥ 7 ngày | "Theo dõi đề nghị đã chờ N ngày" | `open_profile` |
| — | (mọi luật trên) | đơn đứng yên ≥ 14 ngày ở giai đoạn đang mở | thêm lý do "Hồ sơ đứng yên N ngày" | — |

Trạng thái cuối (`hired`, `rejected`, `cancelled`) và lịch `interview` sắp diễn ra → không gợi ý. Điểm hiệu lực lấy
`effectiveScreeningScores` (GĐ3); ngưỡng là `minimumScoreThreshold` của cấu hình đã chấm. Gợi ý không bao giờ đổi trạng
thái tự động; từ chối luôn qua luồng từ chối có lý do sẵn có.

## Phần 3 — Thống kê và chi phí AI

### Yêu cầu

| # | Yêu cầu |
|---|---|
| R17 | `GET /analytics/recruitment?from&to&jobId` (recruiter theo phòng ban như Kanban, org_admin theo tổ chức, admin toàn hệ thống, có thể lọc `organizationId`). Mặc định 30 ngày gần nhất; `from > to` hoặc khoảng > 366 ngày → 400. |
| R18 | Trả `totals` (đơn trong kỳ, tin đang mở, đã tuyển trong kỳ, thời gian tuyển trung bình theo ngày), `funnel` (5 giai đoạn `applied → screening → interview → offer → hired`: số đơn từng đạt, tỉ lệ so với giai đoạn trước), `outcomes` (`rejected`, `cancelled`), `timeInStage` (số ngày trung bình mỗi giai đoạn, chỉ tính lượt ở đã kết thúc, kèm số mẫu), `trend` (số đơn theo ngày), `recent` (6 đơn mới nhất theo `appliedAt`, lấy bằng query có `take 6` — sửa A-04). |
| R19 | Funnel tính trên nhóm đơn có `appliedAt` trong kỳ; "đạt giai đoạn S" = lịch sử từng có `toStatus = S` hoặc trạng thái hiện tại là S. Hàm thuần, test biên (rỗng, revert, nhảy cóc). |
| R20 | `AiUsageLog.organizationId` (nullable). Ghi khi biết: chấm CV và embedding của lần chấm (tổ chức của lượt chấm), phân tích JD (tổ chức của caller), giải thích co-pilot. Migration điền ngược cho dòng `cv_scoring` cũ qua `cv_screenings`. |
| R21 | Bảng `AiModelPrice(modelName, inputUsdPerMillion, outputUsdPerMillion, updatedAt, updatedById)`. Admin xem/sửa ở `GET/PUT /ai-usage-logs/prices[/:modelName]`; giá ≥ 0, tối đa 4 chữ số thập phân. Không có giá nào cài sẵn trong code. |
| R22 | `GET /ai-usage-logs/summary?from&to&organizationId`: admin toàn hệ thống hoặc một tổ chức; org_admin chỉ tổ chức mình (tham số khác → 403). Trả theo tháng × loại: số lượt, lượt lỗi, token vào/ra, chi phí ước tính (USD, `null` khi model chưa có giá) và danh sách model thiếu giá. |
| R23 | Web `/dashboard` (recruiter, org_admin, admin): bộ lọc kỳ + tin; KPI, funnel, thời gian ở giai đoạn, xu hướng, đơn mới nhất từ R17. Org_admin/admin thêm khối "Chi phí AI" từ R22. Trang `/ai-usage-logs` (admin) thêm bảng giá model sửa được. |

## Tiêu chí nghiệm thu

| # | Tiêu chí | Kiểm bằng |
|---|---|---|
| C1 | Lịch online không link → link phòng nội bộ đúng `interviewId`; có link ngoài → giữ nguyên; đổi onsite → online không link → link nội bộ | API unit |
| C2 | `join`: ứng viên của đơn, người phỏng vấn, người tạo lịch → token; recruiter khác, org_admin, ứng viên khác → 403; lịch không tồn tại → 404 | API unit |
| C3 | Khung giờ: đúng biên `startAt − 15'` và `end + 30'` vào được; sớm/muộn 1 giây → 400 đúng thông báo; onsite/huỷ/xong → 400 | API unit (hàm thuần) |
| C4 | Token giải mã bằng secret thật của `livekit-server-sdk`: đúng room, identity, quyền, `exp` = cuối khung giờ | API unit |
| C5 | Thiếu cấu hình LiveKit → 503, API vẫn boot | API unit + boot |
| C6 | Trang phòng họp: lỗi quyền/khung giờ hiện đúng chữ; có token → render phòng; nút "Vào phòng phỏng vấn" bật/tắt theo khung giờ | Web unit |
| C7 | Hai người (recruiter, ứng viên) vào cùng phòng trên LiveKit thật trong stack test với thiết bị giả: mỗi bên thấy người kia | E2E |
| C8 | Bảng luật co-pilot: mỗi luật một ca khớp và một ca ngay ngoài biên (điểm = ngưỡng, 6 vs 7 ngày, 13 vs 14 ngày) | API unit (hàm thuần) |
| C9 | `apply`: key cũ → 409; `move_status` đi qua FSM và ghi lịch sử + `CopilotDecision`; `open_profile` → 400; sai phạm vi → 403 | API unit |
| C10 | `dismiss` ẩn gợi ý; đổi trạng thái → gợi ý mới hiện lại | API unit |
| C11 | `explain` lỗi LLM → 503, không ghi decision; thành công ghi log `copilot` có `organizationId` | API unit |
| C12 | Thẻ Kanban hiện gợi ý; dialog đúng nút theo action; áp dụng gọi đúng action | Web unit |
| C13 | Recruiter áp dụng "Mời phỏng vấn" trên Kanban → thẻ sang cột Phỏng vấn, lịch sử ghi "Áp dụng gợi ý co-pilot" | E2E |
| C14 | Funnel/thời gian ở giai đoạn: rỗng, một đơn, revert, nhảy cóc, lượt ở chưa kết thúc không tính | API unit (hàm thuần) |
| C15 | Phạm vi thống kê: recruiter chỉ thấy phòng ban mình; org_admin tổ chức mình; tham số `organizationId` của org_admin khác → 403 | API unit |
| C16 | Chi phí: token × giá đúng tới 6 chữ số thập phân; model thiếu giá → `null` và có trong danh sách thiếu | API unit (hàm thuần) |
| C17 | Migration `organizationId` điền ngược đúng cho `cv_scoring`, dòng khác giữ null | Probe DB |
| C18 | Dashboard hiện funnel và đơn mới nhất từ API mới; khối chi phí AI chỉ với org_admin/admin; admin sửa giá model | Web unit |
| C19 | Dashboard trên stack test: số funnel khớp dữ liệu seed | E2E |

## Biên và lỗi

- E1: đồng hồ API và trình duyệt lệch — khung giờ chỉ do API quyết; web chỉ ẩn/hiện nút theo dữ liệu API trả.
- E2: lịch đổi giờ sau khi đã cấp token — token cũ hết hạn theo khung cũ; vào lại lấy token mới.
- E3: hai tab cùng một người — LiveKit coi cùng `identity` là một người, tab sau đẩy tab trước ra (hành vi của LiveKit, ghi trong `research.md`).
- E4: đơn đã đổi trạng thái giữa lúc xem và lúc áp dụng gợi ý → 409 (R12).
- E5: ngưỡng hoặc điểm `null` (cấu hình cũ) → không áp luật dựa trên điểm.
- E6: kỳ thống kê rỗng → mọi số 0, tỉ lệ `null` (không chia cho 0).

## Kiểm thử

- API unit: hàm thuần (khung giờ, luật co-pilot, funnel, chi phí) bằng `test.each` có biên; service với `createPrismaMock`.
- Web unit (Vitest + Testing Library): query theo role/chữ hiển thị; LiveKit components được mock ở biên module.
- E2E (Playwright, `docker-compose.test.yml` có LiveKit): C7, C13, C19.
- Probe DB dùng một lần: C17.
- Lệnh mặc định không cần dịch vụ; E2E và probe là lệnh riêng như hiện có.

## Rủi ro

- LiveKit trong Docker trên Windows: UDP qua NAT của Docker Desktop. Có cổng TCP 7881 dự phòng; kiểm bằng E2E thật (C7).
- Prod chưa có LiveKit: cần sửa compose prod + nginx (WebSocket) + mở cổng UDP/TCP trên VPS; chờ chủ dự án.
- Giá model không có nguồn chính thức trong repo: chi phí là ước tính do admin nhập giá.
