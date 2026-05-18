import {
    BookOpen,
    BriefcaseBusiness,
    CheckCircle2,
    Gift,
    GraduationCap,
    Languages,
    ListChecks,
    Sparkles,
    Star,
} from 'lucide-react';
import { SF, SFT } from '@/types/fonts/fonts';

type ParsedJobRequirements = {
    job_summary?: string | null;
    responsibilities?: unknown;
    requirements?: {
        minimum_experience_years?: number | null;
        education_level?: string | null;
        hard_skills?: unknown;
        soft_skills?: unknown;
        languages?: unknown;
    } | null;
    nice_to_haves?: unknown;
    benefits?: unknown;
};

interface JobParsedRequirementsProps {
    parsedRequirements?: unknown;
}

function normalizeParsedRequirements(value: unknown): ParsedJobRequirements | null {
    if (!value) return null;

    if (typeof value === 'string') {
        try {
            return JSON.parse(value) as ParsedJobRequirements;
        } catch {
            return null;
        }
    }

    if (typeof value === 'object') {
        return value as ParsedJobRequirements;
    }

    return null;
}

function toStringList(value: unknown): string[] {
    return Array.isArray(value)
        ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
        : [];
}

function formatExperience(years?: number | null) {
    if (years === null || years === undefined) return 'Không nêu rõ';
    if (years === 0) return 'Fresher';
    if (years < 1) return `${years} năm`;
    return `${years}+ năm`;
}

function formatEducation(level?: string | null) {
    if (!level) return 'Không nêu rõ';
    const labels: Record<string, string> = {
        Certificate: 'Chứng chỉ',
        Diploma: 'Cao đẳng',
        Bachelor: 'Cử nhân',
        Master: 'Thạc sĩ',
        PhD: 'Tiến sĩ',
    };
    return labels[level] ?? level;
}

function RequirementTag({ children, tone = 'blue' }: { children: string; tone?: 'blue' | 'green' | 'gray' }) {
    const styles = {
        blue: 'bg-[#EBF3FD] text-[#0071E3]',
        green: 'bg-[#EAF8EE] text-[#1F8F3A]',
        gray: 'bg-[#F5F5F7] text-[#4B5563]',
    };

    return (
        <span className={`text-[12px] rounded-lg px-2.5 py-1 ${styles[tone]}`} style={{ fontWeight: 600 }}>
            {children}
        </span>
    );
}

function ListBlock({
    title,
    items,
    icon: Icon,
}: {
    title: string;
    items: string[];
    icon: typeof ListChecks;
}) {
    if (items.length === 0) return null;

    return (
        <div className="pt-5 border-t border-[#F2F2F7]">
            <div className="flex items-center gap-2 mb-3">
                <Icon className="w-4 h-4 text-[#0071E3]" />
                <h3 className="text-[15px] text-[#1D1D1F]" style={{ fontFamily: SF, fontWeight: 700 }}>
                    {title}
                </h3>
            </div>
            <div className="space-y-2.5">
                {items.map((item) => (
                    <div key={item} className="flex gap-2.5 text-[14px] text-[#424245] leading-[1.65]">
                        <CheckCircle2 className="w-4 h-4 text-[#34C759] mt-1 flex-shrink-0" />
                        <span>{item}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function JobParsedRequirements({ parsedRequirements }: JobParsedRequirementsProps) {
    const parsed = normalizeParsedRequirements(parsedRequirements);
    if (!parsed) return null;

    const requirements = parsed.requirements ?? {};
    const hardSkills = toStringList(requirements.hard_skills);
    const softSkills = toStringList(requirements.soft_skills);
    const languages = toStringList(requirements.languages);
    const responsibilities = toStringList(parsed.responsibilities);
    const niceToHaves = toStringList(parsed.nice_to_haves);
    const benefits = toStringList(parsed.benefits);

    const hasContent =
        parsed.job_summary ||
        responsibilities.length ||
        hardSkills.length ||
        softSkills.length ||
        languages.length ||
        niceToHaves.length ||
        benefits.length ||
        requirements.minimum_experience_years !== undefined ||
        requirements.education_level;

    if (!hasContent) return null;

    return (
        <section className="bg-white rounded-2xl border border-[#D7E7FA] overflow-hidden">
            {/* <div className="px-7 py-5 border-b border-[#EAF2FC] bg-[#F7FBFF]">
                <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#0071E3] flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h2 className="text-[18px] text-[#1D1D1F] tracking-[-0.01em]" style={{ fontFamily: SF, fontWeight: 700 }}>
                            Thông tin JD đã phân tích
                        </h2>
                        <p className="text-[13px] text-[#5D6B7A] mt-1" style={{ fontFamily: SFT }}>
                            Các ý chính được trích xuất trực tiếp từ mô tả tuyển dụng.
                        </p>
                    </div>
                </div>
            </div> */}

            <div className="p-7 space-y-6" style={{ fontFamily: SFT }}>
                {/* {parsed.job_summary && (
                    <div className="rounded-xl bg-[#F5F5F7] px-4 py-3.5">
                        <p className="text-[13px] uppercase tracking-[0.06em] text-[#6E6E73] mb-1" style={{ fontWeight: 700 }}>
                            Tóm tắt
                        </p>
                        <p className="text-[14px] text-[#1D1D1F] leading-[1.7]">{parsed.job_summary}</p>
                    </div>
                )} */}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="min-h-[88px] rounded-xl border border-[#F2F2F7] px-4 py-3">
                        <BriefcaseBusiness className="w-4 h-4 text-[#0071E3] mb-2" />
                        <p className="text-[11px] uppercase tracking-[0.06em] text-[#8E8E93]" style={{ fontWeight: 700 }}>
                            Kinh nghiệm
                        </p>
                        <p className="text-[15px] text-[#1D1D1F] mt-1" style={{ fontWeight: 700 }}>
                            {formatExperience(requirements.minimum_experience_years)}
                        </p>
                    </div>
                    <div className="min-h-[88px] rounded-xl border border-[#F2F2F7] px-4 py-3">
                        <GraduationCap className="w-4 h-4 text-[#0071E3] mb-2" />
                        <p className="text-[11px] uppercase tracking-[0.06em] text-[#8E8E93]" style={{ fontWeight: 700 }}>
                            Học vấn
                        </p>
                        <p className="text-[15px] text-[#1D1D1F] mt-1" style={{ fontWeight: 700 }}>
                            {formatEducation(requirements.education_level)}
                        </p>
                    </div>
                    <div className="min-h-[88px] rounded-xl border border-[#F2F2F7] px-4 py-3">
                        <Languages className="w-4 h-4 text-[#0071E3] mb-2" />
                        <p className="text-[11px] uppercase tracking-[0.06em] text-[#8E8E93]" style={{ fontWeight: 700 }}>
                            Ngôn ngữ
                        </p>
                        <p className="text-[15px] text-[#1D1D1F] mt-1" style={{ fontWeight: 700 }}>
                            {languages.length ? languages.join(', ') : 'Không nêu rõ'}
                        </p>
                    </div>
                </div>

                {(hardSkills.length > 0 || softSkills.length > 0 || languages.length > 0) && (
                    <div className="pt-5 border-t border-[#F2F2F7] space-y-4">
                        <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-[#0071E3]" />
                            <h3 className="text-[15px] text-[#1D1D1F]" style={{ fontFamily: SF, fontWeight: 700 }}>
                                Yêu cầu cốt lõi
                            </h3>
                        </div>

                        {hardSkills.length > 0 && (
                            <div>
                                <p className="text-[12px] text-[#6E6E73] mb-2" style={{ fontWeight: 700 }}>Kỹ năng chuyên môn</p>
                                <div className="flex flex-wrap gap-2">
                                    {hardSkills.map((skill) => <RequirementTag key={skill}>{skill}</RequirementTag>)}
                                </div>
                            </div>
                        )}

                        {softSkills.length > 0 && (
                            <div>
                                <p className="text-[12px] text-[#6E6E73] mb-2" style={{ fontWeight: 700 }}>Kỹ năng mềm</p>
                                <div className="flex flex-wrap gap-2">
                                    {softSkills.map((skill) => <RequirementTag key={skill} tone="green">{skill}</RequirementTag>)}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <ListBlock title="Công việc hằng ngày" items={responsibilities} icon={ListChecks} />
                <ListBlock title="Điểm cộng" items={niceToHaves} icon={Star} />
                <ListBlock title="Quyền lợi" items={benefits} icon={Gift} />
            </div>
        </section>
    );
}
