'use client';

import { useMemo, useOptimistic, useState, useTransition } from 'react';
import { SFT } from '@/types/fonts/fonts';
import { UserHeader } from './ui/UserHeader';
import { UserStats } from './ui/UserStats';
import { UserFilterBar } from './ui/UserFilterBar';
import { UserTable } from './ui/UserTable';
import { AddUserModal } from './ui/AddUserModal';
import { EditUserModal } from './ui/EditUserModal';
import { deleteUserAction } from '@/servers/users/users.action';
import { toast } from '@/lib/toast';
import { UserRole, UserStatus } from '@ats-platform/types';
import { IUserResponseDto } from '@/types/interfaces/user.interface';

interface UserClientProps {
  initialUsers: IUserResponseDto[];
}

export default function UserClient({ initialUsers }: UserClientProps) {
  const [users, setUsers] = useState<IUserResponseDto[]>(initialUsers);
  const [optimisticUsers, setOptimisticUsers] = useOptimistic(users);
  const [isPending, startTransition] = useTransition();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<UserRole | ''>('');
  const [filterStatus, setFilterStatus] = useState<UserStatus | ''>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<IUserResponseDto | null>(null);

  // Client-side filter
  const filtered = useMemo(() => {
    return optimisticUsers.filter((u) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q);
      const matchRole = !filterRole || u.role === filterRole;
      const matchStatus = !filterStatus || u.status === filterStatus;
      return matchSearch && matchRole && matchStatus;
    });
  }, [optimisticUsers, searchQuery, filterRole, filterStatus]);

  const handleCreated = (user: IUserResponseDto) => {
    setUsers((prev) => [user, ...prev]);
  };

  const handleUpdated = (updated: IUserResponseDto) => {
    setUsers((prev) =>
      prev.map((u) => (u.userId === updated.userId ? updated : u))
    );
  };

  const handleDelete = (userId: string) => {
    // Optimistic removal
    startTransition(async () => {
      setOptimisticUsers((prev) => prev.filter((u) => u.userId !== userId));
      const result = await deleteUserAction(userId);
      if (result.success) {
        setUsers((prev) => prev.filter((u) => u.userId !== userId));
        toast.success('Xóa thành công', 'Người dùng đã bị xóa khỏi hệ thống');
      } else {
        // Rollback on failure
        setUsers((prev) => prev); // trigger re-render from real state
        toast.error('Xóa thất bại', result.message);
      }
    });
  };

  return (
    <div className="p-6 lg:p-8" style={{ fontFamily: SFT }}>
      <UserHeader onAdd={() => setShowAddModal(true)} />
      <UserStats users={optimisticUsers} />
      <UserFilterBar
        onSearch={setSearchQuery}
        onRoleChange={setFilterRole}
        onStatusChange={setFilterStatus}
      />
      <UserTable
        users={filtered}
        onEdit={setEditingUser}
        onDelete={handleDelete}
      />

      {showAddModal && (
        <AddUserModal
          onClose={() => setShowAddModal(false)}
          onCreated={handleCreated}
        />
      )}

      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onUpdated={handleUpdated}
        />
      )}
    </div>
  );
}
