'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { AlertTriangle, Pencil, Trash2 } from 'lucide-react';
import { UserRole, UserStatus } from '@ats-platform/types';
import { IUserResponseDto } from '@/types/interfaces/user.interface';
import {
  Avatar,
  Badge,
  Button,
  DropdownMenuSeparator,
  RowActionsItem,
  RowActionsMenu,
  TD,
  TR,
} from '@/components/ui';

const ROLE_LABEL: Record<UserRole, string> = {
  [UserRole.admin]: 'Quản trị viên',
  [UserRole.org_admin]: 'Quản trị tổ chức',
  [UserRole.recruiter]: 'Tuyển dụng',
  [UserRole.candidate]: 'Ứng viên',
};

const DATE_FORMAT = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

function formatDate(iso: string) {
  return DATE_FORMAT.format(new Date(iso));
}

interface UserRowProps {
  user: IUserResponseDto;
  organizationName?: string;
  onEdit: (user: IUserResponseDto) => void;
  onDelete: (userId: string) => void;
}

export function UserRow({ user, organizationName, onEdit, onDelete }: UserRowProps) {
  const [confirming, setConfirming] = useState(false);
  const nameId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  /** Where focus goes once the actions cell has swapped between the menu and the delete confirmation. */
  const focusNext = useRef<'cancel' | 'trigger' | null>(null);

  useEffect(() => {
    const target = focusNext.current;
    focusNext.current = null;
    if (target === 'cancel') cancelRef.current?.focus();
    if (target === 'trigger') triggerRef.current?.focus();
  }, [confirming]);

  const isActive = user.status === UserStatus.active;

  return (
    <TR className="group">
      <TD>
        <div className="flex items-center gap-3">
          <Avatar name={user.fullName} size={32} />
          <div className="min-w-0 max-w-40 sm:max-w-64 lg:max-w-96">
            <p id={nameId} className="truncate font-medium text-ink" title={user.fullName}>
              {user.fullName}
            </p>
            <p className="truncate text-caption text-ink-3" title={user.email}>
              {user.email}
            </p>
          </div>
        </div>
      </TD>

      <TD>
        <Badge>{ROLE_LABEL[user.role] ?? user.role}</Badge>
        {organizationName && (
          <p className="mt-1 max-w-48 truncate text-caption text-ink-3" title={organizationName}>
            Tổ chức: {organizationName}
          </p>
        )}
      </TD>

      <TD>
        <Badge tone={isActive ? 'success' : 'neutral'}>{isActive ? 'Hoạt động' : 'Ngưng'}</Badge>
      </TD>

      <TD className="whitespace-nowrap tabular-nums text-ink-3 max-sm:hidden">{formatDate(user.createdAt)}</TD>

      <TD className="w-px whitespace-nowrap text-right">
        {confirming ? (
          <div className="flex items-center justify-end gap-2">
            <span className="inline-flex items-center gap-1 text-caption text-danger">
              <AlertTriangle aria-hidden="true" strokeWidth={1.75} className="size-3.5" />
              Xác nhận xóa?
            </span>
            <Button
              size="sm"
              variant="danger"
              onClick={() => {
                onDelete(user.userId);
                setConfirming(false);
              }}
            >
              Xóa
            </Button>
            <Button
              ref={cancelRef}
              size="sm"
              variant="ghost"
              onClick={() => {
                focusNext.current = 'trigger';
                setConfirming(false);
              }}
            >
              Hủy
            </Button>
          </div>
        ) : (
          <RowActionsMenu ref={triggerRef} describedBy={nameId}>
            <RowActionsItem afterClose={() => onEdit(user)}>
              <Pencil aria-hidden="true" strokeWidth={1.75} className="size-4" />
              Chỉnh sửa
            </RowActionsItem>
            <DropdownMenuSeparator />
            <RowActionsItem
              destructive
              movesFocus
              afterClose={() => {
                focusNext.current = 'cancel';
                setConfirming(true);
              }}
            >
              <Trash2 aria-hidden="true" strokeWidth={1.75} className="size-4" />
              Xóa
            </RowActionsItem>
          </RowActionsMenu>
        )}
      </TD>
    </TR>
  );
}
