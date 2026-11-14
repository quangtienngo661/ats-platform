/**
 * True while Alt, Ctrl or Meta is held. The key then belongs to a browser or OS shortcut (Alt+← is Back), so a
 * custom arrow-key handler leaves it alone. Shift alone is not a modifier here.
 */
export function hasModifier(e: { altKey: boolean; ctrlKey: boolean; metaKey: boolean }): boolean {
    return e.altKey || e.ctrlKey || e.metaKey;
}
