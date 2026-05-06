'use client';

import { useState } from 'react';
import {
    Briefcase, GraduationCap, Code, Award, FolderGit2,
    ChevronDown, ChevronUp, Sparkles, ArrowRight,
} from 'lucide-react';
import { SF, SFT } from '@/types/fonts/fonts';
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

function SectionTitle({ icon, title, count }: { icon: React.ReactNode; title: string; count?: number }) {
    return (
        <h3 className="text-[13px] text-[#1D1D1F] mb-3 flex items-center gap-2" style={{ fontFamily: SF, fontWeight: 600 }}>
            {icon}
            {title}
            {count !== undefined && (
                <span className="text-[11px] text-[#AEAEB2] bg-[#F5F5F7] rounded-full px-2 py-0.5">
                    {count}
                </span>
            )}
        </h3>
    );
}

function SkillBadge({ label, color, bg }: { label: string; color: string; bg: string }) {
    return (
        <span
            className="text-[12px] rounded-lg px-2.5 py-1 inline-block"
            style={{ color, background: bg, fontWeight: 500 }}
        >
            {label}
        </span>
    );
}

function ExperienceItem({ exp }: { exp: ParsedExperience }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="bg-[#F5F5F7] rounded-xl p-3.5">
            <button
                type="button"
                onClick={() => setOpen((p) => !p)}
                className="w-full flex items-start justify-between text-left gap-2"
            >
                <div>
                    <p className="text-[13px] text-[#1D1D1F]" style={{ fontWeight: 500 }}>
                        {exp.position ?? '—'}
                    </p>
                    <p className="text-[12px] text-[#6E6E73] mt-0.5">
                        {exp.company ?? '—'}
                        {(exp.start_date || exp.end_date) && (
                            <span className="text-[#AEAEB2]">
                                {' '}· {exp.start_date} – {exp.end_date ?? 'Present'}
                            </span>
                        )}
                    </p>
                </div>
                {exp.description && (
                    open
                        ? <ChevronUp className="w-3.5 h-3.5 text-[#AEAEB2] flex-shrink-0 mt-0.5" />
                        : <ChevronDown className="w-3.5 h-3.5 text-[#AEAEB2] flex-shrink-0 mt-0.5" />
                )}
            </button>
            {open && exp.description && (
                <p className="text-[12px] text-[#6E6E73] mt-2 leading-relaxed border-t border-[#E5E5EA] pt-2">
                    {exp.description}
                </p>
            )}
        </div>
    );
}

function ProjectItem({ proj }: { proj: ParsedProject }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="bg-[#F5F5F7] rounded-xl p-3.5">
            <button
                type="button"
                onClick={() => setOpen((p) => !p)}
                className="w-full flex items-start justify-between text-left gap-2"
            >
                <div>
                    <p className="text-[13px] text-[#1D1D1F]" style={{ fontWeight: 500 }}>
                        {proj.name ?? '—'}
                    </p>
                    <p className="text-[12px] text-[#6E6E73] mt-0.5">
                        {proj.role ?? ''}
                        {(proj.start_date || proj.end_date) && (
                            <span className="text-[#AEAEB2]">
                                {proj.role ? ' · ' : ''}{proj.start_date} – {proj.end_date ?? 'Present'}
                            </span>
                        )}
                    </p>
                    {proj.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                            {proj.technologies.map((t) => (
                                <span key={t} className="text-[10px] text-[#6366F1] bg-[#F5F3FF] rounded-md px-1.5 py-0.5">
                                    {t}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
                {proj.description && (
                    open
                        ? <ChevronUp className="w-3.5 h-3.5 text-[#AEAEB2] flex-shrink-0 mt-0.5" />
                        : <ChevronDown className="w-3.5 h-3.5 text-[#AEAEB2] flex-shrink-0 mt-0.5" />
                )}
            </button>
            {open && proj.description && (
                <p className="text-[12px] text-[#6E6E73] mt-2 leading-relaxed border-t border-[#E5E5EA] pt-2">
                    {proj.description}
                </p>
            )}
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface ProfileDetailsProps {
    profileData?: Record<string, unknown>;
}

export function ProfileDetails({ profileData }: ProfileDetailsProps) {
    const pd = profileData as ProfileParsedData | undefined;

    // Determine if there is anything to show
    const skills = pd?.skills;
    const experience = pd?.experience ?? [];
    const projects = pd?.projects ?? [];
    const education = pd?.education ?? [];
    const certificates = pd?.certificates ?? [];

    const hasSkills =
        (skills?.technical?.length ?? 0) > 0 ||
        (skills?.soft?.length ?? 0) > 0 ||
        (skills?.languages?.length ?? 0) > 0;

    const hasAnyData =
        hasSkills ||
        experience.length > 0 ||
        projects.length > 0 ||
        education.length > 0 ||
        certificates.length > 0;

    return (
        <div className="space-y-4 mt-4" style={{ fontFamily: SFT }}>

            {/* ── AI Sync Banner ──────────────────────────────── */}
            <div className="bg-gradient-to-r from-[#EBF3FD] to-[#F5F3FF] rounded-2xl p-4 flex items-start gap-3 border border-[#D1D5DB]/30">
                <Sparkles className="w-5 h-5 text-[#6366F1] flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                    <p className="text-[13px] text-[#1D1D1F]" style={{ fontFamily: SF, fontWeight: 600 }}>
                        Hồ sơ được trích xuất tự động bởi AI
                    </p>
                    <p className="text-[12px] text-[#6E6E73] mt-0.5 leading-relaxed">
                        Kinh nghiệm làm việc, Học vấn và Kỹ năng được tự động đồng bộ từ CV đã xác nhận của bạn.
                        Để cập nhật, hãy tải lên và xác nhận CV mới tại mục <strong>My CVs</strong>.
                    </p>
                    <Link
                        href="/my-cvs"
                        className="inline-flex items-center gap-1 text-[12px] text-[#0071E3] hover:text-[#0060C0] mt-2 transition-colors"
                        style={{ fontWeight: 500 }}
                    >
                        Đi tới My CVs
                        <ArrowRight className="w-3 h-3" />
                    </Link>
                </div>
            </div>

            {!hasAnyData && (
                <div className="flex flex-col items-center justify-center py-12 bg-white rounded-2xl border border-[#E5E5EA]">
                    <Sparkles className="w-8 h-8 text-[#AEAEB2] mb-3" />
                    <p className="text-[14px] text-[#6E6E73]" style={{ fontWeight: 500 }}>
                        Chưa có dữ liệu hồ sơ
                    </p>
                    <p className="text-[12px] text-[#AEAEB2] mt-1 text-center max-w-[300px]">
                        Tải lên CV tại mục My CVs, sau đó bấm &quot;Xác nhận &amp; Cập nhật hồ sơ&quot; để tự động điền thông tin.
                    </p>
                </div>
            )}

            {/* ── Skills ──────────────────────────────────────── */}
            {hasSkills && (
                <div className="bg-white rounded-2xl border border-[#E5E5EA] p-5">
                    <SectionTitle
                        icon={<Code className="w-4 h-4 text-[#6366F1]" />}
                        title="Kỹ năng"
                        count={(skills?.technical?.length ?? 0) + (skills?.soft?.length ?? 0) + (skills?.languages?.length ?? 0)}
                    />
                    <div className="space-y-3">
                        {(skills?.technical?.length ?? 0) > 0 && (
                            <div>
                                <p className="text-[11px] text-[#AEAEB2] mb-1.5 uppercase tracking-wide" style={{ fontWeight: 600 }}>Kỹ thuật</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {skills!.technical.map((s) => (
                                        <SkillBadge key={s} label={s} color="#6366F1" bg="#F5F3FF" />
                                    ))}
                                </div>
                            </div>
                        )}
                        {(skills?.soft?.length ?? 0) > 0 && (
                            <div>
                                <p className="text-[11px] text-[#AEAEB2] mb-1.5 uppercase tracking-wide" style={{ fontWeight: 600 }}>Kỹ năng mềm</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {skills!.soft.map((s) => (
                                        <SkillBadge key={s} label={s} color="#0071E3" bg="#EBF3FD" />
                                    ))}
                                </div>
                            </div>
                        )}
                        {(skills?.languages?.length ?? 0) > 0 && (
                            <div>
                                <p className="text-[11px] text-[#AEAEB2] mb-1.5 uppercase tracking-wide" style={{ fontWeight: 600 }}>Ngoại ngữ</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {skills!.languages.map((s) => (
                                        <SkillBadge key={s} label={s} color="#059669" bg="#ECFDF5" />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Experience ──────────────────────────────────── */}
            {experience.length > 0 && (
                <div className="bg-white rounded-2xl border border-[#E5E5EA] p-5">
                    <SectionTitle
                        icon={<Briefcase className="w-4 h-4 text-[#0071E3]" />}
                        title="Kinh nghiệm làm việc"
                        count={experience.length}
                    />
                    <div className="space-y-2">
                        {experience.map((exp, i) => (
                            <ExperienceItem key={i} exp={exp} />
                        ))}
                    </div>
                </div>
            )}

            {/* ── Projects ────────────────────────────────────── */}
            {projects.length > 0 && (
                <div className="bg-white rounded-2xl border border-[#E5E5EA] p-5">
                    <SectionTitle
                        icon={<FolderGit2 className="w-4 h-4 text-[#EC4899]" />}
                        title="Dự án"
                        count={projects.length}
                    />
                    <div className="space-y-2">
                        {projects.map((proj, i) => (
                            <ProjectItem key={i} proj={proj} />
                        ))}
                    </div>
                </div>
            )}

            {/* ── Education ───────────────────────────────────── */}
            {education.length > 0 && (
                <div className="bg-white rounded-2xl border border-[#E5E5EA] p-5">
                    <SectionTitle
                        icon={<GraduationCap className="w-4 h-4 text-[#34C759]" />}
                        title="Học vấn"
                        count={education.length}
                    />
                    <div className="space-y-2">
                        {education.map((edu, i) => (
                            <div key={i} className="bg-[#F5F5F7] rounded-xl p-3.5">
                                <p className="text-[13px] text-[#1D1D1F]" style={{ fontWeight: 500 }}>
                                    {edu.degree} {edu.major ? `— ${edu.major}` : ''}
                                </p>
                                <p className="text-[12px] text-[#6E6E73] mt-0.5">{edu.institution ?? '—'}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Certificates ────────────────────────────────── */}
            {certificates.length > 0 && (
                <div className="bg-white rounded-2xl border border-[#E5E5EA] p-5">
                    <SectionTitle
                        icon={<Award className="w-4 h-4 text-[#F59E0B]" />}
                        title="Chứng chỉ"
                        count={certificates.length}
                    />
                    <div className="flex flex-col gap-2">
                        {certificates.map((cert, i) => (
                            <div key={i} className="flex items-center gap-2.5 bg-[#FFFBEB] rounded-xl px-3.5 py-2.5">
                                <Award className="w-3.5 h-3.5 text-[#F59E0B] flex-shrink-0" />
                                <span className="text-[13px] text-[#92400E]">{cert}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
