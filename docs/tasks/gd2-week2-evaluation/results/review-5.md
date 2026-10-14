# Review — Task 5 (R12: xoá lịch đã có scorecard)

- Pha 1: Codex thêm 3 test vào `interviews.service.spec.ts` (describe `removeSchedule`), không đổi test cũ.
  - Phiên `-impl` chạy lại: đúng 1 đỏ (`refuses to delete a schedule that has a scorecard`: promise resolve thay vì 409), 35 pass → đỏ đúng lý do; hai test còn lại ghim hành vi cũ.
  - Commit `0a6eb14 test(api): reproduce deleting a schedule that has a scorecard`.
- Pha 2: `removeSchedule` gọi `interviewScorecard.count({ where: { interviewId } })` sau `assertCanMutateSchedule`, trước `delete`; > 0 → `ConflictException('Buổi phỏng vấn đã có đánh giá, không thể xoá')`. Không đổi gì khác.
  - Phiên `-impl` chạy lại: jest `interviews` 7 suite, 68/68 pass; `nx lint api` 0 error (cảnh báo dòng 101 có sẵn từ trước).
  - Commit `32e0f61 fix(api): refuse to delete a schedule that has a scorecard`.
- Probe Task 2 (FK Restrict, SQLSTATE 23001 đã kiểm thật) không đổi; Task 5 không dựa vào mã 23503.
- Finding nhỏ: khoảng giữa `count` và `delete` không nằm trong transaction; nếu scorecard được tạo chen vào, FK RESTRICT ở DB vẫn chặn (lỗi 500 thay vì 409). Chấp nhận được, không chặn.
- `git ls-remote --heads origin feat/gd2-sp1-evaluation` → rỗng.
- Kết luận: approved.
