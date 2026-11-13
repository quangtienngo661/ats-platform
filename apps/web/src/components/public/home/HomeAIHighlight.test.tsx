// The home page's AI card shows invented numbers. It may only do so while it says so twice: the "Ví dụ" badge on the
// card and the "Số liệu minh họa." footnote under it.
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HomeAIHighlight } from './HomeAIHighlight';

describe('HomeAIHighlight', () => {
    it('labels the sample match "Ví dụ" and captions its numbers as illustrative', () => {
        render(<HomeAIHighlight />);

        const card = screen.getByRole('figure');
        expect(within(card).getByText('Ví dụ')).toBeVisible();
        const footnote = within(card).getByText(/^Số liệu minh họa\./);
        expect(footnote).toBeVisible();
        expect(footnote.tagName).toBe('FIGCAPTION');
        // The numbers it qualifies are on the same card.
        expect(within(card).getByText('82')).toBeVisible();
    });

    it('says the recruiter decides, not the AI', () => {
        render(<HomeAIHighlight />);

        expect(within(screen.getByRole('figure')).getByText(/là người quyết định/)).toBeVisible();
    });
});
