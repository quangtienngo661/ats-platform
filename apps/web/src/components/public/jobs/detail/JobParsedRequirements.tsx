import { CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui';

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

function Group({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div>
            <h3 className="mb-2 text-body-sm font-medium text-ink-3">{title}</h3>
            {children}
        </div>
    );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
    if (items.length === 0) return null;

    return (
        <section>
            <h3 className="mb-3 text-title-sm text-ink">{title}</h3>
            <ul className="max-w-[68ch] space-y-2">
                {items.map((item) => (
                    <li key={item} className="flex gap-2.5 text-body text-ink-2">
                        <CheckCircle2 aria-hidden="true" className="mt-1 size-4 shrink-0 text-success" />
                        <span className="min-w-0 break-words">{item}</span>
                    </li>
                ))}
            </ul>
        </section>
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
        <section className="space-y-8">
            <h2 className="text-title text-ink">Yêu cầu công việc</h2>

            <div className="space-y-5">
                <Group title="Kinh nghiệm và học vấn">
                    <div className="flex flex-wrap gap-1.5">
                        <Badge>{formatExperience(requirements.minimum_experience_years)}</Badge>
                        <Badge>{formatEducation(requirements.education_level)}</Badge>
                    </div>
                </Group>

                {languages.length > 0 && (
                    <Group title="Ngôn ngữ">
                        <div className="flex flex-wrap gap-1.5">
                            {languages.map((language) => <Badge key={language}>{language}</Badge>)}
                        </div>
                    </Group>
                )}

                {hardSkills.length > 0 && (
                    <Group title="Kỹ năng chuyên môn">
                        <div className="flex flex-wrap gap-1.5">
                            {hardSkills.map((skill) => <Badge key={skill} tone="accent">{skill}</Badge>)}
                        </div>
                    </Group>
                )}

                {softSkills.length > 0 && (
                    <Group title="Kỹ năng mềm">
                        <div className="flex flex-wrap gap-1.5">
                            {softSkills.map((skill) => <Badge key={skill} tone="success">{skill}</Badge>)}
                        </div>
                    </Group>
                )}
            </div>

            <ListBlock title="Công việc hằng ngày" items={responsibilities} />
            <ListBlock title="Điểm cộng" items={niceToHaves} />
            <ListBlock title="Quyền lợi" items={benefits} />
        </section>
    );
}
