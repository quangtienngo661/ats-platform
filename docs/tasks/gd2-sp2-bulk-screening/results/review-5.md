# Review Task 5 — route bulk, validation, rate limit (2026-10-14)

**Kết luận:** approved. Commit do phiên `-impl`: `a647beb` test, `52b14ea` sửa setup test (điều phối duyệt phương án A), `23c613c` feat.

| Kiểm | Kết quả (phiên `-impl` tự chạy) |
|---|---|
| Pha 1 | đỏ: DTO thiếu constraint (`arrayMinSize`, `isBoolean`…), controller TS2305/TS2339/TS2554. Vòng 1: dòng dựng controller của test cũ phải nhận tham số thứ hai (plan cho phép) |
| Lỗi setup lộ ở pha 2 | test `bulkScreening delegates…` dựng `Test.createTestingModule` → Nest quét `@UseGuards(ThrottlerGuard)` và đòi `THROTTLER:MODULE_OPTIONS`. Không lộ ở pha 1 vì suite đỏ do biên dịch. **Bài học:** ở pha 1 phải thấy test đỏ vì hành vi chưa có, không chỉ vì lỗi biên dịch |
| Sửa (`52b14ea`) | diff chỉ đổi setup: `-    const module = await Test.createTestingModule({` … `+    const bulkScreeningService = { bulkScreen: jest.fn() };` `+    const controller = new ApplicationsController({} as any, bulkScreeningService as any);` `-    await module.close();` và bỏ 3 import không còn dùng; mọi `expect`, test metadata (K3, tracker theo `userId`) giữ nguyên |
| Jest `bulk-screening.dto\|applications.controller` | 8/8 passed |
| Jest `applications\|cv-screenings\|bulk-screening` | `Test Suites: 9 passed` · `Tests: 146 passed` |
| `npx nx build api --skip-nx-cache` | `webpack compiled successfully` (trên cùng code production) |
| `npx nx lint api` | 0 errors, 306 warnings (trước 301; phần tăng là `as any` trong spec); eslint 4 file production: sạch |
| Không push | không có `refs/remotes/origin/feat/gd2-sp2-bulk-screening`; `branch.<nhánh>.remote` rỗng (Task 4) |
