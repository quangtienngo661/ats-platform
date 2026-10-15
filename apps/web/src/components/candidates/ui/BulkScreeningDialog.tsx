'use client';

import { startTransition, useId, useRef, useState } from 'react';
import { unstable_rethrow } from 'next/navigation';
import type { IBulkScreeningResult } from '@ats-platform/types';
import { AccessibleDialog, DialogContent, DialogOverlay } from '@/components/common/AccessibleDialog';
import { bulkScreenApplicationsAction } from '@/servers/applications/applications.action';
import { SCREENING_SKIP_REASON_LABELS } from '@/types/constants/screening-skip-reasons';
import { SFT } from '@/types/fonts/fonts';
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
    const configSelectId = useId();
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
                    setError(response.message || 'Chấm CV hàng loạt thất bại');
                }
            } catch (err) {
                unstable_rethrow(err);
                setError('Chấm CV hàng loạt thất bại. Vui lòng thử lại.');
            } finally {
                submissionInFlight.current = false;
                setIsSubmitting(false);
            }
        });
    }

    const emptyAutoRun = mode.kind === 'auto' && result
        && result.queued.length === 0 && result.skipped.length === 0 && result.remaining === 0;

    return (
        <AccessibleDialog onClose={onClose} dismissible={!isSubmitting}>
            <DialogOverlay className="fixed inset-0 bg-black/30 z-50" />
            <DialogContent title="Chấm CV hàng loạt">
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-2rem)] max-w-lg max-h-[85vh] overflow-y-auto bg-white rounded-2xl border border-[#F2F2F7] p-6 shadow-xl"
                    style={{ fontFamily: SFT }}>
                    <h2 className="text-[18px] text-[#1D1D1F] font-semibold mb-4">Chấm CV hàng loạt</h2>

                    {!result && (
                        <div className="space-y-4">
                            <div>
                                <label htmlFor={configSelectId} className="block text-[13px] text-[#6E6E73] mb-2">
                                    Cấu hình AI
                                </label>
                                <select id={configSelectId} value={configId}
                                    onChange={event => setConfigId(event.target.value)} disabled={isSubmitting}
                                    className="w-full rounded-xl px-3.5 py-2.5 border border-[#E5E5EA] bg-[#F5F5F7] text-[13px] text-[#1D1D1F] focus-visible:outline-[#0071E3]">
                                    {aiProfiles.length === 0 && <option value="">Cấu hình mặc định</option>}
                                    {aiProfiles.map(profile => (
                                        <option key={profile.configId} value={profile.configId}>{profile.name}</option>
                                    ))}
                                </select>
                            </div>
                            {appliedCount > 0 && (
                                <p className="text-[13px] text-[#6E6E73]">{appliedCount} đơn đang ở 'Mới'</p>
                            )}
                            <label className="flex items-start gap-2.5 text-[13px] text-[#1D1D1F] cursor-pointer">
                                <input type="checkbox" checked={moveAppliedToScreening} disabled={isSubmitting}
                                    onChange={event => setMoveAppliedToScreening(event.target.checked)}
                                    className="w-4 h-4 mt-0.5 shrink-0 accent-[#0071E3]" />
                                <span>Chuyển các đơn ở 'Mới' sang 'Sàng lọc' trước khi chấm</span>
                            </label>
                        </div>
                    )}

                    {result && (
                        <div role="status" className="space-y-3 text-[13px] text-[#1D1D1F]">
                            {emptyAutoRun ? (
                                <p>Không có đơn nào cần chấm</p>
                            ) : (
                                <>
                                    <p className="font-medium">Đã đưa {result.queued.length} đơn vào hàng đợi</p>
                                    <p>Bỏ qua {result.skipped.length} đơn</p>
                                    {result.skipped.length > 0 && (
                                        <ul className="space-y-2 text-[#6E6E73]">
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

                    {error && <p role="alert" className="mt-4 text-[13px] text-[#DC2626]">{error}</p>}
                    {isSubmitting && (
                        <p role="status" className="mt-4 text-[13px] text-[#6E6E73]">Đang gửi yêu cầu chấm...</p>
                    )}

                    <div className="flex justify-end gap-2 mt-6">
                        <button type="button" onClick={onClose} disabled={isSubmitting}
                            className="px-3.5 py-2.5 rounded-xl text-[13px] text-[#6E6E73] hover:bg-[#F5F5F7] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            Đóng
                        </button>
                        {(!result || result.remaining > 0) && (
                            <button type="button" onClick={startScreening} disabled={isSubmitting}
                                className="px-3.5 py-2.5 rounded-xl bg-[#0071E3] text-white text-[13px] font-medium hover:bg-[#005BB5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                Bắt đầu chấm
                            </button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </AccessibleDialog>
    );
}
