// The home search (C14, D4): the locked "Địa điểm" field is gone, and the work type the
// visitor picks goes to the job search as `locationType`.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HomeHero } from './HomeHero';

const mocks = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mocks.push }) }));

beforeEach(() => {
  mocks.push.mockClear();
});

const workType = () => screen.getByRole('combobox', { name: 'Hình thức làm việc' });

describe('HomeHero', () => {
  it('no longer shows a location field that cannot be used', () => {
    render(<HomeHero />);

    expect(screen.queryByLabelText(/Địa điểm/)).toBeNull();
    expect(screen.queryByPlaceholderText('Địa điểm...')).toBeNull();
  });

  it('offers every way of working, starting from "Tất cả"', () => {
    render(<HomeHero />);

    expect(workType()).toHaveDisplayValue('Tất cả');
    expect(Array.from((workType() as HTMLSelectElement).options).map((option) => option.text)).toEqual([
      'Tất cả', 'Remote', 'Văn phòng', 'Hybrid',
    ]);
  });

  it('sends the keyword and the chosen work type to the job search', async () => {
    const user = userEvent.setup();
    render(<HomeHero />);

    await user.type(screen.getByRole('textbox', { name: 'Tìm việc theo từ khóa' }), 'react');
    await user.selectOptions(workType(), 'Remote');
    await user.click(screen.getByRole('button', { name: 'Tìm kiếm' }));

    expect(mocks.push).toHaveBeenCalledWith('/job-postings?q=react&locationType=remote');
  });

  it('can search by work type alone', async () => {
    const user = userEvent.setup();
    render(<HomeHero />);

    await user.selectOptions(workType(), 'Hybrid');
    await user.click(screen.getByRole('button', { name: 'Tìm kiếm' }));

    expect(mocks.push).toHaveBeenCalledWith('/job-postings?locationType=hybrid');
  });

  it('adds no work type to the search while "Tất cả" is chosen', async () => {
    const user = userEvent.setup();
    render(<HomeHero />);

    await user.type(screen.getByRole('textbox', { name: 'Tìm việc theo từ khóa' }), 'react');
    await user.click(screen.getByRole('button', { name: 'Tìm kiếm' }));

    expect(mocks.push).toHaveBeenCalledWith('/job-postings?q=react');
  });

  it('keeps the popular searches going to the keyword search', () => {
    render(<HomeHero />);

    // A real link: Ctrl/Cmd+click and middle-click open the search in a new tab.
    expect(screen.getByRole('link', { name: /Frontend Developer/ })).toHaveAttribute(
      'href',
      '/job-postings?q=Frontend%20Developer',
    );
    expect(screen.queryByRole('button', { name: /Frontend Developer/ })).not.toBeInTheDocument();
  });
});
