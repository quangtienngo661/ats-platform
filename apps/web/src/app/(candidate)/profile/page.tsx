import ProfileClient from '@/components/profile/ProfileClient';
import { getMyCandidateProfileAction } from '@/servers/candidates/candidates.action';
import { ICandidateDto } from '@/types/interfaces/candidate.interface';

// ── Mock data (fallback khi API trả null) ─────────────────────────────────────
const MOCK_PROFILE: ICandidateDto = {
    candidateId: 'cand-001',
    userId: 'user-001',
    user: {
        fullName: 'Nguyễn Văn A',
        email: 'nguyenvana@email.com',
        phoneNumber: '0901234567',
        status: 'active' as any,
        createdAt: '2026-01-15T08:00:00Z',
    },
    currentTitle: 'Senior Frontend Developer',
    yearsOfExperience: 4,
    profileData: {
        bio: 'Kỹ sư phần mềm với 4 năm kinh nghiệm phát triển web, chuyên về React và TypeScript. Đam mê xây dựng sản phẩm có trải nghiệm người dùng xuất sắc.',
        location: 'TP. Hồ Chí Minh',
        linkedin: 'https://linkedin.com/in/nguyenvana',
        github: 'https://github.com/nguyenvana',
        website: 'https://nguyenvana.dev',
        // ── AI-parsed fields (synced from confirmed CV) ──
        skills: {
            technical: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker', 'NestJS'],
            soft: ['Teamwork', 'Problem Solving', 'Communication'],
            languages: ['Vietnamese', 'English'],
        },
        experience: [
            {
                company: 'Shopee',
                position: 'Senior Frontend Developer',
                start_date: '03/2025',
                end_date: 'Present',
                description: 'Phát triển và duy trì các tính năng giao diện người dùng cho nền tảng thương mại điện tử. Tối ưu hóa hiệu suất rendering với React.',
            },
            {
                company: 'Tiki',
                position: 'Fullstack Developer',
                start_date: '07/2023',
                end_date: '02/2025',
                description: 'Xây dựng API RESTful với NestJS và giao diện React. Tham gia thiết kế kiến trúc microservices cho hệ thống quản lý đơn hàng.',
            },
            {
                company: 'FPT Software',
                position: 'Frontend Developer',
                start_date: '06/2021',
                end_date: '06/2023',
                description: 'Phát triển các trang web doanh nghiệp sử dụng React và TypeScript. Làm việc trong môi trường Agile/Scrum.',
            },
        ],
        projects: [
            {
                name: 'ATS Platform',
                role: 'Lead Developer',
                technologies: ['Next.js', 'NestJS', 'Prisma', 'PostgreSQL'],
                description: 'Xây dựng hệ thống tuyển dụng thông minh với tích hợp AI để phân tích CV và sàng lọc ứng viên tự động.',
                start_date: '01/2026',
                end_date: 'Present',
            },
            {
                name: 'E-Commerce Dashboard',
                role: 'Frontend Developer',
                technologies: ['React', 'Redux', 'D3.js', 'Tailwind CSS'],
                description: 'Dashboard phân tích dữ liệu bán hàng theo thời gian thực với biểu đồ tương tác và báo cáo tùy chỉnh.',
                start_date: '06/2022',
                end_date: '12/2022',
            },
        ],
        education: [
            {
                institution: 'Đại học Bách Khoa TP.HCM',
                degree: 'Bachelor',
                major: 'Kỹ thuật Máy tính',
            },
        ],
        certificates: ['AWS Certified Developer – Associate', 'Google Professional Cloud Developer'],
    },
    cvCount: 3,
    applicationCount: 6,
};

export default async function ProfilePage() {
    const profile = await getMyCandidateProfileAction();

    return <ProfileClient profile={profile ?? MOCK_PROFILE} />;
}
