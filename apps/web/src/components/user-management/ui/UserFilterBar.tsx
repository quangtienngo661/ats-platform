'use client';

import type { Ref } from 'react';
import { Search } from 'lucide-react';
import { UserRole, UserStatus } from '@ats-platform/types';
import { Input, Select } from '@/components/ui';

const ROLE_OPTIONS: { value: UserRole | ''; label: string }[] = [
  { value: '', label: 'Tất cả vai trò' },
  { value: UserRole.org_admin, label: 'Quản trị tổ chức' },
  { value: UserRole.admin, label: 'Quản trị viên' },
  { value: UserRole.recruiter, label: 'Tuyển dụng' },
  { value: UserRole.candidate, label: 'Ứng viên' },
];

const STATUS_OPTIONS: { value: UserStatus | ''; label: string }[] = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: UserStatus.active, label: 'Hoạt động' },
  { value: UserStatus.inactive, label: 'Ngưng' },
];

interface UserFilterBarProps {
  search: string;
  role: UserRole | '';
  status: UserStatus | '';
  onSearch: (q: string) => void;
  onRoleChange: (role: UserRole | '') => void;
  onStatusChange: (status: UserStatus | '') => void;
  /** Lets the list put focus back in the search field after clearing the filters. */
  searchRef?: Ref<HTMLInputElement>;
}

/** Controlled, so the list's "Xóa bộ lọc" can reset every field at once. */
export function UserFilterBar({
  search,
  role,
  status,
  onSearch,
  onRoleChange,
  onStatusChange,
  searchRef,
}: UserFilterBarProps) {
  return (
    <>
      <div className="relative w-full sm:w-56">
        <Search
          aria-hidden="true"
          strokeWidth={1.75}
          className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-ink-3"
        />
        <Input
          ref={searchRef}
          aria-label="Tìm người dùng"
          type="text"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Tìm theo tên, email…"
          className="pl-8"
        />
      </div>

      <Select
        aria-label="Lọc vai trò"
        value={role}
        onChange={(e) => onRoleChange(e.target.value as UserRole | '')}
        className="w-full sm:w-44"
      >
        {ROLE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>

      <Select
        aria-label="Lọc trạng thái người dùng"
        value={status}
        onChange={(e) => onStatusChange(e.target.value as UserStatus | '')}
        className="w-full sm:w-40"
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
    </>
  );
}
