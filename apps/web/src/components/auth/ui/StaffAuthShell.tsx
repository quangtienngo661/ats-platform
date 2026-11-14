import { FileSearch, ShieldCheck, SquareKanban, UserCheck } from 'lucide-react';
import { StaffGlimpse } from './AuthGlimpse';
import { AuthSplit, type AuthValue } from './AuthSplit';

interface StaffAuthShellProps {
    children: React.ReactNode;
}

const STAFF_VALUES: readonly AuthValue[] = [
    { icon: FileSearch, text: 'Sàng lọc CV có giải thích' },
    { icon: SquareKanban, text: 'Quản lý pipeline từng tin tuyển dụng' },
    { icon: UserCheck, text: 'Quyết định cuối cùng luôn thuộc về bạn' },
];

/** The staff sign-in page: the candidate frame with the panel speaking to recruiters. */
export function StaffAuthShell({ children }: StaffAuthShellProps) {
    return (
        <AuthSplit
            panelLabel="TalentAI cho nhà tuyển dụng"
            values={STAFF_VALUES}
            glimpse={<StaffGlimpse />}
            note={
                // On a phone the line breaks between the two sentences, never inside one.
                <p className="mt-6 px-4 text-center text-caption text-ink-3">
                    <span className="whitespace-nowrap">
                        <ShieldCheck
                            size={14}
                            strokeWidth={1.75}
                            aria-hidden="true"
                            className="mr-1.5 inline-block -translate-y-px align-middle"
                        />
                        Kết nối bảo mật.
                    </span>{' '}
                    <span className="whitespace-nowrap">Chỉ dành cho nhân viên được ủy quyền.</span>
                </p>
            }
        >
            {children}
        </AuthSplit>
    );
}
