'use client';

import { useId, useRef, useState } from 'react';
import { ChevronDown, ChevronRight, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import {
    Badge,
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    IconButton,
    Surface,
} from '@/components/ui';
import { IJobCategoryDto } from '@/types/interfaces/job-category.interface';
import type { CategoryNode } from '../categoryTree';

/** Pixels of indent per level; also the step between the vertical guide lines. */
const INDENT = 16;
/** Left padding of a row at depth 0, and the width of the 32 px toggle column the guides run through. */
const ROW_PAD = 12;
const TOGGLE = 32;

/** Always visible on touch and narrow screens; on a wide screen with hover it shows on row hover or focus. */
const MENU_TRIGGER_VISIBILITY =
    'group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100 [@media(hover:hover)_and_(min-width:1024px)]:opacity-0';

interface RowActions {
    onEdit: (cat: IJobCategoryDto) => void;
    onDelete: (cat: IJobCategoryDto) => void;
    onAddChild: (parentId: string) => void;
}

function RowMenu({
    category,
    nameId,
    canAddChild,
    onEdit,
    onDelete,
    onAddChild,
}: RowActions & { category: IJobCategoryDto; nameId: string; canAddChild: boolean }) {
    const triggerRef = useRef<HTMLButtonElement>(null);
    /** Runs once the menu has closed and focus is back on its trigger, so a dialog it opens returns focus there. */
    const afterClose = useRef<(() => void) | null>(null);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <IconButton
                    ref={triggerRef}
                    size="sm"
                    aria-label="Tùy chọn"
                    aria-describedby={nameId}
                    className={MENU_TRIGGER_VISIBILITY}
                >
                    <MoreHorizontal aria-hidden="true" strokeWidth={1.75} />
                </IconButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                onCloseAutoFocus={(e) => {
                    const run = afterClose.current;
                    afterClose.current = null;
                    if (!run) return;
                    e.preventDefault();
                    triggerRef.current?.focus();
                    run();
                }}
            >
                {canAddChild && (
                    <DropdownMenuItem onSelect={() => { afterClose.current = () => onAddChild(category.categoryId); }}>
                        <Plus aria-hidden="true" strokeWidth={1.75} className="size-4" />
                        Thêm danh mục con
                    </DropdownMenuItem>
                )}
                <DropdownMenuItem onSelect={() => { afterClose.current = () => onEdit(category); }}>
                    <Pencil aria-hidden="true" strokeWidth={1.75} className="size-4" />
                    Chỉnh sửa
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem destructive onSelect={() => { afterClose.current = () => onDelete(category); }}>
                    <Trash2 aria-hidden="true" strokeWidth={1.75} className="size-4" />
                    Xóa
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

/** One row of the tree. A level of depth adds `INDENT` px of padding and one vertical guide line. */
function CategoryRow({
    category,
    depth,
    subtitle,
    jobCount,
    toggle,
    ...actions
}: RowActions & {
    category: IJobCategoryDto;
    depth: number;
    subtitle?: string;
    jobCount: number;
    toggle?: { expanded: boolean; controls: string; onToggle: () => void };
}) {
    const nameId = useId();

    return (
        <div
            data-row
            className="group relative flex items-center gap-2 py-2 pr-3 transition-colors duration-hover hover:bg-surface-2/60"
            style={{ paddingInlineStart: ROW_PAD + depth * INDENT }}
        >
            {Array.from({ length: depth }, (_, level) => (
                <span
                    key={level}
                    aria-hidden="true"
                    className="absolute inset-y-0 border-l border-line"
                    style={{ insetInlineStart: ROW_PAD + level * INDENT + TOGGLE / 2 }}
                />
            ))}

            {toggle ? (
                <IconButton
                    size="sm"
                    aria-label={toggle.expanded ? `Thu gọn ${category.name}` : `Mở rộng ${category.name}`}
                    aria-expanded={toggle.expanded}
                    aria-controls={toggle.expanded ? toggle.controls : undefined}
                    onClick={toggle.onToggle}
                    className="relative"
                >
                    {toggle.expanded ? (
                        <ChevronDown aria-hidden="true" strokeWidth={1.75} />
                    ) : (
                        <ChevronRight aria-hidden="true" strokeWidth={1.75} />
                    )}
                </IconButton>
            ) : (
                <span aria-hidden="true" className="relative flex size-8 shrink-0 items-center justify-center">
                    <span className="size-1.5 rounded-full bg-line-strong" />
                </span>
            )}

            <div className="relative min-w-0 flex-1">
                <p id={nameId} className="truncate font-medium text-ink" title={category.name}>
                    {category.name}
                </p>
                {subtitle && <p className="text-caption text-ink-3">{subtitle}</p>}
            </div>

            <Badge className="relative tabular-nums">{jobCount} việc làm</Badge>

            <div className="relative">
                <RowMenu category={category} nameId={nameId} canAddChild={depth === 0} {...actions} />
            </div>
        </div>
    );
}

function RootCategory({ node, ...actions }: RowActions & { node: CategoryNode }) {
    const [userExpanded, setUserExpanded] = useState(true);
    const listId = useId();
    const { category, children } = node;
    // While searching, a root with a match stays open; the user's own choice comes back when the query clears.
    const expanded = userExpanded || node.searching;
    // Counts describe the whole category, not the part a search leaves visible.
    const allChildren = category.childCategories ?? [];
    const childCount = allChildren.length;
    const totalJobCount = allChildren.reduce(
        (sum, child) => sum + (child.jobPostings?.length || 0),
        category.jobPostings?.length || 0,
    );

    return (
        <li>
            <Surface className="overflow-hidden">
                <CategoryRow
                    category={category}
                    depth={0}
                    subtitle={`${childCount} danh mục con`}
                    jobCount={totalJobCount}
                    toggle={
                        childCount > 0
                            ? { expanded, controls: listId, onToggle: () => setUserExpanded((v) => !v) }
                            : undefined
                    }
                    {...actions}
                />
                {expanded && children.length > 0 && (
                    <ul id={listId} className="animate-fade-in border-t border-line">
                        {children.map((child) => (
                            <li key={child.categoryId}>
                                <CategoryRow
                                    category={child}
                                    depth={1}
                                    jobCount={child.jobPostings?.length || 0}
                                    {...actions}
                                />
                            </li>
                        ))}
                    </ul>
                )}
            </Surface>
        </li>
    );
}

interface JobCategoryTreeProps extends RowActions {
    /** Root categories with the children to show. The caller shows the empty and no-match states. */
    nodes: CategoryNode[];
}

/** A nested list, not an ARIA tree: each parent has a toggle button and every row has its own menu. */
export function JobCategoryTree({ nodes, ...actions }: JobCategoryTreeProps) {
    return (
        <ul className="space-y-3">
            {nodes.map((node) => (
                <RootCategory key={node.category.categoryId} node={node} {...actions} />
            ))}
        </ul>
    );
}
