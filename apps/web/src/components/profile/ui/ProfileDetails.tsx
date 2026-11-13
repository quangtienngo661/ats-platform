'use client';

import { useState, type ReactNode } from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';
import { Badge, EmptyState, Surface } from '@/components/ui';
import { cn } from '@/components/ui/cn';
import Link from 'next/link';

// ── Types (mirrors the AI CV_PARSING_PROMPT output shape) ─────────────────────

interface ParsedSkills {
    technical: string[];
    soft: string[];
    languages: string[];
}

interface ParsedExperience {
    company: string | null;
    position: string | null;
    start_date: string | null;
    end_date: string | null;
    description: string | null;
}

interface ParsedProject {
    name: string | null;
    role: string | null;
    technologies: string[];
    description: string | null;
    start_date: string | null;
    end_date: string | null;
}

interface ParsedEducation {
    institution: string | null;
    degree: 'Certificate' | 'Bachelor' | 'Master' | 'PhD' | 'Diploma' | null;
    major: string | null;
}

export interface ProfileParsedData {
    skills?: ParsedSkills;
    experience?: ParsedExperience[];
    projects?: ParsedProject[];
    education?: ParsedEducation[];
    certificates?: string[];
    [key: string]: unknown;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Section({ id, title, count, children }: { id: string; title: string; count?: number; children: ReactNode }) {
    return (
        <section aria-labelledby={id} className="flex flex-col gap-3">
            <h2 id={id} className="flex items-center gap-2 text-title-sm text-ink">
                {title}
                {count !== undefined && <Badge>{count}</Badge>}
            </h2>
            {children}
        </section>
    );
}

function SkillGroup({ label, items }: { label: string; items?: string[] }) {
    if (!items || items.length === 0) return null;
    return (
        <div>
            <dt className="mb-1.5 text-caption text-ink-3">{label}</dt>
            <dd className="flex flex-wrap gap-1.5">
                {items.map((item) => (
                    <Badge key={item} className="h-6 px-2 text-caption">
                        {item}
                    </Badge>
                ))}
            </dd>
        </div>
    );
}

/** A row whose description folds open; without a description it is plain text. */
function FoldItem({ title, meta, description, extra }: { title: string; meta?: ReactNode; description: string | null; extra?: ReactNode }) {
    const [open, setOpen] = useState(false);
    const head = (
        <div className="min-w-0 flex-1 text-left">
            <p className="break-words text-body font-medium text-ink">{title}</p>
            {meta && <p className="break-words text-body-sm text-ink-3">{meta}</p>}
            {extra}
        </div>
    );
    return (
        <Surface className="p-4">
            {description ? (
                <>
                    <button
                        type="button"
                        aria-expanded={open}
                        onClick={() => setOpen((prev) => !prev)}
                        className="flex w-full items-start justify-between gap-2"
                    >
                        {head}
                        <ChevronDown
                            aria-hidden="true"
                            strokeWidth={1.75}
                            className={cn('mt-1 size-4 shrink-0 text-ink-3 transition-transform duration-press', open && 'rotate-180')}
                        />
                    </button>
                    {open && <p className="mt-3 whitespace-pre-line break-words border-t border-line pt-3 text-body-sm text-ink-2">{description}</p>}
                </>
            ) : (
                head
            )}
        </Surface>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface ProfileDetailsProps {
    profileData?: Record<string, unknown>;
}

export function ProfileDetails({ profileData }: ProfileDetailsProps) {
    const pd = profileData as ProfileParsedData | undefined;

    const skills = pd?.skills;
    const experience = pd?.experience ?? [];
    const projects = pd?.projects ?? [];
    const education = pd?.education ?? [];
    const certificates = pd?.certificates ?? [];

    const skillCount = (skills?.technical?.length ?? 0) + (skills?.soft?.length ?? 0) + (skills?.languages?.length ?? 0);
    const hasAnyData =
        skillCount > 0 || experience.length > 0 || projects.length > 0 || education.length > 0 || certificates.length > 0;

    return (
        <>
            <Surface variant="inset" className="flex items-start gap-3 p-4">
                <Sparkles aria-hidden="true" strokeWidth={1.75} className="mt-0.5 size-4 shrink-0 text-ink-3" />
                <div className="min-w-0 flex-1">
                    <p className="text-body-sm font-medium text-ink">Hồ sơ được trích xuất tự động bởi AI</p>
                    <p className="mt-0.5 text-body-sm text-ink-3">
                        Kinh nghiệm làm việc, Học vấn và Kỹ năng được tự động đồng bộ từ CV đã xác nhận của bạn.
                        Để cập nhật, hãy tải lên và xác nhận CV mới tại mục <strong className="font-medium">My CVs</strong>.
                    </p>
                    <Link href="/my-cvs" className="mt-2 inline-block text-body-sm font-medium text-accent-text hover:underline">
                        Đi tới My CVs
                    </Link>
                </div>
            </Surface>

            {!hasAnyData && (
                <Surface>
                    <EmptyState
                        icon={Sparkles}
                        title="Chưa có dữ liệu hồ sơ"
                        description={'Tải lên CV tại mục My CVs, sau đó bấm "Xác nhận & Cập nhật hồ sơ" để tự động điền thông tin.'}
                    />
                </Surface>
            )}

            {skillCount > 0 && (
                <Section id="profile-skills" title="Kỹ năng" count={skillCount}>
                    <dl className="flex flex-col gap-4">
                        <SkillGroup label="Kỹ thuật" items={skills?.technical} />
                        <SkillGroup label="Kỹ năng mềm" items={skills?.soft} />
                        <SkillGroup label="Ngoại ngữ" items={skills?.languages} />
                    </dl>
                </Section>
            )}

            {experience.length > 0 && (
                <Section id="profile-experience" title="Kinh nghiệm làm việc" count={experience.length}>
                    <div className="flex flex-col gap-2">
                        {experience.map((exp, i) => (
                            <FoldItem
                                key={i}
                                title={exp.position ?? '—'}
                                meta={
                                    <>
                                        {exp.company ?? '—'}
                                        {(exp.start_date || exp.end_date) && ` · ${exp.start_date} – ${exp.end_date ?? 'Present'}`}
                                    </>
                                }
                                description={exp.description}
                            />
                        ))}
                    </div>
                </Section>
            )}

            {projects.length > 0 && (
                <Section id="profile-projects" title="Dự án" count={projects.length}>
                    <div className="flex flex-col gap-2">
                        {projects.map((proj, i) => (
                            <FoldItem
                                key={i}
                                title={proj.name ?? '—'}
                                meta={
                                    <>
                                        {proj.role ?? ''}
                                        {(proj.start_date || proj.end_date) &&
                                            `${proj.role ? ' · ' : ''}${proj.start_date} – ${proj.end_date ?? 'Present'}`}
                                    </>
                                }
                                description={proj.description}
                                extra={
                                    proj.technologies.length > 0 ? (
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            {proj.technologies.map((t) => (
                                                <Badge key={t}>{t}</Badge>
                                            ))}
                                        </div>
                                    ) : null
                                }
                            />
                        ))}
                    </div>
                </Section>
            )}

            {education.length > 0 && (
                <Section id="profile-education" title="Học vấn" count={education.length}>
                    <div className="flex flex-col gap-2">
                        {education.map((edu, i) => (
                            <Surface key={i} className="p-4">
                                <p className="break-words text-body font-medium text-ink">
                                    {edu.degree} {edu.major ? `— ${edu.major}` : ''}
                                </p>
                                <p className="break-words text-body-sm text-ink-3">{edu.institution ?? '—'}</p>
                            </Surface>
                        ))}
                    </div>
                </Section>
            )}

            {certificates.length > 0 && (
                <Section id="profile-certificates" title="Chứng chỉ" count={certificates.length}>
                    <ul className="flex flex-col gap-1.5">
                        {certificates.map((cert, i) => (
                            <li key={i} className="break-words text-body text-ink-2">
                                {cert}
                            </li>
                        ))}
                    </ul>
                </Section>
            )}
        </>
    );
}
