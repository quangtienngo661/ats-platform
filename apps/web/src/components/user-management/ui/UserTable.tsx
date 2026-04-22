'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { SF, SFT } from '@/types/fonts/fonts';
import { UserRow } from './UserRow';
import { IUserResponseDto } from '@/types/interfaces/user.interface';

interface UserTableProps {
  users: IUserResponseDto[];
  onEdit: (user: IUserResponseDto) => void;
  onDelete: (userId: string) => void;
}

const PAGE_SIZE = 20;
const COLS = ['Người dùng', 'Vai trò', 'Trạng thái', 'Ngày tạo', 'Thao tác'];

export function UserTable({ users, onEdit, onDelete }: UserTableProps) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(users.length / PAGE_SIZE));
  const safe = Math.min(page, totalPages);
  const paginated = users.slice((safe - 1) * PAGE_SIZE, safe * PAGE_SIZE);

  if (users.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#E5E5EA] py-16 flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-[#E3F2FF] flex items-center justify-center">
          <Users className="w-7 h-7 text-[#0071E3]" />
        </div>
        <div className="text-center">
          <p
            className="text-[15px] text-[#1D1D1F]"
            style={{ fontFamily: SF, fontWeight: 600 }}
          >
            Không tìm thấy người dùng
          </p>
          <p className="text-[13px] text-[#6E6E73] mt-1" style={{ fontFamily: SFT }}>
            Thử thay đổi bộ lọc hoặc thêm người dùng mới
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E5E5EA] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#F2F2F7] bg-[#FAFAFA]">
              {COLS.map((col, i) => (
                <th
                  key={col}
                  className={`px-6 py-3.5 text-[11px] uppercase tracking-widest text-[#AEAEB2] ${i === COLS.length - 1 ? 'text-right' : 'text-left'
                    }`}
                  style={{ fontFamily: SF, fontWeight: 600 }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.map((user) => (
              <UserRow
                key={user.userId}
                user={user}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-[#F2F2F7]">
          <p className="text-[12px] text-[#6E6E73]" style={{ fontFamily: SFT }}>
            {(safe - 1) * PAGE_SIZE + 1}–{Math.min(safe * PAGE_SIZE, users.length)} /{' '}
            {users.length} người dùng
          </p>
          <div className="flex items-center gap-1">
            <button
              disabled={safe === 1}
              onClick={() => setPage((p) => p - 1)}
              className="p-1.5 rounded-lg text-[#1D1D1F] hover:bg-[#F5F5F7] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - safe) <= 1)
              .reduce<(number | '...')[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...');
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === '...' ? (
                  <span key={`e-${i}`} className="px-2 text-[12px] text-[#AEAEB2]">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    className={`w-7 h-7 rounded-lg text-[12px] transition-colors ${safe === p ? 'bg-[#0071E3] text-white' : 'text-[#1D1D1F] hover:bg-[#F5F5F7]'
                      }`}
                    style={{ fontFamily: SF, fontWeight: safe === p ? 700 : 400 }}
                  >
                    {p}
                  </button>
                )
              )}
            <button
              disabled={safe === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="p-1.5 rounded-lg text-[#1D1D1F] hover:bg-[#F5F5F7] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
