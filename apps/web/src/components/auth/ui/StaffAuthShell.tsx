import { FileSearch, ShieldCheck, SquareKanban, UserCheck } from 'lucide-react';
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
            {/*
              StaffLoginForm is still the dark glass card it was before the redesign (white text on a translucent
              fill). This night backing, at the card's own radius, keeps it readable on the light column. Delete it
              when the form moves to the light Field/Input primitives.
            */}
            <div className="rounded-[28px] bg-night">{children}</div>
        </AuthSplit>
    );
}
