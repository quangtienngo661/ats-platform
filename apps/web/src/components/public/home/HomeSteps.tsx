import { Reveal } from '@/components/ui';
import { HOME_CONTAINER, SECTION_RISE } from './home-layout';

const STEPS = [
    { title: 'Tải CV lên', text: 'AI đọc kỹ năng và kinh nghiệm từ CV, bạn không phải nhập lại.' },
    {
        title: 'Nhận gợi ý phù hợp',
        text: 'AI so sánh CV với yêu cầu của tin tuyển dụng; người tuyển dụng vẫn quyết định.',
    },
    { title: 'Theo dõi và luyện tập', text: 'Xem trạng thái từng đơn và luyện phỏng vấn với AI trước buổi thật.' },
] as const;

/**
 * "Cách TalentAI hoạt động": the three steps a job seeker goes through, as connected steps rather than cards. From
 * 768 px the steps sit in a row joined by a hairline; below that they stack, joined by a vertical line.
 * It replaces a row of figures (500+, 10K+, 200+, 95%) that no data backed.
 */
export function HomeSteps() {
    return (
        <section aria-labelledby="home-steps-title" className="py-12 sm:py-16">
            <Reveal inView className={`${HOME_CONTAINER} ${SECTION_RISE}`}>
                <h2 id="home-steps-title" className="text-heading text-ink sm:text-display-sm">
                    Cách TalentAI hoạt động
                </h2>
                <ol className="mt-10 grid md:mt-12 md:grid-cols-3">
                    {STEPS.map((step, index) => {
                        const last = index === STEPS.length - 1;
                        return (
                            <li key={step.title} className="grid grid-cols-[2.75rem_minmax(0,1fr)] md:block">
                                {/* The number and the connector: a column on phones, a row from 768 px. */}
                                <div aria-hidden="true" className="flex flex-col items-start md:flex-row md:items-center">
                                    <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-ctl bg-surface px-1.5 font-mono text-caption tabular-nums text-ink shadow-e1">
                                        {String(index + 1).padStart(2, '0')}
                                    </span>
                                    {last ? null : (
                                        <span className="my-2 ml-3.5 w-px flex-1 bg-line md:mx-4 md:my-0 md:h-px md:w-auto" />
                                    )}
                                </div>
                                <div className={last ? 'min-w-0 pt-0.5 md:pt-5' : 'min-w-0 pb-8 pt-0.5 md:pb-0 md:pr-10 md:pt-5'}>
                                    <h3 className="text-title-sm text-ink">{step.title}</h3>
                                    <p className="mt-1.5 max-w-[34ch] text-body text-ink-3">{step.text}</p>
                                </div>
                            </li>
                        );
                    })}
                </ol>
            </Reveal>
        </section>
    );
}
