'use client';

import * as RadixDialog from '@radix-ui/react-dialog';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { IconButton, Kbd } from '@/components/ui';
import { cn } from '@/components/ui/cn';
import { useSwitchUiVariant } from '@/components/ui-variant/useSwitchUiVariant';
import { hasModifier } from '@/lib/keyboard';
import { buildCommands, filterCommands, type Command } from './commands';

const TITLE = 'Tìm hoặc đi tới';

/** The Ctrl/Cmd+K palette: a trigger for the top bar plus the dialog it opens. */
export function CommandPalette({ userRole }: { userRole?: string }) {
    const router = useRouter();
    const { switchTo } = useSwitchUiVariant();
    const [open, setOpen] = useState(false);
    const openRef = useRef(false);
    const [query, setQuery] = useState('');
    const [active, setActive] = useState(0);
    const [isMac, setIsMac] = useState(false);
    const uid = useId();
    const listId = `${uid}-list`;

    const commands = useMemo(() => buildCommands(userRole), [userRole]);
    const results = useMemo(() => filterCommands(query, commands), [query, commands]);
    const groups = useMemo(() => {
        const order: Command['group'][] = [];
        for (const c of results) if (!order.includes(c.group)) order.push(c.group);
        return order.map((name) => ({ name, items: results.filter((c) => c.group === name) }));
    }, [results]);

    // Computed after mount so the server and first client render agree.
    useEffect(() => setIsMac(/mac/i.test(navigator.platform)), []);

    // Every open and close goes through here, so a close by any route (Esc, outside click, hotkey, run) resets.
    const changeOpen = useCallback((next: boolean) => {
        openRef.current = next;
        setOpen(next);
        if (!next) {
            setQuery('');
            setActive(0);
        }
    }, []);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                // Every repeat of a held Ctrl+K is still kept from the browser, but only the first press toggles.
                e.preventDefault();
                if (e.repeat) return;
                changeOpen(!openRef.current);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [changeOpen]);

    const run = (command: Command | undefined) => {
        if (!command) return;
        if (command.href) router.push(command.href);
        else if (command.id === 'ui-legacy') switchTo('legacy');
        else command.run?.();
        changeOpen(false);
    };

    const optionId = (command: Command) => `${uid}-opt-${command.id}`;
    const activeCommand = results[active];
    const activeId = activeCommand ? optionId(activeCommand) : undefined;

    useEffect(() => {
        if (activeId) document.getElementById(activeId)?.scrollIntoView({ block: 'nearest' });
    }, [activeId]);

    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // An IME owns its keys while composing (Vietnamese commits with Enter). Safari sends the committing key with
        // isComposing already false, but keyCode 229.
        if (e.nativeEvent.isComposing || e.keyCode === 229) return;
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            if (hasModifier(e)) return;
            e.preventDefault();
            if (results.length === 0) return;
            const step = e.key === 'ArrowDown' ? 1 : -1;
            setActive((i) => (i + step + results.length) % results.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            run(activeCommand);
        }
    };

    const shortcut = isMac ? '⌘ K' : 'Ctrl K';

    return (
        <>
            <button
                type="button"
                onClick={() => changeOpen(true)}
                className="hidden h-8 items-center gap-2 rounded-ctl bg-surface px-2.5 text-body-sm text-ink-3 shadow-e1 hover:text-ink md:inline-flex"
            >
                <Search aria-hidden="true" className="size-4" strokeWidth={1.75} />
                <span>{TITLE}…</span>
                <Kbd>{shortcut}</Kbd>
            </button>
            <IconButton aria-label={TITLE} onClick={() => changeOpen(true)} className="md:hidden">
                <Search aria-hidden="true" strokeWidth={1.75} />
            </IconButton>
            <RadixDialog.Root open={open} onOpenChange={changeOpen}>
                <RadixDialog.Portal>
                    <RadixDialog.Overlay
                        className={cn(
                            'fixed inset-0 z-palette bg-ink/40 backdrop-blur-[2px]',
                            'data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out',
                        )}
                    />
                    <RadixDialog.Content
                        aria-describedby={undefined}
                        className={cn(
                            'fixed left-1/2 top-[15vh] z-palette w-[calc(100%-32px)] max-w-[560px] -translate-x-1/2',
                            'overflow-hidden rounded-panel bg-surface shadow-e5',
                            'data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out',
                        )}
                    >
                        <RadixDialog.Title className="sr-only">{TITLE}</RadixDialog.Title>
                        <div className="flex items-center gap-2 border-b border-line px-4">
                            <Search aria-hidden="true" className="size-4 shrink-0 text-ink-3" strokeWidth={1.75} />
                            <input
                                role="combobox"
                                aria-expanded="true"
                                aria-controls={listId}
                                aria-autocomplete="list"
                                aria-activedescendant={activeId}
                                aria-label={TITLE}
                                value={query}
                                onChange={(e) => {
                                    setQuery(e.target.value);
                                    setActive(0);
                                }}
                                onKeyDown={onKeyDown}
                                placeholder="Gõ tên trang hoặc lệnh"
                                autoComplete="off"
                                spellCheck={false}
                                // The open panel already shows where focus is; `!` beats the global :focus-visible ring.
                                className="h-12 min-w-0 flex-1 bg-transparent text-body text-ink !outline-none placeholder:text-ink-3"
                            />
                        </div>
                        <div id={listId} role="listbox" aria-label="Kết quả" className="max-h-[360px] overflow-y-auto p-2">
                            {groups.map((group) => (
                                <div key={group.name} role="group" aria-labelledby={`${uid}-g-${group.name}`}>
                                    <div
                                        id={`${uid}-g-${group.name}`}
                                        role="presentation"
                                        className="px-2 pb-1 pt-2 text-micro font-medium text-ink-3"
                                    >
                                        {group.name}
                                    </div>
                                    {group.items.map((command) => {
                                        const selected = command === activeCommand;
                                        return (
                                            // Focus stays in the combobox input, which owns the keyboard (aria-activedescendant).
                                            // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/interactive-supports-focus
                                            <div
                                                key={command.id}
                                                id={optionId(command)}
                                                role="option"
                                                aria-selected={selected}
                                                onMouseMove={() => setActive(results.indexOf(command))}
                                                onClick={() => run(command)}
                                                className={cn(
                                                    'flex h-9 cursor-pointer items-center rounded-ctl px-2 text-body-sm text-ink',
                                                    selected && 'bg-ink/5',
                                                )}
                                            >
                                                {command.label}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                        <div role="status" className={results.length === 0 ? 'px-4 pb-4 text-body-sm text-ink-3' : 'sr-only'}>
                            {results.length === 0 ? 'Không tìm thấy kết quả.' : ''}
                        </div>
                    </RadixDialog.Content>
                </RadixDialog.Portal>
            </RadixDialog.Root>
        </>
    );
}
