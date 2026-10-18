# GĐ2 — kiểm tay SP1, SP2, SP3 trên `dev`

**Cập nhật:** 2026-10-18. SP1 (PR #68), SP2 (PR #69), SP3 (PR #70) đã vào `dev`; kết quả từng phần ở
`docs/deliveries/gd2-sp{1,2,3}-*.md` (mục as-built). Tài liệu này là cách tự kiểm bằng tay trên trình duyệt với dữ liệu mẫu,
dùng test stack cô lập (`docker-compose.test.yml`, DB `ats_test`), không đụng DB dev.

## 1. Chuẩn bị

Cần Docker Desktop đang chạy và không phiên nào giữ khoá test stack (`ls "$LOCALAPPDATA/ats-e2e.lock"` báo không tồn tại).
Chạy từ thư mục gốc repo, trên `dev`:

```bash
docker compose -f docker-compose.test.yml up -d --build --wait
node apps/web/e2e/support/prepare-local.mjs
node docs/tasks/gd2-parallel-execution/manual-testing/seed.mjs 1
node docs/tasks/gd2-parallel-execution/manual-testing/seed.mjs 2
node docs/tasks/gd2-parallel-execution/manual-testing/seed.mjs 3
```

`seed.mjs` tạo dữ liệu mẫu **không dọn** (dùng lại hàm tạo fixture của E2E) và in ra email, mật khẩu, tên tin tuyển dụng.
Mật khẩu là giá trị test sinh ngẫu nhiên trong DB `ats_test`; không lưu kết quả in ra vào repo.

Windows có thể giữ trước một dải cổng (đã gặp `51023–51122`, kiểm bằng
`netsh interface ipv4 show excludedportrange protocol=tcp`), làm Mailpit không mở được cổng SMTP `51025`. API gửi mail
tới Mailpit qua mạng nội bộ Docker (`mailpit:1025`) nên chỉ cần đổi cổng phía máy bằng một file override ngoài repo:

```yaml
services:
  mailpit:
    ports: !override
      - "127.0.0.1:52025:1025"
      - "127.0.0.1:58025:8025"
```

rồi chạy `docker compose -f docker-compose.test.yml -f <file-override> up -d --build --wait`.

Chạy web ở terminal khác, cũng từ thư mục gốc repo:

```bash
NODE_ENV=development NEXT_PUBLIC_API_BASE_URL=http://localhost:55000/api API_INTERNAL_URL=http://localhost:55000/api NEXT_PUBLIC_SOCKET_URL=http://localhost:55000 node node_modules/next/dist/bin/next dev apps/web --hostname localhost --port 3001
```

Đăng nhập ở `http://localhost:3001/sign-in`. **Không dùng `.env` gốc cho web**: nó trỏ `NEXT_PUBLIC_*` về production.
Đăng nhập giới hạn 5 lần/60 giây; sai nhiều lần sẽ gặp `Too Many Requests` và phải chờ.

Khi xong: `docker compose -f docker-compose.test.yml stop` (không `down -v` nếu chưa muốn xoá DB test), rồi
`git checkout -- apps/web/next-env.d.ts docs/tasks/test-defect-fixes/results/local-fixture.json` (Next và `prepare-local.mjs`
ghi lại hai file này).

## 2. Kịch bản kiểm tay

### SP1 — đánh giá ứng viên (`seed.mjs 1`)
Dữ liệu: 1 tin, 2 recruiter cùng khoa (A, B), 2 ứng viên đã có kết quả sàng lọc ở trạng thái `interview`, 1 buổi phỏng vấn **đã hoàn tất** do A đặt và A phỏng vấn.
1. Đăng nhập **A** → mở tin → mở một ứng viên → tab đánh giá: thấy form scorecard (4 điểm 1–5, khuyến nghị, nhận xét). Bấm nộp khi thiếu một mục: không gửi được. Điền đủ và nộp → hiện scorecard đã nộp; nút sửa chỉ A thấy.
2. Nhận xét đúng 2000 ký tự được, 2001 ký tự bị chặn.
3. Thêm một ghi chú ở tab ghi chú; sửa và xoá được ghi chú của chính mình.
4. Đăng nhập **B** (không phải interviewer, không phải người đặt lịch): mở cùng ứng viên → **thấy** scorecard của A ở chế độ chỉ đọc và **không có** nút nộp; B thêm ghi chú được, không sửa/xoá được ghi chú của A. (Đây là lỗi đã sửa ở Task 12; nếu B không thấy gì thì hồi quy.)
5. Ở danh sách ứng viên của tin: tick 2 rồi 4 ứng viên → xuất hiện thanh so sánh; tick thêm ứng viên thứ 5 bị chặn. Bấm so sánh → bảng so sánh, ứng viên chưa có scorecard hiện "chưa có". Không có xếp hạng hay ghi dữ liệu.
6. Drawer lịch phỏng vấn của A: có liên kết sang tab đánh giá; ở B thì không có.
7. Đơn sang `hired`/`rejected`/`cancelled` → không nộp được scorecard (form khoá, API 409).
8. Xoá buổi phỏng vấn đã có scorecard → bị từ chối (409).
9. Đăng nhập tài khoản **ứng viên**: không thấy scorecard hay ghi chú nào, và vào thẳng `/jobs/<id>/compare` bị chặn.

### SP2 — chấm CV hàng loạt và CSV (`seed.mjs 2`)
Dữ liệu: 2 tin (A có nhiều đơn `screening`, 1 `applied`, 1 `interview`, 1 `cancelled`; B có 1 `applied` và 1 đã chấm xong) và 2 recruiter.
1. Danh sách ứng viên của tin A: tick vài đơn → thanh "chấm hàng loạt" (tối đa 50) → hộp thoại "Chấm CV hàng loạt" → bấm bắt đầu. Kết quả: số đơn đã đưa vào hàng đợi + danh sách đơn bị bỏ qua kèm lý do tiếng Việt. Bấm hai lần liên tiếp chỉ gửi một request.
2. Đơn `applied` mặc định **không** được chấm; bật ô "Chuyển các đơn ở Mới sang Sàng lọc trước khi chấm" thì đơn đó chuyển sang `screening` và được đưa vào hàng đợi (có một dòng lịch sử).
3. Chọn đơn đã chấm xong → bị bỏ qua với lý do "đã chấm".
4. Bấm chấm 4 lần trong một phút bằng **cùng** tài khoản → lần thứ 4 báo quá giới hạn (429). Đăng nhập recruiter thứ hai thì vẫn chấm được.
5. Nút xuất CSV: tải file về, mở bằng **Excel**: tiếng Việt đúng dấu, cột đúng; không có cột email hay số điện thoại; không có đơn `cancelled`. Ô bắt đầu bằng `=`, `+`, `-`, `@` phải hiện là văn bản, không chạy công thức.
6. **Lưu ý khi kiểm:** Gemini không chạy được (key hết, test stack dùng key giả). Đơn được đưa vào hàng đợi sẽ **thất bại sau 3 lần thử lại**, không có điểm AI mới. Đó là bình thường, không phải lỗi của SP2. Điểm AI không bao giờ tự đổi trạng thái đơn.

### SP3 — email cho ứng viên (`seed.mjs 3`)
Dữ liệu: 1 tổ chức, 1 recruiter, 1 ứng viên, 1 tin đang tuyển, **chưa có đơn nào**. Mailpit của stack này ở `http://localhost:58025` (SMTP 51025, hoặc cổng của file override); mọi email test đi vào đây, không gửi ra ngoài.
1. Đăng nhập ứng viên → nộp đơn vào tin → mở Mailpit: có email xác nhận nhận đơn gửi đến địa chỉ ứng viên.
2. Đăng nhập recruiter → chuyển đơn sang `screening`: **không** có email. Sang `interview`: có email mời phỏng vấn. Lần lượt `offer`, `hired`: mỗi bước một email.
3. Tạo lịch phỏng vấn cho đơn: email lịch có giờ dạng `09:30–10:30, Thứ Ba, 20/10/2026 (giờ Việt Nam)` và có thông báo trong ứng dụng cho ứng viên. Đổi giờ: email ghi giờ cũ ("Trước đây"). Huỷ lịch: email huỷ.
4. Từ chối một đơn đang có lịch sắp tới: **một** email từ chối trung tính (không nêu lý do), liệt kê các lịch bị huỷ, **không** có email huỷ lịch riêng.
5. Ứng viên rút đơn: không email. Email không chứa điểm, dữ liệu AI hay ghi chú của recruiter.
6. Tên tin chứa `<b>` hoặc `&` hiển thị đúng chữ trong email (không in đậm). Đây là dữ liệu mẫu cố ý.
7. DB: `SELECT * FROM email_notifications` trong `ats_test` (PostgreSQL `localhost:55432`) → các hàng `sent`.

## 3. Kiểm lại bằng lệnh

```bash
npx jest --config apps/api/jest.config.ts --runInBand --silent
npm run test:web -- --no-file-parallelism
npm run typecheck:web
npm run lint:web
```

`nx lint api` / `nx build api` trên máy này cần `NX_DAEMON=false` cùng `NX_WORKSPACE_DATA_DIRECTORY` và
`NX_CACHE_DIRECTORY` trỏ vào trong repo (thư mục `.nx/` đã gitignore), `rm -rf dist .nx/cache` trước build và
`--skip-nx-cache` (không có cờ này log có thể chỉ là cache replay). Khi máy tải nặng, `ScorecardForm.test.tsx` và
`CandidateRow.test.tsx` có thể timeout ở mức 5 giây dù chạy riêng thì xanh.

## 4. Chưa kiểm
Giao diện chưa ai xem bằng mắt hết các màn (desktop/mobile); Gemini thật (key hết tiền); CSV mở bằng Excel; Gmail SMTP thật;
ranh giới khoa ở SP1 chỉ có unit test; recruiter không được báo khi có scorecard vẫn là giả định ngoài phạm vi.
