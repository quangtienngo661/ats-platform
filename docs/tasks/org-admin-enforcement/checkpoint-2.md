# Checkpoint 2 — Platform-admin create regression (GĐ1 Tuần 2)

**Date:** 2026-09-18. Raised once the API enforcement was code-complete: criterion 7 makes a platform
admin name the organization for the two organization-scoped rows that have no parent (department,
AI config), and the web forms sent none — so both creates returned 400 from the UI.

## Q3 — how to handle the regression

Put as: "Platform-admin tạo phòng ban / cấu hình AI từ web sẽ nhận 400 vì form chưa gửi
organizationId. Xử lý thế nào?"

| Option | Gets | Costs, as stated |
|---|---|---|
| Thêm ô chọn tổ chức vào 2 form (khuyến nghị) | Matches the spec, no regression, and needed anyway to demo two organizations | Pulls a piece of Tuần 3's UI forward; has to be verified by eye in a browser |
| Để nguyên, sửa ở Tuần 3 | Tuần 2 stays API-only | After merge, the admin gets 400 on the web when creating a department or AI config, until Tuần 3 |
| Fallback tạm ở API | The UI keeps working with no web change | Departs from criterion 7's "must name it"; useless the moment a second organization exists |

**Answered:** "Thêm ô chọn tổ chức vào 2 form (khuyến nghị)". Built as `decision.md` D10.

**The cost it named, paid 2026-09-19:** both forms were looked at in a browser as the platform admin —
the select blocks a submit with no organization, and the department and AI config land in the chosen one
(`operation.md` §5).
