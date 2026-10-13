import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { jobPosting } from '@/test/fixtures/job-posting';
import { JobDetailSidebar } from './JobDetailSidebar';

describe('JobDetailSidebar — the skills of the posting', () => {
  it('lists the required skills', () => {
    render(<JobDetailSidebar job={jobPosting(['React', 'NestJS'])} />);

    expect(screen.getByText('Kỹ năng yêu cầu')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('NestJS')).toBeInTheDocument();
  });

  it('has no skills block for a posting without skills', () => {
    render(<JobDetailSidebar job={jobPosting([])} />);

    expect(screen.queryByText('Kỹ năng yêu cầu')).toBeNull();
  });
});

describe('JobDetailSidebar — shared work-type labels and fallbacks', () => {
  it.each([
    ['onsite', 'Văn phòng'],
    ['remote', 'Remote'],
    ['hybrid', 'Hybrid'],
    ['unknown-location', 'unknown-location'],
    ['toString', 'toString'],
  ])('shows %s as %s', (locationType, label) => {
    render(<JobDetailSidebar job={{ ...jobPosting(), locationType }} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });
});
