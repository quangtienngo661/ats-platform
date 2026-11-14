// The home page's figures (500+ vị trí, 10K+ ứng viên, 200+ công ty, 95% hài lòng) were invented. The section now
// explains the real sequence a job seeker goes through, so its steps must stay in that order.
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HomeSteps } from './HomeSteps';

describe('HomeSteps', () => {
  it('walks through how TalentAI works, in order', () => {
    render(<HomeSteps />);

    const section = screen.getByRole('region', { name: 'Cách TalentAI hoạt động' });
    const steps = within(within(section).getByRole('list')).getAllByRole('listitem');

    expect(steps.map((step) => within(step).getByRole('heading', { level: 3 }).textContent)).toEqual([
      'Tải CV lên',
      'Nhận gợi ý phù hợp',
      'Theo dõi và luyện tập',
    ]);
  });

  it('says the recruiter still decides', () => {
    render(<HomeSteps />);

    expect(screen.getByText(/người tuyển dụng vẫn quyết định/)).toBeInTheDocument();
  });

  it('shows no invented figures', () => {
    const { container } = render(<HomeSteps />);

    expect(container.textContent).not.toMatch(/\d+\s*(K\+|\+|%)/);
  });
});
