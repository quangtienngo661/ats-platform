import { CheckCircle2, Eye, FileText, MoreHorizontal, Trash2 } from 'lucide-react';
import {
    Badge,
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    IconButton,
    StatusChip,
} from '@/components/ui';
import { ICvDto } from '@/types/interfaces/cv.interface';

interface CvCardProps {
    cv: ICvDto;
    onView: () => void;
    onDelete: () => void;
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
        timeZone: 'Asia/Ho_Chi_Minh',
    });
}

export function CvCard({ cv, onView, onDelete }: CvCardProps) {
    const technicalSkills = cv.parsedData?.skills?.technical ?? [];
    const isConfirmed = cv.parsedData?.isConfirmed;
    const expCount = cv.parsedData?.experience?.length ?? 0;
    const projCount = cv.parsedData?.projects?.length ?? 0;
    const canView = cv.parsingStatus === 'completed';
    const facts = [expCount > 0 && `${expCount} kinh nghiệm`, projCount > 0 && `${projCount} dự án`].filter(Boolean);

    return (
        <div className="relative flex h-full flex-col rounded-card bg-surface p-4 shadow-e1 transition duration-hover ease-out-expo hover:-translate-y-0.5 hover:shadow-e3">
            <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-card bg-surface-2 text-ink-2">
                    <FileText size={20} strokeWidth={1.75} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                    {canView ? (
                        <button
                            type="button"
                            onClick={onView}
                            title={cv.fileName}
                            className="block w-full truncate text-left text-body-sm font-medium text-ink after:absolute after:inset-0 after:rounded-card"
                        >
                            {cv.fileName}
                        </button>
                    ) : (
                        <p title={cv.fileName} className="truncate text-body-sm font-medium text-ink">
                            {cv.fileName}
                        </p>
                    )}
                    <p className="mt-0.5 text-caption tabular-nums text-ink-3">Tải lên {formatDate(cv.uploadedAt)}</p>
                </div>
                <div className="relative -mr-1 -mt-1">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <IconButton aria-label={`Tùy chọn cho ${cv.fileName}`} size="sm">
                                <MoreHorizontal aria-hidden="true" strokeWidth={1.75} />
                            </IconButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {canView && (
                                <DropdownMenuItem onSelect={onView}>
                                    <Eye aria-hidden="true" size={16} strokeWidth={1.75} />
                                    Xem chi tiết
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem destructive onSelect={onDelete}>
                                <Trash2 aria-hidden="true" size={16} strokeWidth={1.75} />
                                Xóa
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {cv.parsingStatus === 'processing' && (
                    <span aria-hidden="true" className="size-1.5 rounded-full bg-accent motion-safe:animate-pulse" />
                )}
                <StatusChip kind="parsing" value={cv.parsingStatus} />
                {isConfirmed && (
                    <Badge tone="success">
                        <CheckCircle2 aria-hidden="true" size={12} strokeWidth={1.75} className="mr-1" />
                        Đã xác nhận hồ sơ
                    </Badge>
                )}
            </div>

            {facts.length > 0 && <p className="mt-3 text-caption tabular-nums text-ink-3">{facts.join(' · ')}</p>}

            {technicalSkills.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {technicalSkills.slice(0, 4).map((skill) => (
                        <Badge key={skill} className="max-w-full truncate">{skill}</Badge>
                    ))}
                    {technicalSkills.length > 4 && (
                        <span className="text-caption text-ink-3">+{technicalSkills.length - 4} kỹ năng</span>
                    )}
                </div>
            )}
        </div>
    );
}
