import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AuthShell } from './AuthShell';
import { StaffAuthShell } from './StaffAuthShell';

const CANDIDATE_VALUES = [
    'Tìm việc hợp với kỹ năng của bạn',
    'Theo dõi đơn ứng tuyển ở một nơi',
    'Luyện phỏng vấn với AI trước vòng thật',
];
const STAFF_VALUES = [
    'Sàng lọc CV có giải thích',
    'Quản lý pipeline từng tin tuyển dụng',
    'Quyết định cuối cùng luôn thuộc về bạn',
];

function valueLines(panel: HTMLElement) {
    return within(panel)
        .getAllByRole('listitem')
        .map((item) => item.textContent);
}

describe('AuthShell', () => {
    it('puts the form in the one main landmark, under a logo that links home', () => {
        render(
            <AuthShell>
                <form aria-label="Đăng nhập" />
            </AuthShell>,
        );

        const mains = screen.getAllByRole('main');
        expect(mains).toHaveLength(1);
        expect(mains[0]).toHaveAttribute('id', 'main-content');
        expect(within(mains[0]).getByRole('form', { name: 'Đăng nhập' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'TalentAI' })).toHaveAttribute('href', '/');
    });

    it('lists the three candidate values, in order, in the brand panel', () => {
        render(<AuthShell>form</AuthShell>);

        const panel = screen.getByRole('complementary');
        expect(valueLines(panel)).toEqual(CANDIDATE_VALUES);
        expect(within(panel).queryByText(STAFF_VALUES[0])).toBeNull();
    });

    it('shows the terms by default and hides them with showTerms={false}', () => {
        const { unmount } = render(<AuthShell>form</AuthShell>);
        expect(screen.getByText(/bạn đồng ý với/)).toHaveTextContent(
            'Bằng cách sử dụng dịch vụ, bạn đồng ý với Điều khoản dịch vụ và Chính sách bảo mật.',
        );
        unmount();

        render(<AuthShell showTerms={false}>form</AuthShell>);
        expect(screen.queryByText(/bạn đồng ý với/)).toBeNull();
    });
});

describe('StaffAuthShell', () => {
    it('puts the form in the one main landmark, under a logo that links home', () => {
        render(
            <StaffAuthShell>
                <form aria-label="Cổng nội bộ" />
            </StaffAuthShell>,
        );

        const mains = screen.getAllByRole('main');
        expect(mains).toHaveLength(1);
        expect(mains[0]).toHaveAttribute('id', 'main-content');
        expect(within(mains[0]).getByRole('form', { name: 'Cổng nội bộ' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'TalentAI' })).toHaveAttribute('href', '/');
    });

    it('swaps the panel to the recruiter values', () => {
        render(<StaffAuthShell>form</StaffAuthShell>);

        const panel = screen.getByRole('complementary');
        expect(valueLines(panel)).toEqual(STAFF_VALUES);
        expect(within(panel).queryByText(CANDIDATE_VALUES[0])).toBeNull();
    });

    it('keeps the security notice, without the emoji', () => {
        render(<StaffAuthShell>form</StaffAuthShell>);

        const notice = screen.getByText(/Kết nối bảo mật/).closest('p');
        expect(notice).toHaveTextContent('Kết nối bảo mật. Chỉ dành cho nhân viên được ủy quyền.', {
            normalizeWhitespace: true,
        });
        expect(notice?.textContent).not.toMatch(/\p{Extended_Pictographic}/u);
        expect(screen.queryByText(/bạn đồng ý với/)).toBeNull();
    });
});
