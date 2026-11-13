import type { IJobCategoryDto } from '@/types/interfaces/job-category.interface';

export interface CategoryNode {
    category: IJobCategoryDto;
    /** The children to show: all of them, or only those matching the search when the parent itself does not. */
    children: IJobCategoryDto[];
    /** True while a query is set: the tree shows what matched, so the parent must be open. */
    searching: boolean;
}

/** Root categories with the children to show for `query`. An empty query keeps everything. */
export function visibleCategoryNodes(categories: IJobCategoryDto[], query: string): CategoryNode[] {
    const q = query.trim().toLowerCase();
    const matches = (c: IJobCategoryDto) => c.name.toLowerCase().includes(q);
    return categories
        .filter((c) => !c.parentCategoryId)
        .flatMap((category) => {
            const all = category.childCategories ?? [];
            if (!q || matches(category)) return [{ category, children: all, searching: !!q }];
            const children = all.filter(matches);
            return children.length > 0 ? [{ category, children, searching: true }] : [];
        });
}
