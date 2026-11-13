'use client';

import { effectiveScreeningScores } from '@ats-platform/types';
import { useId, useState } from 'react';
import { Avatar, Badge, ButtonLink, ScoreBar, Sheet, StatusChip } from '@/components/ui';
import type { IApplicationDto } from '@/types/interfaces/application.interface';

interface CandidatePeekProps {
    application: IApplicationDto | null;
    jobId: string;
    onClose: () => void;
}

/** The AI's suggestion, worded as on the full profile (CandidateOverviewTab). */
const RECOMMENDATION_LABELS: Record<string, string> = {
    interview: 'Nên phỏng vấn',
    reject: 'Không phù hợp',
};

const SKILL_LIMIT = 6;

/**
 * Skill names from a screening. `matchedSkills` is stored as `{ hardSkills, niceToHaveSkills }` by the screening
 * worker, older rows hold a plain list; `missingSkills` is a plain list. Anything else reads as no skills.
 */
function skillNames(value: unknown): string[] {
    const list =
        value !== null && typeof value === 'object' && !Array.isArray(value)
            ? (value as { hardSkills?: unknown }).hardSkills
            : value;
    return Array.isArray(list) ? list.filter((item): item is string => typeof item === 'string' && item.trim() !== '') : [];
}

function appliedAtLabel(value?: string): string | null {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    const time = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    return `${time}, ${date.toLocaleDateString('vi-VN')}`;
}

function SkillList({ label, skills }: { label: string; skills: string[] }) {
    const shown = skills.slice(0, SKILL_LIMIT);
    const more = skills.length - shown.length;
    return (
        <div>
            <p className="mb-1.5 text-caption text-ink-3">{label}</p>
            <ul className="flex flex-wrap gap-1.5">
                {shown.map((skill) => (
                    <li key={skill}>
                        <Badge className="h-6 max-w-full px-2 text-caption">
                            <span className="truncate" title={skill}>
                                {skill}
                            </span>
                        </Badge>
                    </li>
                ))}
                {more > 0 && <li className="self-center text-caption tabular-nums text-ink-3">+{more}</li>}
            </ul>
        </div>
    );
}

function PeekBody({ application, jobId }: { application: IApplicationDto; jobId: string }) {
    const aiHeadingId = useId();
    const user = application.candidate?.user;
    const name = user?.fullName || 'N/A';
    const currentTitle = application.candidate?.currentTitle;
    const years = application.candidate?.yearsOfExperience;
    const screening = application.screening;
    const scores = effectiveScreeningScores(screening ?? {});
    const recommendation = screening?.aiRecommendation ? RECOMMENDATION_LABELS[screening.aiRecommendation] : undefined;
    const matched = skillNames(screening?.matchedSkills);
    const missing = skillNames(screening?.missingSkills);
    const applied = appliedAtLabel(application.appliedAt);
    const screeningPending = screening && screening.status !== 'completed';

    return (
        <div className="flex min-h-full flex-col gap-6">
            <div className="flex items-center gap-3">
                <Avatar name={name} size={40} />
                <div className="min-w-0 space-y-1">
                    {currentTitle && (
                        <p className="break-words text-body-sm text-ink">
                            {currentTitle}
                            {years != null && <span className="text-ink-3"> · {years} năm kinh nghiệm</span>}
                        </p>
                    )}
                    <StatusChip kind="application" value={application.status} />
                </div>
            </div>

            <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-body-sm">
                {user?.email && (
                    <>
                        <dt className="text-ink-3">Email</dt>
                        <dd className="min-w-0 break-all text-ink">{user.email}</dd>
                    </>
                )}
                {user?.phoneNumber && (
                    <>
                        <dt className="text-ink-3">Điện thoại</dt>
                        <dd className="tabular-nums text-ink">{user.phoneNumber}</dd>
                    </>
                )}
                {applied && (
                    <>
                        <dt className="text-ink-3">Nộp lúc</dt>
                        <dd className="tabular-nums text-ink">{applied}</dd>
                    </>
                )}
            </dl>

            <section aria-labelledby={aiHeadingId} className="space-y-4 rounded-card bg-surface-2 p-4">
                <div className="flex items-center justify-between gap-3">
                    <h3 id={aiHeadingId} className="text-body-sm font-medium text-ink">
                        Gợi ý AI
                    </h3>
                    {scores.isReviewed && <Badge tone="accent">Đã duyệt</Badge>}
                </div>
                <ScoreBar score={scores.overall} />
                {screeningPending && <StatusChip kind="screening" value={screening.status} />}
                {recommendation && (
                    <p className="text-body-sm text-ink-2">
                        Khuyến nghị: <span className="font-medium text-ink">{recommendation}</span>
                    </p>
                )}
                {screening?.aiReasoning && (
                    <p className="line-clamp-4 break-words text-body-sm text-ink-2">{screening.aiReasoning}</p>
                )}
                {matched.length > 0 && <SkillList label="Kỹ năng khớp" skills={matched} />}
                {missing.length > 0 && <SkillList label="Kỹ năng còn thiếu" skills={missing} />}
                <p className="text-caption text-ink-3">Điểm AI chỉ là gợi ý. Bạn quyết định vòng tiếp theo.</p>
            </section>

            <div className="sticky bottom-0 mt-auto bg-surface pt-2">
                <ButtonLink
                    href={`/jobs/${jobId}/candidates/${application.applicationId}`}
                    className="w-full"
                >
                    Mở hồ sơ đầy đủ
                </ButtonLink>
            </div>
        </div>
    );
}

/**
 * A side panel with what the list already knows about one application. It changes nothing: stage moves stay on
 * the row's full profile, which the panel links to.
 */
export function CandidatePeek({ application, jobId, onClose }: CandidatePeekProps) {
    // Keep the last application while the sheet slides out, so its content does not blank mid-exit.
    const [shown, setShown] = useState(application);
    if (application && application !== shown) setShown(application);
    const current = application ?? shown;

    return (
        <Sheet
            open={application !== null}
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
            title={current?.candidate?.user?.fullName || 'N/A'}
            width="md"
        >
            {current && <PeekBody application={current} jobId={jobId} />}
        </Sheet>
    );
}
