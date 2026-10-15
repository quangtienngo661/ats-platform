# Web UI — rà soát theo Web Interface Guidelines (survey)

**Ngày:** 2026-10-15 · **Phạm vi:** `apps/web/src/**/*.tsx` (223 file, không tính test) trên `dev` `82001dc`.
**Bộ quy tắc:** Vercel Web Interface Guidelines, tải từ
`https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md` ngày 2026-10-15 (HTTP 200, 191 dòng).
**Cách làm:** script `results/scan.py` quét các mẫu kiểm được bằng máy (control: file mẫu có 4 lỗi cố ý, script bắt đủ 4);
mọi điểm trong mục "Đã xác minh" được đọc tay. Kết quả thô (có báo nhầm) ở `results/scan-raw.md` — 355 điểm / 108 file.
Chưa duyệt giao diện bằng mắt trên trình duyệt: mục này chỉ là rà soát mã.

## Đã xác minh (đọc tay)

### Toàn cục
app/layout.tsx:31 - không có skip link tới nội dung chính
app/layout.tsx:31 - 45 file dùng framer-motion nhưng không có `MotionConfig reducedMotion="user"` hay `useReducedMotion` (0 chỗ xử lý prefers-reduced-motion)
app/global.css:24 - `scroll-behavior: smooth` không có `@media (prefers-reduced-motion: reduce)`
app/layout.tsx - không có `viewport.themeColor` (meta theme-color)
components/common/AccessibleDialog.tsx - modal/drawer không có `overscroll-behavior: contain` (0 file trong toàn app)

### Nút chỉ có icon, thiếu `aria-label` (8 chỗ thật trong 21 điểm script báo; 13 còn lại có chữ từ biến)
components/ai-configuration/ui/ConfigCard.tsx:202 - nút thu gọn/mở (chevron) thiếu aria-label + aria-expanded
components/auth/forms/ResetPasswordForm.tsx:147 - nút ẩn/hiện mật khẩu thiếu aria-label
components/department-management/ui/DepartmentCard.tsx:32 - nút sửa (Edit2) thiếu aria-label
components/job-category-management/ui/JobCategoryTree.tsx:45 - nút sửa thiếu aria-label
components/job-category-management/ui/JobCategoryTree.tsx:86 - nút mở nhánh thiếu aria-label + aria-expanded
components/job-postings/ui/JobPostingCard.tsx:148 - nút sửa (Edit3) thiếu aria-label
components/public/layout/PublicHeader.tsx:111 - nút avatar mở menu tài khoản thiếu aria-label + aria-expanded
components/public/layout/PublicHeader.tsx:192 - nút menu mobile thiếu aria-label + aria-expanded

### Ô nhập bỏ viền focus mà không có thay thế (bàn phím không thấy đang ở đâu)
components/ai-configuration/ui/ConfigCard.tsx:91,105 - `outline-none`, không có focus style (ô sửa tên/mô tả cấu hình)
components/candidates/ui/CandidatesFilters.tsx:87 - ô tìm ứng viên, khung cha không có `focus-within`
components/public/home/HomeHero.tsx:58,68 - ô tìm kiếm và chọn hình thức ở trang chủ, khung cha không có `focus-within`
(Đọc lại khi sửa: AddProfileModal.tsx:156,182,208 là thẻ `<p>` không nhận focus, và JobSearchClient.tsx:160 đã có
`focus-within` ở khung cha cách 8 dòng — 4 điểm này là báo nhầm.)

### Landmark
components/user-management/StaffProfileClient.tsx:12 - `<main>` lồng bên trong `<main>` của DashboardLayout (hai landmark main)

### Hành động xoá / điều hướng
components/interview-topic-management/ui/DeleteInterviewTopicButton.tsx:30 - xoá chủ đề dùng `window.confirm`, các chỗ xoá khác dùng `ConfirmModal`
components/public/home/HomeHero.tsx:92 - chip từ khoá điều hướng bằng `router.push` trong onClick → `<Link>`
components/candidates/ui/CompareBar.tsx:28 - nút "So sánh" điều hướng bằng `router.push` (được: là nút có trạng thái disabled; ghi nhận, không sửa)
components/mock-interview/InterviewChatClient.tsx:355, components/mock-interview/InterviewGeneratingClient.tsx:58 - điều hướng bằng router.push sau hành động (giữ)

### Hàng loạt, cơ học (danh sách đầy đủ trong `results/scan-raw.md`)
- `transition-all` → liệt kê thuộc tính: 160 chỗ / 83 file. Ba thanh tiến độ đổi `width` (AddProfileModal.tsx:237, ConfigCard.tsx:291, CandidateOverviewTab.tsx:406) cần `transition-[width]`; còn lại dùng `transition` / `transition-colors`.
- `...` → `…` trong chữ hiển thị: 43 chỗ / 31 file (ví dụ "Đang lưu...", "Đang gửi yêu cầu chấm...").
- Ô email thiếu `autoComplete="email"` và `spellCheck={false}`: 8 chỗ (company-profile, ForgotPassword, Login, Register, StaffLogin, MutateRecruiter, AddUser, EditUser).

### Định dạng ngày/số
components/user-management/ui/UserRow.tsx:36 - ngày ghép tay `dd/MM/yyyy` → `Intl.DateTimeFormat('vi-VN')`
components/interview-schedule/InterviewScheduleClient.tsx:82 - nhãn `dd/MM` ghép tay: **giữ nguyên**, vì `Intl.DateTimeFormat('vi-VN', {day, month})` cho `05-10` (gạch ngang), khác giao diện hiện tại; `toDateKey` (dòng 40) là khoá nội bộ `YYYY-MM-DD`, đúng.
`.toFixed(1)` cho điểm và lương (13 chỗ / 8 file) hiển thị dấu chấm thập phân; tiếng Việt dùng dấu phẩy — cần quyết định (xem plan)

## Báo nhầm của script (đã loại)
- 13 "nút chỉ có icon" có chữ từ biến (số trang, nhãn, `{cat}`, `{term}`…).
- 5 "ô không có nhãn": 3 nằm trong code đã comment (ProfileEditModal.tsx:118-140), 2 là radio bọc trong `<label>` (MutateInterviewScheduleModal.tsx:260, ScreeningConfigModal.tsx:125).
- "định dạng ngày cứng" ở app/(recruiter)/interviews/page.tsx:30 và MutateInterviewScheduleModal.tsx:50 là giá trị `YYYY-MM-DD` cho `<input type="date">`, đúng chuẩn.

## Không áp dụng / ghi nhận, không đề xuất sửa lần này
- 77 chỗ `focus:` trên ô nhập (`focus:border`, `focus:ring`): với ô nhập, trình duyệt luôn khớp `:focus-visible` nên khác biệt không đáng kể.
- Quy tắc Copy (Title Case, curly quotes, ngôi thứ hai): viết cho tiếng Anh; UI dùng tiếng Việt.
- Trạng thái lọc/trang trong URL, virtual list: đổi kiến trúc, ngoài phạm vi sửa lỗi.
- Không có `<img>`, không chặn zoom. `RichTextEditor` có `onPaste` với `preventDefault`, nhưng chèn lại nội dung dưới dạng chữ thuần (không chặn paste, chỉ bỏ HTML) — đạt.
- Toast dùng `sonner` (có sẵn `aria-live`).

## Chưa kiểm
- Bố cục bằng mắt (tràn chữ, vỡ layout ở 1440/1280/1024/390, chế độ mobile) — cần duyệt trên trình duyệt.
- Thứ bậc heading từng trang: 36 page, 4 page có `<h1>` trực tiếp, 30 component chứa `<h1>`; chưa đối chiếu từng trang.
- `ScreeningConfigModal`: radio ẩn — chưa kiểm có viền focus khi dùng bàn phím.
