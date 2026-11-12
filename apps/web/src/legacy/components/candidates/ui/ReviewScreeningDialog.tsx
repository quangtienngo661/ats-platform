'use client';

import { startTransition, useId, useRef, useState } from 'react';
import { unstable_rethrow } from 'next/navigation';
import { effectiveScreeningScores, type ICVScreening } from '@ats-platform/types';
import { AccessibleDialog, DialogContent, DialogOverlay } from '@/legacy/components/common/AccessibleDialog';
import { toast } from '@/lib/toast';
import { reviewScreeningAction, type ReviewScreeningInput } from '@/servers/cv-screenings/cv-screenings.action';
import { SFT } from '@/types/fonts/fonts';

interface ReviewScreeningDialogProps {
    applicationId: string;
    screening: ICVScreening;
    onClose: () => void;
}

type ScoreField = 'skillsScore' | 'experienceScore' | 'educationScore';

const FIELDS: { field: ScoreField; label: string; inputLabel: string }[] = [
    { field: 'skillsScore', label: 'Kỹ năng', inputLabel: 'Điểm kỹ năng sau duyệt' },
    { field: 'experienceScore', label: 'Kinh nghiệm', inputLabel: 'Điểm kinh nghiệm sau duyệt' },
    { field: 'educationScore', label: 'Học vấn', inputLabel: 'Điểm học vấn sau duyệt' },
];

// Scores are kept to one decimal, like the Decimal(5,1) columns they end up in.
const round1 = (value: number) => Math.round(value * 10) / 10;

/** The AI's own score, whatever shape it arrived in (number or Decimal string). */
function aiScore(screening: ICVScreening, field: ScoreField): number | null {
    const value = Number(screening[field]);
    return screening[field] == null || !Number.isFinite(value) ? null : value;
}

export function ReviewScreeningDialog({ applicationId, screening, onClose }: ReviewScreeningDialogProps) {
    const noteId = useId();
    const effective = effectiveScreeningScores(screening);
    const [values, setValues] = useState<Record<ScoreField, string>>({
        skillsScore: String(effective.skills ?? ''),
        experienceScore: String(effective.experience ?? ''),
        educationScore: String(effective.education ?? ''),
    });
    const [note, setNote] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const submissionInFlight = useRef(false);

    const parsed = FIELDS.map(({ field }) => (values[field].trim() === '' ? NaN : Number(values[field])));
    const allValid = parsed.every(value => Number.isFinite(value) && value >= 0 && value <= 100);
    const changed = FIELDS.some(({ field }, index) => {
        const ai = aiScore(screening, field);
        return ai === null || round1(parsed[index]) !== round1(ai);
    });

    function submit() {
        if (isSubmitting || submissionInFlight.current) return;
        if (!allValid) {
            setError('Điểm phải từ 0 đến 100');
            return;
        }
        if (changed && note.trim() === '') {
            setError('Vui lòng nhập lý do khi sửa điểm');
            return;
        }

        // Lock before React renders the disabled button so rapid clicks cannot submit twice.
        submissionInFlight.current = true;
        setIsSubmitting(true);
        setError(null);

        const input: ReviewScreeningInput = {
            skillsScore: parsed[0],
            experienceScore: parsed[1],
            educationScore: parsed[2],
            ...(note.trim() ? { note: note.trim() } : {}),
        };

        startTransition(async () => {
            try {
                const result = await reviewScreeningAction(applicationId, input);
                if (result.success) {
                    toast.success('Đã duyệt', result.message);
                    onClose();
                } else {
                    setError(result.message || 'Duyệt điểm thất bại. Vui lòng thử lại.');
                }
            } catch (err) {
                unstable_rethrow(err);
                setError('Duyệt điểm thất bại. Vui lòng thử lại.');
            } finally {
                submissionInFlight.current = false;
                setIsSubmitting(false);
            }
        });
    }

    return (
        <AccessibleDialog onClose={onClose} dismissible={!isSubmitting}>
            <DialogOverlay className="fixed inset-0 bg-black/30 z-50" />
            <DialogContent title="Duyệt điểm sàng lọc">
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-2rem)] max-w-lg max-h-[85vh] overflow-y-auto bg-white rounded-2xl border border-[#F2F2F7] p-6 shadow-xl"
                    style={{ fontFamily: SFT }}>
                    <h2 className="text-[18px] text-[#1D1D1F] font-semibold mb-1">Duyệt điểm sàng lọc</h2>
                    <p className="text-[13px] text-[#6E6E73] mb-4">
                        Xác nhận điểm AI hoặc sửa từng điểm. Điểm tổng được tính lại theo cấu hình AI của lần chấm này.
                    </p>

                    <table className="w-full text-[13px] mb-4">
                        <thead>
                            <tr className="text-left text-[#6E6E73]">
                                <th scope="col" className="py-2 font-medium">Tiêu chí</th>
                                <th scope="col" className="py-2 font-medium">Điểm AI</th>
                                <th scope="col" className="py-2 font-medium">Điểm sau duyệt</th>
                            </tr>
                        </thead>
                        <tbody>
                            {FIELDS.map(({ field, label, inputLabel }) => {
                                const ai = aiScore(screening, field);
                                return (
                                    <tr key={field} className="border-t border-[#F2F2F7]">
                                        <td className="py-2.5 text-[#1D1D1F]">{label}</td>
                                        <td className="py-2.5 text-[#6E6E73]">{ai === null ? '—' : String(round1(ai))}</td>
                                        <td className="py-2.5">
                                            <input type="number" min={0} max={100} step={0.1}
                                                aria-label={inputLabel}
                                                value={values[field]} disabled={isSubmitting}
                                                onChange={event => setValues(prev => ({ ...prev, [field]: event.target.value }))}
                                                className="w-24 rounded-xl px-3 py-2 border border-[#E5E5EA] bg-[#F5F5F7] text-[#1D1D1F] focus-visible:outline-[#0071E3]" />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    <label htmlFor={noteId} className="block text-[13px] text-[#6E6E73] mb-2">
                        Lý do / ghi chú {changed ? '(bắt buộc khi sửa điểm)' : '(không bắt buộc)'}
                    </label>
                    <textarea id={noteId} value={note} maxLength={1000} rows={3} disabled={isSubmitting}
                        onChange={event => setNote(event.target.value)}
                        className="w-full rounded-xl px-3.5 py-2.5 border border-[#E5E5EA] bg-[#F5F5F7] text-[13px] text-[#1D1D1F] focus-visible:outline-[#0071E3]" />

                    {error && (
                        <p role="alert" className="mt-3 text-[13px] text-[#DC2626]">{error}</p>
                    )}

                    <div className="flex justify-end gap-2 mt-5">
                        <button type="button" onClick={onClose} disabled={isSubmitting}
                            className="px-4 py-2 rounded-xl text-[13px] text-[#1D1D1F] hover:bg-[#F5F5F7] disabled:opacity-50">
                            Hủy
                        </button>
                        <button type="button" onClick={submit} disabled={isSubmitting}
                            className="px-4 py-2 rounded-xl text-[13px] text-white bg-[#0071E3] hover:bg-[#0062C4] disabled:opacity-50">
                            {changed ? 'Lưu điểm duyệt' : 'Xác nhận điểm'}
                        </button>
                    </div>
                </div>
            </DialogContent>
        </AccessibleDialog>
    );
}
