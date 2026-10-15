# Web UI — sửa theo Web Interface Guidelines: kết quả

**Ngày:** 2026-10-15 · **Nhánh:** `fix/web-ui-guidelines` (worktree `E:\wt\ats-ui`, cắt từ `dev` `82001dc`) ·
**Khảo sát:** [survey.md](survey.md) · **Quét máy:** `results/scan.py`, trước `results/scan-raw.md` (355 điểm), sau 123 điểm
(còn lại là báo nhầm hoặc đã quyết giữ, liệt kê ở survey).

## Quyết định của người dùng (2026-10-15)
- Phạm vi: lỗi đã xác minh + các sửa cơ học. Chưa duyệt bố cục bằng mắt.
- Số thập phân giữ dấu chấm (`8.5`); không đổi 13 chỗ `toFixed`.
- Làm trong worktree riêng để môi trường kiểm tay đang chạy ở checkout chính không bị đổi file.

## Đã sửa
| Nhóm | Thay đổi |
|---|---|
| Toàn cục | Skip link "Bỏ qua tới nội dung chính" ở `app/layout.tsx`; `id="main-content"` ở shell candidate, public, staff (DashboardLayout), interview-session (đổi `div` → `main`), AuthShell và StaffAuthShell (`role="main"`); `MotionProvider` (`MotionConfig reducedMotion="user"`) bọc toàn app; `scroll-behavior: auto` khi prefers-reduced-motion; `overscroll-behavior: contain` cho `[role='dialog']`; `viewport.themeColor` |
| Landmark | `StaffProfileClient`: `<main>` lồng → `<div>` |
| Nút chỉ có icon | 8 nút có `aria-label` (và `aria-expanded`/`aria-pressed` khi là nút bật/tắt) |
| Focus | 5 ô nhập có viền focus: `focus-within` ở khung (trang chủ ×2, lọc ứng viên), `focus-visible:ring` ở ô sửa tại chỗ (ConfigCard ×2) |
| Xoá | Nút xoá chủ đề phỏng vấn dùng `ConfirmModal` thay `window.confirm`; thêm `DeleteInterviewTopicButton.test.tsx` |
| Điều hướng | Chip "Tìm nhiều" ở trang chủ là `<Link>`; `HomeHero.test.tsx` kiểm `href` thay cho `router.push` (cùng URL) |
| Cơ học | `transition-all` → `transition` (162 chỗ) và `transition-[width]` (5 thanh tiến độ); `...` → `…` (43 chỗ); 8 ô email có `spellCheck={false}`, `autoComplete="email"` ở form đăng nhập/đăng ký/quên mật khẩu, `autoComplete="off"` ở form quản trị |
| Ngày | `UserRow` dùng `Intl.DateTimeFormat('vi-VN')` (cùng kết quả `dd/MM/yyyy`) |

## Kiểm chứng (chạy trong worktree)
| Lệnh | Kết quả |
|---|---|
| `npm run typecheck:web` | exit 0 (sau `prisma generate --schema=…`, worktree mới chưa có client) |
| `npm run lint:web` | exit 0 (`--max-warnings 0`) |
| `npm run test:web -- --no-file-parallelism` | 63 file, 385/385 pass |
| `NODE_ENV=production npx nx build web --skip-nx-cache` | Compiled successfully |
| Test mới có răng | `DeleteInterviewTopicButton.test.tsx` chạy trên bản cũ (`window.confirm`): 2/2 fail; bản mới: 2/2 pass |
| Trình duyệt (localhost:3002, API test) | Tab lần đầu hiện skip link; Enter đưa focus vào ô "Tìm việc theo từ khóa" trong `#main-content`; ô tìm kiếm có viền xanh khi focus; trang có đúng 1 `<main>`; CSS `prefers-reduced-motion` đã nạp; HTML có `<meta name="theme-color" content="#F5F5F7">` |

## Chưa kiểm
- Chưa giả lập `prefers-reduced-motion: reduce` để thấy animation tắt thật (chỉ thấy cấu hình và CSS đã nạp).
- Chưa so ảnh từng trang trước/sau ở 1440/1280/1024/390. Thay đổi không đổi giao diện tĩnh, trừ ký tự `…`; viền focus chỉ hiện khi focus.
- Chưa duyệt bố cục bằng mắt (tràn chữ, vỡ layout) — ngoài phạm vi lần này.
- Một lần sửa nhãn ngày `dd/MM` sang `Intl` đã được hoàn lại vì `vi-VN` cho `05-10`; test không bắt được thay đổi này (không assert nhãn).
