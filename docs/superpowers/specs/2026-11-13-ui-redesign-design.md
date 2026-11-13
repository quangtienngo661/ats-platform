# Thiết kế lại giao diện TalentAI — design

- **Ngày:** 13/11/2026 · **Trạng thái:** đã duyệt hướng và các quyết định (xem `../decisions/2026-11-13-ui-redesign-decisions.md`)
- **Research:** `docs/research/2026-11-13-ui-redesign-research.md`
- **Trang so sánh hướng:** https://claude.ai/artifact/MjGQS5hconLhCQf4HhmMge
- **App:** `apps/web` (Next.js 16.3.3, React 19.2.4, Tailwind 3.4.3, `motion` 12.38.0)

## 1. Mục tiêu

Thay toàn bộ lớp trình bày của web app: 36 page, 5 layout nhóm, layout gốc, loading/error. Giao diện mới phải hiện
đại, có chuyển động mượt và dễ dùng cho ba nhóm: ứng viên, staff (recruiter) và admin/org admin. UI hiện tại được
giữ nguyên làm **fallback chuyển được lúc chạy**.

**Thành công khi:**
1. Cả 36 page chạy trên giao diện mới. Chuyển sang giao diện cũ và quay lại được từ giao diện.
2. `npm run typecheck:web`, `npm run lint:web` (0 warning), `npm run test:web` và production build đều xanh. Test
   của giao diện cũ vẫn chạy và xanh.
3. Mọi cặp màu chữ/nền trong token đạt ≥ 4,5:1, có test giữ con số này.
4. Mỗi nhóm màn đã được xem bằng trình duyệt ở 1440, 1024 và 390 px, có ảnh chụp. Giả lập reduced motion thì
   animation tắt.

## 2. Ràng buộc giữ nguyên

- URL, route group, `src/proxy.ts`, phân quyền: không đổi.
- Nghiệp vụ, Server Actions (`src/servers/**`), stores (`src/stores/**`), `src/lib/**`, `src/types/**`: dùng chung cho
  cả hai giao diện, không nhân đôi. Giao diện mới chỉ được dùng field mà API đang trả.
- Chuỗi người dùng thấy bằng tiếng Việt. Log giữ tiếng Anh.
- ADR 0002: điểm AI chỉ là gợi ý, không tự đổi `Application.status`. Giao diện phải thể hiện điều đó.
- Quyết định UI cũ trong brain §11 vẫn áp dụng: một design system với hai mật độ (ứng viên thoải mái, staff gọn);
  phía ứng viên theo bố cục kiểu VietnamWorks; không có khối tiêu đề + mô tả lớn ở đầu trang app; nội dung ứng viên
  rộng tối đa 1200 px ở giữa, trang staff dùng hết chiều rộng.
- Không thêm dependency ngoài `@radix-ui/react-dropdown-menu` và `@radix-ui/react-tooltip` (đã duyệt).

## 3. Hướng thiết kế: A · Mực & kính

Rút từ các design system đã lưu:
- **Vercel:** token app (canvas, ink, hairline), shadow xếp lớp, cặp màu trạng thái nhạt/đậm, chiều cao control.
- **Linear:** thang bề mặt tối cho màn phỏng vấn thử AI.
- **Apple:** kính mờ trên thanh dính, co nhẹ khi nhấn.

Cá tính: chính xác, gọn, đơn sắc; màu xanh chỉ xuất hiện ở focus, link, lựa chọn và phần AI. Sự "sang" đến từ
khoảng thở, chữ có tracking âm ở tiêu đề, bóng nhiều lớp mỏng và chuyển động có chủ đích. Không dùng gradient tím xanh,
emoji, icon Sparkles làm logo, hay nhãn chữ hoa giãn cách cho tiêu đề nhóm.

## 4. Kiến trúc fallback

```
request
  └─ src/app/<group>/layout.tsx   ─ getUiVariant() ─┬─ 'legacy' → <LegacyFrame><LegacyGroupLayout>{children}</…></LegacyFrame>
                                                   └─ 'modern' → khung mới
  └─ src/app/<route>/page.tsx     ─ getUiVariant() ─┬─ 'legacy' → <LegacyPage {...props}/>   (src/legacy/app/<route>/page.tsx)
                                                   └─ 'modern' → page mới
src/servers · src/stores · src/lib · src/types  →  dùng chung
```

### 4.1 Đóng băng UI cũ
- Chép `src/components/**` sang `src/legacy/components/**`, gồm cả file test.
- Chép mọi `src/app/**/page.tsx`, `layout.tsx` của các nhóm, và 3 file `page.test.ts(x)` sang `src/legacy/app/**`,
  cùng đường dẫn tương đối. Các file này nằm ngoài thư mục `app` nên Next không coi là route.
- Trong bản chép, chỉ đổi import `@/components/` thành `@/legacy/components/`. Không sửa gì khác.
- Từ đây `src/legacy/**` đóng băng: không thêm tính năng; chỉ sửa khi một thay đổi dùng chung (action, type) làm nó
  không còn biên dịch.
- Tailwind `content` đã quét `./src/**`, nên class của bản cũ vẫn được sinh ra.

### 4.2 Chọn giao diện
- `src/lib/ui-variant.ts`:
  - `resolveUiVariant(cookieValue, envDefault)` là hàm thuần.
  - `getUiVariant()` chỉ chạy phía server, đọc cookie `talentai-ui` (`legacy` | `modern`). Không có hoặc sai thì lấy
    `process.env.UI_DEFAULT_VARIANT`; env cũng sai thì dùng `modern`.
- `src/servers/ui/ui-variant.action.ts`:
  - `setUiVariantAction(variant)` ghi cookie: path `/`, 1 năm, `sameSite: 'lax'`, `httpOnly: true`.
  - Sau đó gọi `revalidatePath('/', 'layout')`. Client gọi `router.refresh()`.
- Thêm `src/app/(auth)/layout.tsx` (mới) để nhóm auth cũng có chỗ chuyển giao diện ở mức layout.

### 4.3 Bao bọc giao diện cũ
- Root layout gắn class font Inter lên `<body>` chỉ khi đang ở bản cũ; bản mới dùng Geist.
- `LegacyFrame` hiển thị một pill nổi góc dưới trái "Dùng giao diện mới" (client component, gọi action).
- `LegacyFrame` thuộc code mới (`src/components/ui-variant/`), không nằm trong `src/legacy`.

### 4.4 Cô lập CSS
- Root layout đặt `<html data-ui="modern|legacy">`.
- Mọi rule CSS cấp phần tử mới trong `global.css` phải nằm dưới `html[data-ui="modern"]`: font body, nền, selection,
  focus, scrollbar.
- Biến CSS (token) được khai báo trên `:root` để dùng ở mọi nơi; khai báo token không đổi giao diện cũ.
- Giữ nguyên reset hiện có mà bản cũ dựa vào.

### 4.5 Phần dùng chung giữa hai chế độ
`loading.tsx`, `error.tsx`, `global-error.tsx`, `not-found.tsx` và toast dùng thiết kế mới ở cả hai chế độ (ghi nhận
là khác biệt có chủ đích).

### 4.6 Bundle
**ASSUMPTION:** page import cả component cũ và mới, nên chưa biết client chunk của bản cũ có bị tải khi đang ở chế độ
mới không. M0 đo "First Load JS" của `/my-applications` trước và sau khi thêm switch. Nếu tăng quá 10%, chuyển import
bản cũ sang `next/dynamic`.

## 5. Design tokens

### 5.1 Màu
Khai báo trên `:root` dạng kênh RGB (`--ink: 23 23 23`). Tailwind map bằng `rgb(var(--ink) / <alpha-value>)`. M0
phải kiểm CSS build ra có đúng dạng này. Mọi key là **thêm mới** trong `theme.extend`, để class Tailwind mặc định mà
bản cũ dùng (`blue-700`, `red-600`…) vẫn còn.

| Token (class Tailwind) | Hex | Dùng cho |
|---|---|---|
| `canvas` | #fafafa | nền app |
| `surface` | #ffffff | thẻ, panel, bảng |
| `surface-2` | #f5f5f5 | nền phụ, hover, chip trung tính |
| `line` | #ebebeb | hairline, đường kẻ bảng |
| `line-strong` | #888888 | viền input/checkbox (3,54:1, đạt 3:1 cho thành phần UI) |
| `ink` | #171717 | chữ chính, nút chính |
| `ink-2` | #4d4d4d | chữ body |
| `ink-3` | #6f6f6f | chữ phụ, placeholder (4,81:1 trên canvas) |
| `ink-4` | #a1a1a1 | chỉ cho trạng thái disabled |
| `accent` | #0070f3 | nền nút AI/chọn, focus ring, thanh điểm, chấm chưa đọc |
| `accent-text` | #0761d1 | chữ link và chữ màu xanh |
| `accent-soft` | #d3e5ff | nền chip xanh, hàng đang chọn |
| `success` / `success-soft` | #0a7d33 / #dcf5e4 | trạng thái tốt |
| `warning` / `warning-soft` | #ab570a / #ffefcf | chờ, cần chú ý |
| `danger` / `danger-soft` / `danger-solid` | #c50000 / #f7d4d6 / #ee0000 | lỗi, xóa (`danger-solid` làm nền nút xóa, chữ trắng 4,53:1) |
| `night` / `night-2` / `night-3` | #0f1011 / #141516 / #18191a | màn phỏng vấn thử AI, panel thương hiệu ở auth |
| `night-line` | #23252a | hairline trên nền tối |
| `night-ink` / `night-ink-2` / `night-ink-3` | #f7f8f8 / #d0d6e0 / #8a8f98 | chữ trên nền tối |

Quy tắc dùng màu:
- Chữ xanh luôn dùng `accent-text`, không dùng `accent`, vì `accent` trên canvas chỉ đạt 4,36:1.
- Màu trạng thái không thay cho màu nhấn.
- Chỉ có một màu nhấn.

### 5.2 Chữ
- `next/font/google`:
  - Geist (variable, `subsets: ['latin','vietnamese']`) → `--font-sans`
  - Geist Mono → `--font-mono`
- Số trong bảng, KPI và điểm dùng `tabular-nums`. Mã, ID và nhãn kỹ thuật dùng mono.

| Class | Cỡ / dòng | Trọng lượng · tracking | Dùng |
|---|---|---|---|
| `text-micro` | 11/16 | 500 | nhãn phụ trong bảng |
| `text-caption` | 12/16 | 400–500 | caption, chip |
| `text-body-sm` | 13/20 | 400 | body của staff |
| `text-body` | 15/24 | 400 | body của ứng viên |
| `text-title-sm` | 16/24 | 600 · -0.01em | tiêu đề thẻ |
| `text-title` | 20/28 | 600 · -0.015em | tiêu đề vùng, tên trang staff trong toolbar |
| `text-heading` | 24/32 | 600 · -0.02em | tiêu đề trang ứng viên |
| `text-display-sm` | 32/40 | 600 · -0.03em | tiêu đề trang public |
| `text-display` | 48/52 | 600 · -0.035em | hero trang chủ (mobile 34/40) |

Tiêu đề dùng `text-wrap: balance`, đoạn văn dùng `text-wrap: pretty`. Đoạn chữ dài tối đa khoảng 68ch.

### 5.3 Hình khối
- **Radius:**
  - `rounded-ctl` 6 px cho nút, input, chip
  - `rounded-card` 12 px cho thẻ và bảng
  - `rounded-panel` 16 px cho dialog và sheet
  - Avatar là hình vuông bo 8 px, không dùng hình tròn
- **Bóng** (Vercel, thêm key mới):
  - `shadow-e1` `0 0 0 1px rgb(0 0 0 / .08)`
  - `shadow-e2` `0 0 0 1px rgb(0 0 0/.08), 0 1px 1px rgb(0 0 0/.02), 0 2px 2px rgb(0 0 0/.04)`
  - `shadow-e3` `0 0 0 1px rgb(0 0 0/.08), 0 2px 2px rgb(0 0 0/.04), 0 8px 8px -8px rgb(0 0 0/.04)`
  - `shadow-e4` `0 0 0 1px rgb(0 0 0/.08), 0 2px 2px rgb(0 0 0/.04), 0 8px 16px -4px rgb(0 0 0/.04)`
  - `shadow-e5` `0 0 0 1px rgb(0 0 0/.08), 0 1px 1px rgb(0 0 0/.02), 0 8px 16px -4px rgb(0 0 0/.04), 0 24px 32px -8px rgb(0 0 0/.06)`
- **z-index:**
  - `z-sticky` 10, `z-header` 20, `z-drawer` 30, `z-overlay` 40, `z-modal` 50
  - `z-popover` 60, `z-toast` 70, `z-palette` 80
  - Không còn giá trị kiểu `z-[100]`.
- **Spacing:** thang 4 px mặc định của Tailwind.
- **Chiều cao control:** sm 32, md 36, lg 44 px. Mọi vùng bấm ≥ 24×24 px; trên mobile nút chính ≥ 44 px.
- **Focus:** `outline 2px accent`, offset 2px, chỉ khi `:focus-visible`.

## 6. Motion

Thư viện `motion` (đã cài):
- `MotionProvider` đổi thành `LazyMotion features={domAnimation}` bọc `MotionConfig reducedMotion="user"`.
- Không bật `strict`, vì bản cũ còn dùng `motion.*`.
- Component mới dùng `m.*` từ `motion/react-m`.

| Token | Giá trị | Dùng |
|---|---|---|
| `press` | 120 ms | nhấn: `scale(.97)` |
| `hover` | 200 ms | đổi màu, bóng, nhấc thẻ 2 px |
| `base` | 280 ms | vào trang, mở panel/sheet/dialog, popover |
| `slow` | 420 ms | section ở trang public |
| `exit` | 0,7 × thời lượng vào | thoát nhanh hơn vào |
| ease vào | `cubic-bezier(.16,1,.3,1)` | |
| ease thoát | `cubic-bezier(.5,0,.75,0)` | |
| spring gọn | `stiffness 500, damping 40` | indicator tab (`layoutId`), switch |

Mẫu dùng:
- **Vào trang:** phần tử con xuất hiện lần lượt cách nhau 40 ms, `y: 6 → 0`, opacity 0 → 1. Tối đa 8 phần tử; phần
  còn lại hiện ngay.
- **Dialog:** `scale .97 → 1` và opacity.
- **Sheet/panel:** trượt từ phải.
- **Popover/menu:** scale từ `transform-origin` của Radix.
- **KPI:** đếm lên một lần khi mount.
- **Skeleton:** shimmer CSS.
- **Kanban:** thẻ nhấc lên khi kéo.

Không làm:
- View Transitions, vì API React canary.
- Smooth scroll chiếm cuộn (Lenis).
- Animation trên `width`, `height`, `top`, `left`.
- `layoutId` trên bảng dài.
- Animation lặp vô hạn, trừ chấm "đang gõ" của AI và skeleton.

Reduced motion:
- `MotionConfig` tắt transform cho component dùng motion.
- `@media (prefers-reduced-motion: reduce)` tắt animation và transition CSS.

## 7. Thư viện component `src/components/ui/`

Mỗi primitive một file, export có tên, style chỉ dùng token.

| Primitive | Ghi chú |
|---|---|
| `Button` | `variant`: primary (ink), secondary (surface + e2; bản build dùng e2 để nút nhìn ra là bấm được), ghost, danger, accent; `size` sm/md/lg; `loading` hiện spinner nhỏ và `aria-busy`; nhấn co `.97` |
| `ButtonLink` | `next/link` với cùng style |
| `IconButton` | bắt buộc `aria-label`; 32/36 px |
| `Field`, `Input`, `Textarea`, `Select`, `Checkbox`, `Switch` | `Field` nối label, hint và lỗi bằng `id`/`aria-describedby`/`aria-invalid` |
| `Badge`, `StatusChip` | chip vuông bo 6 px; `StatusChip` lấy tone + nhãn từ `src/lib/status-tones.ts` (hàm thuần, có test) |
| `Surface` | plain (e1), raised (e3), inset (surface-2) |
| `Segmented`, `Tabs` | ARIA `tablist`, phím mũi tên; indicator dùng `layoutId` |
| `Table` (`THead`, `TH`, `TR`, `TD`) | header dính tùy chọn, hover hàng, ô số `tabular-nums` |
| `Dialog` | dựa trên `AccessibleDialog` hiện có + motion |
| `Sheet` | panel bên phải, Radix Dialog |
| `DropdownMenu` | Radix dropdown-menu |
| `Tooltip` | Radix tooltip; mở cả khi focus |
| `Avatar` | hình vuông bo 8 px, chữ viết tắt; màu nhạt lấy từ tên bằng hàm thuần có test |
| `Kbd`, `Skeleton`, `EmptyState`, `Stat`, `ScoreBar` | `ScoreBar` luôn đi kèm nhãn "Gợi ý AI" ở đầu cột hoặc trong tooltip |
| `PageToolbar` | một hàng: tên trang (`text-title`) + bộ lọc + thao tác. Thay khối tiêu đề lớn |
| `Breadcrumbs` | dùng trong top bar của staff |
| `Reveal`, `Stagger` | helper motion cho client |

Icon: giữ `lucide-react` (124 file đang dùng), chuẩn hóa `strokeWidth 1.75`, cỡ 16/18/20. Không đổi bộ icon.

## 8. Khung trang

| Khung | Nội dung |
|---|---|
| **Public/ứng viên** | Header dính cao 60 px, kính mờ (`bg-canvas/75` + `backdrop-blur`), viền dưới `line`. Bên trái là logo mới (khối mực + chữ "TalentAI", không dùng Sparkles). Ở giữa là nav ứng viên: Tìm việc · Đơn của tôi · Lịch phỏng vấn · CV của tôi · Phỏng vấn thử; khách chỉ thấy Tìm việc + Đăng nhập/Đăng ký. Bên phải có chuông và menu tài khoản (Hồ sơ · Dùng giao diện cũ · Đăng xuất). Dưới 768 px: ứng viên đã đăng nhập có bottom bar 5 tab chừa safe-area; nav giữa ẩn. Nội dung rộng tối đa 1200 px. |
| **Staff/admin** | Sidebar 248 px: nhóm "Tuyển dụng" (Bảng điều khiển, Tin tuyển dụng, Lịch phỏng vấn), đường kẻ, rồi nhóm "Quản trị" (8 mục lọc bằng `mayVisit`). Chân sidebar là tài khoản kèm tên tổ chức và menu (Hồ sơ của tôi · Dùng giao diện cũ · Đăng xuất). Nút thu gọn có `aria-expanded` chuyển sidebar về rail 64 px. Trạng thái thu gọn lưu ở cookie `talentai-sidebar` để render server không bị nháy. Ở rail, nhãn vẫn nằm trong DOM (sr-only) và hiện bằng tooltip khi hover/focus. Top bar 56 px gồm breadcrumb, nút "Tìm hoặc đi tới… Ctrl K" và chuông. Dưới 1024 px sidebar thành drawer. |
| **Command palette** | Mở bằng Ctrl/Cmd+K hoặc nút ở top bar. Ô nhập là combobox; danh sách nhóm "Đi tới" (mục nav theo role) và "Giao diện" (Dùng giao diện cũ). Dùng ↑ ↓ Enter Esc. Lọc không phân biệt dấu tiếng Việt bằng hàm thuần có test. |
| **Auth** | ≥ 1024 px chia đôi: bên trái form rộng tối đa 400 px; bên phải panel `night` có grain và một vệt sáng tỏa tròn, kèm 3 dòng giá trị sản phẩm. Mobile chỉ có form. Bản staff đổi nội dung panel cho recruiter. |
| **Phỏng vấn thử** | Toàn màn hình nền `night`. Top bar có tiến độ "Câu x/y" và nút thoát. Cột chat rộng tối đa 760 px. Bong bóng AI dùng `night-2`, bong bóng ứng viên dùng `night-ink` với chữ `night`. Có chấm "đang gõ". |
| **Loading/Error/404** | Skeleton theo hình bố cục của từng nhóm. Màn lỗi nói chuyện gì xảy ra và có nút Thử lại. Trang 404 mới (`app/not-found.tsx`) có nút về trang chủ và tìm việc. |

## 9. Thay đổi theo từng màn

Giữ nguyên hành vi và dữ liệu. Cột "Mới" chỉ nêu điểm khác về trình bày/UX.

| Route | Mới |
|---|---|
| `/` | Hero tiêu đề lớn với ô tìm kiếm là trọng tâm (khung tìm kiếm dạng thanh có nút); dải danh mục cuộn ngang; khối AI giải thích ngắn; việc nổi bật; footer gọn có link pháp lý (giữ link hiện có) |
| `/job-postings` | Ô tìm kiếm trên cùng, chip bộ lọc ngang, chip "đang lọc" bỏ được; danh sách 70% + cột phải 30%; cả thẻ bấm được; skeleton; empty state gợi ý bỏ bớt lọc |
| `/job-postings/[id]` | Cột chính 2/3 + thẻ ứng tuyển dính 1/3; yêu cầu đã parse hiện thành chip; nút ứng tuyển mở sheet chọn CV (giữ luồng hiện tại) |
| auth ×8 | Khung auth mới; lỗi inline theo `Field`; nút có trạng thái chờ |
| `/my-applications` (+`[id]`) | Thẻ đơn có `StatusChip` và dòng "Bước tiếp theo"; trang chi tiết dùng timeline hiện có (`build-timeline`) với bố cục mới |
| `/my-cvs` | Lưới CV, trạng thái parse AI, sheet tải lên có vùng kéo thả (giữ action hiện có) |
| `/my-interviews` | Danh sách theo ngày (`group-schedules`), nút link họp nổi bật |
| `/mock-interview` | Chọn chủ đề/độ khó trong một thẻ có bước; danh sách phiên cũ |
| `/mock-interview/[sessionId]` (+`/result`) | Khung phỏng vấn tối; trang kết quả có điểm tổng, theo tiêu chí, kế hoạch hành động, danh sách hỏi đáp mở rộng từng câu |
| `/profile` | Thẻ thông tin + sheet sửa |
| `/dashboard` | KPI (`Stat` đếm lên), pipeline, biểu đồ xu hướng (recharts đổi màu theo token), tin đang mở, ứng viên mới |
| `/jobs` | `PageToolbar` có tab trạng thái, tìm kiếm, nút tạo; bảng/thẻ tin; form 2 bước trong dialog lớn có chỉ báo bước |
| `/jobs/[jobId]/candidates` | Bảng có `ScoreBar` "Gợi ý AI", `StatusChip`, thanh thao tác hàng loạt (giữ `BulkScreeningBar`); **panel xem nhanh** bên phải khi chọn một hàng: chỉ dùng field có sẵn trong dữ liệu danh sách, kèm link "Mở hồ sơ đầy đủ"; thao tác chính vẫn ở hàng/trang chi tiết |
| `/jobs/[jobId]/candidates/[id]` | Header có tên, vòng, thao tác quyết định; tab Tổng quan · Ghi chú · Scorecard; khối "Gợi ý AI" có giải thích theo tiêu chí và luồng duyệt điểm hiện có |
| `/jobs/[jobId]/compare` | Bảng so sánh có cột cố định, số `tabular-nums` |
| `/jobs/[jobId]/kanban` | Cột và thẻ mới, thẻ nhấc khi kéo; **menu thẻ thêm "Chuyển sang vòng…"** gọi cùng action với kéo thả (WCAG 2.5.7) |
| `/interviews` | Lịch tuần mới, dải tóm tắt, drawer chi tiết thành `Sheet` |
| `/my-profile` | Như `/profile` cho staff |
| admin ×9 | Mẫu chung: `PageToolbar` (tìm, lọc, thêm), dải số liệu nhỏ, `Table` với menu hành động ở hàng (`DropdownMenu`), tạo/sửa trong `Dialog`/`Sheet`; cây danh mục có thụt lề và đường dẫn; cấu hình AI là thẻ hồ sơ trọng số; log AI là bảng mono có lọc |

## 10. Khả năng tiếp cận và hiệu năng

- WCAG 2.2 AA:
  - contrast theo §5.1
  - focus nhìn thấy, không bị header dính che (`scroll-margin-top`)
  - target ≥ 24 px
  - kéo thả có cách thay thế
  - landmark: một `<main id="main-content">` mỗi trang, giữ skip link
- Dialog, sheet và menu: focus trap, Esc, trả focus về nút mở (Radix/AccessibleDialog).
- Core Web Vitals mục tiêu: LCP ≤ 2,5 s, INP ≤ 200 ms, CLS ≤ 0,1. Font dùng `next/font` để tránh CLS. Skeleton giữ
  đúng kích thước.

## 11. Kiểm chứng

- **Hợp đồng hành vi:** các test Vitest hiện có (263 truy vấn `getByRole`, 85 `getByText`) phải xanh với UI mới.
  Chỉ sửa test khi chữ hiển thị đổi có chủ đích, và ghi lý do trong commit.
- **Test mới (đỏ trước):**
  - `resolveUiVariant`
  - `setUiVariantAction` ghi đúng cookie
  - page chuyển đúng giữa bản cũ và bản mới
  - contrast của mọi cặp token đạt ngưỡng
  - `status-tones` ánh xạ đủ mọi giá trị enum
  - màu avatar ổn định theo tên
  - command palette lọc theo role và không phân biệt dấu
  - rail sidebar giữ nhãn và `aria-expanded`
  - panel xem nhanh mở, đóng và trả focus khi bấm Esc
  - Kanban "Chuyển sang vòng…" gọi đúng action
- **Cổng:** `typecheck:web`, `lint:web`, `test:web`, production build.
- **E2E:** Playwright trên stack `docker-compose.test.yml`. Sửa selector khi cần, thêm một hành trình chuyển sang giao
  diện cũ rồi quay lại.
- **Mắt người:** chụp từng nhóm màn ở 1440/1024/390, giả lập `prefers-reduced-motion: reduce`.

## 12. Mốc

| Mốc | Phạm vi |
|---|---|
| M0 · Nền móng | Đóng băng bản cũ + switch + `LegacyFrame`; token, font, Tailwind theme, CSS cô lập; motion provider và preset; 2 gói Radix; primitives §7; khung public/ứng viên, staff (sidebar, rail, top bar, palette), auth, phỏng vấn; loading/error/404; đo bundle |
| M1 · Public + auth | `/`, `/job-postings`, `/job-postings/[id]`, 8 trang auth |
| M2 · Ứng viên | `/my-applications` (+chi tiết), `/my-cvs`, `/my-interviews`, `/mock-interview` (+phiên, kết quả), `/profile` |
| M3 · Recruiter | `/dashboard`, `/jobs`, ứng viên (+panel xem nhanh), chi tiết, so sánh, Kanban (+menu chuyển vòng), `/interviews`, `/my-profile` |
| M4 · Admin | 9 trang quản trị |
| M5 · Hoàn thiện | E2E, chụp màn, kiểm a11y/reduced motion, cập nhật brain §11 và delivery record |

## 13. Ngoài phạm vi

- Dark mode. Token đặt tên theo vai trò để thêm sau.
- Endpoint hoặc field API mới; tính năng mới ngoài panel xem nhanh, menu chuyển vòng, command palette (chỉ điều
  hướng) và trang 404.
- Đổi bộ icon, đổi framework, Tailwind v4.
- Chuyển trang bằng View Transitions; smooth scroll kiểu Lenis.

## 14. Rủi ro và điều chưa kiểm

| Rủi ro | Cách xử lý |
|---|---|
| Khối lượng lớn (36 page, khoảng 200 component) | Làm primitives trước, rồi từng nhóm màn; bản cũ đứng yên nên luôn có đường lui |
| Test vỡ vì đổi markup | Test hiện truy vấn theo role/chữ; chỉ đổi khi chữ đổi có chủ đích |
| Bundle bản cũ lọt vào bản mới | Đo ở M0 (§4.6) |
| CSS mới làm lệch bản cũ | Scope theo `data-ui` (§4.4); chụp bản cũ một lần ở M5 để so |
| `<alpha-value>` với Tailwind 3.4.3 | UNVERIFIED: kiểm CSS build ra ở M0 |
| E2E cần Docker và cổng 3001 đang bị english-learning chiếm | Đặt `WEB_E2E_BASE_URL` sang cổng khác theo hướng dẫn `docs/tasks/test-defect-fixes` |
| Panel xem nhanh có thể thiếu field | Chỉ hiện field có trong dữ liệu danh sách; thiếu thì dẫn sang trang chi tiết |
