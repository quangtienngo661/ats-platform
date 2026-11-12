import { act, render, screen } from '@testing-library/react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Avatar } from './Avatar';
import { Breadcrumbs } from './Breadcrumbs';
import { EmptyState } from './EmptyState';
import { PageToolbar } from './PageToolbar';
import { ScoreBar } from './ScoreBar';
import { Stat } from './Stat';
import { StatusChip } from './StatusChip';
import { Table, TBody, TD, TH, THead, TR } from './Table';

afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
});

function stubMotionPreference(reduce: boolean) {
    vi.stubGlobal('matchMedia', (q: string) => ({
        matches: reduce,
        media: q,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
    }));
}

describe('ScoreBar', () => {
    it('exposes the score as a meter', () => {
        render(<ScoreBar score={86} />);
        const meter = screen.getByRole('meter', { name: 'Gợi ý AI' });
        expect(meter).toHaveAttribute('aria-valuenow', '86');
        expect(meter).toHaveAttribute('aria-valuemin', '0');
        expect(meter).toHaveAttribute('aria-valuemax', '100');
        expect(screen.getByText('86')).toHaveClass('tabular-nums');
    });
    it.each([
        [104, '100'],
        [-3, '0'],
        [86.6, '87'],
    ])('clamps %s to %s for the meter and the visible number', (score, shown) => {
        render(<ScoreBar score={score} />);
        expect(screen.getByRole('meter', { name: 'Gợi ý AI' })).toHaveAttribute('aria-valuenow', shown);
        expect(screen.getByText(shown)).toBeInTheDocument();
    });
    it('treats NaN like a missing score', () => {
        render(<ScoreBar score={NaN} />);
        expect(screen.getByText('Chưa có điểm')).toBeInTheDocument();
        expect(screen.queryByRole('meter')).not.toBeInTheDocument();
    });
    it('uses a custom label', () => {
        render(<ScoreBar score={10} label="Độ phù hợp" />);
        expect(screen.getByRole('meter', { name: 'Độ phù hợp' })).toBeInTheDocument();
    });
    it('shows a placeholder and no meter without a score', () => {
        render(<ScoreBar score={null} />);
        expect(screen.getByText('Chưa có điểm')).toBeInTheDocument();
        expect(screen.queryByRole('meter')).not.toBeInTheDocument();
    });
});

describe('EmptyState', () => {
    it('renders heading, description and action', () => {
        render(
            <EmptyState
                title="Chưa có đơn ứng tuyển"
                description="Nộp đơn đầu tiên."
                action={<button type="button">Tìm việc</button>}
            />,
        );
        expect(screen.getByRole('heading', { level: 2, name: 'Chưa có đơn ứng tuyển' })).toBeInTheDocument();
        expect(screen.getByText('Nộp đơn đầu tiên.')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Tìm việc' })).toBeInTheDocument();
    });
});

describe('StatusChip', () => {
    it('shows the label', () => {
        render(<StatusChip kind="application" value="hired" />);
        expect(screen.getByText('Đã tuyển')).toBeInTheDocument();
    });
});

describe('Avatar', () => {
    it('shows the initials, hidden from assistive tech, with the name as title', () => {
        render(<Avatar name="Lê Ngọc Hân" />);
        const initials = screen.getByText('NH');
        expect(initials).toHaveAttribute('aria-hidden', 'true');
        expect(initials.closest('[title]')).toHaveAttribute('title', 'Lê Ngọc Hân');
    });
});

/** Manual clock: rAF callbacks queue up and run when the test advances time. */
function stubFrames() {
    let now = 0;
    let queue: Array<[number, FrameRequestCallback]> = [];
    let id = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => now);
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
        queue.push([++id, cb]);
        return id;
    });
    vi.stubGlobal('cancelAnimationFrame', (target: number) => {
        queue = queue.filter(([i]) => i !== target);
    });
    return (ms: number) => {
        const step = 16;
        for (let t = 0; t < ms; t += step) {
            now += step;
            const run = queue;
            queue = [];
            act(() => run.forEach(([, cb]) => cb(now)));
        }
    };
}

const visibleDigits = (root: ParentNode) => root.querySelector('[aria-hidden="true"]')?.textContent;

describe('Stat', () => {
    it('exposes the final value to assistive tech from the start', () => {
        stubMotionPreference(false);
        stubFrames();
        render(<Stat label="Ứng viên" value={1234} suffix="%" delta="+3" />);
        expect(screen.getByText('Ứng viên')).toBeInTheDocument();
        expect(screen.getByText('1.234%')).toHaveClass('sr-only');
        expect(screen.getByText('+3')).toBeInTheDocument();
    });

    it('renders the final value immediately under reduced motion', () => {
        stubMotionPreference(true);
        const advance = stubFrames();
        const { container } = render(<Stat label="Việc" value={42} />);
        expect(visibleDigits(container)).toBe('42');
        advance(100);
        expect(visibleDigits(container)).toBe('42');
    });

    it('counts up from 0 to the final value on a client-only mount', () => {
        stubMotionPreference(false);
        const advance = stubFrames();
        const { container } = render(<Stat label="Việc" value={200} />);
        expect(visibleDigits(container)).toBe('0');
        advance(300);
        const mid = Number(visibleDigits(container));
        expect(mid).toBeGreaterThan(0);
        expect(mid).toBeLessThan(200);
        advance(400);
        expect(visibleDigits(container)).toBe('200');
    });

    it('shows the final value straight away while hydrating, never 0', () => {
        stubMotionPreference(false);
        const advance = stubFrames();
        const container = document.createElement('div');
        document.body.appendChild(container);
        container.innerHTML = renderToString(<Stat label="Việc" value={200} />);
        expect(visibleDigits(container)).toBe('200');
        const seen: Array<string | null | undefined> = [];
        act(() => {
            hydrateRoot(container, <Stat label="Việc" value={200} />);
        });
        seen.push(visibleDigits(container));
        for (let i = 0; i < 45; i++) {
            advance(16);
            seen.push(visibleDigits(container));
        }
        expect(new Set(seen)).toEqual(new Set(['200']));
        container.remove();
    });

    it('shows a changed value directly, without resetting to 0', () => {
        stubMotionPreference(false);
        const advance = stubFrames();
        const { container, rerender } = render(<Stat label="Việc" value={200} />);
        advance(700);
        expect(visibleDigits(container)).toBe('200');
        rerender(<Stat label="Việc" value={350} />);
        expect(visibleDigits(container)).toBe('350');
        advance(700);
        expect(visibleDigits(container)).toBe('350');
    });
});

describe('Table', () => {
    it('renders a semantic table with numeric cells right-aligned', () => {
        render(
            <Table>
                <THead sticky>
                    <TR>
                        <TH>Tên</TH>
                        <TH numeric>Điểm</TH>
                    </TR>
                </THead>
                <TBody>
                    <TR>
                        <TD>An</TD>
                        <TD numeric>86</TD>
                    </TR>
                </TBody>
            </Table>,
        );
        expect(screen.getByRole('table')).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'Tên' })).toBeInTheDocument();
        expect(screen.getByRole('cell', { name: '86' })).toHaveClass('text-right', 'tabular-nums');
        expect(screen.getAllByRole('rowgroup')[0]).toHaveClass('sticky', 'z-sticky');
    });
});

describe('PageToolbar', () => {
    it('renders the title as h1 with actions', () => {
        render(
            <PageToolbar title="Tin tuyển dụng">
                <button>Tạo tin</button>
            </PageToolbar>,
        );
        expect(screen.getByRole('heading', { level: 1, name: 'Tin tuyển dụng' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Tạo tin' })).toBeInTheDocument();
    });
});

describe('Breadcrumbs', () => {
    it('links earlier items and marks the last as current', () => {
        render(
            <Breadcrumbs
                items={[{ label: 'Việc', href: '/jobs' }, { label: 'Chi tiết' }]}
            />,
        );
        expect(screen.getByRole('navigation', { name: 'Đường dẫn' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Việc' })).toHaveAttribute('href', '/jobs');
        expect(screen.getByText('Chi tiết')).toHaveAttribute('aria-current', 'page');
    });
});
