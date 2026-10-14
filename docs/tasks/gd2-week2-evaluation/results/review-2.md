# Review — Task 2 (schema, migration, enum, probe)

- Pha 1 (Codex viết probe; phiên `-impl` chạy docker + `migrate deploy` + probe vì sandbox Codex không chạy được docker/DB):
  - `docker run … postgres:18.4-alpine` ở `127.0.0.1:55532`, `pg_isready` OK.
  - `migrate deploy` (32 migration có sẵn) OK.
  - Probe → exit 1, 16/16 FAIL, mọi dòng `42P01`/`42704` (bảng/enum chưa có): đỏ đúng lý do; các hàng cha insert được.
  - Commit `a935b00 test(db): add the scorecard and note constraint probe` (probe + log đỏ).
- Pha 2 (Codex: schema, migration viết tay, enum; `prisma validate` + `generate` exit 0):
  - `migrate deploy` áp `20261014000000_add_interview_scorecards_and_application_notes` OK.
  - Probe → 15/16: FK `ON DELETE RESTRICT` trả **23001** (restrict_violation) trên `interview_scorecards_interview_id_fkey`, plan/probe chờ 23503 (của NO ACTION). **Plan sai ở SQLSTATE**, không phải code.
  - Điều phối chọn sửa giá trị mong đợi (giữ `onDelete: Restrict` theo spec), vẫn assert mã 23001 **và** tên constraint: commit riêng `0834ebe test(db): expect restrict_violation for the scorecard foreign key` (Codex sửa, chỉ file probe).
  - Probe chạy lại → 16/16 PASS, exit 0.
  - `rm -rf dist .nx/cache && npx nx build api` → exit 0.
  - `docker rm -f ats-sp1-pg-probe` xong.
  - Commit `4116aab feat(db): add interview scorecards and application notes` (schema, enum, migration, log xanh).
- Interfaces: tên model/field/quan hệ ngược khớp plan; quan hệ ngược thêm ở cuối danh sách của `User`, `Organization`, `Application`, `InterviewSchedule`; enum + model mới ở cuối file.
- Chưa xác minh: không có kiểm drift Prisma ↔ SQL viết tay (`prisma migrate diff` không in gì trên máy này); probe chỉ phủ ràng buộc, không phủ kiểu/default từng cột.
- Lưu ý cho Task 5: plan có thể lặp giả định 23503; kiểm bằng chạy thật.
- `git ls-remote --heads origin feat/gd2-sp1-evaluation` → rỗng.
- Kết luận: approved.
