-- Script: Seed Job Categories
-- Bảng: job_categories
-- Cột: category_id, name, parent_category_id

-- 1. Xóa dữ liệu cũ (Tùy chọn - cẩn thận nếu đã có data hoặc khóa ngoại đang tham chiếu)
-- DELETE FROM job_categories;

-- 2. Chèn danh mục GỐC (Parent Categories)
INSERT INTO job_categories (category_id, name, parent_category_id) VALUES
('52a125b2-a9b0-4f35-9794-5cb391e0ccf1', 'Công nghệ thông tin', NULL),
('a219df0e-5614-49c0-9993-9c8789ccb242', 'Kinh doanh & Bán hàng', NULL),
('b8d44c8f-bbbc-4b3f-8461-828bafe0b66b', 'Marketing & Truyền thông', NULL),
('f4cc56b3-e2e1-45a0-8a4d-045371c66f91', 'Nhân sự', NULL),
('d815ea78-fb86-4f40-8b1e-450f3b9c0268', 'Tài chính & Kế toán', NULL),
('1845bbef-2f47-4977-8fa2-6f29631fc7b1', 'Thiết kế & Sáng tạo', NULL);

-- 3. Chèn danh mục CON (Child Categories)
INSERT INTO job_categories (category_id, name, parent_category_id) VALUES
-- Con của "Công nghệ thông tin" (52a125b2-a9b0-4f35-9794-5cb391e0ccf1)
('67b84803-0c45-4290-84a1-0268579db005', 'Frontend Development', '52a125b2-a9b0-4f35-9794-5cb391e0ccf1'),
('9b232675-8e81-43eb-8e54-5d51ff972b22', 'Backend Development', '52a125b2-a9b0-4f35-9794-5cb391e0ccf1'),
('791a2de9-d123-4f01-92be-6447c211601f', 'DevOps / SRE', '52a125b2-a9b0-4f35-9794-5cb391e0ccf1'),
('b721de05-4f39-446a-8438-e6b8c4c3b53a', 'Data Science / AI', '52a125b2-a9b0-4f35-9794-5cb391e0ccf1'),

-- Con của "Kinh doanh & Bán hàng" (a219df0e-5614-49c0-9993-9c8789ccb242)
('e82e2c2f-e8b2-4d2b-aa58-5231c518ebfc', 'Account Executive', 'a219df0e-5614-49c0-9993-9c8789ccb242'),
('3c6b2ba9-a72a-4648-9f1d-2f0ef1f87ab2', 'Business Development', 'a219df0e-5614-49c0-9993-9c8789ccb242'),
('88514d87-3eab-47f2-a279-ef2bb6f9713c', 'Sales Manager', 'a219df0e-5614-49c0-9993-9c8789ccb242'),

-- Con của "Marketing & Truyền thông" (b8d44c8f-bbbc-4b3f-8461-828bafe0b66b)
('e2c92e92-38cf-481f-beeb-9d19854d9c79', 'Digital Marketing', 'b8d44c8f-bbbc-4b3f-8461-828bafe0b66b'),
('44fc7f79-6a3f-4226-8318-63bbcf8c9509', 'Content & Copywriting', 'b8d44c8f-bbbc-4b3f-8461-828bafe0b66b'),
('cd542151-df54-47ad-9549-34bafeb0ceeb', 'Brand Management', 'b8d44c8f-bbbc-4b3f-8461-828bafe0b66b'),

-- Con của "Nhân sự" (f4cc56b3-e2e1-45a0-8a4d-045371c66f91)
('c13ab371-d8ad-48b0-81f1-7d1a586a117b', 'Talent Acquisition', 'f4cc56b3-e2e1-45a0-8a4d-045371c66f91'),
('ae0c27fc-cfd9-4d6d-86eb-cffb114d56cd', 'HR Operations', 'f4cc56b3-e2e1-45a0-8a4d-045371c66f91'),

-- Con của "Tài chính & Kế toán" (d815ea78-fb86-4f40-8b1e-450f3b9c0268)
('5a8e2cc9-9d5a-4e2d-a2f0-1a134c4b57cf', 'Kế toán tổng hợp', 'd815ea78-fb86-4f40-8b1e-450f3b9c0268'),
('8e5a31a9-b3a5-4eb1-b3b4-1c8cc9e5f524', 'Phân tích tài chính', 'd815ea78-fb86-4f40-8b1e-450f3b9c0268'),

-- Con của "Thiết kế & Sáng tạo" (1845bbef-2f47-4977-8fa2-6f29631fc7b1)
('6c5f73d4-28b9-43c3-8f69-a864d4b2d6a5', 'UI/UX Design', '1845bbef-2f47-4977-8fa2-6f29631fc7b1'),
('f8f32c12-32b4-4eab-937b-944a9198642a', 'Graphic Design', '1845bbef-2f47-4977-8fa2-6f29631fc7b1');
