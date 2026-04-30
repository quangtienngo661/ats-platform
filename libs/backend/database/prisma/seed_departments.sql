-- Seed data cho bảng departments (PostgreSQL)
-- Đảm bảo bạn đang chạy script này trên DB PostgreSQL >= 13 (để hỗ trợ sẵn hàm gen_random_uuid())

INSERT INTO departments (department_id, name, description, color, created_at) VALUES
(gen_random_uuid(), 'Nhân sự', 'Quản lý tuyển dụng, đào tạo và phúc lợi nhân viên', '#FF2D55', CURRENT_TIMESTAMP),
(gen_random_uuid(), 'Công nghệ thông tin', 'Phát triển phần mềm, quản trị hạ tầng mạng và bảo mật', '#007AFF', CURRENT_TIMESTAMP),
(gen_random_uuid(), 'Marketing', 'Lên chiến dịch truyền thông, quản lý thương hiệu và quảng cáo', '#FF9500', CURRENT_TIMESTAMP),
(gen_random_uuid(), 'Kinh doanh', 'Phát triển thị trường, tìm kiếm và chăm sóc khách hàng doanh nghiệp', '#34C759', CURRENT_TIMESTAMP),
(gen_random_uuid(), 'Tài chính', 'Quản lý dòng tiền, báo cáo tài chính và hoạch định ngân sách', '#5856D6', CURRENT_TIMESTAMP),
(gen_random_uuid(), 'Kế toán', 'Xử lý hóa đơn, lương thưởng, thuế và sổ sách', '#AF52DE', CURRENT_TIMESTAMP),
(gen_random_uuid(), 'Chăm sóc khách hàng', 'Hỗ trợ, giải đáp thắc mắc và tiếp nhận phản hồi từ khách hàng', '#5AC8FA', CURRENT_TIMESTAMP),
(gen_random_uuid(), 'Nghiên cứu & Phát triển', 'Nghiên cứu công nghệ mới, phát triển sản phẩm đột phá (R&D)', '#FF9500', CURRENT_TIMESTAMP),
(gen_random_uuid(), 'Phát triển sản phẩm', 'Quản lý vòng đời sản phẩm, định hướng tính năng (Product Management)', '#0071E3', CURRENT_TIMESTAMP),
(gen_random_uuid(), 'Thiết kế', 'Thiết kế đồ họa, UI/UX và các ấn phẩm truyền thông', '#FF2D55', CURRENT_TIMESTAMP),
(gen_random_uuid(), 'Hành chính', 'Quản lý văn phòng, trang thiết bị và các thủ tục pháp lý nội bộ', '#8E8E93', CURRENT_TIMESTAMP),
(gen_random_uuid(), 'Pháp chế', 'Tư vấn luật doanh nghiệp, rà soát hợp đồng và tuân thủ pháp lý', '#FF3B30', CURRENT_TIMESTAMP),
(gen_random_uuid(), 'Thu mua', 'Tìm kiếm nhà cung cấp, đàm phán giá cả và mua sắm trang thiết bị', '#FFCC00', CURRENT_TIMESTAMP),
(gen_random_uuid(), 'Logistics', 'Quản lý chuỗi cung ứng, kho bãi và vận chuyển', '#4CD964', CURRENT_TIMESTAMP),
(gen_random_uuid(), 'Quan hệ công chúng', 'Xây dựng quan hệ với báo chí, đối tác và xử lý khủng hoảng (PR)', '#5856D6', CURRENT_TIMESTAMP),
(gen_random_uuid(), 'Quản trị chất lượng', 'Kiểm tra và đảm bảo chất lượng sản phẩm dịch vụ (QA/QC)', '#34C759', CURRENT_TIMESTAMP),
(gen_random_uuid(), 'Vận hành', 'Đảm bảo các quy trình kinh doanh hoạt động trơn tru (Operations)', '#007AFF', CURRENT_TIMESTAMP),
(gen_random_uuid(), 'Kỹ thuật', 'Bảo trì, sửa chữa máy móc thiết bị và cơ sở hạ tầng', '#8E8E93', CURRENT_TIMESTAMP),
(gen_random_uuid(), 'Quản lý dự án', 'Lập kế hoạch, theo dõi tiến độ và phân bổ nguồn lực (PMO)', '#AF52DE', CURRENT_TIMESTAMP),
(gen_random_uuid(), 'Đào tạo & Phát triển', 'Tổ chức các khóa huấn luyện, nâng cao kỹ năng cho nhân viên', '#FFCC00', CURRENT_TIMESTAMP);
