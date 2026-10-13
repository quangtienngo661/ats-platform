# Tối ưu FE TalentAI, giữ giao diện hiện tại

## Phạm vi đã thực hiện

Theo yêu cầu mới, giữ layout, bố cục, font, màu, URL và nghiệp vụ đang có. Không triển khai thiết kế Figma hay thêm chức năng avatar/logo. Giữ Next.js 16, React 19 và Tailwind CSS 3.

- Giới hạn callback đăng nhập/đăng xuất về đường dẫn nội bộ; encode query đúng và fallback theo vai trò. Giữ nguyên quy tắc quyền đang có và cookie refresh của request hiện tại.
- API làm sạch mô tả tin khi tạo/sửa và khi đọc dữ liệu cũ bằng sanitize-html: chỉ p/br/strong/b/em/i/ul/ol/li, không thuộc tính. Editor paste văn bản thuần.
- Truyền bộ lọc onsite/remote/hybrid từ FE tới API; kiểm tra phân trang trước truy vấn, giữ phạm vi tổ chức và giới hạn tin công khai.
- Thay ba hydrator ghi Zustand trong render bằng store riêng cho cây route, có dữ liệu ngay từ lần render đầu; giữ logic Socket.IO và upsert.
- Chuẩn hóa lỗi Server Actions, giữ redirect/notFound của Next; lỗi API đi tới error boundary thay vì biến thành danh sách rỗng. Bổ sung loading/error cho các nhóm route, retry khi tải CV hoặc kết quả phỏng vấn thất bại.
- Dùng Radix cho 20 modal/drawer hiện có và menu dashboard mobile: tên dialog, focus trap, Escape, khôi phục focus. Giữ markup panel và classes hiện có. Liên kết label/input, tên nút icon, checkbox bàn phím và hiển thị thao tác card khi focus.
- Gỡ CSS scaffold không được sử dụng; gom CSS editor dùng chung. Sửa min-width khiến thanh tìm việc tràn ngang trên mobile.
- Bật ESLint Next Core Web Vitals, React Hooks và JSX accessibility; ngưỡng zero warnings. Bổ sung typecheck, test và Playwright vào CI với stack/fixture riêng, cleanup luôn chạy.
- Cập nhật rule web của harness theo runner và kiến trúc thực tế.

Ô địa điểm trên trang chủ giữ nguyên vị trí/hình thức, nhưng vô hiệu hóa vì API không hỗ trợ tìm theo địa điểm. Các placeholder không có đích/hành động được đánh dấu vô hiệu hóa.

## Kiểm chứng local

| Kiểm tra | Kết quả |
| --- | --- |
| Typecheck ứng dụng và test | Đạt |
| ESLint source FE | 0 lỗi, 0 warning |
| Vitest FE | 19 file, 130 test đạt |
| Jest API | 59 suite, 462 test đạt |
| Playwright | 17 hành trình đạt trên API/DB test thật |
| Production build FE | Đạt; build đủ 33 route page hiện có |
| Docker API build | Đạt |

Playwright kiểm tra đăng nhập theo vai trò, callback có query, refresh/revoke phiên, tìm việc theo hình thức, sanitize HTML cũ, tạo tin, quản lý recruiter/tenant và đặt lịch. Bổ sung kiểm tra CV đã có dữ liệu, focus dialog, Kanban sau reload, lịch sử/câu hỏi phỏng vấn resume và menu mobile.

Đối chiếu DOM/style trước–sau ở trang chủ, tìm việc, đăng nhập tại **1440 px và 390 px**. Navbar, vị trí khối nội dung, font và màu giữ nguyên. Ngoại lệ là sửa ô địa điểm bị tràn trong container desktop và thanh tìm việc mobile: document width từ 408 px về 390 px. Số đo tóm tắt: [layout-comparison.json](results/layout-comparison.json).

Các thay đổi được làm ở checkout riêng rồi áp dụng phần chênh lệch vào checkout đang sử dụng, có kiểm tra hash và bản sao lưu source trước sửa. Không copy dữ liệu test, cache, .env hay thay đổi bản thiết kế cũ.

## Giới hạn kiểm chứng

- Chưa chạy CI trên GitHub; đã cấu hình và chạy các lệnh tương ứng tại local.
- Đối chiếu hình ảnh/DOM gồm ba trang trên cả hai kích thước, không tuyên bố đã kiểm tra hình ảnh cả 33 route.
- E2E CV dùng hồ sơ mẫu trong database; interview dùng phiên/câu hỏi mẫu. Chưa kiểm chứng upload/parse CV thật hoặc sinh câu hỏi/chấm điểm bằng AI ngoài hệ thống trong đợt này.
- Production build còn thông báo môi trường từ Node/Nx, FORCE_COLOR/NO_COLOR và dữ liệu Browserslist cũ; ESLint FE đạt zero warnings.

## Chạy lại

Từ root repo, Node 24:

```powershell
npm run typecheck:web
npm run lint:web
npm run test:web
npm run test:api -- --silent
$env:NODE_ENV = 'production'
npx nx build web --configuration=production
```

E2E sử dụng API **55000**, PostgreSQL **55432**, Redis **56379** và web **3001**. Runner từ chối API ngoài localhost hoặc cổng khác 55000. Chuẩn bị fixture và tài khoản mẫu theo [hướng dẫn](../test-defect-fixes/README.md). Khi đổi cổng web test, đặt WEB_E2E_BASE_URL trước khi khởi động compose để origin Socket.IO khớp.

```powershell
docker compose -f docker-compose.test.yml up -d --build --wait
node apps/web/e2e/support/prepare-local.mjs
# Đặt WEB_E2E_* cho các tài khoản mẫu và organizationId theo hướng dẫn.
npm run test:e2e:web
docker compose -f docker-compose.test.yml down -v --remove-orphans
```
