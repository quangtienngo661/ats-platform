import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { jobPosting } from '@/test/fixtures/job-posting';
import { JobDetailHero } from './JobDetailHero';

vi.mock('./ApplyButton', () => ({ ApplyButton: () => null }));

describe('JobDetailHero — the skills of the posting', () => {
  it('shows every skill of the posting', () => {
    render(<JobDetailHero job={jobPosting(['React', 'NestJS', 'SQL', 'Docker'])} isLoggedIn={false} available />);

    for (const name of ['React', 'NestJS', 'SQL', 'Docker']) expect(screen.getByText(name)).toBeInTheDocument();
  });

  it('shows no skill tags for a posting without skills', () => {
    render(<JobDetailHero job={jobPosting([])} isLoggedIn={false} available />);

    expect(screen.queryByText('React')).toBeNull();
    expect(screen.getByRole('heading', { name: 'Backend Engineer' })).toBeInTheDocument();
  });
});
