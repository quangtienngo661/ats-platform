import { Banknote, Briefcase, Building2 } from 'lucide-react';
import { Avatar, Badge, Surface } from '@/components/ui';
import { IJobPostingDto } from '@/types/interfaces/job-posting.interface';
import { jobSkillsOf } from '@/lib/job-skills';
import { WORK_TYPE_LABELS, type WorkType } from '@/lib/work-types';
import { ApplyButton } from './ApplyButton';

function formatSalary(min?: number | null, max?: number | null): string {
    if (!min && !max) return 'Thỏa thuận';
    const fmt = (n: number) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(0)}M` : `${(n / 1_000).toFixed(0)}K`;
    if (min && max) return `${fmt(min)} – ${fmt(max)} VNĐ`;
    if (min) return `Từ ${fmt(min)} VNĐ`;
    return `Đến ${fmt(max ?? 0)} VNĐ`;
}

interface JobDetailSidebarProps {
    job: IJobPostingDto;
    /** When given, the card ends with the apply button (desktop only; phones get the bottom bar). */
    apply?: { isLoggedIn: boolean; available: boolean };
}

export function JobDetailSidebar({ job, apply }: JobDetailSidebarProps) {
    const dept = job.department;
    const category = job.category;
    const skills = jobSkillsOf(job);
    const location = Object.hasOwn(WORK_TYPE_LABELS, job.locationType)
        ? WORK_TYPE_LABELS[job.locationType as WorkType]
        : job.locationType ?? '';

    const infoItems = [
        { label: 'Mức lương', value: formatSalary(job.salaryMin, job.salaryMax), icon: Banknote, numeric: true },
        { label: 'Hình thức', value: location, icon: Briefcase, numeric: false },
        ...(category ? [{ label: 'Lĩnh vực', value: category.name, icon: Building2, numeric: false }] : []),
    ];

    return (
        <div className="space-y-4">
            <Surface variant="raised" className="p-5">
                <h2 className="mb-4 text-title-sm text-ink">Thông tin chung</h2>
                <dl className="space-y-4">
                    {infoItems.map(({ label, value, icon: Icon, numeric }) => (
                        <div key={label} className="flex items-start gap-3">
                            <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-ink-3" />
                            <div className="min-w-0">
                                <dt className="text-caption text-ink-3">{label}</dt>
                                <dd className={numeric ? 'break-words text-body font-medium tabular-nums text-ink' : 'break-words text-body font-medium text-ink'}>
                                    {value}
                                </dd>
                            </div>
                        </div>
                    ))}
                </dl>

                {skills.length > 0 && (
                    <div className="mt-5 border-t border-line pt-5">
                        <p className="mb-3 text-caption text-ink-3">Kỹ năng yêu cầu</p>
                        <div className="flex flex-wrap gap-1.5">
                            {skills.map(s => (
                                <Badge key={s.skillId} tone="accent">{s.name ?? s.skillId}</Badge>
                            ))}
                        </div>
                    </div>
                )}

                {apply && (
                    <div className="mt-6 hidden lg:block">
                        <ApplyButton job={job} isLoggedIn={apply.isLoggedIn} available={apply.available} />
                    </div>
                )}
            </Surface>

            {dept && (
                <Surface variant="plain" className="p-5">
                    <div className="flex items-center gap-3">
                        <Avatar name={dept.name} size={40} />
                        <div className="min-w-0">
                            <p className="break-words text-body font-medium text-ink">{dept.name}</p>
                            <p className="text-caption text-ink-3">Phòng ban</p>
                        </div>
                    </div>
                    {dept.description && (
                        <p className="mt-3 break-words text-body-sm text-ink-2">{dept.description}</p>
                    )}
                </Surface>
            )}
        </div>
    );
}
