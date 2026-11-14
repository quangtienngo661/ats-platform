// The card's "Tùy chọn" menu from the keyboard; what edit and delete do afterwards belongs to DepartmentClient.
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Department } from '@/types/interfaces/departments.interface';
import { DepartmentCard } from './DepartmentCard';

const department = {
  departmentId: 'department-a', organizationId: 'org-a', name: 'Kỹ thuật',
  description: 'Nhóm phát triển', color: '#0071E3', members: [],
  membersCount: 0, jobPostingsCount: 0,
} satisfies Department;

type User = ReturnType<typeof userEvent.setup>;

/** Opens the card's menu from the keyboard and activates `item`; returns the menu's trigger. */
async function choose(user: User, item: string) {
  const trigger = screen.getByRole('button', { name: 'Tùy chọn' });
  trigger.focus();
  await user.keyboard('{Enter}');
  const target = await screen.findByRole('menuitem', { name: item });
  // Bounded, so a missing item fails instead of looping.
  for (let i = 0; i < 5 && document.activeElement !== target; i++) await user.keyboard('{ArrowDown}');
  expect(target).toHaveFocus();
  await user.keyboard('{Enter}');
  return trigger;
}

function renderCard() {
  let focusAtEdit: Element | null = null;
  const onEdit = vi.fn(() => { focusAtEdit = document.activeElement; });
  const onDelete = vi.fn();
  render(<DepartmentCard department={department} onEdit={onEdit} onDelete={onDelete} onViewDetail={vi.fn()} />);
  return { onEdit, onDelete, focusAtEdit: () => focusAtEdit };
}

describe('DepartmentCard — "Tùy chọn" menu', () => {
  it('describes its trigger with the department name', () => {
    renderCard();
    expect(screen.getByRole('button', { name: 'Tùy chọn' })).toHaveAccessibleDescription('Kỹ thuật');
  });

  it('edits that department only once focus is back on the trigger, so the dialog returns focus there', async () => {
    const user = userEvent.setup();
    const { onEdit, onDelete, focusAtEdit } = renderCard();

    const trigger = await choose(user, 'Chỉnh sửa');

    await waitFor(() => expect(onEdit).toHaveBeenCalledTimes(1));
    expect(onEdit).toHaveBeenCalledWith(department);
    expect(focusAtEdit()).toBe(trigger);
    expect(trigger).toHaveFocus();
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('deletes that department from "Xóa"', async () => {
    const user = userEvent.setup();
    const { onEdit, onDelete } = renderCard();

    const trigger = await choose(user, 'Xóa');

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith(department);
    expect(onEdit).not.toHaveBeenCalled();
    await waitFor(() => expect(trigger).toHaveFocus());
  });
});
