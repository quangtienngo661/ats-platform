'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { BriefcaseBusiness, ChevronDown, Search } from 'lucide-react';
import { Button, Reveal, Surface } from '@/components/ui';
import { WORK_TYPES, WORK_TYPE_LABELS } from '@/lib/work-types';
import { DOT_GRID, HOME_CONTAINER, SECTION_RISE, dotMask } from './home-layout';

const SUGGESTED_SEARCHES = ['Frontend Developer', 'Product Manager', 'Data Science', 'UX Designer'];

/** A field inside the search bar: no border of its own (the bar is the box), the global focus outline hugging it. */
const BAR_FIELD =
    'h-11 w-full min-w-0 rounded-ctl bg-transparent text-base text-ink placeholder:text-ink-3 ' +
    'focus-visible:outline-offset-0 sm:text-body';

/**
 * The top of the home page: the headline, one line on what TalentAI does, and the job search as a 56 px bar
 * (keyword | work type | "Tìm kiếm"), then suggested searches. Left-aligned, with a dot grid in the top-right
 * corner that fades out towards the text. Below 640 px the bar's fields stack.
 */
export function HomeHero() {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [workType, setWorkType] = useState('');

    const handleSearch = (e: FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (query) params.set('q', query);
        if (workType) params.set('locationType', workType);
        router.push(`/job-postings?${params.toString()}`);
    };

    return (
        <section aria-labelledby="home-hero-title" className="relative isolate overflow-hidden">
            {/*
              The only decoration: dots in the top-right corner, fading out before they reach the text. (A white
              radial light was tried: on the near-white canvas it banded into visible rings.)
            */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -z-10"
                style={{ ...DOT_GRID, ...dotMask('100% 0%', '65%') }}
            />

            <div className={`${HOME_CONTAINER} pb-12 pt-14 sm:pb-16 sm:pt-20 lg:pb-20 lg:pt-28`}>
                <div className="max-w-[720px]">
                    <Reveal className={SECTION_RISE}>
                        <h1
                            id="home-hero-title"
                            className="text-[34px]/[40px] font-semibold tracking-[-0.03em] text-ink sm:text-display"
                        >
                            Tìm việc làm phù hợp với bạn
                        </h1>
                    </Reveal>
                    <Reveal delay={0.06} className={SECTION_RISE}>
                        <p className="mt-4 max-w-[56ch] text-body text-ink-3 sm:mt-5">
                            TalentAI đọc CV của bạn và so với yêu cầu của từng tin tuyển dụng.
                        </p>
                    </Reveal>

                    <Reveal delay={0.12} className={SECTION_RISE}>
                        <form role="search" aria-label="Tìm việc" onSubmit={handleSearch} className="mt-8 sm:mt-10">
                            <Surface
                                variant="raised"
                                className="flex flex-col gap-1 p-1.5 sm:h-14 sm:flex-row sm:items-center sm:gap-0"
                            >
                                <div className="relative min-w-0 flex-1">
                                    <Search
                                        aria-hidden="true"
                                        size={18}
                                        strokeWidth={1.75}
                                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3"
                                    />
                                    <input
                                        type="text"
                                        aria-label="Tìm việc theo từ khóa"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="Tên vị trí, kỹ năng, công ty…"
                                        className={`${BAR_FIELD} pl-10 pr-3`}
                                    />
                                </div>

                                <span aria-hidden="true" className="mx-3 h-px bg-line sm:mx-1 sm:h-6 sm:w-px" />

                                <div className="relative sm:w-[188px] sm:shrink-0">
                                    <BriefcaseBusiness
                                        aria-hidden="true"
                                        size={18}
                                        strokeWidth={1.75}
                                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3"
                                    />
                                    <select
                                        aria-label="Hình thức làm việc"
                                        value={workType}
                                        onChange={(e) => setWorkType(e.target.value)}
                                        className={`${BAR_FIELD} cursor-pointer appearance-none truncate pl-10 pr-9`}
                                    >
                                        <option value="">Tất cả</option>
                                        {WORK_TYPES.map((type) => (
                                            <option key={type} value={type}>
                                                {WORK_TYPE_LABELS[type]}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown
                                        aria-hidden="true"
                                        size={16}
                                        strokeWidth={1.75}
                                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-3"
                                    />
                                </div>

                                <Button type="submit" size="lg" className="mt-1 w-full sm:ml-1.5 sm:mt-0 sm:w-auto">
                                    Tìm kiếm
                                </Button>
                            </Surface>
                        </form>
                    </Reveal>

                    <Reveal delay={0.18} className={SECTION_RISE}>
                        <div className="mt-5 flex flex-wrap items-center gap-2">
                            <span className="mr-1 text-caption text-ink-3">Thử tìm</span>
                            {SUGGESTED_SEARCHES.map((term) => (
                                <Link
                                    key={term}
                                    href={`/job-postings?q=${encodeURIComponent(term)}`}
                                    className="inline-flex h-7 items-center rounded-ctl bg-surface px-2.5 text-caption text-ink-2 shadow-e1 transition duration-hover ease-out-expo hover:text-ink hover:shadow-e3 active:scale-[.97] active:duration-press"
                                >
                                    {term}
                                </Link>
                            ))}
                        </div>
                    </Reveal>
                </div>
            </div>
        </section>
    );
}
