import RecruiterClient from '@/components/recruiter-management/RecruiterClient';
import { getDepartmentsAction } from '@/servers/departments/departments.action';
import { getRecruitersAction } from '@/servers/recruiters/recruiters.action';
import { getUsersAction } from '@/servers/users/users.action';

export const metadata = {
    title: 'Quản lý nhà tuyển dụng | TalentAI',
    description: 'Quản lý danh sách và phân công nhà tuyển dụng trong hệ thống',
};

export default async function RecruiterManagementPage() {
    const recruiters = await getRecruitersAction();
    const departments = await getDepartmentsAction();
    const users = await getUsersAction();

    return (
        <RecruiterClient
            recruiters={recruiters}
            departments={departments}
            users={users.filter((user) => user.recruiter === null)}
        />
    );
}
