// The card's "Tùy chọn" menu from the keyboard; what edit and delete do afterwards belongs to RecruiterClient.
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { IRecruiterDto } from '@/types/interfaces/recruiter.interface';
import { RecruiterCard } from './RecruiterCard';

const recruiter = {
  recruiterId: 'rec-a', userId: 'user-a', position: 'Trưởng nhóm',
  department: { departmentId: 'dep-a', name: 'Kỹ thuật' },
  user: { fullName: 'Nguyễn Văn A', email: 'a@ats.test', role: 'recruiter', status: 'active' },
} as unknown as IRecruiterDto;

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
  render(
    <RecruiterCard
      recruiter={recruiter}
      departmentName="Kỹ thuật"
      departmentColor="#0071E3"
      onEdit={onEdit}
      onDelete={onDelete}
      onViewDetail={vi.fn()}
    />,
  );
  return { onEdit, onDelete, focusAtEdit: () => focusAtEdit };
}

describe('RecruiterCard — "Tùy chọn" menu', () => {
  it('describes its trigger with the recruiter name', () => {
    renderCard();
    expect(screen.getByRole('button', { name: 'Tùy chọn' })).toHaveAccessibleDescription('Nguyễn Văn A');
  });

  it('edits that recruiter only once focus is back on the trigger, so the dialog returns focus there', async () => {
    const user = userEvent.setup();
    const { onEdit, onDelete, focusAtEdit } = renderCard();

    const trigger = await choose(user, 'Chỉnh sửa');

    await waitFor(() => expect(onEdit).toHaveBeenCalledTimes(1));
    expect(onEdit).toHaveBeenCalledWith(recruiter);
    expect(focusAtEdit()).toBe(trigger);
    expect(trigger).toHaveFocus();
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('deletes that recruiter from "Xóa"', async () => {
    const user = userEvent.setup();
    const { onEdit, onDelete } = renderCard();

    const trigger = await choose(user, 'Xóa');

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith(recruiter);
    expect(onEdit).not.toHaveBeenCalled();
    await waitFor(() => expect(trigger).toHaveFocus());
  });
});
