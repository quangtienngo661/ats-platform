// Component behaviour: the answer composer sends on Enter, adds a line on Shift+Enter and never sends mid-composition.
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AnswerInput } from './AnswerInput';

function setup(props: { disabled?: boolean } = {}) {
    const onSubmit = vi.fn();
    render(<AnswerInput onSubmit={onSubmit} {...props} />);
    return { onSubmit, textarea: screen.getByRole('textbox', { name: 'Câu trả lời' }) };
}

describe('AnswerInput', () => {
    it('sends the trimmed answer on Enter and clears the box', async () => {
        const user = userEvent.setup();
        const { onSubmit, textarea } = setup();

        await user.type(textarea, '  useEffect chạy sau khi render  ');
        await user.keyboard('{Enter}');

        expect(onSubmit).toHaveBeenCalledTimes(1);
        expect(onSubmit).toHaveBeenCalledWith('useEffect chạy sau khi render');
        expect(textarea).toHaveValue('');
    });

    it('adds a new line on Shift+Enter instead of sending', async () => {
        const user = userEvent.setup();
        const { onSubmit, textarea } = setup();

        await user.type(textarea, 'Dòng một');
        await user.keyboard('{Shift>}{Enter}{/Shift}');
        await user.type(textarea, 'Dòng hai');

        expect(onSubmit).not.toHaveBeenCalled();
        expect(textarea).toHaveValue('Dòng một\nDòng hai');
    });

    it('does not send when Enter confirms an IME composition', () => {
        const { onSubmit, textarea } = setup();

        fireEvent.change(textarea, { target: { value: 'Tiếng Việt' } });
        fireEvent.keyDown(textarea, { key: 'Enter', isComposing: true });

        expect(onSubmit).not.toHaveBeenCalled();
        expect(textarea).toHaveValue('Tiếng Việt');
    });

    it('sends from the send button and keeps it disabled while the box is empty', async () => {
        const user = userEvent.setup();
        const { onSubmit, textarea } = setup();
        const send = screen.getByRole('button', { name: 'Gửi câu trả lời' });

        expect(send).toBeDisabled();
        await user.type(textarea, 'Dùng key ổn định');
        await user.click(send);

        expect(onSubmit).toHaveBeenCalledWith('Dùng key ổn định');
    });

    it('sends nothing while disabled, even on Enter', () => {
        const { onSubmit, textarea } = setup({ disabled: true });

        fireEvent.change(textarea, { target: { value: 'Trả lời' } });
        fireEvent.keyDown(textarea, { key: 'Enter' });

        expect(onSubmit).not.toHaveBeenCalled();
    });
});
