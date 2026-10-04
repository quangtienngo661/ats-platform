// The job search filters a candidate (or a visitor) reaches from the "Bộ lọc" panel:
// what they type becomes the URL, and a bad entry never navigates (C13, E6, E15, E17).
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { JobSearchClient } from './JobSearchClient';

const mocks = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mocks.push }) }));

const SKILLS = [
  { skillId: 'skill-a', name: 'NestJS' },
  { skillId: 'skill-b', name: 'React' },
];

type Props = Partial<React.ComponentProps<typeof JobSearchClient>>;

function renderSearch(props: Props = {}) {
  return render(
    <JobSearchClient
      initialJobs={[]}
      total={0}
      categories={[]}
      currentPage={1}
      skills={SKILLS}
      initialQuery={{}}
      {...props}
    />,
  );
}

async function openFilters(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Bộ lọc' }));
}

const lastUrl = () => {
  const call = mocks.push.mock.calls.at(-1);
  if (!call) throw new Error('router.push was not called');
  return new URL(call[0], 'http://localhost');
};

beforeEach(() => {
  mocks.push.mockClear();
});

describe('JobSearchClient — salary (C13, E15)', () => {
  it('searches by a salary typed with thousand separators', async () => {
    const user = userEvent.setup();
    renderSearch();
    await openFilters(user);

    await user.type(screen.getByRole('textbox', { name: 'Từ' }), '15.000.000');
    await user.click(screen.getByRole('button', { name: 'Tìm' }));

    expect(lastUrl().pathname).toBe('/job-postings');
    expect(lastUrl().searchParams.get('salaryMin')).toBe('15000000');
    expect(lastUrl().searchParams.has('salaryMax')).toBe(false);
  });

  it('applies the salary on Enter and on "Áp dụng"', async () => {
    const user = userEvent.setup();
    renderSearch();
    await openFilters(user);

    await user.type(screen.getByRole('textbox', { name: 'Đến' }), '20.000.000{Enter}');
    expect(lastUrl().searchParams.get('salaryMax')).toBe('20000000');

    mocks.push.mockClear();
    await user.click(screen.getByRole('button', { name: 'Áp dụng' }));
    expect(mocks.push).toHaveBeenCalledTimes(1);
  });

  it('accepts a range that is a single value', async () => {
    const user = userEvent.setup();
    renderSearch();
    await openFilters(user);

    await user.type(screen.getByRole('textbox', { name: 'Từ' }), '15000000');
    await user.type(screen.getByRole('textbox', { name: 'Đến' }), '15.000.000');
    await user.click(screen.getByRole('button', { name: 'Áp dụng' }));

    expect(lastUrl().searchParams.get('salaryMin')).toBe('15000000');
    expect(lastUrl().searchParams.get('salaryMax')).toBe('15000000');
  });

  it('shows a message and stays on the page when the minimum is above the maximum', async () => {
    const user = userEvent.setup();
    renderSearch();
    await openFilters(user);

    await user.type(screen.getByRole('textbox', { name: 'Từ' }), '20.000.000');
    await user.type(screen.getByRole('textbox', { name: 'Đến' }), '10.000.000');
    await user.click(screen.getByRole('button', { name: 'Áp dụng' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Mức lương tối thiểu không thể lớn hơn mức lương tối đa');
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it('shows a message and stays on the page for a salary it cannot read', async () => {
    const user = userEvent.setup();
    renderSearch();
    await openFilters(user);

    await user.type(screen.getByRole('textbox', { name: 'Từ' }), '1.5');
    await user.click(screen.getByRole('button', { name: 'Áp dụng' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Mức lương không hợp lệ');
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it('fills the salary fields from the URL, with thousand separators', async () => {
    const user = userEvent.setup();
    renderSearch({ initialQuery: { salaryMin: 15_000_000 } });
    await openFilters(user);

    expect(screen.getByRole('textbox', { name: 'Từ' })).toHaveValue('15.000.000');
    expect(screen.getByRole('textbox', { name: 'Đến' })).toHaveValue('');
  });
});

describe('JobSearchClient — skills (C13, E6, E17)', () => {
  it('puts every chosen skill in the URL as a repeated key', async () => {
    const user = userEvent.setup();
    renderSearch();
    await openFilters(user);

    await user.click(screen.getByRole('button', { name: 'NestJS' }));
    await user.click(screen.getByRole('button', { name: 'React' }));

    expect(lastUrl().searchParams.getAll('skillIds')).toEqual(['skill-a', 'skill-b']);
  });

  it('takes a skill out again when it is pressed a second time', async () => {
    const user = userEvent.setup();
    renderSearch({ initialQuery: { skillIds: ['skill-a'] } });
    await openFilters(user);

    const chip = screen.getByRole('button', { name: 'NestJS' });
    expect(chip).toHaveAttribute('aria-pressed', 'true');
    await user.click(chip);

    expect(lastUrl().searchParams.has('skillIds')).toBe(false);
    expect(chip).toHaveAttribute('aria-pressed', 'false');
  });

  it('hides the skill group when no active posting has a skill (E6)', async () => {
    const user = userEvent.setup();
    renderSearch({ skills: [] });
    await openFilters(user);

    expect(screen.queryByText('Kỹ năng')).toBeNull();
  });

  it('goes back to page 1 when a filter changes while on page 3 (E17)', async () => {
    const user = userEvent.setup();
    renderSearch({ total: 60, currentPage: 3 });
    await openFilters(user);

    await user.click(screen.getByRole('button', { name: 'NestJS' }));

    expect(lastUrl().searchParams.has('page')).toBe(false);
  });

  it('stays on the page asked for when the pagination buttons are used', async () => {
    const user = userEvent.setup();
    renderSearch({ total: 60, currentPage: 3 });

    await user.click(screen.getByRole('button', { name: 'Tiếp' }));

    expect(lastUrl().searchParams.get('page')).toBe('4');
  });
});

describe('JobSearchClient — clearing (E17)', () => {
  it('clears the salary, the skills and the page together', async () => {
    const user = userEvent.setup();
    renderSearch({ initialQuery: { salaryMin: 12_000_000, skillIds: ['skill-a'] }, currentPage: 2, total: 40 });
    await openFilters(user);

    await user.click(screen.getByRole('button', { name: 'Xóa bộ lọc' }));

    expect(mocks.push).toHaveBeenCalledWith('/job-postings');
    expect(screen.getByRole('textbox', { name: 'Từ' })).toHaveValue('');
    expect(screen.getByRole('button', { name: 'NestJS' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('offers to clear when only a salary or a skill is set', async () => {
    const user = userEvent.setup();
    renderSearch({ initialQuery: { skillIds: ['skill-b'] } });
    await openFilters(user);

    expect(screen.getByRole('button', { name: 'Xóa bộ lọc' })).toBeInTheDocument();
  });
});
