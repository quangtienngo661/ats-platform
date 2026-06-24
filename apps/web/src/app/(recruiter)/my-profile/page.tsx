import RecruiterProfileClient from '@/components/recruiter-profile/RecruiterProfileClient';
import { getMyRecruiterProfileAction } from '@/servers/recruiters/recruiters.action';

export default async function RecruiterProfilePage() {
    const recruiter = await getMyRecruiterProfileAction();

    if (!recruiter) {
        return (
            <div className="p-6 text-[14px] text-[#6E6E73]">
                Không tìm thấy hồ sơ nhà tuyển dụng. Vui lòng liên hệ quản trị viên.
            </div>
        );
    }

    return <RecruiterProfileClient recruiter={recruiter} />;
}
