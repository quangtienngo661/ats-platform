# Kiểm bằng mắt giao diện mới (Task 33)

**Ngày:** 14/11/2026 (chạy trong khoảng 01:00–03:30 giờ VN, tức 18:00–20:30 UTC ngày 13/11: đúng khung giờ server UTC và
trình duyệt VN lệch ngày). **Nhánh:** `feat/ui-redesign`. **Hướng:** A · Mực & kính, chỉ light.

## Kết quả

- 45 nhóm màn × 3 kích thước = 135 ảnh viewport, cộng 7 ảnh trước khi sửa, 16 ảnh kiểm riêng, 5 ảnh legacy
  (163 PNG, 13,6 MB, trung bình 84 KB; đếm bằng `git ls-files`). Thư mục: [`screenshots/`](screenshots/).
- **Tìm thấy 10 lỗi, sửa cả 10** (8 lỗi có test đỏ trước, 2 lỗi chỉ là layout). Còn **15 điểm mở**, ghi ở cuối.
- Sau khi sửa: `scrollWidth === 390` trên **45/45** màn ở 390 px. Không còn console error nào trên màn redesign, trừ 2 trường
  hợp chủ đích (trang 404 trả HTTP 404; job không tồn tại trả trạng thái lỗi).

## Cách chạy

- Stack test có sẵn: API `:55000`, Postgres `:55432`, Redis `:56379`. Web là `next dev` trên `:3011`, chạy với
  `TZ=UTC` giống server Docker, để lỗi lệch ngày lộ ra. Sau đó build production và chạy `next start` trên `:3011` cho
  phần bundle và prefetch.
- Dữ liệu: một tổ chức riêng chèn thẳng vào `ats_test` theo cách `apps/web/e2e/support/*-fixtures.mjs` làm. Gồm
  org admin, recruiter, ứng viên chính và 7 ứng viên khác; 4 tin (đang tuyển, nháp, đã đóng, và một tin tiêu đề đúng
  120 ký tự); 10 đơn ở mọi vòng có điểm AI; 3 lịch phỏng vấn; thông báo; phiên phỏng vấn thử đã xong (có kết quả) và
  đang diễn ra; AI usage log; CV đã phân tích kèm dữ liệu trích xuất.
- Dữ liệu xấu nhất: tin 120 ký tự; ứng viên và một recruiter tên dài 100 ký tự
  (`Nguyễn Hoàng Bảo Ngọc Phương Thảo … Đặng Thị Ngọc Bích`); email dài; tên tệp CV dài.
- Sau khi chụp, toàn bộ dữ liệu này đã bị xóa khỏi `ats_test`; script báo còn 0 dòng.
- Mỗi vai trò đăng nhập một lần, giữ storage state ngoài repo. Script, mật khẩu test và storage state nằm trong
  scratchpad, không nằm trong repo.
- Ảnh có nút "N" (Next dev indicator) ở góc dưới trái vì chụp bằng `next dev`. Bản production không có nút này.

## Bảng màn × kích thước

✓ = không có lỗi mới thấy được; điểm mở (O) ghi cạnh dấu ✓ vẫn áp dụng cho màn đó. ✗ sửa `sha` = lỗi đã sửa, ảnh trong
thư mục là ảnh sau khi sửa. ✗ mở = xem mục "Điểm còn mở". O3 (formatter ngày không có `timeZone`) còn có thể áp dụng cho
các màn không ghi O3 ở đây: bảng chỉ ghi nơi tên component trong O3 chắc chắn có mặt.

| Nhóm màn (tên ảnh) | 1440 | 1024 | 390 |
|---|---|---|---|
| guest-home | ✓ | ✓ | ✓ |
| guest-job-postings | ✓ | ✓ | ✓ |
| guest-job-detail | ✗ sửa `8faea67`; mở O5 | ✗ sửa `8faea67`; mở O5 | ✗ sửa `8faea67`; mở O5 |
| guest-job-detail-long (tiêu đề 120 ký tự) | ✓ | ✓ | ✓ |
| guest-sign-in, sign-in-admin, register, forgot-password, reset-password, verify-email, verification-success | ✓ | ✓ | ✓ |
| guest-not-found | ✓ | ✓ | ✓ |
| candidate-home | ✓ | ✓ | ✓ |
| candidate-job-postings | ✓ | ✓ | ✓ |
| candidate-job-detail (thanh ứng tuyển trên tab bar) | ✗ sửa `8faea67`; mở O3, O5 | ✗ sửa `8faea67`; mở O3, O5 | ✗ sửa `8faea67`; mở O3, O5 |
| candidate-job-detail-closed (tin đã đóng → 404) | ✓ | ✓ | ✓ |
| candidate-my-applications | ✗ sửa `ef19b60`; mở O4 | ✗ sửa `ef19b60`; mở O4 | ✗ sửa `ef19b60`; mở O4 |
| candidate-my-application-detail | ✓ (O3) | ✓ (O3) | ✓ (O3) |
| candidate-my-cvs | ✗ sửa `3cf4780`; mở O11, O15 | ✗ sửa `3cf4780`; mở O11, O15 | ✗ sửa `3cf4780`; mở O11, O15 |
| candidate-my-interviews | ✓ (O3, O14) | ✓ (O3, O14) | ✓ (O3, O14) |
| candidate-profile | ✓ (O11) | ✓ (O11) | ✗ mở (O9, O11) |
| candidate-mock-interview | ✗ sửa `ef19b60` | ✗ sửa `ef19b60` | ✗ sửa `ef19b60` |
| candidate-mock-interview-result | ✗ sửa `ef19b60`, `eceb8a5` | ✗ sửa `ef19b60`, `eceb8a5` | ✗ sửa `ef19b60`, `eceb8a5` |
| candidate-mock-interview-session | ✓ | ✓ | ✓ |
| recruiter-dashboard | ✗ sửa `bb3f007`, `d409d78`, `62586d6`; mở O7 | ✗ sửa (như 1440); mở O7 | ✗ sửa (như 1440); mở O7 |
| recruiter-jobs (tin 120 ký tự) | ✓ | ✓ | ✓ |
| recruiter-candidates | ✓ | ✓ | ✓ |
| recruiter-candidates-long-job | ✓ | ✓ | ✗ mở (O10) |
| recruiter-candidate-detail (tên 100 ký tự) | ✗ sửa `05b7cc2`, `3cf4780`, `ef19b60`; ✗ mở (O8) | ✗ sửa (như 1440); ✗ mở (O8) | ✗ sửa `05b7cc2`, `3cf4780`, `ef19b60` |
| recruiter-compare | ✗ sửa `dccdf3f`; mở O3, O6 | ✗ sửa `dccdf3f`; mở O3, O6 | ✗ sửa `dccdf3f`; mở O3, O6 |
| recruiter-kanban, kanban-long-job | ✓ (O11, O12) | ✓ (O11, O12) | ✓ (O11, O12) |
| recruiter-interviews | ✗ mở (O2, O3, O14) | ✗ mở (O2, O3, O14) | ✗ mở (O2, O3, O14) |
| recruiter-my-profile | ✓ | ✓ | ✓ |
| recruiter-candidates-missing-job (job không tồn tại) | ✗ mở (O13) | ✗ mở (O13) | ✗ mở (O13) |
| orgadmin-department-management, recruiter-management, ai-configuration | ✓ | ✓ | ✓ |
| admin-user-management | ✓ (O12) | ✓ (O12) | ✗ sửa `83d9bea`; mở O12 |
| admin-skill-management, interview-topic-management, job-category-management, company-profile, dashboard | ✓ | ✓ | ✓ |
| admin-ai-usage-logs | ✗ sửa `ef19b60` | ✗ sửa `ef19b60` | ✗ sửa `ef19b60` |

Không chụp được: trang `error.tsx` của từng nhóm (không có cách gây lỗi render an toàn từ ngoài). `/auth-callback` chỉ
chạy trong luồng OAuth nên cũng không chụp.

## Lỗi đã sửa

| # | Lỗi | Bằng chứng trước | Commit (đỏ → sửa) |
|---|---|---|---|
| D1 | Hydration lệch ngày ở `CvCard` (giờ tải lên) và `CandidateDetailClient` ("Nộp ngày"): server UTC, trình duyệt +7 | Log e2e Task 32; dev overlay "1 Issue" trên `/my-cvs` | `06fa398` → `3cf4780` (đỏ 7/10) |
| D2 | `/user-management` rộng 562 px ở viewport 390: `<span class="sr-only">Thao tác</span>` (absolute) thoát khỏi vùng cuộn của bảng vì vùng cuộn không phải containing block | probe: phần tử `SPAN.sr-only` right=562 | `e1bc94c` → `83d9bea` (thêm `relative` cho `Table`) |
| D3 | Hydration ở `ApplicationCard`, `SessionCard`, `InterviewResultClient`, `CandidateOverviewTab`, `AiUsageLogsTable` (ngày/giờ không có `timeZone`) và số token `toLocaleString()` không có locale (server `en-US` "23,010", trình duyệt "23.010") | pageerror trên `/my-applications` (+13/11 −12/11), `/mock-interview`, kết quả phỏng vấn thử, chi tiết ứng viên (+5/11/2026), `/ai-usage-logs` (+23.010) | `9035abc` → `ef19b60` (đỏ 7/7) |
| D4 | Mô tả tin dạng HTML: `whitespace-pre-line` biến mỗi xuống dòng giữa các thẻ block thành một dòng trống | `before-guest-job-detail-390.png` | `9cfbcab` → `8faea67` |
| D5 | Avatar lấy ký tự đầu của dấu câu: "E(" cho "Senior Backend Engineer (NestJS)", "Á(" cho tin 120 ký tự | `before-recruiter-dashboard-1440.png` | `4f44a1e` → `bb3f007` (giờ là "EN", "ÁH") |
| D6 | Trang so sánh ứng viên không có padding ngang: dính sidebar ở 1440, dính mép màn ở 390 | `before-recruiter-compare-1440.png`, `-390.png` | `dccdf3f` (chỉ layout) |
| D7 | Kết quả phỏng vấn thử: mọi thanh điểm ghi "Chưa có điểm". API trả Prisma Decimal dạng chuỗi ("72"), `ScoreBar` chỉ nhận số hữu hạn | `before-candidate-mock-interview-result-1440.png`; `curl …/result` → `"overallScore":"72"` | `937438e` → `eceb8a5` |
| D8 | Chi tiết ứng viên không có padding ngang (thẻ đầu trang dính mép ở 390) | `before-recruiter-candidate-detail-390.png` | `05b7cc2` (chỉ layout) |
| D9 | Reduced motion: thời lượng animation về 0,01 ms nhưng `animation-delay` inline của `Reveal`/`Stagger` vẫn giữ, nên khối nội dung ở opacity 0 trong lúc chờ delay | Dashboard, +50 ms sau hydrate, `reduce`: 5 animation `rise` đang chạy, 5 khối opacity 0 | `52aa287` → `62586d6` |
| D10 | Dashboard "Ứng viên gần đây": tên tin bị cắt "…" mà không có `title` | worst-case script: 2 phần tử bị cắt không có title | `75d00f1` → `d409d78` |

Commit bảo trì test: `515c784` (cho test đổi múi giờ 30 s vì import lại module dưới tải nặng bị quá 5 s),
`d72b130` (sửa kiểu cho fixture điểm dạng chuỗi).

## Kiểm cứng (số đo)

### scrollWidth ở 390 px

| | Trước sửa | Sau sửa |
|---|---|---|
| Số màn có `document.documentElement.scrollWidth === 390` | 44/45 | **45/45** |
| Màn vượt | `/user-management` = 562 (phần tử: `SPAN.sr-only` trong `TH`) | không |

Danh sách trong checklist Task 33 (compare, Kanban, header ConfigCard, phân trang JobSearchClient): compare 390,
Kanban 390 (cả tin 120 ký tự), `/ai-configuration` 390. Kanban và compare cuộn ngang bên trong vùng riêng, đúng thiết kế.

### Dữ liệu xấu nhất (390 và 1440)

Script đếm phần tử bị cắt (`text-overflow: ellipsis` hoặc line-clamp) mà không có `title`:

| Màn | Bị cắt | Không có title | scrollWidth |
|---|---|---|---|
| Sidebar của recruiter tên 100 ký tự, 390 (drawer mở) và 1440 | 4 / 4 | 0 / 0 | 390 / 1440 |
| Bảng ứng viên 390 | 9 | 0 | 390 |
| Kanban 1440, Kanban tin 120 ký tự 390 | 10 / 3 | 0 / 0 | 1440 / 390 |
| `/jobs` 390 | 0 (tiêu đề xuống dòng) | 0 | 390 |
| Dashboard 1440 | 6 | 2 → **0** sau D10 | 1440 |
| `/user-management` 1440, `/recruiter-management` 390 | 12 / 3 | 0 / 0 | 1440 / 390 |

Ảnh: `check-sidebar-long-recruiter-390.png`, `-1440.png`, `recruiter-kanban-long-job-390.png`, `recruiter-jobs-390.png`.

### Reduced motion

Đo bằng init script: chờ app hydrate (`html[data-ui]` có giá trị và có `main`/`h1`), sau 50 ms đếm animation đang chạy
có transform/opacity, phần tử có chữ ở opacity 0, và transform inline từ motion. Có đối chứng `no-preference`.

| Trang | `reduce` trước D9 | `reduce` sau D9 | `no-preference` (đối chứng) |
|---|---|---|---|
| `/` (khách) | 0 chạy, 0 ẩn | 0 chạy, 0 ẩn | 4–24 chạy, 0–4 ẩn |
| `/dashboard` (recruiter) | **5 chạy, 5 ẩn** | 0 chạy, 0 ẩn | 5 chạy, 5 ẩn |
| `/my-applications` | (không đo) | 0 chạy, 0 ẩn | 2–24 chạy, 0–2 ẩn |

Transform inline từ motion (`m.*`) ở mốc +50 ms: 0 ở mọi lần đo. `.animate-spin` vẫn quay dưới `reduce`: animation
`spin` `running`, `currentTime` tăng 417 ms sau 400 ms (đối chứng `no-preference`: 400 ms).

### Console error, page error, request lỗi

- `next dev`, 45 màn × 3 kích thước, lần cuối: 0 `pageerror`, 0 request lỗi. Console error chỉ có ở 2 màn chủ đích:
  `/trang-khong-ton-tai` (tài liệu trả HTTP 404) và `/jobs/<uuid không tồn tại>/candidates` (lỗi đọc dữ liệu từ server,
  xem O13).
- Lần đầu, trước khi sửa: hydration mismatch ở `/my-applications`, `/my-cvs`, `/mock-interview`, kết quả phỏng vấn
  thử, chi tiết ứng viên và `/ai-usage-logs` (đã sửa ở D1, D3).
- Production (`next start`, server `TZ=UTC`), 10 route của admin, recruiter và ứng viên: 0 console error, 0 pageerror.

### Bàn phím

| Màn | Tab tới nút | Vòng focus | Enter | Mũi tên | Esc | Focus trả về |
|---|---|---|---|---|---|---|
| Menu thẻ Kanban ("Tùy chọn") | có | `solid 2px` accent | mở menu, focus "Xem hồ sơ" | xuống "Chuyển sang vòng…" | đóng | nút "Tùy chọn" |
| Menu dòng `/user-management` (ẩn tới khi hover) | có; opacity 0 → hiện khi focus | `solid 2px` accent | mở menu, focus "Chỉnh sửa" | — | đóng | nút "Tùy chọn" |
| Command palette (Ctrl+K) | — | ô nhập là combobox | gõ "lich" → 1 kết quả "Lịch phỏng vấn", Enter → `/interviews` | — | đóng | `body` (palette mở bằng phím tắt, không có nút mở) |

Ảnh: `check-kanban-menu-focus-1440.png`, `check-kanban-menu-open-1440.png`, `check-row-menu-focus-1440.png`,
`check-command-palette-1440.png`.

### Các mục còn treo từ các task trước

| Mục | Kết quả |
|---|---|
| Lớp kéo Kanban (drag layer) | ✓ Thẻ gốc mờ; một thẻ nổi `fixed z-popover` đi theo chuột; cột đích tô màu. `check-kanban-drag-1440.png` |
| Sticky header | ✓ Thanh trên `top-0 z-header`; thẻ đầu trang chi tiết ứng viên `top-14 z-sticky`; tiêu đề ngày ở `/my-interviews` `top-[60px]` (ảnh: `candidate-my-interviews-390.png`). Xem O8 |
| Hover hiện menu dòng | ✓ (bảng bàn phím ở trên) |
| Vòng của NotificationBadge | ✓ Không có cha nào cắt (`overflow` visible), badge nằm trong viewport ở 390. `check-notification-badge-390.png`, `-1440.png` |
| `whitespace-pre-line` trên mô tả tin | ✗ → sửa ở D4 |
| Khoảng trống chân CvDetailModal | ✓ Không có khoảng trống, nút dính đáy. `check-cv-detail-modal-end-390.png`, `-1440.png` |
| Thanh ứng tuyển trên mobile so với tab bar | ✓ Thanh nằm ngay trên tab bar, không che. `candidate-job-detail-390.png` |
| Biểu đồ dashboard | ✓ Vẽ đường và vùng tô, trục T6–T11 |
| Trạng thái rail sau prefetch (bản production) | ✓ Thu gọn ở `/dashboard` → link sang `/user-management`: vẫn thu gọn; mở rộng lại → `/department-management`: vẫn mở rộng. Cookie khớp ở mọi bước |
| Nhãn tab bar ứng viên ở 390/360 | ✓ "Phỏng vấn thử" kết thúc ở 387/360 px, không bị cắt |
| Nút mũi tên phân trang JobSearchClient trên điện thoại | Chưa kiểm: chỉ có 7 tin, chưa đủ một trang thứ hai |

### Bundle (build production, `NODE_ENV=production`, so với `dev`)

Đo lại cả hai nhánh trong cùng một phiên, cùng Next 16.3.3 (Turbopack), cùng script: hợp các chunk `.js` trong
`page_client-reference-manifest.js` (clientModules + entryJSFiles), mỗi chunk đếm một lần, raw và gzip. Thêm số "first
load" Next tự ghi ở `diagnostics/route-bundle-stats.json`. `dev` build từ worktree `6d03844` (cùng merge-base với nhánh
này).

| Route | `dev` raw / gzip | Nhánh raw / gzip | Raw tăng | First load Next: `dev` → nhánh |
|---|---|---|---|---|
| `/my-applications` | 275.058 / 90.186 | 520.531 / 159.963 | +89% (gzip +77%) | 714.161 → 959.971 (+34%) |
| `/dashboard` | 680.946 / 204.199 | 876.278 / 262.894 | +29% (gzip +29%) | 1.120.049 → 1.315.718 (+17%) |
| `/jobs/[jobId]/kanban` | 394.837 / 122.510 | 607.713 / 183.212 | +54% (gzip +50%) | 833.940 → 1.047.153 (+26%) |
| `/` | 269.098 / 88.240 | 514.363 / 158.289 | +91% (gzip +79%) | 708.201 → 953.803 (+35%) |
| `static/chunks` tổng | 2.032.872 B (60 tệp) | 2.703.546 B (77 tệp) | +33% | — |

**Kết luận.**

- **Số 2,5–3,5× ở bản ghi đầu là lỗi của script, không phải code.** Script đó đếm cùng một chunk hai lần, một lần ghi
  `/_next/static/chunks/x.js` (trong clientModules), một lần `static/chunks/x.js` (trong entryJSFiles). Dựng lại script
  đó trên build hiện tại cho 1.037.255 B ở `/my-applications` (bản ghi đầu: 1.037.227 B), còn gộp theo đường dẫn chuẩn
  hóa cho 520.531 B. Trên `dev`, cùng script chuẩn hóa cho 275.058 B, khớp số Task 2 "trước" (275.066 B) trong 8 B;
  `/dashboard` 680.946 so với 674.113 B (lệch 1%).
- **Có tăng thật, và vượt ngưỡng 10% của Task 2.** Task 2 chỉ đo sau M0 (+7,9% ở `/my-applications`). Sau M1–M4,
  `/my-applications` lớn hơn `dev` 89% raw, `/dashboard` 29%. Theo "first load" của Next: +34% và +17%.
- **Nguyên nhân (đo thô, không phải đo chính xác).** Phân loại từng module trong các chunk first load của
  `/my-applications` theo dấu hiệu chuỗi: nhóm Radix (menu, tooltip, popper, roving focus, remove-scroll, aria-hidden)
  từ 9.394 lên 219.427 B (+210.033 B), tức khoảng 85% của mức tăng 245.810 B; mã ứng dụng chưa phân loại +42.380 B;
  `motion` giảm 9.699 B (LazyMotion với `m.*` thay cho `motion.*`). React/React DOM, socket.io, sonner không đổi. Chuỗi
  `DropdownMenu`, `Tooltip`, `Popper`, `RovingFocusGroup` có trong first load của nhánh và không có trong `dev`. Các
  thư viện mới là `@radix-ui/react-dropdown-menu` và `@radix-ui/react-tooltip` (và `react-dialog` được dùng ở 6 nơi
  thay vì 1). Chúng nằm trong first load của mọi route có shell, không phải chỉ của màn dùng chúng. Không có số riêng
  cho `domMax`. Chưa sửa; ghi lại để quyết định (ví dụ tải muộn menu và tooltip của shell).
- **Hạn chế của phép đo.** Phân loại theo chuỗi là phỏng đoán có căn cứ, không phải bản đồ module (`next
  experimental-analyze` ghi dữ liệu nhị phân, chưa đọc được). Chỉ liệt kê được 2 nhóm chính, không đủ 5. `dev` build
  dùng `node_modules` của nhánh (nên `@radix-ui/react-dialog` là 1.3.1 thay vì bản khóa của `dev`), và cần ba
  việc thủ công mà `dev` bình thường không cần: `turbopack.root: 'E:/'` (Turbopack từ chối symlink `node_modules`
  trỏ ra ngoài root), `tsc -b libs/shared/types`, và chép thư mục Prisma client đã sinh. Ba việc này chỉ nằm trong
  worktree đã xóa.

## Giao diện cũ (fallback)

Cookie `talentai-ui=legacy`, 1440 px:

| Màn | `html[data-ui]` | Pill "Dùng giao diện mới" | Console error |
|---|---|---|---|
| Recruiter `/jobs` | `legacy` | có | 0 |
| Recruiter `/dashboard` | `legacy` | có | 0 |
| Ứng viên `/job-postings` | `legacy` | có | 0 |
| Ứng viên `/` | `legacy` | có | 0 |
| Khách `/job-postings` | `legacy` | có | 0 |

Ảnh `legacy-*.png` trông như sản phẩm cũ: logo Sparkles xanh, nhãn nhóm chữ hoa giãn chữ, nút xanh đặc. **Chưa so
ảnh với bản build trước redesign** (xem "Chưa kiểm"). Một lệch thấy được: pill che khối tài khoản ở chân
sidebar cũ (O1).

## Điểm còn mở

| # | Điểm | Vì sao chưa sửa |
|---|---|---|
| O1 | Pill "Dùng giao diện mới" (`fixed bottom-4 left-4`) che tên và email ở chân sidebar staff của giao diện cũ (`legacy-recruiter-*.png`) | Spec §4.3 chốt "góc dưới trái". Cần quyết định: dời sang phải hoặc nâng lên trên chân sidebar |
| O2 | `/interviews`: tuần và "Hôm nay" tính theo giờ server. Lúc 01:xx giờ VN thứ Bảy 14/11, trang ghi "Hôm nay Thứ 6 13/11". Tuần chỉ có Thứ 2–Thứ 6, nên chưa rõ lịch ngày thứ Bảy/Chủ nhật có hiện không | Lỗi múi giờ phía server, không gây console error. Chưa xác minh với bản cũ |
| O3 | Khoảng 15 formatter ngày khác vẫn không có `timeZone` (`ApplicationDetail`, `ApplicationTimeline`, `MyInterviewsClient`, `ScheduleCard`, `ScheduleDetailDrawer`, `CompareTable`, `CandidatePeek`, `NotesPanel`, `ScorecardPanel`, `ProfileHeader`, `ApplyButton`…). Ở Server Component, chúng hiển thị ngày UTC cho người dùng VN mà không báo lỗi | Theo brief, chỉ sửa formatter gây console error trên màn đã xem. Nên làm một task riêng |
| O4 | "AI Score: 0%" cho đơn chưa sàng lọc (`/my-applications`) | API trả 0. Mã nguồn `dev` in cùng chuỗi với cùng điều kiện (`aiScore != null`), nên bản cũ cũng in số này khi API trả 0 (đối chiếu mã nguồn bằng `git grep`, chưa chạy bản cũ) |
| O5 | Bộ lọc HTML của API bỏ thẻ `<h3>` trong mô tả tin, nên "Trách nhiệm", "Yêu cầu" hiện như chữ thường | Phía API |
| O6 | Trang so sánh: "Kỹ năng phù hợp: Chưa có" dù đơn có kỹ năng khớp (`matched_skills` dạng `{hardSkills: […]}`, giống fixture gd3) | Chưa xác minh dạng dữ liệu thật; chưa xác minh với bản cũ |
| O7 | Phễu dashboard (Ứng tuyển 2, Phỏng vấn 0) khác số tab ở danh sách ứng viên (Phỏng vấn 2) | Ngữ nghĩa của API; chưa xác minh với bản cũ |
| O8 | Chi tiết ứng viên ở ≥768 px: thẻ đầu trang sticky cao khoảng 200 px khi tên dài 100 ký tự (`check-sticky-candidate-detail-1024.png`) | Cần quyết định thiết kế, ví dụ `line-clamp-2` khi dính |
| O9 | Hồ sơ ứng viên ở 390: cột tên hẹp vì nút "Sửa hồ sơ" nằm cạnh, email bẻ thành 3 dòng giữa từ | Cần quyết định bố cục (nút xuống dòng riêng) |
| O10 | Ô thống kê "Điểm AI trung bình" ở 390 ghi "Chưa có" cỡ chữ lớn, xuống 2 dòng | Nhỏ; cần quyết định chữ cho giá trị rỗng |
| O11 | Chữ tiếng Anh người dùng thấy: "avg", "8d" (Kanban), "Present" (CV), "My CVs" (hồ sơ), "AI Score", accessible name "Notifications" | Cả 6 chuỗi ("avg", "Xd", "Present", "My CVs", "AI Score", aria-label "Notifications") có trong mã nguồn `dev` (`git grep`), nên không phải lỗi mới của redesign. Chưa so ảnh render với bản cũ. Cần chốt cách dịch |
| O12 | Mọi nút menu dòng tên là "Tùy chọn", không kèm tên dòng (Kanban, `/user-management`). `CvCard` thì ghi "Tùy chọn cho <tệp>" | A11y: người dùng trình đọc màn hình không phân biệt được các nút. Đổi tên sẽ làm vỡ test e2e/unit đang truy vấn "Tùy chọn" |
| O13 | `/jobs/<id không tồn tại>/candidates` hiện "Không tải được dữ liệu." thay vì 404, và log lỗi server ra console (dev). Tin thuộc phòng ban khác cũng hiện chữ này (API 403) | Trang `dev` cũng không bắt lỗi của server action (không map 403/404), nên lỗi rơi vào error boundary; chưa chạy bản cũ để xem nó hiện gì. Câu "Không tải được dữ liệu." là của `RouteError` mới. Cần quyết định có map 403/404 hay không |
| O14 | "Vào phòng họp" là nút xanh đặc. Brief chỉ cho màu accent ở focus, link, vùng chọn và AI; nút chính màu mực | Cần quyết định thiết kế |
| O15 | Bấm một CV "Đã phân tích" nhưng chưa có dữ liệu trích xuất thì không có gì xảy ra (`CvDetailModal` trả `null`) | Trường hợp biên của dữ liệu; cần chốt trạng thái rỗng |

## Chưa kiểm

- **So ảnh với bản build trước redesign:** chưa làm. Đã có bản build `dev` (số bundle ở trên), nhưng không dựng
  lại dữ liệu seed (đã xóa khỏi `ats_test`) nên không chụp được màn đã đăng nhập; trang đăng nhập đơn lẻ không đủ để
  so. Mọi câu "bản cũ vẫn như vậy" ở trên là so mã nguồn (`git grep` trên `dev`) hoặc chưa xác minh, không phải so ảnh.
  Lần trước `git worktree add` lỗi `Filename too long`; lần này `git -c core.longpaths=true worktree add` chạy được.
- Trang `error.tsx` của các nhóm và `/auth-callback`.
- Phân trang JobSearchClient trên điện thoại (thiếu dữ liệu cho trang 2).
- Thiết bị thật, Safari iOS và Android Chrome thật; mọi kết quả ở trên là Chromium headless (Playwright) với viewport
  giả lập.
- Trình đọc màn hình (NVDA/VoiceOver). Bàn phím chỉ đo trên 3 màn ở trên.
- Dark mode: ngoài phạm vi.
- Contrast chỉ xem bằng mắt; không đo lại từng cặp màu (đã có test token ở Task 3).
- Phiên phỏng vấn thử đang diễn ra chỉ chụp màn đầu. Chưa gửi câu trả lời vì cần AI thật.
- Kéo thả Kanban chỉ chụp lúc đang kéo. Lần thả rơi vào cột "Sàng lọc" thật; đã đưa đơn về `applied` bằng SQL.
