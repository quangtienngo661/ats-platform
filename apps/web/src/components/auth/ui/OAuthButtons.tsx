import { GitHubIcon, GoogleIcon } from '@/components/public/icons/common.icon';
import { Button } from '@/components/ui';
import { AuthAlert, AuthDivider } from './AuthParts';

interface OAuthButtonsProps {
    errorMessage?: string | null;
}

/** Not mounted yet: the providers are disabled until the API exposes the OAuth routes. */
export function OAuthButtons({ errorMessage }: OAuthButtonsProps) {
    return (
        <div className="mb-6 flex flex-col gap-3">
            {errorMessage ? <AuthAlert>{errorMessage}</AuthAlert> : null}

            <Button type="button" variant="secondary" size="lg" disabled className="w-full">
                <GoogleIcon />
                Tiếp tục với Google
            </Button>
            <Button type="button" variant="secondary" size="lg" disabled className="w-full">
                <GitHubIcon />
                Tiếp tục với GitHub
            </Button>

            <AuthDivider />
        </div>
    );
}
