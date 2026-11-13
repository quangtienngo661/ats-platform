import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { jobPosting } from '@/test/fixtures/job-posting';
import { JobDetailBody } from './JobDetailBody';

describe('JobDetailBody — plain-text descriptions', () => {
  it('keeps line breaks of a description stored as plain text', () => {
    render(<JobDetailBody job={{ ...jobPosting(), description: 'Dòng một\nDòng hai' }} />);

    expect(screen.getByText(/Dòng một/)).toHaveClass('whitespace-pre-line');
  });
});
