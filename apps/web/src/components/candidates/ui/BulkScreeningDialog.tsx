'use client';

import { startTransition, useId, useRef, useState } from 'react';
import { unstable_rethrow } from 'next/navigation';
import type { IBulkScreeningResult } from '@ats-platform/types';
import { Button, Checkbox, Dialog, Field, Select } from '@/components/ui';
import { bulkScreenApplicationsAction } from '@/servers/applications/applications.action';
import { SCREENING_SKIP_REASON_LABELS } from '@/types/constants/screening-skip-reasons';
import type { IApplicationDto } from '@/types/interfaces/application.interface';
import type { ConfigProfile } from '@/types/interfaces/configProfile.interface';

export type BulkScreeningMode =
    | { kind: 'selected'; applications: IApplicationDto[] }
    | { kind: 'auto' };

interface BulkScreeningDialogProps {
    jobId: string;
    mode: BulkScreeningMode;
    applications: IApplicationDto[];
    aiProfiles: ConfigProfile[];
    onClose: () => void;
}

export function BulkScreeningDialog({
    jobId, mode, applications, aiProfiles, onClose,
}: BulkScreeningDialogProps) {
    const moveCheckboxId = useId();
    const [configId, setConfigId] = useState(() =>
        aiProfiles.find(profile => profile.isDefault)?.configId || aiProfiles[0]?.configId || '');
    const [moveAppliedToScreening, setMoveAppliedToScreening] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const submissionInFlight = useRef(false);
    const [result, setResult] = useState<IBulkScreeningResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const appliedCount = mode.kind === 'selected'
        ? mode.applications.filter(application => application.status === 'applied').length
        : 0;

    function startScreening() {
        if (isSubmitting || submissionInFlight.current) return;
        // Lock before React renders the disabled button so rapid clicks cannot submit twice.
        submissionInFlight.current = true;
        setIsSubmitting(true);
        setError(null);

        startTransition(async () => {
            try {
                const response = await bulkScreenApplicationsAction(jobId, {
                    ...(mode.kind === 'selected'
                        ? { applicationIds: mode.applications.map(application => application.applicationId) }
                        : {}),
                    moveAppliedToScreening,
                    ...(configId ? { configId } : {}),
                });
                if (response.success && response.data) {
                    setResult(response.data);
                } else {
                    setError(response.message || 'Không chấm được CV hàng loạt. Thử lại.');
                }
            } catch (err) {
                unstable_rethrow(err);
                setError('Không chấm được CV hàng loạt. Thử lại.');
            } finally {
                submissionInFlight.current = false;
                setIsSubmitting(false);
            }
        });
    }

    const emptyAutoRun = mode.kind === 'auto' && result
        && result.queued.length === 0 && result.skipped.length === 0 && result.remaining === 0;

    return (
        <Dialog
            open
            onOpenChange={(open) => {
                if (!open && !isSubmitting) onClose();
            }}
            title="Chấm CV hàng loạt"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
                        Đóng
                    </Button>
                    {(!result || result.remaining > 0) && (
                        <Button onClick={startScreening} loading={isSubmitting}>
                            Bắt đầu chấm
                        </Button>
                    )}
                </>
            }
        >
            {!result && (
                <div className="space-y-4">
                    <Field label="Cấu hình AI">
                        {(control) => (
                            <Select {...control} value={configId}
                                onChange={event => setConfigId(event.target.value)} disabled={isSubmitting}>
                                {aiProfiles.length === 0 && <option value="">Cấu hình mặc định</option>}
                                {aiProfiles.map(profile => (
                                    <option key={profile.configId} value={profile.configId}>{profile.name}</option>
                                ))}
                            </Select>
                        )}
                    </Field>
                    {appliedCount > 0 && (
                        <p className="text-body-sm tabular-nums text-ink-2">{appliedCount} đơn đang ở 'Mới'</p>
                    )}
                    <div className="flex items-start gap-2.5">
                        <Checkbox id={moveCheckboxId} checked={moveAppliedToScreening} disabled={isSubmitting}
                            onChange={event => setMoveAppliedToScreening(event.target.checked)}
                            className="mt-0.5" />
                        <label htmlFor={moveCheckboxId} className="cursor-pointer text-body-sm text-ink">
                            Chuyển các đơn ở 'Mới' sang 'Sàng lọc' trước khi chấm
                        </label>
                    </div>
                </div>
            )}

            {result && (
                <div role="status" className="space-y-3 text-body-sm text-ink">
                    {emptyAutoRun ? (
                        <p>Không có đơn nào cần chấm</p>
                    ) : (
                        <>
                            <p className="font-medium">Đã đưa {result.queued.length} đơn vào hàng đợi</p>
                            <p>Bỏ qua {result.skipped.length} đơn</p>
                            {result.skipped.length > 0 && (
                                <ul className="space-y-2 break-words text-ink-2">
                                    {result.skipped.map(item => {
                                        const name = applications.find(application => application.applicationId === item.applicationId)
                                            ?.candidate?.user?.fullName || `Mã đơn ${item.applicationId.slice(0, 8)}`;
                                        return (
                                            <li key={item.applicationId}>
                                                {name}: {SCREENING_SKIP_REASON_LABELS[item.reason]}
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                            {result.remaining > 0 && (
                                <p>Còn {result.remaining} đơn đủ điều kiện chưa chấm, bấm lại để chấm tiếp</p>
                            )}
                        </>
                    )}
                </div>
            )}

            {error && <p role="alert" className="mt-4 text-body-sm text-danger">{error}</p>}
            {isSubmitting && (
                <p role="status" className="mt-4 text-body-sm text-ink-3">Đang gửi yêu cầu chấm…</p>
            )}
        </Dialog>
    );
}
