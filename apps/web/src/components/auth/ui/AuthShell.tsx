import { ListChecks, MessagesSquare, Search } from 'lucide-react';
import { CandidateGlimpse } from './AuthGlimpse';
import { AuthSplit, type AuthValue } from './AuthSplit';

interface AuthShellProps {
    children: React.ReactNode;
    showTerms?: boolean;
}

const CANDIDATE_VALUES: readonly AuthValue[] = [
    { icon: Search, text: 'Tìm việc hợp với kỹ năng của bạn' },
    { icon: ListChecks, text: 'Theo dõi đơn ứng tuyển ở một nơi' },
    { icon: MessagesSquare, text: 'Luyện phỏng vấn với AI trước vòng thật' },
];

/** The candidate sign-in, sign-up and password pages. */
export function AuthShell({ children, showTerms = true }: AuthShellProps) {
    return (
        <AuthSplit
            panelLabel="TalentAI cho người tìm việc"
            values={CANDIDATE_VALUES}
            glimpse={<CandidateGlimpse />}
            note={
                showTerms && (
                    // The two documents have no pages yet, so they are named, not linked.
                    <p className="mt-6 px-4 text-center text-caption text-ink-3">
                        Bằng cách sử dụng dịch vụ, bạn đồng ý với{' '}
                        <span className="whitespace-nowrap font-medium text-ink-2">Điều khoản dịch vụ</span> và{' '}
                        <span className="whitespace-nowrap font-medium text-ink-2">Chính sách bảo mật</span>.
                    </p>
                )
            }
        >
            {children}
        </AuthSplit>
    );
}
