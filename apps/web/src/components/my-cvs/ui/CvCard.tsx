import { FileText, Trash2, Eye, CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { SF, SFT } from '@/types/fonts/fonts';
import { ICvDto } from '@/types/interfaces/cv.interface';

interface CvCardProps {
    cv: ICvDto;
    onView: () => void;
    onDelete: () => void;
}

const STATUS_CONFIG: Record<ICvDto['parsingStatus'], {
    label: string; color: string; bg: string; icon: typeof CheckCircle;
}> = {
    completed: { label: 'Đã phân tích', color: '#16A34A', bg: '#E8F5E9', icon: CheckCircle },
    pending: { label: 'Chờ xử lý', color: '#F59E0B', bg: '#FFFBEB', icon: Clock },
    processing: { label: 'Đang phân tích', color: '#0EA5E9', bg: '#F0F9FF', icon: Loader2 },
    failed: { label: 'Lỗi phân tích', color: '#DC2626', bg: '#FEF2F2', icon: AlertCircle },
};

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
}

export function CvCard({ cv, onView, onDelete }: CvCardProps) {
    const status = STATUS_CONFIG[cv.parsingStatus];
    const StatusIcon = status.icon;
    const technicalSkills = cv.parsedData?.skills?.technical ?? [];
    const isConfirmed = cv.parsedData?.isConfirmed;
    const expCount = cv.parsedData?.experience?.length ?? 0;
    const projCount = cv.parsedData?.projects?.length ?? 0;

    return (
        <div className="group bg-white rounded-2xl border border-[#E5E5EA] p-5 hover:shadow-md hover:shadow-black/5 transition-all">
            <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-[#EBF3FD] flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 text-[#0071E3]" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    {/* Title row */}
                    <div className="flex items-center gap-2 mb-1">
                        <p
                            className="text-[15px] text-[#1D1D1F] truncate"
                            style={{ fontFamily: SF, fontWeight: 600 }}
                        >
                            {cv.fileName}
                        </p>
                        {isConfirmed && (
                            <span
                                className="text-[10px] text-[#16A34A] bg-[#E8F5E9] rounded-full px-2 py-0.5 flex-shrink-0 inline-flex items-center gap-1"
                                style={{ fontWeight: 600 }}
                            >
                                <CheckCircle className="w-2.5 h-2.5" />
                                Đã xác nhận hồ sơ
                            </span>
                        )}
                    </div>

                    <p className="text-[12px] text-[#AEAEB2] mb-2">
                        Tải lên {formatDate(cv.uploadedAt)}
                        {expCount > 0 && ` · ${expCount} kinh nghiệm`}
                        {projCount > 0 && ` · ${projCount} dự án`}
                    </p>

                    {/* Status + Skills preview */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <span
                            className="text-[11px] rounded-full px-2.5 py-1 inline-flex items-center gap-1 flex-shrink-0"
                            style={{ background: status.bg, color: status.color, fontWeight: 600 }}
                        >
                            <StatusIcon className={`w-3 h-3 ${cv.parsingStatus === 'processing' ? 'animate-spin' : ''}`} />
                            {status.label}
                        </span>

                        {technicalSkills.slice(0, 4).map((skill) => (
                            <span key={skill} className="text-[11px] text-[#6E6E73] bg-[#F5F5F7] rounded-md px-2 py-0.5">
                                {skill}
                            </span>
                        ))}
                        {technicalSkills.length > 4 && (
                            <span className="text-[11px] text-[#AEAEB2]">
                                +{technicalSkills.length - 4} kỹ năng
                            </span>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    {cv.parsingStatus === 'completed' && (
                        <button
                            onClick={onView}
                            className="p-2 rounded-lg text-[#0071E3] hover:bg-[#EBF3FD] transition-colors"
                            title="Xem chi tiết & xác nhận"
                        >
                            <Eye className="w-4 h-4" />
                        </button>
                    )}
                    <button
                        onClick={onDelete}
                        className="p-2 rounded-lg text-[#FF3B30] hover:bg-[#FFE5E5] transition-colors"
                        title="Xóa"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
