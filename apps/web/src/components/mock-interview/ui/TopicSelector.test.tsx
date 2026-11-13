// Keyboard behaviour of the topic radiogroup: roving tabindex, arrows select, ends wrap.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import type { IInterviewTopic } from '@/types/interfaces/interview.interface';
import { TopicSelector } from './TopicSelector';

const topics: IInterviewTopic[] = [
    { topicId: 'a', name: 'Alpha' },
    { topicId: 'b', name: 'Beta' },
    { topicId: 'c', name: 'Gamma' },
];

function Harness() {
    const [id, setId] = useState<string | null>(null);
    return (
        <>
            <TopicSelector topics={topics} selectedId={id} onSelect={setId} />
            <button disabled={!id}>Bắt đầu</button>
        </>
    );
}

describe('TopicSelector keyboard', () => {
    it('makes only the first card a tab stop when nothing is selected', () => {
        render(<Harness />);
        const radios = screen.getAllByRole('radio');
        expect(radios.map((r) => r.tabIndex)).toEqual([0, -1, -1]);
    });

    it('moves focus and selection with arrows, wrapping at the ends', async () => {
        const user = userEvent.setup();
        render(<Harness />);
        await user.tab();
        const [a, b, c] = screen.getAllByRole('radio');
        expect(a).toHaveFocus();

        await user.keyboard('{ArrowRight}');
        expect(b).toHaveFocus();
        expect(b).toHaveAttribute('aria-checked', 'true');
        expect(screen.getByRole('button', { name: 'Bắt đầu' })).toBeEnabled();
        expect(screen.getAllByRole('radio').map((r) => r.tabIndex)).toEqual([-1, 0, -1]);

        await user.keyboard('{ArrowUp}');
        await user.keyboard('{ArrowLeft}');
        expect(c).toHaveFocus();
        expect(c).toHaveAttribute('aria-checked', 'true');
    });

    it('jumps with Home and End', async () => {
        const user = userEvent.setup();
        render(<Harness />);
        await user.tab();
        const [a, , c] = screen.getAllByRole('radio');
        await user.keyboard('{End}');
        expect(c).toHaveFocus();
        await user.keyboard('{Home}');
        expect(a).toHaveFocus();
        expect(a).toHaveAttribute('aria-checked', 'true');
    });
});
