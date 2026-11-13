# Thiết kế lại giao diện — plan tóm tắt (13/11/2026)

Plan đầy đủ: `docs/superpowers/plans/2026-11-13-ui-redesign.md`. Spec: `docs/superpowers/specs/2026-11-13-ui-redesign-design.md`.
Nhánh: `feat/ui-redesign`.

## M0 · Nền móng
1. Chép nguyên UI hiện tại vào `src/legacy/` và đóng băng.
2. Chọn giao diện cũ/mới lúc chạy bằng cookie, có nút chuyển qua lại; đo bundle trước/sau.
3. Thêm token màu, font Geist, theme Tailwind; test contrast cho mọi cặp token.
4. Thêm preset motion (`LazyMotion`, stagger, reveal) và hai gói Radix.
5. Thêm primitives thao tác và form (Button, Field, Input, Switch…).
6. Thêm primitives hiển thị dữ liệu (StatusChip, ScoreBar, Table, EmptyState…) và bảng nhãn trạng thái.
7. Thêm primitives overlay và điều hướng (Dialog, Sheet, DropdownMenu, Tooltip, Tabs, Segmented).
8. Dựng khung staff/admin: sidebar thu về rail, top bar, menu tài khoản.
9. Thêm command palette Ctrl/Cmd+K cho staff.
10. Dựng khung public/ứng viên: header kính mờ, bottom bar mobile, footer.
11. Làm lại khung auth, khung phỏng vấn, loading/error và trang 404.

## M1 · Public và auth
12. Làm lại trang chủ.
13. Làm lại trang tìm việc (chip lọc, empty state).
14. Làm lại trang chi tiết việc (thẻ ứng tuyển dính, sheet chọn CV).
15. Làm lại các form đăng nhập, đăng ký, quên/đặt lại mật khẩu.

## M2 · Ứng viên
16. Làm lại "Đơn của tôi" và trang chi tiết đơn.
17. Làm lại "CV của tôi".
18. Làm lại lịch phỏng vấn và hồ sơ ứng viên.
19. Làm lại màn thiết lập phỏng vấn thử.
20. Làm lại phiên phỏng vấn thử và trang kết quả.

## M3 · Recruiter
21. Làm lại bảng điều khiển.
22. Làm lại danh sách và form tin tuyển dụng.
23. Làm lại danh sách ứng viên, thêm panel xem nhanh.
24. Làm lại trang chi tiết ứng viên.
25. Làm lại bảng so sánh ứng viên.
26. Làm lại Kanban, thêm menu "Chuyển sang vòng…".
27. Làm lại lịch phỏng vấn của staff và hồ sơ staff.

## M4 · Admin
28. Làm lại quản lý người dùng, nhà tuyển dụng, phòng ban.
29. Làm lại quản lý danh mục ngành nghề, kỹ năng, chủ đề phỏng vấn.
30. Làm lại cấu hình AI, nhật ký AI, hồ sơ công ty.

## M5 · Hoàn thiện
31. Thêm test chặn màu hex rời và font inline; xóa khung cũ không còn dùng.
32. Cập nhật e2e, thêm hành trình chuyển giao diện cũ/mới.
33. Kiểm bằng mắt ở 1440/1024/390, dữ liệu xấu nhất, reduced motion.
34. Cập nhật brain và ghi bản as-built.

---

# Thiết kế lại giao diện — as-built (14/11/2026)

Nhánh `feat/ui-redesign` (từ `dev` `6d03844`). Lúc ghi bản này HEAD là `8d1c2a3`, 107 commit (`git rev-list --count
dev..8d1c2a3`); vòng sửa cuối sau review cả nhánh thêm các commit sau đó (`git log 8d1c2a3..HEAD`).
**Chưa merge.** Hướng A · Mực & kính, chỉ light. Spec:
`docs/superpowers/specs/2026-11-13-ui-redesign-design.md`; decisions:
`docs/superpowers/decisions/2026-11-13-ui-redesign-decisions.md`. Bằng chứng: `docs/tasks/ui-redesign/visual-check.md`
và `docs/tasks/ui-redesign/e2e-final.txt`.

**Cách lùi về giao diện cũ:** env `UI_DEFAULT_VARIANT=legacy` (cả hệ thống) hoặc cookie `talentai-ui=legacy` (từng người
dùng). Cookie thắng env. Compose chưa truyền `UI_DEFAULT_VARIANT` vào container web (xem "Điều chưa kiểm").

## Đã làm theo mốc

| Mốc | Task | Kết quả | Commit chính |
|---|---|---|---|
| M0 · Nền móng | 1–11, 8a | UI cũ đóng băng ở `src/legacy/`; cookie `talentai-ui` chọn giao diện; token, Geist, theme Tailwind; primitives trong `src/components/ui/`; shell staff, command palette, shell public/ứng viên, auth/interview/error/404 | `1e3b3d4`, `740c803`, `c9bc7ed`, `7b2db8e`, `def276e`, `3943ed3`, `8a14906`, `47c38f3`, `0b831b8`, `5c5dde2` |
| M1 · Public và auth | 12–15, 12a | Trang chủ, tìm việc, chi tiết việc, các form auth | `dc8120f`, `55f1920`, `e104b56`, `db45a3f` |
| M2 · Ứng viên | 16–20, 19a | Đơn của tôi, CV, lịch phỏng vấn, hồ sơ, phỏng vấn thử (thiết lập, phiên, kết quả); `ConfirmModal` dựng trên `Dialog` | `2291c7e`, `468bd67`, `1854bc8`, `c8061a5`, `60fd3ea`, `fea9420` |
| M3 · Recruiter | 21–27 | Dashboard, tin tuyển dụng, danh sách và chi tiết ứng viên, so sánh, Kanban (menu "Chuyển sang vòng…", lớp kéo), lịch staff | `7491750`, `d56330d`, `dc0dae7`, `0a02dbf`, `b17817e`, `9e19d7f`, `c0a250e` |
| M4 · Admin | 28–30 | User, recruiter, phòng ban, danh mục, kỹ năng, chủ đề, cấu hình AI, nhật ký AI, hồ sơ công ty | `7717ffe`, `c384d86`, `7aa2c24` |
| M5 · Hoàn thiện | 31–34 | `design-guard`, dọn shell cũ, `RowActionsMenu` dùng chung (31a/b/c); e2e cập nhật, 48 pass; kiểm bằng mắt, sửa 10 lỗi; tài liệu này | `5b5f728`, `fa0329f`, `3a83691`, `3b87f31`, `aba15db`, `04dda6f`, `5e63f7f`, `0c90ee1` |

Task 31 chạy thành ba lượt (31a guard, 31b primitives/shell/palette, 31c màn hình và menu hàng dùng chung). Task 8a,
12a, 19a, 31a/b/c và 32b không có trong plan gốc.

## Lệch so với plan

Ledger (`.superpowers/sdd/2026-11-13-ui-redesign/progress.md`) là nguồn đầy đủ của mọi dòng `Ruling:`. Bảng dưới giữ
những dòng đổi hành vi hoặc cấu trúc so với plan.

| Ruling | Vì sao | Nếu sai thì mất gì |
|---|---|---|
| `MotionProvider` nạp `domMax`, không phải `domAnimation` (`6fa7ae8`) | `domAnimation` không có layout feature, nên indicator `layoutId` (Tabs, Segmented, nav) nhảy thay vì trượt | Bundle client lớn hơn khoảng 10 kb |
| `Reveal`/`Stagger` chạy bằng CSS keyframe `animate-rise`, không bằng Motion (`e500efc`) | HTML từ server bị ẩn tới khi hydrate nếu dùng `initial=hidden`; trái spec §10 (LCP), người tắt JS thấy trang trống | Chuyển động vào bằng CSS, không phải spring |
| `Reveal inView` chỉ ẩn phần tử dưới màn hình sau khi mount, và hiện lại nếu đã cuộn qua (`cca9632`, `5958235`) | Phần cuộn nhảy qua (khôi phục cuộn, anchor) không được kẹt ở opacity 0 | Thêm một client component nhỏ |
| `Stat` chỉ đếm lên khi mount phía client sau hydrate (`f6ab32b`) | Đếm từ 0 lúc hydrate gây nháy giá trị cuối → 0 → đếm | Tải lại cứng không có hiệu ứng đếm |
| Thời lượng motion 120/200/280/420 ms (`39554e1`) | Task 3 đặt 100/150/200/300, lệch spec §6 | Không có |
| `Button` secondary dùng `shadow-e2`; spec §7 ghi e1 và đã sửa theo | Nút cần chút nổi để nhìn ra là bấm được | Thẩm mỹ |
| `Button` primary thêm `max-md:min-h-11` (`fa0329f`) | Spec đòi nút chính ≥ 44 px trên mobile, `md` chỉ 36 px; sửa một lần ở primitive thay vì từng màn | Nút chính cao hơn dưới `md`; ba cặp nút lệch chiều cao đã chỉnh cho đều ở 31c |
| Control form cỡ chữ 16 px dưới `sm` | Chặn iOS tự zoom khi focus | Không có |
| `Field` ẩn dấu `*` khỏi accessible name; `Dialog` không có nút X | Tên là "Tên cấu hình", không phải "Tên cấu hình *"; Esc và "Hủy" là đường đóng. `AddProfileModal.test` và `ai-configuration.e2e.ts` sửa theo | Người dùng tìm nút X không thấy; nhất quán với mọi Dialog khác |
| `@radix-ui/react-dialog` 1.1.20 → 1.3.1 (Task 8a, `004c837`) | Hai bản dismissable-layer làm menu trong Dialog/Sheet mất focus, một Esc đóng cả hai, `body` kẹt `pointer-events:none` | Hành vi `AccessibleDialog` cũ có thể đổi; test của bản legacy phủ |
| Menu tài khoản chuyển giao diện qua hook `useSwitchUiVariant` trong `DropdownMenuItem` | Menu Radix cần menuitem thật để dùng phím | Không có |
| Shell cuộn cả document, không đặt chiều cao cố định cho `main` | Giữ khôi phục cuộn và `scroll-padding`; Kanban, lịch tuần tự giới hạn chiều cao | Thêm một lượt chỉnh layout ở ba màn |
| `viewportFit: 'cover'` chỉ cho giao diện mới (`generateViewport`, `6fa7ae8`) | Tab bar ứng viên dùng `env(safe-area-inset-bottom)` trên iPhone | Không có với legacy |
| Trang chủ bỏ số liệu bịa (500+, 10K+, 200+, 95%) và badge "AI-Powered", thêm dải 3 bước | Spec: chỉ vẽ thứ API có | Mất số liệu xã hội (vốn không thật) |
| `SiteFooter` nằm ở layout `(public)`; bỏ `PublicFooter` khỏi trang chủ và trang job | Tránh hai footer | Footer xuất hiện cả ở trang job (đúng spec §9) |
| Luật `text-wrap` của modern nằm dưới `:where(html[data-ui="modern"])` (`2b2e2b2`) | Specificity 0,1,2 làm `truncate` hỏng trên 31 thẻ `<p>` | Không có |
| `statusTone` dùng đúng chữ người dùng đang thấy ("Bản nháp", "Chờ xử lý", "Lỗi phân tích", nhãn ứng viên riêng); thêm kind `candidate-application` | Spec §2 cấm đổi chữ hiển thị khi không có lý do | Nhãn khác bảng trong plan, sửa dễ |
| `KanbanCard` giữ chữ sàng lọc theo vòng, vẽ bằng `Badge` + tone thay vì `StatusChip` | Test và recruiter dựa vào chữ đó | Một chip component khác trên Kanban |
| `KanbanCard` có một `DropdownMenu` "Tùy chọn" duy nhất; thêm Sub/SubTrigger/SubContent vào `DropdownMenu`; submenu vẫn liệt kê vòng mà guard từ chối | Trước đó có tới ba trigger trùng tên; test của plan chọn "Đã tuyển" để lấy toast từ chối | Screen reader nghe lặp tên (ghi cho review cuối) |
| `RowActionsMenu` dùng chung (`3a83691`); cờ `movesFocus` giữ lại | Cùng một mẫu reveal + trả focus bị chép ở 8 nơi. `movesFocus` bỏ một lần focus tạm vào trigger trước "Hủy"; focus cuối không đổi | Một cờ API nhỏ |
| Lớp kéo Kanban tự vẽ bằng `useDragLayer` (`9d4b206`) | Ghost native của HTML5Backend là ảnh phẳng, nên thẻ nguồn nổi lên trông như hai thẻ | Khoảng 60 dòng trong thư mục kanban |
| Xóa CV có hộp xác nhận (`c34636d`); chữ rút đơn "Bạn có thể ứng tuyển lại sau" thay "không thể hoàn tác" (`a013377`) | Hành động phá hủy không xác nhận; API cho ứng tuyển lại sau khi rút | Thêm một cú bấm |
| Thêm Task 19a: `ConfirmModal` dựng trên `Dialog`, giữ nguyên props | Dùng ở nhiều màn; legacy có bản riêng | Không có |
| `splitActionPlan` chỉ tách theo xuống dòng, ký hiệu đầu dòng và số thứ tự (`048306a`) | Tách theo câu cắt sai "TP. Hồ Chí Minh", "ThS. Nguyễn" | Kế hoạch một đoạn hiện là một bước |
| Dashboard: KPI 3 cột; nhãn phễu theo vòng Kanban ("Ứng tuyển") | API chỉ trả 3 chỉ số; phễu chính là phễu Kanban | Một ô lưới trống; thêm một nguồn nhãn |
| Danh sách ứng viên: toolbar dính chỉ từ `md` | Trên điện thoại toolbar xuống dòng chiếm ~1/5 màn hình | Điện thoại phải cuộn lên để lọc |
| Admin: user dùng `Table` + menu hàng; recruiter, phòng ban giữ lưới thẻ | `DepartmentCard.test` phải xanh; ép thẻ thành bảng là viết lại component có test mà người dùng không lợi gì | Hai kiểu danh sách ở admin |
| Task 30 bỏ cột chi phí ở nhật ký AI và nút "Thao tác nhanh" trong hồ sơ công ty | `IAiUsageLogDto` không có trường chi phí (plan sai); các nút đó không làm gì | Không có |
| design-guard: allow-list **rỗng** (`3b87f31`; `design-guard.allow.json` = `{}`) | `global-error.tsx` không vi phạm, lý do ghi sai; test bắt buộc mỗi mục có lý do | Thêm lại mục nếu một file cần giá trị thô |
| Xóa `components/common/Logo.tsx`, `SubmitButton.tsx`; `NotificationBadge` bỏ pulse vô hạn (`a109a3f`) | Không còn importer ngoài `src/legacy`; spec §6 cấm animation lặp | Khôi phục từ git |
| e2e: `UserRow` đặt `timeZone: 'Asia/Ho_Chi_Minh'` (`5e63f7f`), chỉ file này | Hydration lệch trong khung 00:00–07:00 giờ VN làm A3/A7 đỏ; các formatter khác thành follow-up | Cảnh báo hydration ban đêm còn ở các màn đó |
| Gate mỗi task: typecheck + lint + vitest vùng chạm; `test:web` đầy đủ mỗi cuối mốc | Suite đầy đủ mất 4–11 phút trên máy này | Lỗi chéo vùng lộ ở cuối mốc |
| Test stack dùng lại container có sẵn; Mailpit đổi sang cổng 58200 (override ở scratchpad); gỡ stack sau Task 33 | Windows chặn dải cổng 57957–58056 | Không đổi repo |
| Tăng bundle được chấp nhận và báo cáo, không sửa | Ngưỡng 10% của spec §4.6 dành cho việc bật switch ở M0, không phải ngân sách cả nhánh | Tải đầu chậm hơn trên mobile yếu (xem Bundle) |

## Giao diện cũ không giống từng điểm ảnh

Cookie `talentai-ui=legacy` đưa về mã `src/legacy/`, nhưng không tái hiện đúng giao diện trước redesign:

- `fontFamily.sans` và `fontFamily.mono` mới trong `tailwind.config.js` đổi `font-mono` ở legacy (2 chỗ, cả hai trong
  `AiUsageLogsTable.tsx`).
- `Toaster` dùng chung dùng `font-sans` (Geist) cả ở legacy.
- `RouteError`, `RouteLoading` và `not-found` của cây mới cũng hiện ở legacy.

## Số test trước/sau

`npm run test:web` (vitest, `apps/web`):

| Mốc | File | Test |
|---|---|---|
| Trước khi bắt đầu (`6d03844`, Task 1) | 69 | 409 |
| Sau khi chép `src/legacy` (Task 1) | 116 | 616 |
| Cuối M0 | 145 | 906 |
| Cuối M1 | 150 | 935 |
| Cuối M2 | 161 | 999 |
| Cuối M3 (`7717ffe`) | 175 | 1.062 |
| Cuối M4 (`95073aa`) | 185 | 1.105 |
| Cổng M5 (`a109a3f`) | 192 | 1.155 |
| Cuối Task 33 (`8e537ed`, gate của implementer) | 196 | 1.192 |
| Chạy lại ở Task 34 (`8e537ed`) | 196 (exit 0, 331 s) | 1.192 |

Chép `src/legacy` thêm 47 file / 207 test (116 − 69, 616 − 409): bản sao test của UI cũ, không phải test mới. Phần còn
lại, 80 file / 576 test (196 − 116, 1.192 − 616), là test của redesign.

e2e (`npm run test:e2e:web`, cần `TZ=UTC`; README e2e chưa nói điều này): **48 passed** (8,9 phút), `e2e-final.txt`.
Gồm 2 test mới của `ui-variant.e2e.ts`; số trước đó suy ra là 46 (ASSUMPTION: 48 − 2, ledger không ghi số này). Log
còn 6 cảnh báo hydration cùng loại (`CvCard.tsx:54`, `CandidateDetailClient.tsx:80`); hai chỗ này đã sửa sau đó ở
`3cf4780`, e2e chưa chạy lại sau lần sửa.

## Bundle

Build production (`NODE_ENV=production`), Next 16.3.3, cùng script đo hai nhánh: `dev` (worktree `6d03844`) so với
nhánh này. Số liệu đầy đủ: `visual-check.md`, mục "Bundle".

| Route | `dev` raw | Nhánh raw | Raw tăng | First load Next: `dev` → nhánh |
|---|---|---|---|---|
| `/my-applications` | 275.058 | 520.531 | +89% | 714.161 → 959.971 (+34%) |
| `/dashboard` | 680.946 | 876.278 | +29% | 1.120.049 → 1.315.718 (+17%) |
| `/jobs/[jobId]/kanban` | 394.837 | 607.713 | +54% | 833.940 → 1.047.153 (+26%) |
| `static/chunks` tổng | 2.032.872 | 2.703.546 | +33% | — |

- Ngưỡng 10% của spec §4.6 dành cho bước bật switch ở M0 (đo lúc đó: +7,9% ở `/my-applications`, +2,9% ở
  `/dashboard`), không phải ngân sách cả nhánh. Cả nhánh vượt xa ngưỡng đó.
- Nhóm Radix (dropdown-menu, tooltip, popper, roving focus) chiếm khoảng 85% mức tăng của `/my-applications` theo
  phân loại chuỗi trong chunk (không phải bản đồ module; `next experimental-analyze` ghi dữ liệu nhị phân chưa đọc
  được). **Nguồn gốc của nó chưa xác nhận.** Shell ứng viên không dùng `Tooltip` (chỉ `StaffShell` và `StaffSidebar`
  dùng). Giả thuyết khả dĩ hơn, chưa đo: barrel `@/components/ui/index.ts` được 157 file import, kéo Dialog, Sheet,
  DropdownMenu, Tooltip vào mọi route. Và `NotificationPanel.tsx` dùng `motion.div` (bản đầy đủ của Motion), nên chỉ
  đổi `domMax` thành `domAnimation` sẽ không làm gì nhỏ đi. Chưa có số riêng cho `domMax`.
- Số "2,5–3,5×" ở bản ghi đầu của Task 33 là lỗi script (đếm mỗi chunk hai lần), đã thay bằng bảng trên.
- Việc tiếp theo: tải muộn menu và tooltip của shell, hoặc thu nhỏ shell. Chưa làm.

## Điều chưa kiểm

- **`UI_DEFAULT_VARIANT` chưa tới container web:** `docker-compose.yml` và `docker-compose-dev.yml` liệt kê `environment:` của
  `web` từng biến một và không có biến này, nên đặt nó trong `.env` không có tác dụng ở Docker. Cookie vẫn dùng được.
  Chưa sửa compose (compose prod nằm trong danh sách cần hỏi trước); thêm `UI_DEFAULT_VARIANT: ${UI_DEFAULT_VARIANT:-}`
  vào `environment:` của `web` nếu muốn dùng env làm đòn bẩy lùi.
- **Ảnh so với bản trước redesign:** chưa có. Không dựng lại dữ liệu seed (đã xóa khỏi `ats_test`) nên không chụp được
  màn đã đăng nhập của `dev`. Mọi câu "bản cũ vẫn như vậy" trong `visual-check.md` là so mã nguồn (`git grep` trên
  `dev`) hoặc chưa xác minh.
- **Ảnh chụp bằng `next dev`**, nên có nút "N" của Next ở góc dưới trái. Bản production chỉ kiểm console (10 route,
  0 lỗi) và trạng thái rail sau prefetch; chưa chụp ảnh production.
- **`error.tsx` của từng nhóm route và `/auth-callback`:** không chụp được (không có cách gây lỗi render an toàn;
  `/auth-callback` chỉ chạy trong luồng OAuth).
- **O13** (job không tồn tại hiện "Không tải được dữ liệu.") mới xác nhận một phần: chưa chạy bản cũ để xem nó hiện gì.
- Phân trang `JobSearchClient` trên điện thoại: chỉ có 7 tin, chưa có trang 2, nên chưa xem nút mũi tên 36×44.
- Thiết bị thật (Safari iOS, Android Chrome); mọi kết quả là Chromium headless với viewport giả lập.
- Trình đọc màn hình (NVDA/VoiceOver); bàn phím chỉ đo trên 3 màn (menu thẻ Kanban, menu hàng user, command palette).
- Dark mode: ngoài phạm vi. Contrast chỉ có test token (Task 3) và xem bằng mắt, không đo từng cặp trên màn thật.
- Phiên phỏng vấn thử đang diễn ra chỉ chụp màn đầu (gửi câu trả lời cần AI thật). Kéo thả Kanban chỉ chụp lúc kéo.
- e2e chưa chạy lại sau các commit của Task 33 (ngày/giờ, avatar, bảng, reduced motion) và sau `8e537ed`.
- Theo ledger, review cả nhánh và PR vào `dev` chưa làm tại thời điểm viết.

## Lỗi có từ trước và việc tiếp theo

Chưa sửa. Mỗi mục là việc riêng cho chủ dự án. Nguồn: các dòng "Pre-existing defects" và "minor (deferred)" trong ledger
và O1–O15 trong `visual-check.md`; ledger gọi chúng là có từ trước hoặc ngoài phạm vi, không phải mục nào cũng được
kiểm lại trên `dev`.

**Ngày và múi giờ**
- Khoảng 15 formatter ngày không có `timeZone` (O3 trong `visual-check.md`): `ApplicationDetail`, `ApplicationTimeline`,
  `MyInterviewsClient`, `ScheduleCard`, `ScheduleDetailDrawer`, `CompareTable`, `CandidatePeek`, `NotesPanel`,
  `ScorecardPanel`, `ProfileHeader`, `ApplyButton`. Ledger ước tính 22–24 chỗ trong cả repo, một số dùng chung với
  legacy; chưa đếm lại. Ở Server Component chúng hiện ngày UTC cho người dùng VN mà không báo lỗi. Đề xuất: một helper
  `formatDateVN` dùng chung (hiện `'Asia/Ho_Chi_Minh'` ghi cứng ở khoảng 8 nơi) và một task hai commit (test đỏ, sửa).
- O2: `/interviews` tính tuần và "Hôm nay" theo giờ server (UTC). Lúc 01:xx giờ VN thứ Bảy 14/11, trang ghi "Hôm nay
  Thứ 6 13/11".

**Kanban và ứng viên**
- Thả thẻ lên thẻ khác (`handleReorder`) đổi vòng ở client mà không gọi API và không qua guard.
- Toast "Thành công / Hoàn tác" hiện trước kết quả API; khi rollback, `screeningStatus` không được khôi phục và dialog
  sàng lọc mở bởi lần chuyển vẫn mở. `pendingDrops` được xóa nhưng không bao giờ được đặt.
- Test e2e gd3 Kanban chọn thẻ bằng `div.group` (thẻ không có role hoặc label).
- `ScoreOverview`: kiểu DTO ghi `number` trong khi API gửi chuỗi (Prisma Decimal).
- Avatar vẽ ô vuông rỗng cho tên chỉ gồm emoji.

**Admin**
- Hồ sơ công ty là dữ liệu mock và nút lưu chỉ là timer giả; không có gì được lưu.
- Sheet phòng ban, mục "Tin tuyển dụng", hiện `membersCount`; nút "Thêm thành viên" không có handler;
  `MutateDepartmentModal` im lặng khi lưu lỗi.
- Xóa recruiter, phòng ban, danh mục không có xác nhận; danh mục cũng không có trạng thái pending.
- Nhật ký AI: bộ lọc và thống kê chỉ tính trang hiện tại; "Hiển thị x/y" lấy số đã lọc của trang chia cho tổng toàn
  cục; tham số `actionType`/`status` trên URL bị bỏ qua; `ACTION_CONFIG[type lạ]` làm trang crash.
- Chữ tiếng Anh trong UI tiếng Việt: "AI Usage Logs", "Tokens", "Model", gợi ý ngưỡng; thêm "avg", "Xd", "Present",
  "My CVs", "AI Score" và aria-label "Notifications" (O11).
- Toast thành công khi xóa chủ đề gần như không bao giờ hiện (hàng bị gỡ khi `revalidatePath`). Thống kê kỹ năng đếm
  danh sách đã lọc còn thống kê chủ đề đếm tất cả.
- Sửa danh mục gốc đang có con để gán cha có thể tạo cấp thứ ba mà cây không vẽ (backend có chặn hay không: chưa xác
  minh).

**Component dùng chung**
- `Button` đang `disabled` khi `loading` làm mất focus bàn phím về `body` (cân nhắc `aria-disabled` + chặn click).
- `ConfirmModal` không có prop `destructive` (luôn danger; cả ba nơi gọi đều phá hủy).
- `DeleteCvDialog` đóng lại cả khi xóa thất bại, muốn thử lại phải mở lại.
- Hai commit chỉ sửa layout, `dccdf3f` và `05b7cc2` (padding trang so sánh và chi tiết ứng viên), không có test đỏ;
  bằng chứng là `before-*.png`.
- Một HTTP 404 từ `next dev` ở trang chi tiết ứng viên trong lần chạy e2e 13/11, chưa giải thích và không tái hiện.

**Điểm mở của lần kiểm bằng mắt** (O1–O15 ở cuối `visual-check.md`; O4–O7, O9–O11, O15 là chi tiết nhỏ hoặc phía API):
- O1: pill "Dùng giao diện mới" (`fixed bottom-4 left-4`) che tên và email ở chân sidebar giao diện cũ. Spec §4.3 chốt góc
  dưới trái; cần quyết định dời pill.
- O8: thẻ đầu trang chi tiết ứng viên dính cao ~200 px khi tên dài 100 ký tự ở ≥ 768 px.
- O12: mọi nút menu hàng tên là "Tùy chọn", không kèm tên hàng; đổi tên làm vỡ test đang truy vấn "Tùy chọn".
- O13: job không tồn tại hoặc thuộc phòng ban khác hiện "Không tải được dữ liệu." thay vì 404.
- O14: "Vào phòng họp" là nút xanh đặc, trái brief (accent chỉ ở focus, link, vùng chọn, AI).
