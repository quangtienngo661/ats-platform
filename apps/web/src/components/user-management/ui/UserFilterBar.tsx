'use client';

import { Search, ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { SF } from '@/types/fonts/fonts';
import { UserRole, UserStatus } from '@ats-platform/types';

const ROLE_OPTIONS: { value: UserRole | ''; label: string }[] = [
  { value: '', label: 'Tất cả vai trò' },
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
  onSearch: (q: string) => void;
  onRoleChange: (role: UserRole | '') => void;
  onStatusChange: (status: UserStatus | '') => void;
}

export function UserFilterBar({ onSearch, onRoleChange, onStatusChange }: UserFilterBarProps) {
  const [query, setQuery] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onSearch(value), 300);
  };

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  const selectClass =
    'appearance-none pl-4 pr-8 py-2.5 text-[13px] border border-[#E5E5EA] rounded-xl outline-none focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/10 transition-all bg-white cursor-pointer';

  return (
    <div className="flex items-center gap-3 mb-5 flex-wrap">
      {/* Search */}
      <div className="relative flex-1 min-w-[220px]">
        <Search className="w-4 h-4 text-[#AEAEB2] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Tìm theo tên, email..."
          className="w-full pl-9 pr-4 py-2.5 text-[13px] border border-[#E5E5EA] rounded-xl outline-none focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/10 transition-all bg-white"
          style={{ fontFamily: SF }}
        />
      </div>

      {/* Role filter */}
      <div className="relative">
        <select
          onChange={(e) => onRoleChange(e.target.value as UserRole | '')}
          className={selectClass}
          style={{ fontFamily: SF }}
        >
          {ROLE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className="w-3.5 h-3.5 text-[#AEAEB2] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>

      {/* Status filter */}
      <div className="relative">
        <select
          onChange={(e) => onStatusChange(e.target.value as UserStatus | '')}
          className={selectClass}
          style={{ fontFamily: SF }}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className="w-3.5 h-3.5 text-[#AEAEB2] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>
    </div>
  );
}
