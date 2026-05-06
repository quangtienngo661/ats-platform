import { GitHubIcon, GoogleIcon } from '@/components/public/icons/common.icon';
import { SERVER_URL } from '@/types/constants/urls';
import { SFT } from '@/types/fonts/fonts';

interface OAuthButtonsProps {
    errorMessage?: string | null;
}

export function OAuthButtons({ errorMessage }: OAuthButtonsProps) {
    return (
        <div className="mb-6">
            {errorMessage && (
                <div className="mb-4 px-4 py-3 rounded-xl bg-[#FFE5E5] text-[#FF3B30] text-[13px] text-center" style={{ fontFamily: SFT }}>
                    {errorMessage}
                </div>
            )}

            <div className="grid grid-cols-2 gap-3">
                {/* Google */}
                <a
                    // href={`${SERVER_URL}/auth/google`}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-[#E5E5EA] bg-white hover:bg-[#F5F5F7] hover:border-[#D2D2D7] hover:shadow-sm transition-all text-[13px] text-[#1D1D1F]"
                    style={{ fontFamily: SFT, fontWeight: 500, textDecoration: 'none' }}
                >
                    <GoogleIcon />
                    Google
                </a>

                {/* GitHub */}
                <a
                    // href={`${SERVER_URL}/auth/github`}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-[#E5E5EA] bg-white hover:bg-[#F5F5F7] hover:border-[#D2D2D7] hover:shadow-sm transition-all text-[13px] text-[#1D1D1F]"
                    style={{ fontFamily: SFT, fontWeight: 500, textDecoration: 'none' }}
                >
                    <GitHubIcon />
                    GitHub
                </a>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 mt-5">
                <div className="flex-1 h-px bg-[#F2F2F7]" />
                <span className="text-[12px] text-[#AEAEB2]" style={{ fontFamily: SFT }}>hoặc</span>
                <div className="flex-1 h-px bg-[#F2F2F7]" />
            </div>
        </div>
    );
}
