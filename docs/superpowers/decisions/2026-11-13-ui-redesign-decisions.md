# Decisions — Thiết kế lại giao diện TalentAI

Ngày: 13/11/2026. Đi kèm design doc
[`../specs/2026-11-13-ui-redesign-design.md`](../specs/2026-11-13-ui-redesign-design.md).
File này gom mọi quyết định đã chốt lúc brainstorm. Mỗi quyết định có các phương án đã trình bày, trade-off, phương án
được chọn và lý do. Design doc mô tả *cách làm*; file này trả lời *vì sao chọn vậy và đã bỏ gì*.

**Nhãn:** ✅ = phương án được chọn. **Ai chốt:** "Chủ dự án" = chọn trực tiếp trong chat; "Duyệt cùng design" = trợ lý
đề xuất trong lúc trình bày design, chủ dự án đồng ý cả phần chứa nó.

## Tóm tắt

| # | Quyết định | Chọn | Ai chốt |
|---|---|---|---|
| D1 | Hướng giao diện | A · Mực & kính (Vercel + Linear + Apple) | Chủ dự án |
| D2 | Cách giữ UI cũ làm fallback | Chuyển lúc chạy bằng cookie, bản cũ đóng băng ở `src/legacy/` | Chủ dự án |
| D3 | Điều hướng staff/admin | Sidebar thu về rail + command palette Ctrl/Cmd+K | Chủ dự án |
| D4 | Dark mode | Chỉ light; token đặt tên theo vai trò để thêm sau | Chủ dự án |
| D5 | Design tổng thể (motion, khung, mốc M0–M5) | Duyệt như trình bày | Chủ dự án |
| D6 | Menu thả xuống và tooltip | Thêm `@radix-ui/react-dropdown-menu` + `@radix-ui/react-tooltip` | Chủ dự án |
| D7 | Các bước sau (spec, plan, cách thực thi, commit) | Làm theo đề xuất, không hỏi lại | Chủ dự án |

## D1 — Hướng giao diện

**Bối cảnh:**
- Brain §11 từng chốt "Direction A" (zinc, #2563EB, Inter) và có wireframe Figma, nhưng chưa triển khai. Giao diện
  hiện tại là kiểu Apple (#0071E3, SF/Inter).
- Người dùng muốn hiện đại, có motion, sang và mượt, dựa trên các design system đã lưu.
- Ba hướng được dựng thành trang so sánh: https://claude.ai/artifact/MjGQS5hconLhCQf4HhmMge

| Phương án | Trade-off |
|---|---|
| ✅ A · Mực & kính: Vercel + Linear + Apple. Geist, nút mực đen, xanh chỉ cho focus/AI, kính mờ, motion nhanh | Mạnh nhất cho bảng, Kanban, lịch của staff; ứng viên vẫn ổn ở mật độ thoải mái. Rủi ro: hơi lạnh với ứng viên nếu thiếu khoảng thở |
| B · Kem & serif: Claude + Airbnb. Nền kem, serif Newsreader, coral | Ấm, hợp ứng viên và phỏng vấn thử. Rủi ro: kiểu "kem + serif + cam đất" rất phổ biến ở giao diện do AI tạo; serif yếu ở bảng dày |
| C · Đêm tĩnh: Mercury + Stripe + Cal.com. Indigo trầm, nút trong mờ, Manrope | Sang và yên. Rủi ro: indigo gần kiểu "tím xanh AI"; chữ nhẹ khó đọc ở bảng dày |

Lý do chọn A: ATS phần lớn thời gian là màn staff dày dữ liệu, và A là hệ duy nhất có đặc tả dùng được cho app
(chiều cao control, năm mức shadow, cặp màu trạng thái).

## D2 — Cách giữ UI cũ làm fallback

| Phương án | Trade-off |
|---|---|
| ✅ Chuyển lúc chạy: chụp UI cũ vào `src/legacy/`, cookie chọn bản, nút chuyển trong menu tài khoản, env đặt mặc định; server actions và stores dùng chung | Quay lại được ngay, cho từng người dùng. Tốn: bản cũ nằm trong code (đóng băng, test cũ vẫn chạy) |
| Chỉ git tag + nhánh | Code gọn, nhưng muốn quay lại phải deploy bản cũ và mất mọi thay đổi mới |
| Chỉ đổi theme | Rẻ, nhưng không giữ được bố cục cũ vì bản mới đổi cả cấu trúc trang |

## D3 — Điều hướng staff/admin

Bối cảnh: staff có 11 đích đến (3 tuyển dụng + 8 quản trị). Brain §11 ghi "Staff nav not decided yet"; wireframe Figma
dùng thanh ngang.

| Phương án | Trade-off |
|---|---|
| ✅ Sidebar thu gọn + Cmd+K: sidebar có nhãn, thu về rail icon 64 px, kèm command palette; mobile dùng drawer | Chứa đủ 11 mục; palette giúp nhảy trang nhanh (Greenhouse có tính năng tương tự) |
| Top nav như Figma cũ | Gọn cho recruiter (3 mục), nhưng 8 mục quản trị phải dồn vào menu "Quản trị" |

## D4 — Dark mode

| Phương án | Trade-off |
|---|---|
| ✅ Chỉ light, token sẵn: token đặt theo vai trò; màn chat phỏng vấn AI vẫn dùng bề mặt tối | Khối lượng kiểm tra giảm một nửa |
| Có dark mode ngay | Cả hai theme cho mọi màn; gần gấp đôi việc kiểm contrast và ảnh chụp |

## D5 — Design tổng thể

Trình bày trong chat ngày 13/11 gồm bảy phần: fallback, design system, motion, khung trang, nâng cấp UX theo research
ATS, kiểm chứng, mốc M0–M5. Chủ dự án chọn "Duyệt, viết spec" (phương án còn lại: "Cần sửa").

## D6 — Menu thả xuống và tooltip

| Phương án | Trade-off |
|---|---|
| ✅ Thêm 2 gói Radix (dropdown-menu, tooltip), cùng họ với `@radix-ui/react-dialog` đang dùng | Có sẵn focus, phím mũi tên, Esc, ARIA đúng chuẩn |
| Tự viết, không thêm gói | Không thêm dependency, nhưng phải tự làm roving focus, Esc, vị trí, ARIA; dễ lỗi hơn |

## D7 — Các bước sau

Giữa lúc viết spec, chủ dự án nhắn: "Làm theo bạn recommend, không cần hỏi lại mình". Áp dụng cho các bước còn lại của
đợt này:
- Viết plan và chọn cách thực thi đã đề xuất (subagent theo task, review sau mỗi task).
- Commit theo task trên nhánh `feat/ui-redesign`, gồm cả cặp commit test đỏ → fix cho lỗi.
- Không merge vào `dev` khi chưa có CI xanh.

## Đề xuất kỹ thuật được duyệt cùng design

| Chọn | Bỏ | Vì sao |
|---|---|---|
| Geist + Geist Mono qua `next/font/google` | Outfit, Satoshi (skill redesign gợi ý); Inter | Outfit không có subset tiếng Việt (đã kiểm `font-data.json`); Satoshi không có trên Google Fonts; Inter là font mặc định dễ nhận ra |
| `motion` với `LazyMotion` + `m` | `motion.*` đầy đủ cho code mới | Khoảng 5 kb thay vì 43 kb; không bật `strict` vì bản cũ còn `motion.*` |
| Animation bằng `motion` và CSS | View Transitions (`<ViewTransition>`) | Chỉ có trong React canary mà Next bundle, chưa có trong React 19.2.4 stable |
| Cuộn gốc của trình duyệt | Lenis/smooth scroll quán tính | Chiếm cuộn làm hại thao tác trong app nhiều bảng |
| Token màu trên `:root`, CSS phần tử mới scope theo `html[data-ui="modern"]` | Ghi đè global trực tiếp | Không làm lệch bản cũ |
| Chữ phụ `#6f6f6f`, chữ xanh `#0761d1` | `#888888`, `#0070f3` cho chữ | Đo được 3,54:1 và 4,36:1, dưới 4,5:1 |
| Giữ `lucide-react`, chuẩn hóa stroke 1.75 | Đổi sang Phosphor/Heroicons | 124 file đang dùng; đổi bộ icon không đáng so với rủi ro |
| Panel xem nhanh chỉ dùng dữ liệu danh sách sẵn có | Gọi thêm API khi mở panel | Không thêm endpoint; trang chi tiết vẫn là nơi làm việc sâu |
| Thêm menu "Chuyển sang vòng…" ở Kanban | Chỉ kéo thả | WCAG 2.2 SC 2.5.7 yêu cầu cách thay thế cho kéo |
