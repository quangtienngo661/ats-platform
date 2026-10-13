# Căn cứ kỹ thuật

Không cần suy đoán API từ tài liệu mạng; sử dụng source cài trong repo và quan sát thực nghiệm.

- NextRequest/NextResponse thật trong [proxy tests](../../../apps/web/src/proxy.test.ts)
  cho thấy cookie request vẫn cũ trước sửa. [Browser GREEN](results/e2e-green-final.txt)
  xác nhận SSR đọc được cấu hình ngay trong request sau refresh.
- [AuthController/Service](../../../apps/api/src/app/auth/auth.controller.ts) dùng
  refresh cookie để thu hồi; browser RED replay 201, GREEN replay 401.
- [Gateway](../../../apps/api/src/common/socket-io/socket-io.service.ts) dùng resolver
  tenant từ DB; connection handler bất đồng bộ. Unit deferred JWT tạo được race;
  [runtime](results/runtime-probes.json) nhận event ứng tuyển thật sau join ngay tại connect.
- SDK Gemini hiện cài khai báo usageMetadata optional trong
  `node_modules/@google/genai/dist/genai.d.ts`; không gọi Gemini thật trong phiên này.
- [Migration default per organization](../../../libs/backend/database/prisma/migrations/20260919053000_ai_config_default_per_organization/migration.sql)
  được áp dụng trên database test và kiểm tra bằng constraint PostgreSQL thật.
- [Auth module](../../../apps/api/src/app/auth/auth.module.ts) giới hạn login 5/minute.
  Lần browser GREEN đầu có 4 đạt, case thứ 5 nhận 429. Fixture được sửa để không
  tiêu tốn login và chờ counter hết hạn; không đổi giới hạn sản phẩm.
- Deadline 3s là quyết định local để health đáp ứng trong ngân sách 5s chẩn đoán;
  không xác lập SLA production.
