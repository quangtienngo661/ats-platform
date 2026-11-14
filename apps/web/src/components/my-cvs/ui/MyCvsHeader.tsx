import { Upload } from 'lucide-react';
import { Button, PageToolbar } from '@/components/ui';

interface MyCvsHeaderProps {
    onUpload: () => void;
}

export function MyCvsHeader({ onUpload }: MyCvsHeaderProps) {
    return (
        <PageToolbar title="CV của tôi">
            <Button onClick={onUpload}>
                <Upload aria-hidden="true" strokeWidth={1.75} />
                Tải CV lên
            </Button>
        </PageToolbar>
    );
}
