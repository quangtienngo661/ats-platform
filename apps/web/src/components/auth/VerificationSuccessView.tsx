import { CircleCheck, ShieldCheck, Sparkles } from 'lucide-react';
import { ButtonLink } from '@/components/ui';
import { AuthHeading } from './ui/AuthParts';

const FEATURES = [
    { icon: Sparkles, text: 'Hồ sơ AI-Driven được tạo tự động từ CV' },
    { icon: ShieldCheck, text: 'Quản lý đơn ứng tuyển dễ dàng' },
];

export default function VerificationSuccessView() {
    return (
        <div className="motion-safe:animate-rise">
            <CircleCheck aria-hidden="true" strokeWidth={1.75} className="mb-4 size-7 text-success" />
            <AuthHeading
                title="Đã xác thực email"
                description="Tài khoản của bạn đã được kích hoạt. Đăng nhập để dùng TalentAI."
            />

            <ul className="mb-6 flex flex-col gap-3 rounded-card bg-surface-2 p-4">
                {FEATURES.map(({ icon: Icon, text }) => (
                    <li key={text} className="flex items-center gap-3 text-body-sm text-ink">
                        <Icon aria-hidden="true" strokeWidth={1.75} className="size-4 shrink-0 text-ink-2" />
                        {text}
                    </li>
                ))}
            </ul>

            <ButtonLink href="/sign-in" size="lg" className="w-full">
                Đến trang đăng nhập
            </ButtonLink>
        </div>
    );
}
