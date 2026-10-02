# Khảo sát đầu lần sửa

Ngày 2026-09-29, nhánh `feat/org-admin-enforcement`, base `8ec4751`.

- Docker engine đang chạy. Stack `ats-platform` có PostgreSQL, Redis, API;
  GET localhost:5000/api/health trả up.
- [Audit trước](../test-coverage-audit/README.md) có 11 nhóm lỗi với test RED.
  [BE chạy lại](results/be-red.json): 378 đạt/7 lỗi;
  [FE chạy lại](results/fe-red.json): 10 đạt/7 lỗi.
- Compose dev dùng container name cố định và dữ liệu sẵn có;
  [Compose test riêng](../../../docker-compose.test.yml) được chọn để bảo vệ dữ liệu đó.
- Browser RED với API/database thật xác nhận Hủy/X tạo record và logout không
  thu hồi token: [output](results/e2e-red.txt).
- Không có AGENTS.md riêng trong project đã khảo sát; harness rules và
  fix-defect/write-tests được áp dụng với yêu cầu sửa đã được user cho phép.
- Bản kê git cuối và những file thay đổi: [git-state](results/git-state.txt).
