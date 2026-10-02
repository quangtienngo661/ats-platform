# Kế hoạch kiểm tra test

1. Lưu output baseline và đo coverage trên toàn bộ source BE, tránh bỏ qua file không được import (survey.md).
2. Bổ sung case biên, toàn bộ ma trận chuyển trạng thái hồ sơ, mock AI và thứ tự xử lý Socket/retry (survey.md, ma trận).
3. Thêm runner FE hành vi và test biểu mẫu/proxy; dùng tên control người dùng nhìn thấy (survey.md).
4. Thêm E2E trình duyệt riêng cho một hành trình với API/database local thật; không đưa vào default test (survey.md).
5. Chạy các suite, lưu output và tổng hợp lỗi tái hiện, case còn thiếu, thứ tự sửa. Không suy diễn E2E thành công từ unit/component test.

Phạm vi: audit và bổ sung test; không sửa logic nghiệp vụ, không commit/push. Chỉ bổ sung tên truy cập cho các control cần được thao tác theo vai trò/tên.
