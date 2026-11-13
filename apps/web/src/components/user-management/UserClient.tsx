'use client';

import { useMemo, useOptimistic, useRef, useState, useTransition } from 'react';
import { SearchX, Users } from 'lucide-react';
import { Button, EmptyState, Surface } from '@/components/ui';
import { UserHeader } from './ui/UserHeader';
import { UserStats } from './ui/UserStats';
import { UserFilterBar } from './ui/UserFilterBar';
import { UserTable } from './ui/UserTable';
import { AddUserModal } from './ui/AddUserModal';
import { EditUserModal } from './ui/EditUserModal';
import { deleteUserAction } from '@/servers/users/users.action';
import { toast } from '@/lib/toast';
import { IOrganizationOption, UserRole, UserStatus } from '@ats-platform/types';
import { IUserResponseDto } from '@/types/interfaces/user.interface';

interface UserClientProps {
  initialUsers: IUserResponseDto[];
  organizations: IOrganizationOption[];
}

export default function UserClient({ initialUsers, organizations }: UserClientProps) {
  const [users, setUsers] = useState<IUserResponseDto[]>(initialUsers);
  const [optimisticUsers, setOptimisticUsers] = useOptimistic(users);
  const [, startTransition] = useTransition();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<UserRole | ''>('');
  const [filterStatus, setFilterStatus] = useState<UserStatus | ''>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<IUserResponseDto | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Client-side filter
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return optimisticUsers.filter((u) => {
      const matchSearch =
        !q ||
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q);
      const matchRole = !filterRole || u.role === filterRole;
      const matchStatus = !filterStatus || u.status === filterStatus;
      return matchSearch && matchRole && matchStatus;
    });
  }, [optimisticUsers, searchQuery, filterRole, filterStatus]);

  const clearFilters = () => {
    setSearchQuery('');
    setFilterRole('');
    setFilterStatus('');
    // The "Xóa bộ lọc" button disappears with the no-match state; keep focus in the toolbar.
    searchRef.current?.focus();
  };

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
    <div className="space-y-4 p-4 lg:p-6">
      <UserHeader onAdd={() => setShowAddModal(true)}>
        <UserFilterBar
          search={searchQuery}
          role={filterRole}
          status={filterStatus}
          onSearch={setSearchQuery}
          onRoleChange={setFilterRole}
          onStatusChange={setFilterStatus}
          searchRef={searchRef}
        />
      </UserHeader>
      <UserStats users={optimisticUsers} />

      {optimisticUsers.length === 0 ? (
        <Surface>
          <EmptyState
            icon={Users}
            title="Chưa có người dùng"
            description="Tài khoản bạn tạo sẽ hiện ở đây."
            action={<Button onClick={() => setShowAddModal(true)}>Thêm người dùng đầu tiên</Button>}
          />
        </Surface>
      ) : filtered.length === 0 ? (
        <Surface>
          <EmptyState
            icon={SearchX}
            title="Không có người dùng khớp"
            description="Đổi từ khóa tìm kiếm hoặc bộ lọc."
            action={<Button variant="secondary" onClick={clearFilters}>Xóa bộ lọc</Button>}
          />
        </Surface>
      ) : (
        <UserTable
          users={filtered}
          organizations={organizations}
          onEdit={setEditingUser}
          onDelete={handleDelete}
        />
      )}

      {showAddModal && (
        <AddUserModal
          organizations={organizations}
          onClose={() => setShowAddModal(false)}
          onCreated={handleCreated}
        />
      )}

      {editingUser && (
        <EditUserModal
          organizations={organizations}
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onUpdated={handleUpdated}
        />
      )}
    </div>
  );
}
