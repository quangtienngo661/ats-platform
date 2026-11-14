/** Joins class names, skipping falsy ones. No conflict merging: callers must not pass a class that fights a base class. */
export function cn(...classes: Array<string | false | null | undefined>): string {
    return classes.filter(Boolean).join(' ');
}
