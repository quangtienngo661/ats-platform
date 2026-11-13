'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { IconButton, Table, TBody, TH, THead } from '@/components/ui';
import { cn } from '@/components/ui/cn';
import { SkillRow } from './SkillRow';
import { ISkillDto } from '@/types/interfaces/skill.interface';

interface SkillTableProps {
    skills: ISkillDto[];
    onEdit: (skill: ISkillDto) => void;
    onDelete: (skillId: string) => void;
}

const PAGE_SIZE = 20;

/** Page numbers around the current one, with "…" where a run is skipped. */
function pageItems(current: number, total: number): (number | '...')[] {
    return Array.from({ length: total }, (_, i) => i + 1)
        .filter((p) => p === 1 || p === total || Math.abs(p - current) <= 1)
        .reduce<(number | '...')[]>((acc, p, i, arr) => {
            if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...');
            acc.push(p);
            return acc;
        }, []);
}

/** The list of skills. The caller shows the empty and no-match states, so `skills` is never empty here. */
export function SkillTable({ skills, onEdit, onDelete }: SkillTableProps) {
    const [page, setPage] = useState(1);
    const totalPages = Math.max(1, Math.ceil(skills.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const paginated = skills.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

    return (
        <div className="space-y-3">
            <Table>
                <THead>
                    <tr className="border-b border-line">
                        <TH className="w-10">#</TH>
                        <TH>Tên kỹ năng</TH>
                        <TH>Danh mục</TH>
                        <TH className="w-px">
                            <span className="sr-only">Thao tác</span>
                        </TH>
                    </tr>
                </THead>
                <TBody>
                    {paginated.map((skill, idx) => (
                        <SkillRow
                            key={skill.skillId}
                            index={(safePage - 1) * PAGE_SIZE + idx}
                            skill={skill}
                            onEdit={onEdit}
                            onDelete={onDelete}
                        />
                    ))}
                </TBody>
            </Table>

            {totalPages > 1 && (
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-caption tabular-nums text-ink-3">
                        {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, skills.length)} / {skills.length} kỹ năng
                    </p>
                    <nav aria-label="Phân trang kỹ năng" className="flex items-center gap-1">
                        <IconButton size="sm" aria-label="Trước" disabled={safePage === 1} onClick={() => setPage(safePage - 1)}>
                            <ChevronLeft aria-hidden="true" strokeWidth={1.75} />
                        </IconButton>
                        {pageItems(safePage, totalPages).map((p, i) =>
                            p === '...' ? (
                                <span key={`gap-${i}`} aria-hidden="true" className="px-1 text-caption text-ink-3">
                                    …
                                </span>
                            ) : (
                                <button
                                    key={p}
                                    type="button"
                                    aria-label={`Trang ${p}`}
                                    aria-current={safePage === p ? 'page' : undefined}
                                    onClick={() => setPage(p)}
                                    className={cn(
                                        'inline-flex size-8 items-center justify-center rounded-ctl text-caption tabular-nums',
                                        'transition duration-press ease-out-expo active:scale-[.97]',
                                        safePage === p ? 'bg-ink text-surface' : 'text-ink-2 hover:bg-ink/5 hover:text-ink',
                                    )}
                                >
                                    {p}
                                </button>
                            ),
                        )}
                        <IconButton
                            size="sm"
                            aria-label="Tiếp"
                            disabled={safePage === totalPages}
                            onClick={() => setPage(safePage + 1)}
                        >
                            <ChevronRight aria-hidden="true" strokeWidth={1.75} />
                        </IconButton>
                    </nav>
                </div>
            )}
        </div>
    );
}
