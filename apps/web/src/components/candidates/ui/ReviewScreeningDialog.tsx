'use client';

import { startTransition, useRef, useState } from 'react';
import { unstable_rethrow } from 'next/navigation';
import { effectiveScreeningScores, type ICVScreening } from '@ats-platform/types';
import { Button, Dialog, Field, Input, Textarea } from '@/components/ui';
import { toast } from '@/lib/toast';
import { reviewScreeningAction, type ReviewScreeningInput } from '@/servers/cv-screenings/cv-screenings.action';

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
        <Dialog
            open
            onOpenChange={(next) => {
                if (!next && !isSubmitting) onClose();
            }}
            title="Duyệt điểm sàng lọc"
            description="Xác nhận điểm AI hoặc sửa từng điểm. Điểm tổng được tính lại theo cấu hình AI của lần chấm này."
            footer={
                <>
                    <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
                        Hủy
                    </Button>
                    <Button onClick={submit} loading={isSubmitting}>
                        {changed ? 'Lưu điểm duyệt' : 'Xác nhận điểm'}
                    </Button>
                </>
            }
        >
            <table className="mb-4 w-full text-body-sm">
                <thead>
                    <tr className="text-left text-ink-3">
                        <th scope="col" className="py-2 font-medium">Tiêu chí</th>
                        <th scope="col" className="py-2 font-medium">Điểm AI</th>
                        <th scope="col" className="py-2 font-medium">Điểm sau duyệt</th>
                    </tr>
                </thead>
                <tbody>
                    {FIELDS.map(({ field, label, inputLabel }) => {
                        const ai = aiScore(screening, field);
                        return (
                            <tr key={field} className="border-t border-line">
                                <td className="py-2.5 text-ink">{label}</td>
                                <td className="py-2.5 tabular-nums text-ink-3">{ai === null ? '—' : String(round1(ai))}</td>
                                <td className="py-2.5">
                                    <Input
                                        type="number" min={0} max={100} step={0.1}
                                        aria-label={inputLabel}
                                        value={values[field]} disabled={isSubmitting}
                                        onChange={event => setValues(prev => ({ ...prev, [field]: event.target.value }))}
                                        className="w-24"
                                    />
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            <Field label={`Lý do / ghi chú ${changed ? '(bắt buộc khi sửa điểm)' : '(không bắt buộc)'}`}>
                {(control) => (
                    <Textarea
                        {...control}
                        value={note} maxLength={1000} rows={3} disabled={isSubmitting}
                        onChange={event => setNote(event.target.value)}
                    />
                )}
            </Field>

            {error && (
                <p role="alert" className="mt-3 text-body-sm text-danger">{error}</p>
            )}
        </Dialog>
    );
}
