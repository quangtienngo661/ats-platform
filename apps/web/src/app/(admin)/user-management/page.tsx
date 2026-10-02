import UserClient from '@/components/user-management/UserClient';
import { getOrganizationOptionsForCurrentUser } from '@/servers/organizations/organizations.action';
import { getUsersAction } from '@/servers/users/users.action';

export default async function UserManagementPage() {
    const [users, organizations] = await Promise.all([getUsersAction(), getOrganizationOptionsForCurrentUser()]);
    return <UserClient initialUsers={users} organizations={organizations} />;
}
