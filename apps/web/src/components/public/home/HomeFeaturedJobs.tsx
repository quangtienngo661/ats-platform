import { ArrowRight } from 'lucide-react';
import { ButtonLink, Reveal } from '@/components/ui';
import { HOME_CONTAINER, SECTION_RISE } from './home-layout';

/** The closing call to action: one band that sends the visitor to every open posting. */
export function HomeFeaturedJobs() {
    return (
        <section aria-labelledby="home-jobs-title" className="pb-16 pt-4 sm:pb-24">
            <Reveal className={`${HOME_CONTAINER} ${SECTION_RISE}`}>
                <div className="flex flex-col gap-6 rounded-card bg-surface p-6 shadow-e1 sm:p-10 md:flex-row md:items-center md:justify-between lg:px-12 lg:py-14">
                    <div className="min-w-0">
                        <h2 id="home-jobs-title" className="text-heading text-ink sm:text-display-sm">
                            Xem mọi tin đang tuyển
                        </h2>
                        <p className="mt-2 max-w-[48ch] text-body text-ink-3">
                            Lọc theo hình thức làm việc, mức lương và kỹ năng.
                        </p>
                    </div>
                    <ButtonLink href="/job-postings" size="lg" className="group w-full md:w-auto">
                        Xem việc làm
                        <ArrowRight
                            aria-hidden="true"
                            strokeWidth={1.75}
                            className="transition-transform duration-hover ease-out-expo group-hover:translate-x-0.5"
                        />
                    </ButtonLink>
                </div>
            </Reveal>
        </section>
    );
}
