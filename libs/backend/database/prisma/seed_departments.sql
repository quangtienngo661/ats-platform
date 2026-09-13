-- Seed data cho bảng departments (PostgreSQL)
-- Requires the seed organization from migration 20260913042256_add_organization_tenant
-- to exist first: departments.organization_id is NOT NULL with an FK.
-- Đảm bảo bạn đang chạy script này trên DB PostgreSQL >= 13 (để hỗ trợ sẵn hàm gen_random_uuid())

INSERT INTO departments (department_id, organization_id, name, description, color, created_at) VALUES
(gen_random_uuid(), '00000000-0000-4000-8000-000000000001', 'Nhân sự', 'Quản lý tuyển dụng, đào tạo và phúc lợi nhân viên', '#FF2D55', CURRENT_TIMESTAMP),
(gen_random_uuid(), '00000000-0000-4000-8000-000000000001', 'Công nghệ thông tin', 'Phát triển phần mềm, quản trị hạ tầng mạng và bảo mật', '#007AFF', CURRENT_TIMESTAMP),
(gen_random_uuid(), '00000000-0000-4000-8000-000000000001', 'Marketing', 'Lên chiến dịch truyền thông, quản lý thương hiệu và quảng cáo', '#FF9500', CURRENT_TIMESTAMP),
(gen_random_uuid(), '00000000-0000-4000-8000-000000000001', 'Kinh doanh', 'Phát triển thị trường, tìm kiếm và chăm sóc khách hàng doanh nghiệp', '#34C759', CURRENT_TIMESTAMP),
(gen_random_uuid(), '00000000-0000-4000-8000-000000000001', 'Tài chính', 'Quản lý dòng tiền, báo cáo tài chính và hoạch định ngân sách', '#5856D6', CURRENT_TIMESTAMP),
(gen_random_uuid(), '00000000-0000-4000-8000-000000000001', 'Kế toán', 'Xử lý hóa đơn, lương thưởng, thuế và sổ sách', '#AF52DE', CURRENT_TIMESTAMP),
(gen_random_uuid(), '00000000-0000-4000-8000-000000000001', 'Chăm sóc khách hàng', 'Hỗ trợ, giải đáp thắc mắc và tiếp nhận phản hồi từ khách hàng', '#5AC8FA', CURRENT_TIMESTAMP),
(gen_random_uuid(), '00000000-0000-4000-8000-000000000001', 'Nghiên cứu & Phát triển', 'Nghiên cứu công nghệ mới, phát triển sản phẩm đột phá (R&D)', '#FF9500', CURRENT_TIMESTAMP),
(gen_random_uuid(), '00000000-0000-4000-8000-000000000001', 'Phát triển sản phẩm', 'Quản lý vòng đời sản phẩm, định hướng tính năng (Product Management)', '#0071E3', CURRENT_TIMESTAMP),
(gen_random_uuid(), '00000000-0000-4000-8000-000000000001', 'Thiết kế', 'Thiết kế đồ họa, UI/UX và các ấn phẩm truyền thông', '#FF2D55', CURRENT_TIMESTAMP),
(gen_random_uuid(), '00000000-0000-4000-8000-000000000001', 'Hành chính', 'Quản lý văn phòng, trang thiết bị và các thủ tục pháp lý nội bộ', '#8E8E93', CURRENT_TIMESTAMP),
(gen_random_uuid(), '00000000-0000-4000-8000-000000000001', 'Pháp chế', 'Tư vấn luật doanh nghiệp, rà soát hợp đồng và tuân thủ pháp lý', '#FF3B30', CURRENT_TIMESTAMP),
(gen_random_uuid(), '00000000-0000-4000-8000-000000000001', 'Thu mua', 'Tìm kiếm nhà cung cấp, đàm phán giá cả và mua sắm trang thiết bị', '#FFCC00', CURRENT_TIMESTAMP),
(gen_random_uuid(), '00000000-0000-4000-8000-000000000001', 'Logistics', 'Quản lý chuỗi cung ứng, kho bãi và vận chuyển', '#4CD964', CURRENT_TIMESTAMP),
(gen_random_uuid(), '00000000-0000-4000-8000-000000000001', 'Quan hệ công chúng', 'Xây dựng quan hệ với báo chí, đối tác và xử lý khủng hoảng (PR)', '#5856D6', CURRENT_TIMESTAMP),
(gen_random_uuid(), '00000000-0000-4000-8000-000000000001', 'Quản trị chất lượng', 'Kiểm tra và đảm bảo chất lượng sản phẩm dịch vụ (QA/QC)', '#34C759', CURRENT_TIMESTAMP),
(gen_random_uuid(), '00000000-0000-4000-8000-000000000001', 'Vận hành', 'Đảm bảo các quy trình kinh doanh hoạt động trơn tru (Operations)', '#007AFF', CURRENT_TIMESTAMP),
(gen_random_uuid(), '00000000-0000-4000-8000-000000000001', 'Kỹ thuật', 'Bảo trì, sửa chữa máy móc thiết bị và cơ sở hạ tầng', '#8E8E93', CURRENT_TIMESTAMP),
(gen_random_uuid(), '00000000-0000-4000-8000-000000000001', 'Quản lý dự án', 'Lập kế hoạch, theo dõi tiến độ và phân bổ nguồn lực (PMO)', '#AF52DE', CURRENT_TIMESTAMP),
(gen_random_uuid(), '00000000-0000-4000-8000-000000000001', 'Đào tạo & Phát triển', 'Tổ chức các khóa huấn luyện, nâng cao kỹ năng cho nhân viên', '#FFCC00', CURRENT_TIMESTAMP);
