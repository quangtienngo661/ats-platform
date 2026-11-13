import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Reveal } from '@/components/ui';
import type { IJobCategoryDto } from '@/types/interfaces/job-category.interface';
import { CategoryRail, type CategoryRailItem } from './CategoryRail';
import { HOME_CONTAINER, SECTION_RISE } from './home-layout';

interface HomeCategoriesProps {
    categories: IJobCategoryDto[];
}

/**
 * A horizontal, snapping row of job categories. No job count: the category list carries postings only for child
 * categories, and of every status (drafts and closed ones too), so any count here would be wrong. A category with
 * children names them instead. Renders nothing when there are no categories (the API serves them to staff only).
 */
export function HomeCategories({ categories }: HomeCategoriesProps) {
    if (categories.length === 0) return null;

    const items: CategoryRailItem[] = categories.slice(0, 8).map((category) => ({
        id: category.categoryId,
        name: category.name,
        children: (category.childCategories ?? []).map((child) => child.name),
    }));

    return (
        <section aria-labelledby="home-categories-title" className="py-12 sm:py-16">
            <Reveal className={`${HOME_CONTAINER} ${SECTION_RISE}`}>
                <CategoryRail
                    items={items}
                    heading={
                        <div className="flex min-w-0 items-baseline gap-4">
                            <h2 id="home-categories-title" className="text-heading text-ink sm:text-display-sm">
                                Ngành nghề
                            </h2>
                            <Link
                                href="/job-postings"
                                className="inline-flex min-h-6 shrink-0 items-center gap-0.5 rounded-ctl text-body-sm text-accent-text hover:underline"
                            >
                                Xem tất cả
                                <ChevronRight aria-hidden="true" size={16} strokeWidth={1.75} />
                            </Link>
                        </div>
                    }
                />
            </Reveal>
        </section>
    );
}
