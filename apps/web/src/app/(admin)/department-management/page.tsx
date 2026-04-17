import DepartmentClient from '@/components/department-management/DepartmentClient';
import { getDepartmentsAction } from '@/servers/departments/departments.action';
import { Department } from '@/types/interfaces/departments.interface';

// Mock data — replace with server fetch when API is ready
const MOCK_DEPARTMENTS: Record<string, Department> = {
    "1": {
        departmentId: "1",
        name: 'Nhân sự',
        color: '#0071E3',
        description: 'Tuyển dụng và quản lý nhân sự',
        membersCount: 4,
        jobPostingsCount: 3,
        members: [
            { recruiterId: 'r1', userId: 'u1', fullName: 'Nguyễn Thị Lan Anh', email: 'lananh@company.com', phoneNumber: '0901234567', position: 'HR Manager', role: 'recruiter', status: 'active' },
            { recruiterId: 'r2', userId: 'u2', fullName: 'Trần Văn Minh', email: 'minh.tran@company.com', phoneNumber: '0912345678', position: 'HR Specialist', role: 'recruiter', status: 'active' },
            { recruiterId: 'r3', userId: 'u3', fullName: 'Phạm Thị Hoa', email: 'hoa.pham@company.com', phoneNumber: null, position: 'Talent Acquisition', role: 'recruiter', status: 'active' },
            { recruiterId: 'r4', userId: 'u4', fullName: 'Lê Quang Huy', email: 'huy.le@company.com', phoneNumber: '0923456789', position: 'HR Executive', role: 'recruiter', status: 'inactive' },
        ],
    },
    "2": {
        departmentId: "2",
        name: 'IT',
        color: '#34C759',
        description: 'Phát triển và duy trì hệ thống',
        jobPostingsCount: 5,
        membersCount: 4,
        members: [
            { recruiterId: 'r5', userId: 'u5', fullName: 'Vũ Đình Nam', email: 'nam.vu@company.com', phoneNumber: '0934567890', position: 'Tech Lead', role: 'admin', status: 'active' },
            { recruiterId: 'r6', userId: 'u6', fullName: 'Đặng Thị Thu', email: 'thu.dang@company.com', phoneNumber: '0945678901', position: 'Senior Developer', role: 'recruiter', status: 'active' },
            { recruiterId: 'r7', userId: 'u7', fullName: 'Hoàng Văn Long', email: 'long.hoang@company.com', phoneNumber: '0956789012', position: 'Backend Developer', role: 'recruiter', status: 'active' },
            { recruiterId: 'r8', userId: 'u8', fullName: 'Bùi Thị Ngọc', email: 'ngoc.bui@company.com', phoneNumber: null, position: 'QA Engineer', role: 'recruiter', status: 'active' },
        ],
    },
    "3": {
        departmentId: "3",
        name: 'Marketing',
        color: '#FF9500',
        description: 'Tiếp thị và truyền thông',
        membersCount: 2,
        jobPostingsCount: 2,
        members: [
            { recruiterId: 'r9', userId: 'u9', fullName: 'Nguyễn Hữu Phúc', email: 'phuc.nguyen@company.com', phoneNumber: '0967890123', position: 'Marketing Manager', role: 'recruiter', status: 'active' },
            { recruiterId: 'r10', userId: 'u10', fullName: 'Lý Thị Mai', email: 'mai.ly@company.com', phoneNumber: '0978901234', position: 'Content Creator', role: 'recruiter', status: 'active' },
        ],
    },
    "4": {
        departmentId: "4",
        name: 'Kinh doanh',
        color: '#6366F1',
        description: 'Bán hàng và phát triển kinh doanh',
        membersCount: 3,
        jobPostingsCount: 4,
        members: [
            { recruiterId: 'r11', userId: 'u11', fullName: 'Trịnh Văn Thắng', email: 'thang.trinh@company.com', phoneNumber: '0989012345', position: 'Sales Director', role: 'admin', status: 'active' },
            { recruiterId: 'r12', userId: 'u12', fullName: 'Phan Thị Linh', email: 'linh.phan@company.com', phoneNumber: '0901234568', position: 'Account Executive', role: 'recruiter', status: 'active' },
            { recruiterId: 'r13', userId: 'u13', fullName: 'Cao Minh Đức', email: 'duc.cao@company.com', phoneNumber: null, position: 'Business Analyst', role: 'recruiter', status: 'inactive' },
        ],
    },
    "5": {
        departmentId: "5",
        name: 'Tài chính',
        color: '#AF52DE',
        description: 'Kế toán và quản lý tài chính',
        membersCount: 2,
        jobPostingsCount: 1,
        members: [
            { recruiterId: 'r14', userId: 'u14', fullName: 'Đinh Thị Thanh', email: 'thanh.dinh@company.com', phoneNumber: '0912345679', position: 'CFO', role: 'admin', status: 'active' },
            { recruiterId: 'r15', userId: 'u15', fullName: 'Ngô Văn Sơn', email: 'son.ngo@company.com', phoneNumber: '0923456780', position: 'Accountant', role: 'recruiter', status: 'active' },
        ],
    },
};

export default async function DepartmentManagementPage() {
    const departments = await getDepartmentsAction();

    // return <DepartmentClient departments={Object.values(MOCK_DEPARTMENTS)} />;
    return <DepartmentClient departments={departments} />;
}
