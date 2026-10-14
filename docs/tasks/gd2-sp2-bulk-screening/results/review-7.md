# Review Task 7 — xuất CSV của một tin (2026-10-14)

**Kết luận:** approved, không finding. Commit do phiên `-impl`: `334dcd7` test, feat ngay sau.

| Kiểm | Kết quả (phiên `-impl` tự chạy) |
|---|---|
| Pha 1 | đỏ chỉ vì TS2307 (service chưa có), TS2339 `exportJobCsv`, TS2554 ở 3 chỗ dựng controller (đã thêm tham số thứ ba sẵn, nên pha 2 không phải sửa test). Test dựng class trực tiếp, không `Test.createTestingModule` (bài học Task 5) |
| Test | C11: query không chứa `email`/`phoneNumber`/`include`, `select` đúng từng trường; C13: 5001 → 400 đúng message, `findMany` không được gọi; C8: 404/403; E8, E11; giờ VN `2026-10-13T02:05Z` → `2026-10-13 09:05`; điểm `toFixed(1)`; nhãn trạng thái/sàng lọc/gợi ý; kỹ năng sai dạng → rỗng; tên file theo ngày VN (fake timer) |
| Pha 2 — file | `application-export.service.ts` (mới), `applications.controller.ts`, `applications.module.ts`; spec không đổi |
| Jest `applications\|cv-screenings\|bulk-screening\|csv.util\|application-export` | `Test Suites: 11 passed` · `Tests: 169 passed` |
| `npx nx build api --skip-nx-cache` | `webpack compiled successfully` |
| eslint 3 file | sạch |
| Route | `GET job/:jobId/export` khai báo trước `job/:jobId`; có 3 đoạn path nên `job/:jobId` (2) và `:id` (1) không bắt được. Trả qua `@Res()` (K7) — chưa chạy thật, để P6 (Task 11) |
| Ngày giờ | `Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', hourCycle: 'h23' })` + `formatToParts`, không phụ thuộc TZ server |
| Không push | không có `refs/remotes/origin/feat/gd2-sp2-bulk-screening` |
