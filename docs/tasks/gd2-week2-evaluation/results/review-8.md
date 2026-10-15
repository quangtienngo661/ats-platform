# Review — Task 8 (rào chống rò rỉ cho ứng viên)

- Một pha (plan: test phải xanh ngay). Codex gọi bằng lệnh đơn, guard cho qua.
- `no-candidate-access.spec.ts`: đọc `ROLES_KEY` như `RolesGuard` (handler trước, class sau), duyệt handler có `PATH_METADATA`, assert số handler 3 (scorecard) và 4 (ghi chú) để vòng lặp không thể rỗng, cộng `compareApplications`; mỗi route phải có roles = đúng `[recruiter, admin]` (thiếu metadata = mọi vai qua, nên assert có). Đối chứng: route `apply` có `candidate`.
- `candidate-payload-no-evaluation.spec.ts`: duyệt đệ quy `candidateScheduleSelect`, `applicationIncludeOptions`, `candidateHistorySelect`, không có khoá `scorecard`/`scorecards`/`notes`. Đối chứng: tìm được `interviewId`, khoá lồng `application.select.jobPosting.select.organization.select.name`, `screening.select.status`, `toStatus`.
- Phiên `-impl` chạy lại: 2 suite, 4/4 pass.
- Commit `7810a21 test(api): pin that candidates never receive evaluation data`.
- Chưa phủ (ghi thật): `applications/my`, `applications/:id`, `:id/history` ghép include **inline** trong service; test chỉ kiểm các object được export. Đường HTTP thật cho ứng viên được Task 12 (E2E) kiểm: `GET /applications/my` không có khoá `scorecard`/`notes`, route scorecard/ghi chú → 403.
- Không làm thử "teeth" bằng cách sửa tạm code sản phẩm (phiên `-impl` không viết code sản phẩm); thay bằng hai đối chứng trên.
- `git ls-remote --heads origin feat/gd2-sp1-evaluation` → rỗng.
- Kết luận: approved.
