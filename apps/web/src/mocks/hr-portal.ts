/**
 * Mock data cho HR Portal — chuẩn interface BE response.
 * Khi nối API thật, chỉ cần xóa import file này và thay bằng Server Action.
 */
import { IJobPostingDto } from '@/types/interfaces/job-posting.interface';
import { IApplicationDto } from '@/types/interfaces/application.interface';
import { IRecruiterDto } from '@/types/interfaces/recruiter.interface';

// ─── Recruiter Profile ───────────────────────────────────────────────────────

export const mockRecruiterProfile: IRecruiterDto = {
    recruiterId: 'rec-001',
    userId: 'user-hr-001',
    position: 'Senior HR Manager',
    department: {
        departmentId: 'dept-hr',
        name: 'Nhân sự',
        description: 'Tuyển dụng và quản lý nhân sự',
        color: '#0071E3',
    },
    user: {
        fullName: 'Nguyễn Thị Lan Anh',
        email: 'lananh@company.com',
        phoneNumber: '0901234567',
        role: 'recruiter' as any,
        status: 'active' as any,
    },
};

// ─── Job Postings ────────────────────────────────────────────────────────────

export const mockJobPostings: IJobPostingDto[] = [
    {
        jobId: 'job-001',
        title: 'Senior Frontend Engineer',
        departmentId: 'dept-eng',
        locationType: 'hybrid',
        salaryMin: 2000,
        salaryMax: 4000,
        description: 'Tìm kiếm Frontend Engineer có kinh nghiệm với React, TypeScript và các công nghệ hiện đại.',
        status: 'active',
        publishedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
        department: { departmentId: 'dept-eng', name: 'Engineering', color: '#0071E3' },
        category: { categoryId: 'cat-it', name: 'Công nghệ thông tin' },
        recruiter: {
            recruiterId: 'rec-001',
            position: 'Senior HR Manager',
            user: { fullName: 'Nguyễn Thị Lan Anh', email: 'lananh@company.com' },
        },
        jobPostingSkills: [
            { id: 'jps-1', isRequired: true, skill: { skillId: 's1', name: 'React' } },
            { id: 'jps-2', isRequired: true, skill: { skillId: 's2', name: 'TypeScript' } },
            { id: 'jps-3', isRequired: false, skill: { skillId: 's3', name: 'Next.js' } },
        ],
        applications: [
            { candidate: { userId: 'u-cand-1' }, cvId: 'cv-1', status: 'screening' },
            { candidate: { userId: 'u-cand-2' }, cvId: 'cv-2', status: 'interview' },
            { candidate: { userId: 'u-cand-3' }, cvId: 'cv-3', status: 'applied' },
        ],
    },
    {
        jobId: 'job-002',
        title: 'Product Manager',
        departmentId: 'dept-product',
        locationType: 'remote',
        salaryMin: 3000,
        salaryMax: 5000,
        description: 'Tham gia đội ngũ Product với vai trò quản lý sản phẩm B2B SaaS.',
        status: 'active',
        publishedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
        createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
        department: { departmentId: 'dept-product', name: 'Product', color: '#6366F1' },
        category: { categoryId: 'cat-pm', name: 'Quản lý sản phẩm' },
        recruiter: {
            recruiterId: 'rec-001',
            position: 'Senior HR Manager',
            user: { fullName: 'Nguyễn Thị Lan Anh', email: 'lananh@company.com' },
        },
        jobPostingSkills: [
            { id: 'jps-4', isRequired: true, skill: { skillId: 's4', name: 'Agile' } },
            { id: 'jps-5', isRequired: true, skill: { skillId: 's5', name: 'B2B SaaS' } },
            { id: 'jps-6', isRequired: false, skill: { skillId: 's6', name: 'OKR' } },
        ],
        applications: [
            { candidate: { userId: 'u-cand-4' }, cvId: 'cv-4', status: 'applied' },
            { candidate: { userId: 'u-cand-5' }, cvId: 'cv-5', status: 'applied' },
        ],
    },
    {
        jobId: 'job-003',
        title: 'UX/UI Designer',
        departmentId: 'dept-design',
        locationType: 'onsite',
        salaryMin: 1500,
        salaryMax: 3000,
        description: 'Thiết kế giao diện người dùng chất lượng cao cho các sản phẩm số.',
        status: 'active',
        publishedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
        createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
        department: { departmentId: 'dept-design', name: 'Design', color: '#0EA5E9' },
        category: { categoryId: 'cat-design', name: 'Thiết kế' },
        recruiter: {
            recruiterId: 'rec-002',
            position: 'HR Specialist',
            user: { fullName: 'Trần Văn Minh', email: 'minh.tran@company.com' },
        },
        jobPostingSkills: [
            { id: 'jps-7', isRequired: true, skill: { skillId: 's7', name: 'Figma' } },
            { id: 'jps-8', isRequired: true, skill: { skillId: 's8', name: 'User Research' } },
            { id: 'jps-9', isRequired: false, skill: { skillId: 's9', name: 'Motion Design' } },
        ],
        applications: [
            { candidate: { userId: 'u-cand-6' }, cvId: 'cv-6', status: 'offer' },
        ],
    },
    {
        jobId: 'job-004',
        title: 'Data Scientist',
        departmentId: 'dept-data',
        locationType: 'hybrid',
        salaryMin: 2500,
        salaryMax: 4500,
        description: 'Phân tích dữ liệu và xây dựng model ML.',
        status: 'active',
        publishedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
        createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
        department: { departmentId: 'dept-data', name: 'Data', color: '#16A34A' },
        category: { categoryId: 'cat-ds', name: 'Khoa học dữ liệu' },
        recruiter: {
            recruiterId: 'rec-001',
            position: 'Senior HR Manager',
            user: { fullName: 'Nguyễn Thị Lan Anh', email: 'lananh@company.com' },
        },
        jobPostingSkills: [
            { id: 'jps-10', isRequired: true, skill: { skillId: 's10', name: 'Python' } },
            { id: 'jps-11', isRequired: true, skill: { skillId: 's11', name: 'Machine Learning' } },
            { id: 'jps-12', isRequired: false, skill: { skillId: 's12', name: 'SQL' } },
        ],
        applications: [],
    },
    {
        jobId: 'job-005',
        title: 'Marketing Manager',
        departmentId: 'dept-mkt',
        locationType: 'onsite',
        salaryMin: 1800,
        salaryMax: 3000,
        description: 'Bản nháp — đang soạn nội dung.',
        status: 'draft',
        publishedAt: null,
        createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
        department: { departmentId: 'dept-mkt', name: 'Marketing', color: '#9333EA' },
        category: null,
        recruiter: {
            recruiterId: 'rec-001',
            position: 'Senior HR Manager',
            user: { fullName: 'Nguyễn Thị Lan Anh', email: 'lananh@company.com' },
        },
        jobPostingSkills: [
            { id: 'jps-13', isRequired: true, skill: { skillId: 's13', name: 'SEO' } },
            { id: 'jps-14', isRequired: false, skill: { skillId: 's14', name: 'Content Marketing' } },
        ],
        applications: [],
    },
    {
        jobId: 'job-006',
        title: 'iOS Engineer',
        departmentId: 'dept-eng',
        locationType: 'onsite',
        salaryMin: 2000,
        salaryMax: 3500,
        description: 'Đã đóng tuyển.',
        status: 'closed',
        publishedAt: new Date(Date.now() - 21 * 86400000).toISOString(),
        createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
        department: { departmentId: 'dept-eng', name: 'Engineering', color: '#0071E3' },
        category: { categoryId: 'cat-it', name: 'Công nghệ thông tin' },
        recruiter: {
            recruiterId: 'rec-002',
            position: 'HR Specialist',
            user: { fullName: 'Trần Văn Minh', email: 'minh.tran@company.com' },
        },
        jobPostingSkills: [
            { id: 'jps-15', isRequired: true, skill: { skillId: 's15', name: 'Swift' } },
            { id: 'jps-16', isRequired: false, skill: { skillId: 's16', name: 'SwiftUI' } },
        ],
        applications: [
            { candidate: { userId: 'u-cand-7' }, cvId: 'cv-7', status: 'hired' },
            { candidate: { userId: 'u-cand-8' }, cvId: 'cv-8', status: 'rejected' },
        ],
    },
];

// ─── Applications (cho danh sách ứng viên) ───────────────────────────────────

export const mockApplications: IApplicationDto[] = [
    {
        applicationId: 'app-001',
        jobId: 'job-001',
        cvId: 'cv-1',
        candidateId: 'cand-001',
        status: 'applied',
        appliedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
        jobPosting: {
            title: 'Senior Frontend Engineer',
            departmentId: 'dept-eng',
            department: { name: 'Engineering' },
            locationType: 'hybrid',
        },
        candidate: { fullName: 'Nguyễn Văn An', email: 'nguyen.an@email.com' },
        screening: { overallScore: 92, aiRecommendation: 'hire', status: 'completed' },
    },
    {
        applicationId: 'app-002',
        jobId: 'job-001',
        cvId: 'cv-2',
        candidateId: 'cand-002',
        status: 'screening',
        appliedAt: new Date(Date.now() - 5 * 3600000).toISOString(),
        jobPosting: {
            title: 'Senior Frontend Engineer',
            departmentId: 'dept-eng',
            department: { name: 'Engineering' },
            locationType: 'hybrid',
        },
        candidate: { fullName: 'Trần Thị Bình', email: 'tran.binh@email.com' },
        screening: { overallScore: 88, aiRecommendation: 'interview', status: 'completed' },
    },
    {
        applicationId: 'app-003',
        jobId: 'job-001',
        cvId: 'cv-3',
        candidateId: 'cand-003',
        status: 'interview',
        appliedAt: new Date(Date.now() - 24 * 3600000).toISOString(),
        jobPosting: {
            title: 'Senior Frontend Engineer',
            departmentId: 'dept-eng',
            department: { name: 'Engineering' },
            locationType: 'hybrid',
        },
        candidate: { fullName: 'Lê Minh Cường', email: 'le.cuong@email.com' },
        screening: { overallScore: 95, aiRecommendation: 'hire', status: 'completed' },
    },
    {
        applicationId: 'app-004',
        jobId: 'job-002',
        cvId: 'cv-4',
        candidateId: 'cand-004',
        status: 'offer',
        appliedAt: new Date(Date.now() - 48 * 3600000).toISOString(),
        jobPosting: {
            title: 'Product Manager',
            departmentId: 'dept-product',
            department: { name: 'Product' },
            locationType: 'remote',
        },
        candidate: { fullName: 'Phạm Thu Dung', email: 'pham.dung@email.com' },
        screening: { overallScore: 85, aiRecommendation: 'interview', status: 'completed' },
    },
    {
        applicationId: 'app-005',
        jobId: 'job-003',
        cvId: 'cv-5',
        candidateId: 'cand-005',
        status: 'applied',
        appliedAt: new Date(Date.now() - 3 * 3600000).toISOString(),
        jobPosting: {
            title: 'UX/UI Designer',
            departmentId: 'dept-design',
            department: { name: 'Design' },
            locationType: 'onsite',
        },
        candidate: { fullName: 'Hoàng Văn Em', email: 'hoang.em@email.com' },
        screening: { overallScore: 90, aiRecommendation: 'hire', status: 'completed' },
    },
    {
        applicationId: 'app-006',
        jobId: 'job-002',
        cvId: 'cv-6',
        candidateId: 'cand-006',
        status: 'screening',
        appliedAt: new Date(Date.now() - 24 * 3600000).toISOString(),
        jobPosting: {
            title: 'Product Manager',
            departmentId: 'dept-product',
            department: { name: 'Product' },
            locationType: 'remote',
        },
        candidate: { fullName: 'Vũ Thị Hương', email: 'vu.huong@email.com' },
        screening: { overallScore: 87, aiRecommendation: 'interview', status: 'completed' },
    },
];
