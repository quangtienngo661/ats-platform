import DepartmentClient from '@/components/department-management/DepartmentClient';
import { getDepartmentsAction } from '@/servers/departments/departments.action';

export default async function DepartmentManagementPage() {
    const departments = await getDepartmentsAction();

    return <DepartmentClient departments={departments} />;
}
