# Review Task 2 — schema, migration, enum, probe DB (approved, 39e4b0f + 2104549)

- Files: đúng mục Files (probe, log đỏ, log xanh, `schema.prisma`, `migration.sql`, `enums.ts`). Không chạm file khác.
- Hai pha: Codex viết probe (pha 1) rồi schema/migration/enum (pha 2); phiên `-impl` chạy container, `migrate deploy`, probe, `migrate diff`, `prisma generate`, `nx build api` và commit.
- Đỏ trước: probe đỏ đúng lý do (control PASS, 10 FAIL vì đối tượng chưa có), commit `39e4b0f` trước commit schema.
- Xanh: probe 11/11 PASS; `migrate diff --exit-code` rỗng sau deploy; control của chính lệnh đó in đủ SQL trước deploy (chạy sau Step 3 thay vì "trước Step 3" — trước Step 3 control không thể đỏ; ghi trong log xanh).
- Interfaces: khối schema khớp từng ký tự với plan; 3 dòng quan hệ ngược ở cuối danh sách; enum `as const` + `type` đặt trước khối alias; tên constraint/index khớp probe.
- Finding nhỏ (không chặn): dòng `emailNotifications` trong `model Application` lệch cột so với `screening    CVScreening?` (thẩm mỹ; `prisma format` sẽ căn lại).
- Ghi nhận: `prisma migrate diff` CÓ in kết quả với `--from-config-datasource` (brain ghi là in rỗng — nên sửa brain). `database:build` vẫn lấy từ Nx local cache sau `rm -rf .nx/cache`; build chưa chứng minh client mới, Task 5 là phép thử thật.
- `git ls-remote --heads origin feat/gd2-sp3-email-notifications`: rỗng.
