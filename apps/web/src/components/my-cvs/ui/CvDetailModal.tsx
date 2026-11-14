'use client';

import { useActionState, useEffect, useRef, useState, type ReactNode } from 'react';
import { useFormStatus } from 'react-dom';
import { Award, Briefcase, CheckCircle2, ChevronDown, FolderGit2, GraduationCap, Code, UserCheck } from 'lucide-react';
import { Badge, Button, Checkbox, Sheet } from '@/components/ui';
import { cn } from '@/components/ui/cn';
import { ICvDto } from '@/types/interfaces/cv.interface';
import { ICvParsedData } from '@ats-platform/types';
import { confirmCvAction } from '@/servers/cvs/cvs.action';
import { toast } from '@/lib/toast';

interface CvDetailModalProps {
    cv: ICvDto;
    onClose: () => void;
}

type ActionState = { success: boolean; message: string };
const initialState: ActionState = { success: false, message: '' };

function SectionTitle({ icon, title, count }: { icon: ReactNode; title: string; count?: number }) {
    return (
        <h3 className="mb-3 flex items-center gap-2 text-body-sm font-semibold text-ink">
            <span className="text-ink-3">{icon}</span>
            {title}
            {count !== undefined && <span className="text-caption font-normal tabular-nums text-ink-3">{count}</span>}
        </h3>
    );
}

function SkillGroup({ label, items }: { label: string; items: string[] }) {
    if (items.length === 0) return null;
    return (
        <div>
            <p className="mb-1.5 text-caption text-ink-3">{label}</p>
            <div className="flex flex-wrap gap-1.5">
                {items.map((s) => (
                    <Badge key={s} className="h-6 px-2 text-caption">{s}</Badge>
                ))}
            </div>
        </div>
    );
}

/** A row that expands to show its description; without one it is plain text. */
function Expandable({
    title,
    subtitle,
    extra,
    description,
}: {
    title: string;
    subtitle: ReactNode;
    extra?: ReactNode;
    description?: string | null;
}) {
    const [open, setOpen] = useState(false);
    const head = (
        <>
            <div className="min-w-0 flex-1">
                <p className="break-words text-body-sm font-medium text-ink">{title}</p>
                <p className="mt-0.5 break-words text-caption text-ink-3">{subtitle}</p>
                {extra}
            </div>
            {description && (
                <ChevronDown
                    aria-hidden="true"
                    size={16}
                    strokeWidth={1.75}
                    className={cn('mt-0.5 shrink-0 text-ink-3 transition-transform duration-hover ease-out-expo', open && 'rotate-180')}
                />
            )}
        </>
    );
    return (
        <div className="rounded-card bg-surface-2 p-3.5">
            {description ? (
                <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => setOpen((p) => !p)}
                    className="flex w-full items-start gap-2 text-left"
                >
                    {head}
                </button>
            ) : (
                <div className="flex items-start gap-2">{head}</div>
            )}
            {open && description && (
                <p className="mt-2 whitespace-pre-line break-words border-t border-line pt-2 text-body-sm leading-relaxed text-ink-2">
                    {description}
                </p>
            )}
        </div>
    );
}

function ExperienceItem({ exp }: { exp: ICvParsedData['experience'][number] }) {
    return (
        <Expandable
            title={exp.position ?? '—'}
            subtitle={
                <>
                    {exp.company ?? '—'}
                    {(exp.start_date || exp.end_date) && (
                        <span className="tabular-nums"> · {exp.start_date} – {exp.end_date ?? 'Present'}</span>
                    )}
                </>
            }
            description={exp.description}
        />
    );
}

function ProjectItem({ proj }: { proj: ICvParsedData['projects'][number] }) {
    return (
        <Expandable
            title={proj.name ?? '—'}
            subtitle={
                <>
                    {proj.role ?? ''}
                    {(proj.start_date || proj.end_date) && (
                        <span className="tabular-nums">
                            {proj.role ? ' · ' : ''}{proj.start_date} – {proj.end_date ?? 'Present'}
                        </span>
                    )}
                </>
            }
            extra={
                proj.technologies.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                        {proj.technologies.map((t) => (
                            <Badge key={t} tone="accent">{t}</Badge>
                        ))}
                    </div>
                ) : null
            }
            description={proj.description}
        />
    );
}

function SubmitButton({ children }: { children: string }) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" loading={pending}>
            {children}
        </Button>
    );
}

export function CvDetailModal({ cv, onClose }: CvDetailModalProps) {
    const [state, formAction] = useActionState(confirmCvAction, initialState);

    const onCloseRef = useRef(onClose);
    useEffect(() => {
        onCloseRef.current = onClose;
    }, [onClose]);

    useEffect(() => {
        if (state.success) {
            const timer = setTimeout(() => onCloseRef.current(), 500);
            toast.success(state.message);
            return () => clearTimeout(timer);
        } else if (!state.success && state.message) {
            toast.error(state.message);
        }
    }, [state]);

    const data = cv.parsedData;
    if (!data) return null;

    const isAlreadyConfirmed = data.isConfirmed;
    const { technical, soft, languages } = data.skills;
    const hasSkills = technical.length > 0 || soft.length > 0 || languages.length > 0;

    return (
        <Sheet open onOpenChange={(open) => { if (!open) onClose(); }} title="Chi tiết CV" width="lg">
            <div className="flex flex-col gap-6">
                <p className="-mt-2 break-words text-caption text-ink-3">{cv.fileName}</p>

                {!isAlreadyConfirmed ? (
                    <div className="flex items-start gap-3 rounded-card bg-accent-soft p-4">
                        <UserCheck aria-hidden="true" size={20} strokeWidth={1.75} className="mt-0.5 shrink-0 text-accent-text" />
                        <div>
                            <p className="text-body-sm font-medium text-ink">Xác nhận để cập nhật hồ sơ</p>
                            <p className="mt-0.5 text-body-sm text-ink-2">
                                AI đã trích xuất thông tin từ CV. Kiểm tra và bấm xác nhận để đồng bộ vào hồ sơ của bạn.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-3 rounded-card bg-success-soft p-4">
                        <CheckCircle2 aria-hidden="true" size={20} strokeWidth={1.75} className="shrink-0 text-success" />
                        <p className="text-body-sm font-medium text-success">Hồ sơ đã được xác nhận từ CV này</p>
                    </div>
                )}

                {hasSkills && (
                    <section>
                        <SectionTitle
                            icon={<Code aria-hidden="true" size={16} strokeWidth={1.75} />}
                            title="Kỹ năng"
                            count={technical.length + soft.length + languages.length}
                        />
                        <div className="flex flex-col gap-3">
                            <SkillGroup label="Kỹ thuật" items={technical} />
                            <SkillGroup label="Kỹ năng mềm" items={soft} />
                            <SkillGroup label="Ngoại ngữ" items={languages} />
                        </div>
                    </section>
                )}

                {data.experience.length > 0 && (
                    <section>
                        <SectionTitle
                            icon={<Briefcase aria-hidden="true" size={16} strokeWidth={1.75} />}
                            title="Kinh nghiệm làm việc"
                            count={data.experience.length}
                        />
                        <div className="flex flex-col gap-2">
                            {data.experience.map((exp, i) => (
                                <ExperienceItem key={i} exp={exp} />
                            ))}
                        </div>
                    </section>
                )}

                {data.projects.length > 0 && (
                    <section>
                        <SectionTitle
                            icon={<FolderGit2 aria-hidden="true" size={16} strokeWidth={1.75} />}
                            title="Dự án"
                            count={data.projects.length}
                        />
                        <div className="flex flex-col gap-2">
                            {data.projects.map((proj, i) => (
                                <ProjectItem key={i} proj={proj} />
                            ))}
                        </div>
                    </section>
                )}

                {data.education.length > 0 && (
                    <section>
                        <SectionTitle
                            icon={<GraduationCap aria-hidden="true" size={16} strokeWidth={1.75} />}
                            title="Học vấn"
                            count={data.education.length}
                        />
                        <div className="flex flex-col gap-2">
                            {data.education.map((edu, i) => (
                                <div key={i} className="rounded-card bg-surface-2 p-3.5">
                                    <p className="break-words text-body-sm font-medium text-ink">
                                        {edu.degree} {edu.major ? `— ${edu.major}` : ''}
                                    </p>
                                    <p className="mt-0.5 break-words text-caption text-ink-3">{edu.institution ?? '—'}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {data.certificates.length > 0 && (
                    <section>
                        <SectionTitle
                            icon={<Award aria-hidden="true" size={16} strokeWidth={1.75} />}
                            title="Chứng chỉ"
                            count={data.certificates.length}
                        />
                        <ul className="flex flex-col gap-2">
                            {data.certificates.map((cert, i) => (
                                <li key={i} className="break-words rounded-card bg-surface-2 px-3.5 py-2.5 text-body-sm text-ink">
                                    {cert}
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {state.success && (
                    <div className="flex items-center gap-3 rounded-card bg-success-soft p-4">
                        <CheckCircle2 aria-hidden="true" size={20} strokeWidth={1.75} className="shrink-0 text-success" />
                        <p className="text-body-sm font-medium text-success">{state.message}</p>
                    </div>
                )}
            </div>

            <div className="sticky bottom-0 -mx-6 mt-6 bg-surface px-6 pb-1 pt-4 shadow-[0_-1px_0_0_theme(colors.line)]">
                {!isAlreadyConfirmed && !state.success ? (
                    <form action={formAction} className="flex flex-col gap-4">
                        <div className="flex items-center gap-2">
                            <Checkbox id="syncToProfile" name="syncToProfile" value="true" />
                            <label htmlFor="syncToProfile" className="cursor-pointer select-none text-body-sm text-ink">
                                Dùng thông tin này làm hồ sơ mặc định
                            </label>
                        </div>
                        <input type="hidden" name="cvId" value={cv.cvId} />
                        <input type="hidden" name="markAsConfirmed" value="true" />
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={onClose}>Đóng</Button>
                            <SubmitButton>Xác nhận CV</SubmitButton>
                        </div>
                    </form>
                ) : (
                    <form action={formAction} className="flex justify-end gap-2">
                        <input type="hidden" name="cvId" value={cv.cvId} />
                        <input type="hidden" name="syncToProfile" value="true" />
                        <Button variant="ghost" onClick={onClose}>Đóng</Button>
                        <SubmitButton>Sử dụng profile này</SubmitButton>
                    </form>
                )}
            </div>
        </Sheet>
    );
}
