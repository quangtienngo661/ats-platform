import { Upload } from 'lucide-react';

interface MyCvsHeaderProps {
    onUpload: () => void;
}

export function MyCvsHeader({ onUpload }: MyCvsHeaderProps) {
    return (
        <div className="mb-6">
            <div className="flex items-center justify-end">
                <h1 className="sr-only">CV của tôi</h1>

                <button
                    onClick={onUpload}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-xl transition shadow-sm text-[13px]"
                    style={{ fontWeight: 500 }}
                >
                    <Upload className="w-4 h-4" />
                    Tải CV lên
                </button>
            </div>
        </div>
    );
}
