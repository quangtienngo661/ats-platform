import Link from 'next/link';
import { LayoutGrid, List } from 'lucide-react';
import { cn } from '@/components/ui/cn';

interface ViewToggleProps {
    jobId: string;
    activeView: 'list' | 'kanban';
}

/** Two links styled as a segmented switch: each view is its own page, so these navigate rather than toggle state. */
export function ViewToggle({ jobId, activeView }: ViewToggleProps) {
    const views = [
        { key: 'list', label: 'Danh sách', href: `/jobs/${jobId}/candidates`, icon: List },
        { key: 'kanban', label: 'Kanban', href: `/jobs/${jobId}/kanban`, icon: LayoutGrid },
    ] as const;

    return (
        <nav aria-label="Chế độ xem" className="inline-flex rounded-ctl bg-surface-2 p-0.5">
            {views.map(({ key, label, href, icon: Icon }) => {
                const active = activeView === key;
                return (
                    <Link
                        key={key}
                        href={href}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                            'inline-flex h-8 items-center gap-1.5 rounded-ctl px-3 text-body-sm',
                            'transition duration-press ease-out-expo active:scale-[.97]',
                            active ? 'bg-surface text-ink shadow-e2' : 'text-ink-3 hover:text-ink',
                        )}
                    >
                        <Icon aria-hidden="true" size={16} strokeWidth={1.75} />
                        {label}
                    </Link>
                );
            })}
        </nav>
    );
}
