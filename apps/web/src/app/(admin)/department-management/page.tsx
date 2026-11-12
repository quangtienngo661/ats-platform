import { getUiVariant } from '@/lib/ui-variant';
import LegacyDepartmentManagementPage from '@/legacy/app/(admin)/department-management/page';
import DepartmentClient from '@/components/department-management/DepartmentClient';
import { getDepartmentsAction } from '@/servers/departments/departments.action';
import { getOrganizationOptionsForCurrentUser } from '@/servers/organizations/organizations.action';

export default async function DepartmentManagementPage() {
    if ((await getUiVariant()) === 'legacy') return <LegacyDepartmentManagementPage />;
    const [departments, organizations] = await Promise.all([
        getDepartmentsAction(),
        getOrganizationOptionsForCurrentUser(),
    ]);

    return <DepartmentClient departments={departments} organizations={organizations} />;
}
