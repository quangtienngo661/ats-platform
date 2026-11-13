'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight, Tag } from 'lucide-react';
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { IconButton } from '@/components/ui';

export type CategoryRailItem = { id: string; name: string; children: string[] };

/**
 * The category cards in one row that scrolls sideways and snaps to a card. From 768 px two arrow buttons page
 * through it; each is disabled at its end, and both hide while everything fits. Phones swipe.
 */
export function CategoryRail({ items, heading }: { items: CategoryRailItem[]; heading: ReactNode }) {
    const listId = useId();
    const listRef = useRef<HTMLUListElement>(null);
    const previousRef = useRef<HTMLButtonElement>(null);
    const nextRef = useRef<HTMLButtonElement>(null);
    /** The arrow to focus once the focused one has turned disabled (a disabled button drops focus to <body>). */
    const handOff = useRef<HTMLButtonElement | null>(null);
    // Before the first measure (and on the server) nothing is known to scroll, so the arrows stay hidden.
    const [edges, setEdges] = useState({ start: true, end: true });

    const measure = useCallback(() => {
        const list = listRef.current;
        if (!list) return;
        const start = list.scrollLeft <= 1;
        const end = list.scrollLeft + list.clientWidth >= list.scrollWidth - 1;
        const focused = document.activeElement;
        // Only while the other arrow stays: when everything fits, both arrows go.
        if (end && !start && focused === nextRef.current) handOff.current = previousRef.current;
        else if (start && !end && focused === previousRef.current) handOff.current = nextRef.current;
        setEdges({ start, end });
    }, []);

    // After the commit, once the other arrow is enabled and can take focus.
    useEffect(() => {
        const target = handOff.current;
        handOff.current = null;
        target?.focus();
    }, [edges]);

    useEffect(() => {
        const list = listRef.current;
        if (!list) return;
        measure();
        list.addEventListener('scroll', measure, { passive: true });
        window.addEventListener('resize', measure);
        return () => {
            list.removeEventListener('scroll', measure);
            window.removeEventListener('resize', measure);
        };
    }, [measure]);

    const page = (direction: 1 | -1) => {
        const list = listRef.current;
        if (!list) return;
        // An explicit `behavior` overrides the CSS reduced-motion rule, so ask the OS here.
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        list.scrollBy({ left: direction * list.clientWidth * 0.8, behavior: reduce ? 'auto' : 'smooth' });
    };

    const scrollable = !(edges.start && edges.end);
    // A side with more cards beyond it fades out over 48 px, so a cut card reads as "more this way".
    const fade = `linear-gradient(to right, ${edges.start ? 'black' : 'transparent'}, black 48px, black calc(100% - 48px), ${edges.end ? 'black' : 'transparent'})`;

    return (
        <>
            <div className="flex items-end justify-between gap-4">
                {heading}
                {scrollable ? (
                    <div className="hidden shrink-0 gap-1 md:flex">
                        <IconButton
                            ref={previousRef}
                            aria-label="Xem các ngành trước"
                            aria-controls={listId}
                            disabled={edges.start}
                            onClick={() => page(-1)}
                        >
                            <ChevronLeft aria-hidden="true" strokeWidth={1.75} />
                        </IconButton>
                        <IconButton
                            ref={nextRef}
                            aria-label="Xem các ngành tiếp theo"
                            aria-controls={listId}
                            disabled={edges.end}
                            onClick={() => page(1)}
                        >
                            <ChevronRight aria-hidden="true" strokeWidth={1.75} />
                        </IconButton>
                    </div>
                ) : null}
            </div>

            {/*
              The row runs into the gutters so cards slide under the page edge; scroll padding keeps a snapped card
              aligned with the heading. Vertical padding leaves room for the hover lift and shadow.
            */}
            <ul
                id={listId}
                ref={listRef}
                style={{ maskImage: fade, WebkitMaskImage: fade }}
                className="-mx-4 mt-6 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto overscroll-x-contain px-4 pb-3 pt-1 [scrollbar-width:none] sm:mt-8 lg:-mx-6 lg:scroll-px-6 lg:px-6 [&::-webkit-scrollbar]:hidden"
            >
                {items.map((item) => (
                    <li key={item.id} className="w-[220px] shrink-0 snap-start sm:w-[248px]">
                        <Link
                            href={`/job-postings?categoryId=${item.id}`}
                            className="flex h-full min-h-[132px] flex-col justify-between gap-6 rounded-card bg-surface p-4 shadow-e1 transition duration-hover ease-out-expo hover:-translate-y-0.5 hover:shadow-e3 active:scale-[.97] active:duration-press"
                        >
                            <span className="flex size-9 items-center justify-center rounded-ctl bg-surface-2 text-ink-2">
                                <Tag aria-hidden="true" size={18} strokeWidth={1.75} />
                            </span>
                            <span className="min-w-0">
                                <span title={item.name} className="line-clamp-2 break-words text-title-sm text-ink">
                                    {item.name}
                                </span>
                                {item.children.length > 0 ? (
                                    <span
                                        title={item.children.join(', ')}
                                        className="mt-1 block truncate text-body-sm text-ink-3"
                                    >
                                        {item.children.join(' · ')}
                                    </span>
                                ) : null}
                            </span>
                        </Link>
                    </li>
                ))}
            </ul>
        </>
    );
}
