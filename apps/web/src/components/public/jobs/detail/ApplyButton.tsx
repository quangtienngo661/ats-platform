'use client';

import { useState, useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Send, FileText, Lock, ClipboardList } from 'lucide-react';
import Link from 'next/link';
import { Button, ButtonLink, Sheet } from '@/components/ui';
import { cn } from '@/components/ui/cn';
import { IJobPostingDto } from '@/types/interfaces/job-posting.interface';
import { applyForJobAction, ApplicationActionState } from '@/servers/applications/applications.action';
import { getMyCvsAction } from '@/servers/cvs/cvs.action';
import { ICvDto } from '@/types/interfaces/cv.interface';
import { toast } from '@/lib/toast';

interface ApplyButtonProps {
    job: IJobPostingDto;
    isLoggedIn: boolean;
    available: boolean;
}

const initialState: ApplicationActionState = { success: false, message: '' };

export function ApplyButton({ job, isLoggedIn, available }: ApplyButtonProps) {
    const router = useRouter();
    const [showModal, setShowModal] = useState(false);
    const [cvs, setCvs] = useState<ICvDto[]>([]);
    const [selectedCvId, setSelectedCvId] = useState('');
    const [loadingCvs, setLoadingCvs] = useState(false);
    const [cvsError, setCvsError] = useState(false);
    const [cvRetry, setCvRetry] = useState(0);

    const [state, dispatch, isPending] = useActionState(applyForJobAction, initialState);

    // Load CVs when the sheet opens
    useEffect(() => {
        if (!showModal || !isLoggedIn) return;
        let active = true;
        setLoadingCvs(true);
        setCvsError(false);
        setSelectedCvId('');
        getMyCvsAction().then(data => {
            if (!active) return;
            const confirmed = data.filter(cv => cv.parsedData?.isConfirmed);
            setCvs(confirmed);
            if (confirmed.length > 0) setSelectedCvId(confirmed[0].cvId);
        }).catch(() => { if (active) setCvsError(true); })
          .finally(() => { if (active) setLoadingCvs(false); });
        return () => { active = false; };
    }, [showModal, isLoggedIn, cvRetry]);

    // Handle action result
    useEffect(() => {
        if (state.success) {
            toast.success('Ứng tuyển thành công!', 'Đơn của bạn đã được ghi nhận.');
            setShowModal(false);
            router.push('/my-applications');
        } else if (state.message) {
            toast.error('Ứng tuyển thất bại', state.message);
        }
    }, [state, router]);

    if (!isLoggedIn) {
        return (
            <ButtonLink
                href={`/sign-in?${new URLSearchParams({ callbackUrl: `/job-postings/${job.jobId}` })}`}
                size="lg"
                className="w-full"
            >
                <Lock aria-hidden="true" />
                Đăng nhập để ứng tuyển
            </ButtonLink>
        );
    }

    if (!available) {
        return (
            <ButtonLink href="/my-applications" variant="secondary" size="lg" className="w-full">
                <ClipboardList aria-hidden="true" />
                Xem đơn ứng tuyển của tôi
            </ButtonLink>
        );
    }

    return (
        <>
            <Button size="lg" className="w-full" onClick={() => setShowModal(true)}>
                <Send aria-hidden="true" />
                Ứng tuyển ngay
            </Button>

            <Sheet
                open={showModal}
                onOpenChange={(open) => { if (!isPending) setShowModal(open); }}
                title="Ứng tuyển"
            >
                <form action={dispatch} className="flex min-h-full flex-col gap-5">
                    <input type="hidden" name="jobId" value={job.jobId} />
                    <input type="hidden" name="cvId" value={selectedCvId} />

                    <p className="break-words text-body text-ink-2">{job.title}</p>

                    {!state.success && state.message && (
                        <div role="alert" className="rounded-card bg-danger-soft px-4 py-3 text-body-sm text-danger">
                            {state.message}
                        </div>
                    )}

                    <div>
                        <span id="apply-cv-label" className="mb-2 block text-body-sm font-medium text-ink">
                            Chọn CV để ứng tuyển
                        </span>

                        {loadingCvs ? (
                            <div role="status" className="py-6 text-center text-body-sm text-ink-3">Đang tải CV…</div>
                        ) : cvsError ? (
                            <div role="alert" className="py-6 text-center text-body-sm text-danger">
                                Không thể tải CV.{' '}
                                <button
                                    type="button"
                                    onClick={() => setCvRetry(value => value + 1)}
                                    className="rounded-ctl text-accent-text underline-offset-2 hover:underline"
                                >
                                    Thử lại
                                </button>
                            </div>
                        ) : cvs.length === 0 ? (
                            <div className="rounded-card border border-dashed border-line-strong p-6 text-center">
                                <FileText aria-hidden="true" className="mx-auto mb-2 size-8 text-ink-4" />
                                <p className="mb-1 text-body-sm text-ink-2">Bạn chưa có CV nào</p>
                                <Link href="/my-cvs" className="text-body-sm font-medium text-accent-text hover:underline">
                                    Tải lên CV ngay →
                                </Link>
                            </div>
                        ) : (
                            <div role="radiogroup" aria-labelledby="apply-cv-label" className="space-y-2">
                                {cvs.map(cv => (
                                    <label
                                        key={cv.cvId}
                                        className={cn(
                                            'flex cursor-pointer items-center gap-3 rounded-card bg-surface p-3.5 shadow-e1',
                                            'transition duration-hover ease-out-expo hover:bg-surface-2',
                                            'has-[:checked]:bg-accent-soft has-[:checked]:ring-2 has-[:checked]:ring-accent',
                                            'has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent',
                                        )}
                                    >
                                        <input
                                            type="radio"
                                            name="cvSelect"
                                            className="size-4 shrink-0 accent-accent focus-visible:outline-none"
                                            checked={selectedCvId === cv.cvId}
                                            onChange={() => setSelectedCvId(cv.cvId)}
                                        />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-body-sm font-medium text-ink">
                                                {cv.fileName ?? `CV - ${cv.cvId.slice(-6)}`}
                                            </p>
                                            {cv.uploadedAt && (
                                                <p className="text-caption tabular-nums text-ink-3">
                                                    {new Date(cv.uploadedAt).toLocaleDateString('vi-VN')}
                                                </p>
                                            )}
                                        </div>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="sticky bottom-0 mt-auto flex gap-3 bg-surface pb-1 pt-3">
                        <Button variant="secondary" size="lg" className="flex-1" onClick={() => setShowModal(false)} disabled={isPending}>
                            Hủy
                        </Button>
                        <Button
                            type="submit"
                            size="lg"
                            className="flex-1"
                            loading={isPending}
                            disabled={loadingCvs || cvsError || cvs.length === 0 || !selectedCvId}
                        >
                            {!isPending && <Send aria-hidden="true" />}
                            {isPending ? 'Đang nộp…' : 'Nộp đơn ứng tuyển'}
                        </Button>
                    </div>
                </form>
            </Sheet>
        </>
    );
}
