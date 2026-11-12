import type { ComponentProps } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button';
import { ButtonLink } from './ButtonLink';
import { IconButton } from './IconButton';

vi.mock('next/link', () => ({
    default: ({ children, ...props }: ComponentProps<'a'>) => <a {...props}>{children}</a>,
}));

describe('Button', () => {
    it('is busy and disabled while loading, and keeps its label as the name', () => {
        render(<Button loading>Lưu thay đổi</Button>);
        const button = screen.getByRole('button', { name: 'Lưu thay đổi' });
        expect(button).toHaveAttribute('aria-busy', 'true');
        expect(button).toBeDisabled();
    });

    it('does not call onClick when clicked while loading', async () => {
        const user = userEvent.setup();
        const onClick = vi.fn();
        render(
            <Button loading onClick={onClick}>
                Lưu thay đổi
            </Button>,
        );
        await user.click(screen.getByRole('button'));
        expect(onClick).not.toHaveBeenCalled();
    });

    it('calls onClick once when clicked and not loading', async () => {
        const user = userEvent.setup();
        const onClick = vi.fn();
        render(<Button onClick={onClick}>Lưu thay đổi</Button>);
        const button = screen.getByRole('button', { name: 'Lưu thay đổi' });
        expect(button).not.toHaveAttribute('aria-busy');
        await user.click(button);
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('defaults to type="button"', () => {
        render(<Button>Hủy</Button>);
        expect(screen.getByRole('button', { name: 'Hủy' })).toHaveAttribute('type', 'button');
    });

    it('keeps an explicit type="submit"', () => {
        render(<Button type="submit">Đăng nhập</Button>);
        expect(screen.getByRole('button', { name: 'Đăng nhập' })).toHaveAttribute('type', 'submit');
    });
});

describe('IconButton', () => {
    it('is named by its aria-label and defaults to type="button"', () => {
        render(
            <IconButton aria-label="Đóng">
                <svg aria-hidden="true" />
            </IconButton>,
        );
        expect(screen.getByRole('button', { name: 'Đóng' })).toHaveAttribute('type', 'button');
    });
});

describe('ButtonLink', () => {
    it('renders a link to its href, not a button', () => {
        render(<ButtonLink href="/job-postings">Tìm việc</ButtonLink>);
        expect(screen.getByRole('link', { name: 'Tìm việc' })).toHaveAttribute('href', '/job-postings');
        expect(screen.queryByRole('button')).toBeNull();
    });
});
