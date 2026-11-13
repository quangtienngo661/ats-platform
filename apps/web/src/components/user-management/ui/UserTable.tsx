'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { IOrganizationOption } from '@ats-platform/types';
import { IUserResponseDto } from '@/types/interfaces/user.interface';
import { IconButton, Table, TBody, TH, THead } from '@/components/ui';
import { cn } from '@/components/ui/cn';
import { UserRow } from './UserRow';

interface UserTableProps {
  users: IUserResponseDto[];
  organizations?: IOrganizationOption[];
  onEdit: (user: IUserResponseDto) => void;
  onDelete: (userId: string) => void;
}

const PAGE_SIZE = 20;

/** Page numbers around the current one, with "…" where a run is skipped. */
function pageItems(current: number, total: number): (number | '...')[] {
  return Array.from({ length: total }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === total || Math.abs(p - current) <= 1)
    .reduce<(number | '...')[]>((acc, p, i, arr) => {
      if (i > 0 && p - arr[i - 1] > 1) acc.push('...');
      acc.push(p);
      return acc;
    }, []);
}

/** The list of users. The caller shows the empty and no-match states, so `users` is never empty here. */
export function UserTable({ users, onEdit, onDelete, organizations = [] }: UserTableProps) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(users.length / PAGE_SIZE));
  const safe = Math.min(page, totalPages);
  const paginated = users.slice((safe - 1) * PAGE_SIZE, safe * PAGE_SIZE);

  return (
    <div className="space-y-3">
      <Table>
        <THead>
          <tr className="border-b border-line">
            <TH>Người dùng</TH>
            <TH>Vai trò</TH>
            <TH>Trạng thái</TH>
            <TH className="max-sm:hidden">Ngày tạo</TH>
            <TH className="w-px">
              <span className="sr-only">Thao tác</span>
            </TH>
          </tr>
        </THead>
        <TBody>
          {paginated.map((user) => (
            <UserRow
              key={user.userId}
              user={user}
              organizationName={organizations.find((org) => org.organizationId === user.organizationId)?.name}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </TBody>
      </Table>

      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-caption tabular-nums text-ink-3">
            {(safe - 1) * PAGE_SIZE + 1}–{Math.min(safe * PAGE_SIZE, users.length)} / {users.length} người dùng
          </p>
          <nav aria-label="Phân trang người dùng" className="flex items-center gap-1">
            <IconButton size="sm" aria-label="Trước" disabled={safe === 1} onClick={() => setPage(safe - 1)}>
              <ChevronLeft aria-hidden="true" strokeWidth={1.75} />
            </IconButton>
            {pageItems(safe, totalPages).map((p, i) =>
              p === '...' ? (
                <span key={`gap-${i}`} aria-hidden="true" className="px-1 text-caption text-ink-3">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  type="button"
                  aria-label={`Trang ${p}`}
                  aria-current={safe === p ? 'page' : undefined}
                  onClick={() => setPage(p)}
                  className={cn(
                    'inline-flex size-8 items-center justify-center rounded-ctl text-caption tabular-nums',
                    'transition duration-press ease-out-expo active:scale-[.97]',
                    safe === p ? 'bg-ink text-surface' : 'text-ink-2 hover:bg-ink/5 hover:text-ink',
                  )}
                >
                  {p}
                </button>
              ),
            )}
            <IconButton size="sm" aria-label="Tiếp" disabled={safe === totalPages} onClick={() => setPage(safe + 1)}>
              <ChevronRight aria-hidden="true" strokeWidth={1.75} />
            </IconButton>
          </nav>
        </div>
      )}
    </div>
  );
}
