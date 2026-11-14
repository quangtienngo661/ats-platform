# Research cho đợt thiết kế lại giao diện (13/11/2026)

Phục vụ spec `docs/superpowers/specs/2026-11-13-ui-redesign-design.md`. Ba nhánh research chạy song song; mục nào
chưa kiểm được ghi **UNVERIFIED** hoặc **UNSOURCED**. Mục có dấu ✔ là đã kiểm lại trực tiếp trong repo ngày 13/11.

## 1. Next.js 16 / React 19 / Motion / Tailwind 3

### Phiên bản đã cài ✔
`next` 16.3.3, `react`/`react-dom` 19.2.4, `motion` 12.38.0, `tailwindcss` 3.4.3. Không có gói `@tailwindcss/*`.
`next.config.js` không bật `cacheComponents` hay flag experimental nào.

### Font có subset tiếng Việt trong `next/font/google` ✔
Nguồn: `node_modules/next/dist/compiled/@next/font/dist/google/font-data.json`.

| Font | vietnamese | variable |
|---|---|---|
| Geist, Geist Mono | có | có (100–900) |
| Inter, Inter Tight, Manrope, Plus Jakarta Sans, Bricolage Grotesque, Lexend, Space Grotesk, IBM Plex Sans | có | có |
| JetBrains Mono, Fraunces, Newsreader, Source Serif 4, Lora | có | có |
| Be Vietnam Pro | có | **không** (static 100–900) |
| Outfit, Figtree, DM Sans, Onest, Instrument Sans, Instrument Serif | **không** | — |

Hệ quả: các font mà skill redesign gợi ý như Outfit không dùng được cho UI tiếng Việt. Geist dùng được.

### View Transitions
- Docs đi kèm Next (`node_modules/next/dist/docs/01-app/02-guides/view-transitions.md`) nói App Router chạy được
  `<ViewTransition>` mà không cần cấu hình. Next 16.3.3 không còn flag `experimental.viewTransition`.
- ✔ `ViewTransition` có trong React canary mà Next bundle (`next/dist/compiled/react/cjs/react.production.js`),
  **không** có trong `react` 19.2.4 bản stable. Type TypeScript cần canary types: UNVERIFIED.
- Kết luận cho spec: không dùng trong đợt này (API canary, chưa ổn định).

### Motion v12
- `LazyMotion` + `domAnimation` + `m` (`motion/react-m`): khoảng 5 kb so với khoảng 43 kb của `motion` đầy đủ
  (motion.dev/docs/react-lazy-motion). `strict` sẽ throw nếu còn `motion.*` bên trong. 46 file hiện dùng `motion.*`,
  nên không bật `strict`.
- `MotionConfig reducedMotion="user"` tắt animation transform/layout khi OS bật reduce motion, giữ opacity/màu
  (motion.dev/docs/react-accessibility).
- `layoutId` đo layout mỗi lần render nếu không có `layoutDependency`. Không dùng cho bảng dài.
- `AnimatePresence` cho exit animation khi đổi route trong App Router: UNVERIFIED. Spec không dựa vào nó.

### Loading và pending UI
- `loading.tsx` stream UI chờ ngay lập tức (docs `03-file-conventions/loading.md`). Suspense không tự làm route dynamic.
- `useFormStatus` phải nằm trong component con của form. `useOptimistic` gọi trong Action/`startTransition`, tự
  hoàn nguyên khi lỗi (react.dev/reference/react/useOptimistic).

### Đọc cookie để chọn giao diện
- `cookies()` làm route thành dynamic (docs `04-functions/cookies.md`). Layout `(admin)`, `(candidate)`,
  `(interview-session)` và `(public)` đã đọc cookie `accessToken`, nên đọc thêm một cookie không tốn thêm gì.
  Trang `(auth)` hiện có thể đang static; đọc cookie sẽ làm chúng dynamic (chi phí nhỏ, trang nhẹ).
- Next 16 đổi `middleware` thành `proxy.ts` (docs `upgrading/version-16.md`). App đã có `src/proxy.ts`.
- Docs không có công thức "UI variant" chính thức. Các cơ chế có sẵn: đọc cookie trong layout/page, `proxy` rewrite
  sang cây route song song, hoặc env lúc build (không đổi được lúc chạy).

### Tailwind 3.4
- `darkMode: 'selector'` thay `class` từ 3.4.1. Đợt này chưa làm dark mode.
- Màu từ CSS variable: `rgb(var(--x) / <alpha-value>)`. Placeholder `<alpha-value>` là tính năng v3.3+, nhưng
  research không lấy được trang docs v3: UNVERIFIED. M0 phải build thử và kiểm CSS sinh ra.
- Container queries là gói riêng `@tailwindcss/container-queries`, chưa cài. Không dùng.

### Mức chuẩn
- Core Web Vitals (web.dev/articles/vitals): LCP ≤ 2,5 s, INP ≤ 200 ms, CLS ≤ 0,1 ở p75.
- WCAG 2.2 AA: target ≥ 24×24 px (2.5.8), contrast chữ 4,5:1, thành phần UI 3:1, có cách thay thế cho kéo thả
  (2.5.7). Trang w3.org trả 403 khi research; con số lấy theo hiểu biết chung, UNVERIFIED từ nguồn gốc.

## 2. UX của hệ thống ATS

Mức bằng chứng: tóm tắt từ kết quả tìm kiếm, chưa đọc trọn trang; nhiều nguồn là blog của vendor.

| # | Đối tượng | Thực hành | Nguồn |
|---|---|---|---|
| 1 | tất cả | Điểm AI là gợi ý, không tự loại; nút quyết định của người tách riêng | support.greenhouse.io (Talent Matching); EU AI Act Art. 14 qua artificialintelligenceact.eu |
| 2 | staff | Giải thích điểm AI: tiêu chí, trọng số, dữ liệu dùng, điều điểm không xét | pair.withgoogle.com (Explainability + Trust) |
| 3 | staff | Ghi lại khi người duyệt sửa/bỏ điểm AI kèm lý do | EU AI Act Art. 14 |
| 4 | ứng viên | Timeline trạng thái, xác nhận khi nộp và khi đổi vòng | Talent Board 2021 qua shrm.org, recruitingnewsnetwork.com |
| 5 | staff | Danh sách + panel xem nhanh; thao tác chính không chỉ nằm trong panel | developer.microsoft.com (master-detail) |
| 6 | staff | Kanban kéo thả **và** menu "Chuyển sang vòng…" | WCAG 2.2 SC 2.5.7 qua deque.com |
| 7 | staff | Thao tác hàng loạt: đếm số đã chọn, thanh ngữ cảnh, xác nhận, hoàn tác | nngroup.com (bulk actions) |
| 8 | staff | Scorecard có cấu trúc, chấm độc lập | support.greenhouse.io (structured hiring) |
| 9 | tất cả | WCAG 2.2 AA làm nền | deque.com, siteimprove.com |
| 10 | ứng viên | Luồng nộp ngắn, dùng lại CV đã parse, mobile trước | GOV.UK/designsystem.digital.gov; vendor |
| 11 | ứng viên | Ít bộ lọc cốt lõi + chip bộ lọc đang áp dụng | niceboard.co; baymard.com (tương tự) |
| 12 | staff | Command palette Cmd/Ctrl+K + bảng phím tắt | support.greenhouse.io (Command Palette) |
| 13 | tất cả | Empty state nói lý do và bước tiếp theo; loading theo hình bố cục | carbondesignsystem.com, cloudscape.design, nngroup.com |
| 14 | admin | Cài đặt nhóm theo việc, phần thiết yếu trước | docs.thoughtspot.com |
| 15 | admin | Log AI/cấu hình: ai, gì, khi nào, trước/sau, lọc, xuất | wiki SPARC trên github.com |

UNSOURCED: cách Ashby và LinkedIn Recruiter trình bày điểm AI; phím tắt của Ashby; so sánh Kanban với danh sách;
đặc tả hình ảnh (chữ, màu, motion) của các ATS hiện đại.

## 3. Design system đã lưu (artifact loại "Design System" trên claude.ai)

Đã đọc README của 12 bộ: Linear, Stripe, Apple, Jobright, Notion, Cal.com, Mercury, Vercel, Superhuman, Airbnb,
Claude, Wise. Tất cả phân tích trang marketing; không bộ nào có đặc tả bảng dày, Kanban hay lịch, và **không bộ nào
định nghĩa thời lượng/easing**.

| Hệ | Nền | Nhấn | Chữ | Hợp ATS (ứng viên/staff/admin) |
|---|---|---|---|---|
| Vercel | sáng #fafafa | mực #171717, link #0070f3 | Geist + Geist Mono | TB/Cao/Cao |
| Linear | tối #010102 | #5e6ad2 | Inter/Geist | TB/Cao/Cao |
| Apple | sáng + ô tối | #0066cc | SF Pro | Cao/Thấp/Thấp |
| Claude | kem #faf9f5 | coral #cc785c | serif + Inter | Cao/TB/TB |
| Mercury | đêm #171721 + sáng | #5266eb | arcadia (nhẹ) | Cao/TB/TB |
| Cal.com | sáng | mực #111111 | Cal Sans + Inter | Cao/Cao/Cao |

Giá trị dùng trong hướng A (đã chọn):
- **Vercel:** màu canvas, ink, hairline; năm mức shadow xếp lớp từ `0 0 0 1px #00000014` tới mức modal; cặp màu
  trạng thái nhạt/đậm (error `#f7d4d6`/`#c50000`, warning `#ffefcf`/`#ab570a`); chiều cao control 32/40/48.
- **Linear:** thang bề mặt tối `#0f1011` → `#18191a`, ink `#f7f8f8`, chữ phụ `#8a8f98` cho màn chat AI.
- **Apple:** kính mờ `saturate(180%) blur(20px)` trên thanh dính; co nhẹ khi nhấn.

Trang so sánh ba hướng: https://claude.ai/artifact/MjGQS5hconLhCQf4HhmMge (riêng tư).

## 4. Contrast đã đo ✔ (WCAG relative luminance, script node ngày 13/11)

| Chữ | Nền | Tỉ lệ | Dùng |
|---|---|---|---|
| #171717 | #fafafa | 17,18 | ink trên canvas |
| #4d4d4d | #fafafa | 8,10 | body |
| #888888 | #ffffff | **3,54** | không dùng cho chữ; dùng cho viền input (≥ 3:1) |
| #6f6f6f | #fafafa | 4,81 | chữ phụ (thay #888888) |
| #0070f3 | #fafafa | **4,36** | không dùng cho chữ trên canvas; chỉ dùng làm nền/viền/focus |
| #0761d1 | #ffffff | 5,77 | chữ link/accent |
| #ffffff | #0070f3 | 4,55 | chữ trắng trên nút xanh |
| #c50000 | #f7d4d6 | 4,55 | chip lỗi |
| #ab570a | #ffefcf | 4,51 | chip cảnh báo |
| #0a7d33 | #dcf5e4 | 4,56 | chip thành công (không có trong Vercel, tự chọn) |
| #8a8f98 | #18191a | 5,42 | chữ phụ trên bề mặt tối |
