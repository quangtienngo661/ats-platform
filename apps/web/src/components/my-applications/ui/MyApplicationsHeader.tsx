import { PageToolbar } from '@/components/ui';

export function MyApplicationsHeader({ children }: { children?: React.ReactNode }) {
    return <PageToolbar title="Đơn của tôi">{children}</PageToolbar>;
}
