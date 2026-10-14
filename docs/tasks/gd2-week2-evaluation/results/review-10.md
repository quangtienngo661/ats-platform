# Review — Task 10 (tab đánh giá và ghi chú) — đang dở

## Pha 1 — test

- Codex viết `CandidateTabs.test.tsx`, `ScorecardPanel.test.tsx`, `ScorecardForm.test.tsx`, `NotesPanel.test.tsx`. Phiên `-impl` chạy lại: 4 file đỏ vì `Failed to resolve import` (component chưa có) → đỏ đúng lý do; 46 file cũ (336 test) xanh.
- `interviewerId` có trong lịch phía staff: Codex đọc `schema.prisma:617`, `include-options.util.ts:145` (không omit), `interviews.service.ts:397,407` (chưa chạy API thật; Task 12 sẽ chạy).
- Commit `96127b2 test(web): add the evaluation tabs behaviour`.
- **Bỏ sót khi review pha 1:** `ScorecardForm blocks submit until all four ratings and a recommendation are chosen` lặp 5 lần render + truy vấn + gõ 61 ký tự; không chạy được dưới 5000ms trên máy này (xem dưới). Lúc review pha 1 test chỉ đỏ vì thiếu module nên không lộ.

## Pha 2 — code (chưa commit)

- Job Codex `task-mv7a402s-oo4j3r` treo từ 06:07 ở bước nó tự chạy `npm run typecheck:web` + `npm run lint:web` (log job không ghi thêm, file không đổi). `codex-companion cancel` lỗi tham số taskkill (Git Bash đổi `/PID`), nhưng PID 141504 của job đã không còn (`tasklist` rỗng).
- Log job cho thấy Codex đã dùng một "temporary Node preload" qua `NODE_OPTIONS` để test chạy nhanh hơn. **Không dùng làm bằng chứng.** `NODE_OPTIONS` của phiên rỗng; `git status` không có file preload nào trong repo.
- Phiên `-impl` chạy (không preload): `npm run typecheck:web` exit 0; `npm run lint:web` exit 0; `npm run test:web` 342/343, FAIL duy nhất là test ScorecardForm trên (timeout 5000ms).
- Lỗi của test thứ hai `ScorecardForm shows the API message … keeps the typed values` khi chạy chung là **hệ quả**: test 1 hết giờ nhưng vẫn gõ tiếp vào DOM của test 2 (nhận xét bị trộn ký tự, submit gọi 2 lần). Chạy riêng (`-t`) → PASS 1840ms.

## Đo nguyên nhân

1. Giả thuyết "userEvent chờ timer mỗi phím": đổi `userEvent.setup()` → `userEvent.setup({ delay: null })` (2 dòng). Chạy riêng file 3 lần: test 1 = 4628 ✓ / 4556 ✓ / 5052 ✗ ms (trước: 5051 ✗). **Bác bỏ** → đã `git checkout` hoàn lại.
2. Test đo tạm (`zz-tmp-measure.test.tsx`, tạo trong `apps/web/src/components/candidates/ui/` vì vitest chỉ nhận file dưới `src/`, chạy 3 lần rồi **xoá ngay**; `git status` sau đó không còn). Kết quả ghi ra `scratchpad/measure.jsonl`. Một vòng tương đương của test 1:

| Bước | Lần 1 | Lần 2 | Lần 3 | Số lần React render |
|---|---|---|---|---|
| render `ScorecardForm` | 26 ms | 28 | 32 | 1 |
| 24 lần `getByRole`/`within` (4 nhóm × 6) | 273 ms | 262 | 310 | — |
| 4 lần click radio | 310 ms | 345 | 350 | 4 (1 mỗi click) |
| chọn khuyến nghị | 60 ms | 85 | 65 | — |
| `user.type` 61 ký tự | 584 ms | 626 | 538 | **0** (textarea không điều khiển) |
| **Đối chứng:** cùng 24 truy vấn trên HTML tĩnh, không React | 239 ms | 184 | 166 | — |

- Kết luận theo số đo: **không phải do component** (render 1 lần lúc mount, 1 lần mỗi click, 0 lần khi gõ; mount ~30ms). Chi phí nằm ở **khối lượng thao tác của test**: truy vấn `getByRole` (đối chứng tĩnh cho thấy cùng mức ~170–240ms, tức là chi phí của jsdom/máy, không phải của component) và `user.type` (~9ms/ký tự kể cả không có render). Test 1 làm 5 vòng như vậy (thêm các truy vấn "not checked" cho 20 radio và hai lần `expectBlocked`) → ~4,5–5s.
- Tải CPU lúc đo: **không lấy được** (`powershell` bị guard worktree chặn, `wmic` không có trên máy).
- Đối chứng "test form có sẵn trong repo" (điều phối yêu cầu): **chưa làm**; thay bằng đối chứng HTML tĩnh ở trên (tách được truy vấn khỏi component). Ghi thật.
- Lệch quy trình: file đo tạm được đặt trong repo (không phải scratchpad) vì cấu hình vitest chỉ nhận `src/**/*.test.*`; đã xoá ngay sau khi đo.

## Trạng thái

Chờ điều phối và người dùng duyệt cách sửa test (xem đề xuất gửi điều phối). Code Task 10 (6 file) ở working tree, chưa commit.

## Đo lần 2 (Codex, bản sao tạm của đúng test 1, đã xoá; số trong `task-10-timing-run{1,2}.jsonl`, phiên `-impl` đã đối chiếu)

- Sửa `user.type` → `user.click` + `user.paste` (Codex chạy, log `task-10-scorecardform-run{1,2,3}.log`): test 1 = 5021 ✗ / 4915 ✓ / 5014 ✗ ms → không nhanh lên; đã `git checkout` hoàn lại. `test:web` toàn bộ 2 lần 343/343 (log `task-10-test-web-run{1,2}.log`), `typecheck:web` exit 0, `lint:web` 0/0.
- Đo từng bước (máy tải nặng hơn lúc đo: tổng 10886 / 10592 ms so với ~5000 bình thường):
  - Tổng từng vòng: run 1 = 3111, 1888, 2123, 1865, 1896; run 2 = 2794, 2045, 2158, 1895, 1697 → **không tích luỹ** (vòng 1 chậm nhất do khởi động, vòng 2–5 phẳng).
  - `user.type` 61 ký tự ≈ 950–1010 ms mỗi vòng (≈ 45–47% tổng); nhóm truy vấn ≈ 22%.
- Mâu thuẫn chưa giải thích: đo cho thấy `user.type` chiếm gần nửa, nhưng thay bằng `paste` thì tổng không giảm ở lượt chạy trước. Hai lượt chạy ở mức tải máy khác nhau nên không so trực tiếp được. Ghi thật, không kết luận thêm.

## Sửa đã duyệt: tách test 1 thành 5 case `it.each` (điều phối và người dùng duyệt)

- Đổi **cấu trúc** test đã commit, không đổi assert: `git diff -w` (lưu ở `task-10-split-diff-w.txt`) chỉ đổi phần mở đầu (`it.each` 5 case, tiêu đề = chuỗi gốc + `(thiếu $what)`, nhận `{ missing }`, bỏ `for` và dấu đóng); thân vòng lặp giữ đúng từng dòng (`git diff -w --stat`: 8 thêm, 4 bớt).
- Codex chạy, phiên `-impl` đọc log (NODE_OPTIONS rỗng, tuần tự):
  - File chạy riêng 3 lần (`task-10-split-scorecardform-run{1,2,3}.log`): 6/6 pass mỗi lần, đủ **5** case con. Thời gian case: 1597–2310 ms (case đầu 1848–2310 do khởi động); test 2: 1762–1821 ms.
  - `npm run test:web` 2 lần (`task-10-split-test-web-run{1,2}.log`): 50/50 file, 347/347 test.
  - `npm run typecheck:web` exit 0; `npm run lint:web` 0 lỗi 0 cảnh báo.
- Rủi ro còn lại: dưới tải nặng (đo trước) vòng khởi động 2,8–3,1 s, biên ~2 s trên trần 5 s; CI chưa chạy.
- Mâu thuẫn chưa giải thích: `user.type` đo được ~46% thời gian mỗi vòng nhưng thay bằng `paste` không làm tổng giảm (hai lượt đo ở mức tải máy khác nhau).
- Review code: chỉ 6 file trong Files; `CandidateTabs`/`ScorecardPanel`/`ScorecardForm`/`NotesPanel` khớp props của plan; nút "Nộp đánh giá" theo `status === completed && interviewerId === currentUserId && !isClosed && chưa có`; sửa/xoá ghi chú chỉ khi `author.userId === currentUserId`; `page.tsx` truyền `currentUserId` (từ `getMeAction`) và `isClosed` (hired/rejected/cancelled). Giao diện chưa xem bằng mắt trong trình duyệt.
- Commits: `2406e03 test(web): split the scorecard required-choice cases into separate tests`, `4086228 feat(web): add the evaluation and notes tabs to the candidate page`.
- `git ls-remote --heads origin feat/gd2-sp1-evaluation` → rỗng.
- Kết luận: approved.
