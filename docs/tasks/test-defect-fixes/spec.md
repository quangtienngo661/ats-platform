# Tiêu chí sửa lỗi

Phạm vi: F1–F11 trong [audit](../test-coverage-audit/README.md), được user yêu cầu sửa.

| Nhóm | Giá trị/hành vi phải đúng |
| --- | --- |
| Logout | Request có refresh cookie; sau logout token đã lưu không refresh được: 401 |
| Proxy quyền | Candidate bị redirect khỏi AI configuration cả trước/sau refresh |
| Proxy cookie | Request hiện tại có access/refresh mới và giữ cookie không liên quan |
| Landing | Candidate job-postings, recruiter dashboard, admin department-management |
| Form | Hủy/X không gọi create và không có record trong database |
| Socket | Join tới sớm chờ auth; cùng org nhận event, khác org bị chặn |
| CV retry | Còn retry: processing và không failure notification; hết retry: failed đúng một lần |
| Cancelled | Screening bị từ chối; không tạo record/queue job |
| Gemini | Thiếu metadata vẫn trả JSON; malformed JSON chỉ có một failed log |
| Health | DB/Redis không trả lời: 503 sau deadline 3s; dependency còn tốt vẫn up |

Các test audit được giữ nguyên assertion. Các biên mới bổ sung được mô tả trong README.
Không mở rộng thành triển khai web org_admin hoặc thiết kế khóa chống concurrency.
