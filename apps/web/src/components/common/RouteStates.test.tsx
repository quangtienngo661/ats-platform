import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import InterviewError from '@/app/(interview-session)/error';
import InterviewLoading from '@/app/(interview-session)/loading';
import GlobalError from '@/app/global-error';
import NotFound from '@/app/not-found';
import RouteError from './RouteError';
import RouteLoading from './RouteLoading';

const router = vi.hoisted(() => ({ refresh: vi.fn(), push: vi.fn() }));

vi.mock('next/navigation', () => ({ useRouter: () => router }));

beforeEach(() => {
    router.refresh.mockReset();
});

describe('NotFound', () => {
    it('names the problem and offers the home page and the job search', () => {
        render(<NotFound />);

        expect(screen.getByRole('heading', { level: 1, name: 'Không tìm thấy trang' })).toBeVisible();
        expect(screen.getByRole('link', { name: 'Về trang chủ' })).toHaveAttribute('href', '/');
        expect(screen.getByRole('link', { name: 'Tìm việc' })).toHaveAttribute('href', '/job-postings');
    });

    it('renders inside the root layout only, so it owns the one main landmark', () => {
        render(<NotFound />);

        const mains = screen.getAllByRole('main');
        expect(mains).toHaveLength(1);
        expect(mains[0]).toHaveAttribute('id', 'main-content');
        expect(within(mains[0]).getByRole('heading', { level: 1 })).toHaveTextContent('Không tìm thấy trang');
    });
});

describe('RouteLoading', () => {
    it('announces the wait as a status named "Đang tải…"', () => {
        render(<RouteLoading />);

        const status = screen.getByRole('status', { name: 'Đang tải…' });
        expect(status).toHaveTextContent('Đang tải…');
    });
});

describe('RouteError', () => {
    it('says what failed, with the wording rule (not "Không thể tải dữ liệu")', () => {
        render(<RouteError error={new Error('boom')} reset={vi.fn()} />);

        const alert = screen.getByRole('alert');
        expect(within(alert).getByRole('heading', { name: 'Không tải được dữ liệu.' })).toBeVisible();
        expect(alert).not.toHaveTextContent('Không thể tải dữ liệu');
        expect(alert).not.toHaveTextContent('Vui lòng');
    });

    it('"Thử lại" refreshes the server data and resets the boundary, once each', async () => {
        const user = userEvent.setup();
        const reset = vi.fn();
        render(<RouteError error={new Error('boom')} reset={reset} />);

        await user.click(screen.getByRole('button', { name: 'Thử lại' }));

        expect(router.refresh).toHaveBeenCalledTimes(1);
        expect(reset).toHaveBeenCalledTimes(1);
    });
});

describe('route states on the night surface of the mock interview', () => {
    // Light tokens on the night shell would put ink text on near-black and a white card in the dark session.
    const LIGHT_ONLY = /(^|\s)(bg-surface|bg-surface-2|bg-canvas|text-ink|text-ink-2|text-ink-3|bg-ink)(\s|$)/;

    it('the interview loader keeps the status name and uses night tokens only', () => {
        const { container } = render(<InterviewLoading />);

        expect(screen.getByRole('status', { name: 'Đang tải…' })).toBeInTheDocument();
        for (const element of container.querySelectorAll('[class]')) {
            expect(element.getAttribute('class')).not.toMatch(LIGHT_ONLY);
        }
    });

    it('the interview error keeps the copy and the retry, and uses night tokens only', async () => {
        const user = userEvent.setup();
        const reset = vi.fn();
        const { container } = render(<InterviewError error={new Error('boom')} reset={reset} />);

        expect(screen.getByRole('heading', { name: 'Không tải được dữ liệu.' })).toBeVisible();
        // The retry button is the one light element on purpose: on a dark surface the light button is the primary.
        for (const element of container.querySelectorAll('[class]:not(button):not(button *)')) {
            expect(element.getAttribute('class')).not.toMatch(LIGHT_ONLY);
        }
        await user.click(screen.getByRole('button', { name: 'Thử lại' }));
        expect(router.refresh).toHaveBeenCalledTimes(1);
        expect(reset).toHaveBeenCalledTimes(1);
    });
});

describe('GlobalError', () => {
    it('renders its own Vietnamese document, with diacritics and the error digest', () => {
        const error = Object.assign(new Error('boom'), { digest: 'abc123' });
        const html = renderToStaticMarkup(<GlobalError error={error} reset={vi.fn()} />);

        expect(html).toMatch(/^<html lang="vi"/);
        expect(html).toContain('<body');
        expect(html).toContain('Không hiển thị được trang.');
        expect(html).toContain('Thử lại');
        expect(html).toContain('abc123');
        expect(html).not.toMatch(/Khong the|Thu lai|Vui l/);
    });
});
