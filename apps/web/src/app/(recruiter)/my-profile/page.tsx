import RecruiterProfileClient from '@/components/recruiter-profile/RecruiterProfileClient';
import { getMyRecruiterProfileAction } from '@/servers/recruiters/recruiters.action';
import { getMeAction } from '@/servers/users/users.action';
import { getCurrentOrganizationAction } from '@/servers/organizations/organizations.action';
import StaffProfileClient from '@/components/user-management/StaffProfileClient';

export default async function RecruiterProfilePage() {
    const user = await getMeAction();
    if (user && (user.role === 'org_admin' || user.role === 'admin')) {
        const organization = user.role === 'org_admin' ? await getCurrentOrganizationAction() : null;
        return <StaffProfileClient user={user} organizationName={organization?.name} />;
    }
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
