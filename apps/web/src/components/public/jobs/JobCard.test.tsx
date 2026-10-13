import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { jobPosting } from '@/test/fixtures/job-posting';
import { JobCard } from './JobCard';

describe('JobCard — the skills of the posting', () => {
  it('shows the first three skills and how many more there are', () => {
    render(<JobCard job={jobPosting(['React', 'NestJS', 'SQL', 'Docker'])} />);

    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('NestJS')).toBeInTheDocument();
    expect(screen.getByText('SQL')).toBeInTheDocument();
    expect(screen.queryByText('Docker')).toBeNull();
    expect(screen.getByText('+1')).toBeInTheDocument();
  });

  it('shows no skill block for a posting without skills', () => {
    render(<JobCard job={jobPosting([])} />);

    expect(screen.queryByText(/^\+\d+$/)).toBeNull();
    expect(screen.getByText('Backend Engineer')).toBeInTheDocument();
  });
});

describe('JobCard — shared work-type labels and fallbacks', () => {
  it.each([
    ['onsite', 'Văn phòng'],
    ['remote', 'Remote'],
    ['hybrid', 'Hybrid'],
    ['unknown-location', 'unknown-location'],
    ['', 'Văn phòng'],
  ])('shows %s as %s', (locationType, label) => {
    render(<JobCard job={{ ...jobPosting(), locationType }} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });
});
