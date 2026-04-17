import { SERVER_URL } from '@/types/constants/urls';
import { SFT } from '@/types/fonts/fonts';

// Google SVG icon
function GoogleIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
            <path d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05" />
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
        </svg>
    );
}

// GitHub SVG icon
function GitHubIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
        </svg>
    );
}

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
                    href={`${SERVER_URL}/auth/github`}
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
