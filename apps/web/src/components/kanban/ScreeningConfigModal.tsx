'use client';
import { useLatestCallback } from '@/lib/useLatestCallback';

import { useActionState, useEffect, useId } from 'react';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { ConfigProfile } from '@/types/interfaces/configProfile.interface';
import { ApplicationActionState, triggerCvScreeningAction } from '@/servers/applications/applications.action';
import { Badge, Button, Dialog } from '@/components/ui';

interface ScreeningConfigModalProps {
    applicationId: string;
    candidateName: string;
    roleName: string;
    aiProfiles: ConfigProfile[];
    onClose: () => void;
    onSuccess: () => void;
}

const initialState: ApplicationActionState = { success: false, message: '' };

const weightPill = 'rounded-ctl bg-surface-2 px-1.5 py-0.5 text-micro tabular-nums text-ink-2';

export default function ScreeningConfigModal({
    applicationId,
    candidateName,
    roleName,
    aiProfiles,
    onClose,
    onSuccess,
}: ScreeningConfigModalProps) {
    const defaultProfile = aiProfiles.find(p => p.isDefault) ?? aiProfiles[0] ?? null;

    const onCloseLatest = useLatestCallback(onClose);
    const onSuccessLatest = useLatestCallback(onSuccess);
    const [state, formAction, pending] = useActionState(triggerCvScreeningAction, initialState);
    const formId = useId();

    // Lắng nghe kết quả từ server
    useEffect(() => {
        if (state.success) {
            onSuccessLatest();
            const timer = setTimeout(() => onCloseLatest(), 300);
            return () => clearTimeout(timer);
        }
    }, [state, onCloseLatest, onSuccessLatest]);

    return (
        <Dialog
            open
            onOpenChange={(open) => { if (!open) onClose(); }}
            title="Cấu hình sàng lọc AI"
            description={`${candidateName} • ${roleName}`}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>
                        Bỏ qua
                    </Button>
                    {aiProfiles.length > 0 && (
                        <Button type="submit" form={formId} loading={pending}>
                            Bắt đầu sàng lọc
                        </Button>
                    )}
                </>
            }
        >
            <form id={formId} action={formAction}>
                {/* Hidden fields — FormData tự động thu thập */}
                <input type="hidden" name="applicationId" value={applicationId} />

                {aiProfiles.length === 0 ? (
                    <div className="flex flex-col items-center py-8 text-center">
                        <p className="text-title-sm text-ink">Chưa có cấu hình AI</p>
                        <p className="mt-1 max-w-sm text-body-sm text-ink-3">
                            Vui lòng tạo cấu hình tại trang{' '}
                            <Link href="/ai-configuration" className="font-medium text-accent-text underline">AI Configuration</Link>{' '}
                            trước khi sàng lọc.
                        </p>
                    </div>
                ) : (
                    <fieldset>
                        <legend className="mb-3 text-body-sm text-ink-2">
                            Chọn bộ tiêu chí đánh giá CV để AI sử dụng cho ứng viên này:
                        </legend>
                        <div className="space-y-2">
                            {aiProfiles.map(profile => {
                                const isDefault = profile.configId === defaultProfile?.configId;
                                return (
                                    <label
                                        key={profile.configId}
                                        className="flex cursor-pointer items-start gap-3 rounded-card bg-surface p-3 shadow-e1 transition duration-hover hover:shadow-e2 has-[:checked]:bg-accent-soft has-[:checked]:ring-2 has-[:checked]:ring-accent has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent"
                                    >
                                        {/* Radio — ẩn nhưng có trong FormData */}
                                        <input
                                            type="radio"
                                            name="configId"
                                            value={profile.configId}
                                            defaultChecked={isDefault}
                                            className="sr-only"
                                        />

                                        <div className="min-w-0 flex-1">
                                            <div className="mb-1 flex items-center gap-2">
                                                <span className="truncate text-body-sm font-medium text-ink" title={profile.name}>
                                                    {profile.name}
                                                </span>
                                                {profile.isDefault && (
                                                    <Badge className="shrink-0 gap-1">
                                                        <Star aria-hidden="true" strokeWidth={1.75} className="size-3" />Mặc định
                                                    </Badge>
                                                )}
                                            </div>
                                            {profile.description && (
                                                <p className="mb-2 truncate text-caption text-ink-3" title={profile.description}>{profile.description}</p>
                                            )}
                                            {/* Weight pills */}
                                            <div className="flex flex-wrap gap-1.5">
                                                <span className={weightPill}>Kỹ năng {profile.skillsWeight}%</span>
                                                <span className={weightPill}>Kinh nghiệm {profile.experienceWeight}%</span>
                                                <span className={weightPill}>Học vấn {profile.educationWeight}%</span>
                                                <span className={weightPill}>Ngưỡng: {profile.minimumScoreThreshold}</span>
                                            </div>
                                        </div>
                                    </label>
                                );
                            })}
                        </div>
                    </fieldset>
                )}

                {/* Error message */}
                {state.message && !state.success && (
                    <p role="alert" className="mt-4 rounded-ctl bg-danger-soft px-3 py-2 text-body-sm text-danger">
                        {state.message}
                    </p>
                )}
            </form>
        </Dialog>
    );
}
