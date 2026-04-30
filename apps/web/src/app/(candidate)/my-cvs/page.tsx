import MyCvsClient from '@/components/my-cvs/MyCvsClient';
import { getMyCvsAction } from '@/servers/cvs/cvs.action';

// ── Mock data — matches exact CvParsedData interface (AI output shape) ────────
const MOCK_CVS = [
    {
        cvId: 'cv-001',
        candidateId: 'cand-001',
        fileName: 'NguyenVanA_CV_2026.pdf',
        filePath: '/uploads/cvs/cv-001.pdf',
        parsingStatus: 'completed' as const,
        uploadedAt: '2026-04-18T09:30:00Z',
        parsedData: {
            name: 'Nguyễn Văn A',
            email: 'nguyenvana@email.com',
            phoneNumber: '0901234567',
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
                    degree: 'Bachelor' as const,
                    major: 'Kỹ thuật Máy tính',
                },
            ],
            certificates: ['AWS Certified Developer – Associate', 'Google Professional Cloud Developer'],
            isConfirmed: true,
        },
    },
    {
        cvId: 'cv-002',
        candidateId: 'cand-001',
        fileName: 'NguyenVanA_DataScience_CV.pdf',
        filePath: '/uploads/cvs/cv-002.pdf',
        parsingStatus: 'completed' as const,
        uploadedAt: '2026-04-20T14:15:00Z',
        parsedData: {
            name: 'Nguyễn Văn A',
            email: 'nguyenvana@email.com',
            phoneNumber: '0901234567',
            skills: {
                technical: ['Python', 'TensorFlow', 'Pandas', 'SQL', 'Scikit-learn', 'Jupyter'],
                soft: ['Analytical Thinking', 'Research'],
                languages: ['Vietnamese', 'English'],
            },
            experience: [
                {
                    company: 'VinAI Research',
                    position: 'Junior ML Engineer',
                    start_date: '01/2025',
                    end_date: 'Present',
                    description: 'Nghiên cứu và phát triển các mô hình NLP cho tiếng Việt. Đóng góp vào các bài báo khoa học.',
                },
            ],
            projects: [
                {
                    name: 'CV Scoring Model',
                    role: 'ML Engineer',
                    technologies: ['Python', 'BERT', 'FastAPI'],
                    description: 'Xây dựng mô hình phân loại CV theo JD sử dụng BERT fine-tuned trên tập dữ liệu tuyển dụng tiếng Việt.',
                    start_date: '09/2024',
                    end_date: '12/2024',
                },
            ],
            education: [
                {
                    institution: 'Đại học Khoa học Tự nhiên TP.HCM',
                    degree: 'Master' as const,
                    major: 'Khoa học Dữ liệu',
                },
            ],
            certificates: ['Deep Learning Specialization – Coursera'],
            isConfirmed: false,
        },
    },
    {
        cvId: 'cv-003',
        candidateId: 'cand-001',
        fileName: 'CV_DevOps_2026.pdf',
        filePath: '/uploads/cvs/cv-003.pdf',
        parsingStatus: 'pending' as const,
        uploadedAt: '2026-04-21T16:00:00Z',
        parsedData: null,
    },
];

export default async function MyCvsPage() {
    const cvs = await getMyCvsAction();
    // const cvs = MOCK_CVS;

    return <MyCvsClient cvs={cvs} />;
}
