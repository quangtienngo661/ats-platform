import UserClient from '@/components/user-management/UserClient';
import { getUsersAction } from '@/servers/users/users.action';

export default async function UserManagementPage() {
    const users = await getUsersAction();
    return <UserClient initialUsers={users} />;
}
