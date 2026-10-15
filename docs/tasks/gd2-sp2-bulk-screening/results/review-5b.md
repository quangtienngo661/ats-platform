# Review Task 5b — probe trên PostgreSQL thật (2026-10-14)

**Kết luận:** approved. Commit `8d73813` (fixture, probe, log) do phiên `-impl` làm sau khi P1–P5 PASS.

| Bước | Kết quả |
|---|---|
| Khoá | `mkdir "$LOCALAPPDATA/ats-e2e.lock"` thành công (trước đó `ls` xác nhận khoá trống); `rmdir` sau khi xong, `ls` xác nhận đã mất |
| Stack | `docker compose -f docker-compose.test.yml up -d --build --wait`: cả 3 container Healthy; webpack hash trong image `ca5806a8132515f6` trùng bản build local của code Task 5 |
| `prepare-local.mjs` | exit 0; tác dụng phụ: ghi lại `docs/tasks/test-defect-fixes/results/local-fixture.json` (id tổ chức mới) → khôi phục bằng `git checkout --`, không commit |
| P3 (C5, A3, A4) | PASS: 200, `queued` = đúng 50 id `screening` nộp sớm nhất theo thứ tự, `remaining` 10, `skipped` rỗng, không có đơn applied/interview/cancelled; **5531 ms** (≤ 15000) |
| P1 (C1) | PASS: 3 queued; DB 3 dòng `cv_screenings`, `config_id` = cấu hình mặc định của tổ chức |
| P2 (C6) | PASS: `movedToScreening: true`; `applications.status = 'screening'`; đúng 1 dòng `application_history` applied→screening, `changed_by` = recruiter 1 |
| P4 (C10) | PASS: request thứ 4 của recruiter 1 (ở 5673 ms) → 429 `ThrottlerException: Too Many Requests` |
| P5 (A5) | PASS: recruiter 2 ngay sau đó → 200 (tracker theo `userId`; guard JWT cấp class chạy trước `ThrottlerGuard`) |
| Cleanup | `organizationsRemaining: 0`, `usersRemaining: 0` |
| Dừng | `docker compose … stop`; `ps --all`: 3 container Exited |
| Log | không có chuỗi `eyJ`/`Bearer`/`accessToken"` (control: dòng `PASS P3` tìm thấy) |

**Chưa xác minh:** job BullMQ do probe đưa vào hàng đợi không được chờ tới kết quả (Gemini key giả → `failed` sau 3 lần retry, đúng spec); thông báo 429 là tiếng Anh của `ThrottlerGuard` (Task 8 dịch ở server action).
