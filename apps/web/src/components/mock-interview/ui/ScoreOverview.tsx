import { useId } from 'react';
import { TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react';
import { Badge, ScoreBar, Stat, Surface, type Tone } from '@/components/ui';

/** The verdict next to the overall score; thresholds unchanged from the previous result page. */
function scoreVerdict(score: number): { tone: Tone; label: string } {
    if (score >= 80) return { tone: 'success', label: 'Xuất sắc' };
    if (score >= 60) return { tone: 'warning', label: 'Khá' };
    return { tone: 'danger', label: 'Cần cải thiện' };
}

interface ScoreOverviewProps {
    overallScore: number;
    strengths: string[];
    weaknesses: string[];
    /** Each question's own score, shown as a bar per question. The API has no per-criterion scores. */
    questions?: { orderIndex: number; correctnessScore: number | null }[];
}

function FeedbackList({ title, icon: Icon, iconClass, items }: { title: string; icon: LucideIcon; iconClass: string; items: string[] }) {
    const headingId = useId();
    return (
        <Surface as="section" aria-labelledby={headingId} className="p-5">
            <h2 id={headingId} className="flex items-center gap-2 text-title-sm text-ink">
                <Icon aria-hidden="true" strokeWidth={1.75} className={`size-4 ${iconClass}`} />
                {title}
            </h2>
            {items.length > 0 ? (
                <ul className="mt-3 flex list-disc flex-col gap-2 pl-5 text-body text-ink-2 marker:text-ink-4">
                    {items.map((item, i) => (
                        <li key={i} className="break-words">
                            {item}
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="mt-3 text-body-sm text-ink-3">Chưa có nhận xét.</p>
            )}
        </Surface>
    );
}

/** The API sends Prisma Decimal columns as strings ("72"); the bars and the verdict need numbers. */
function toScore(value: number | string | null | undefined): number | null {
    if (value === null || value === undefined || value === '') return null;
    const score = Number(value);
    return Number.isFinite(score) ? score : null;
}

export function ScoreOverview({ overallScore: rawOverall, strengths, weaknesses, questions = [] }: ScoreOverviewProps) {
    const overallScore = toScore(rawOverall) ?? 0;
    const verdict = scoreVerdict(overallScore);
    const perQuestionId = useId();
    const ordered = [...questions].sort((a, b) => a.orderIndex - b.orderIndex);

    return (
        <div className="flex flex-col gap-4">
            <Surface variant="raised" className="grid gap-6 p-5 sm:p-6 md:grid-cols-[minmax(0,240px)_minmax(0,1fr)] md:gap-10">
                <div className="min-w-0">
                    <Stat label="Điểm tổng" value={Math.round(overallScore)} suffix="/100" />
                    <Badge tone={verdict.tone} className="mt-2">
                        {verdict.label}
                    </Badge>
                    <ScoreBar score={overallScore} label="Điểm tổng" className="mt-5" />
                </div>

                {ordered.length > 0 && (
                    <section aria-labelledby={perQuestionId} className="min-w-0">
                        <h2 id={perQuestionId} className="text-caption text-ink-3">
                            Điểm từng câu
                        </h2>
                        <ul className="mt-3 grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
                            {ordered.map((q) => (
                                <li key={q.orderIndex} className="grid grid-cols-[52px_minmax(0,1fr)] items-center gap-3">
                                    <span className="text-caption tabular-nums text-ink-3">Câu {q.orderIndex}</span>
                                    <ScoreBar score={toScore(q.correctnessScore)} label={`Câu ${q.orderIndex}`} />
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
            </Surface>

            <div className="grid gap-4 md:grid-cols-2">
                <FeedbackList title="Điểm mạnh" icon={TrendingUp} iconClass="text-success" items={strengths} />
                <FeedbackList title="Cần cải thiện" icon={TrendingDown} iconClass="text-danger" items={weaknesses} />
            </div>
        </div>
    );
}
