# Sửa lỗi sau test audit

Ngày: 2026-09-29. Nhánh: `feat/org-admin-enforcement`; base `8ec4751`.

## Phạm vi được yêu cầu

Chạy Docker Compose, kiểm chứng và sửa 11 nhóm lỗi F1–F11 từ
[audit](../test-coverage-audit/README.md). Giữ assertion và bằng chứng RED;
chưa có yêu cầu commit/push.

## Thứ tự

1. Chạy lại BE/FE trước sửa; dựng Compose test riêng, chạy browser RED.
2. Sửa phiên/quyền/proxy và form FE (F1–F5); sửa race socket, retry CV,
   hồ sơ cancelled, metadata/log AI và deadline health (F6–F11).
3. Chạy toàn bộ BE/FE, kiểm tra kiểu/lint/build, chạy browser GREEN.
4. Kiểm tra health khi dependency tạm dừng và socket trên API/DB thật;
   khôi phục dependency, xác nhận cleanup dữ liệu thử, ghi kết quả.

## Quyết định local

- `docker-compose.test.yml`: database, Redis và uploads riêng; API cổng 55000.
  Giữ nguyên stack `ats-platform` hiện có.
- FE E2E do Playwright mở trên cổng 3000 với URL API local được ghi đè rõ ràng.
- Deadline mỗi dependency health là 3 giây; đây là lựa chọn cho kiểm tra
  readiness local, không phải tuyên bố SLA sản phẩm.
- Không gửi mail thật hoặc gọi Gemini trả phí trong các hành trình E2E này.
- Các rủi ro concurrency/queue trong audit chưa có bằng chứng lỗi runtime
  không tự động trở thành tuyên bố đã sửa.

## Tiêu chí chấp nhận

Các assertion RED ban đầu chuyển GREEN, suite cũ vẫn đạt; ba hành trình FE
thao tác browser và PostgreSQL thật đạt; health trả 503 hữu hạn khi dependency
không trả lời; socket chờ xác thực nhưng vẫn chặn người khác tổ chức.

## Hoàn tất

Cả bốn bước đã thực hiện: 391/391 BE, 19/19 FE, 5/5 browser và 5 probes runtime
đạt. Bổ sung hai hành trình refresh với phiên API thật. Xem [README](README.md)
cho kết quả và giới hạn. Không có commit/push trong phạm vi phiên này.
