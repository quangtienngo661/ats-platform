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

describe('JobDetailBody — HTML descriptions', () => {
  // The editor stores HTML with a newline between block tags. pre-line turned each of those newlines into an
  // empty line between the heading, the list and its items (seen at 390 px in Task 33).
  it('does not keep source newlines between the blocks of an HTML description', () => {
    render(<JobDetailBody job={{ ...jobPosting(), description: '<h3>Trách nhiệm</h3>\n<ul>\n<li>Thiết kế API</li>\n</ul>' }} />);

    expect(screen.getByRole('heading', { name: 'Trách nhiệm' }).parentElement).not.toHaveClass('whitespace-pre-line');
  });

  it('keeps line breaks inside a paragraph-free HTML fragment with only inline tags', () => {
    render(<JobDetailBody job={{ ...jobPosting(), description: '<strong>Dòng một</strong>\nDòng hai' }} />);

    expect(screen.getByText('Dòng một').parentElement).toHaveClass('whitespace-pre-line');
  });
});
