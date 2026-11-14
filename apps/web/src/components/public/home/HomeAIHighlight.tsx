import { ArrowRight, Check, ListChecks, MessagesSquare, Minus, ScanText } from 'lucide-react';
import { Avatar, Badge, ButtonLink, Reveal, ScoreBar, Surface } from '@/components/ui';
import { HOME_CONTAINER, SECTION_RISE } from './home-layout';

const POINTS = [
    { icon: ScanText, text: 'Tự đọc CV, bạn không phải nhập lại kinh nghiệm và kỹ năng.' },
    { icon: ListChecks, text: 'Đối chiếu từng kỹ năng trong CV với yêu cầu của tin.' },
    { icon: MessagesSquare, text: 'Luyện phỏng vấn với AI và xem nhận xét sau mỗi phiên.' },
] as const;

/** Invented values: the card is captioned "Ví dụ" and says so again in its footnote. */
const SAMPLE = {
    job: 'Kỹ sư Frontend (React)',
    candidate: 'Nguyễn Minh Anh',
    experience: '4 năm kinh nghiệm',
    overall: 82,
    criteria: [
        { label: 'Kỹ năng', score: 86 },
        { label: 'Kinh nghiệm', score: 78 },
        { label: 'Học vấn', score: 70 },
    ],
    matched: ['React', 'TypeScript', 'Next.js'],
    missing: ['GraphQL'],
} as const;

/** What the AI looks at, as the sample result a recruiter would see. Not real data. */
function SampleMatch() {
    return (
        <Surface as="figure" variant="raised" className="p-5 sm:p-7">
            <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={SAMPLE.candidate} size={40} />
                    <div className="min-w-0">
                        <p className="break-words text-title-sm text-ink">{SAMPLE.candidate}</p>
                        {/* Wraps on phones: cut short, it would hide the job the example is about. */}
                        <p className="break-words text-body-sm text-ink-3">
                            {SAMPLE.experience} · ứng tuyển {SAMPLE.job}
                        </p>
                    </div>
                </div>
                <Badge>Ví dụ</Badge>
            </div>

            <div className="mt-6 flex items-end justify-between gap-4 border-t border-line pt-5">
                <div>
                    <p className="text-caption text-accent-text">Gợi ý AI</p>
                    <p className="mt-1 text-body-sm text-ink-3">Độ phù hợp với yêu cầu của tin</p>
                </div>
                <p className="text-display-sm tabular-nums text-ink">
                    {SAMPLE.overall}
                    <span className="text-body text-ink-3">/100</span>
                </p>
            </div>

            <dl className="mt-5 grid gap-3">
                {SAMPLE.criteria.map((item) => (
                    <div key={item.label} className="grid grid-cols-[6.5rem_minmax(0,1fr)] items-center gap-3">
                        <dt className="text-body-sm text-ink-2">{item.label}</dt>
                        <dd>
                            <ScoreBar score={item.score} label={item.label} />
                        </dd>
                    </div>
                ))}
            </dl>

            <div className="mt-6 flex flex-wrap gap-1.5 border-t border-line pt-5">
                {SAMPLE.matched.map((skill) => (
                    <span
                        key={skill}
                        className="inline-flex h-6 items-center gap-1 rounded-ctl bg-surface-2 px-2 font-mono text-micro text-ink-2"
                    >
                        <Check aria-hidden="true" size={12} strokeWidth={2} className="text-success" />
                        <span className="sr-only">Có kỹ năng </span>
                        {skill}
                    </span>
                ))}
                {SAMPLE.missing.map((skill) => (
                    <span
                        key={skill}
                        className="inline-flex h-6 items-center gap-1 rounded-ctl bg-warning-soft px-2 font-mono text-micro text-warning"
                    >
                        <Minus aria-hidden="true" size={12} strokeWidth={2} />
                        Thiếu {skill}
                    </span>
                ))}
            </div>

            <figcaption className="mt-5 text-caption text-ink-3">
                Số liệu minh họa. Người tuyển dụng xem gợi ý này cùng CV và là người quyết định.
            </figcaption>
        </Surface>
    );
}

/**
 * What the AI does for a job seeker, in two uneven columns: the explanation (5 of 12) and a sample match card
 * (7 of 12). Stacked below 1024 px. Every claim matches what the product does today: the candidate never sees
 * the screening score, so the copy says the recruiter sees it.
 */
export function HomeAIHighlight() {
    return (
        <section aria-labelledby="home-ai-title" className="py-12 sm:py-16 lg:py-20">
            <Reveal inView className={`${HOME_CONTAINER} ${SECTION_RISE}`}>
                <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12 xl:gap-16">
                    <div className="min-w-0 lg:col-span-5">
                        <h2 id="home-ai-title" className="text-heading text-ink sm:text-display-sm">
                            AI đối chiếu CV với yêu cầu của tin
                        </h2>
                        <p className="mt-4 max-w-[52ch] text-body text-ink-2">
                            Khi bạn ứng tuyển, TalentAI đối chiếu kỹ năng, kinh nghiệm và học vấn trong CV với yêu cầu
                            của tin. Người tuyển dụng xem gợi ý này cùng hồ sơ của bạn.
                        </p>

                        <ul className="mt-8 grid gap-4">
                            {POINTS.map(({ icon: Icon, text }) => (
                                <li key={text} className="flex items-start gap-3">
                                    <span className="flex size-8 shrink-0 items-center justify-center rounded-ctl bg-surface text-ink-2 shadow-e1">
                                        <Icon aria-hidden="true" size={16} strokeWidth={1.75} />
                                    </span>
                                    <span className="min-w-0 text-pretty pt-1 text-body text-ink">{text}</span>
                                </li>
                            ))}
                        </ul>

                        <ButtonLink href="/my-cvs" variant="secondary" size="lg" className="group mt-9">
                            Tải CV lên
                            <ArrowRight
                                aria-hidden="true"
                                strokeWidth={1.75}
                                className="transition-transform duration-hover ease-out-expo group-hover:translate-x-0.5"
                            />
                        </ButtonLink>
                    </div>

                    <div className="min-w-0 lg:col-span-7">
                        <SampleMatch />
                    </div>
                </div>
            </Reveal>
        </section>
    );
}
