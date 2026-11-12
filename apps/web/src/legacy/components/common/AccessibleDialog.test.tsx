import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { AccessibleDialog, DialogOverlay, DialogContent } from './AccessibleDialog';

function Example({ pending = false }: { pending?: boolean }) {
    const [open, setOpen] = useState(false);
    return <>
        <button onClick={() => setOpen(true)}>Open</button>
        <button>Background</button>
        {open && <AccessibleDialog onClose={() => setOpen(false)} dismissible={!pending}>
            <DialogOverlay><DialogContent title="Sample dialog"><div>
                <label htmlFor="sample-name">Name</label><input id="sample-name" />
                <button onClick={() => setOpen(false)}>Close</button>
            </div></DialogContent></DialogOverlay>
        </AccessibleDialog>}
    </>;
}

describe('existing dialog accessibility', () => {
    it('announces its title, traps keyboard focus and restores the opener on Escape', async () => {
        const user = userEvent.setup();
        render(<Example />);
        await user.click(screen.getByRole('button', { name: 'Open' }));
        expect(screen.getByRole('dialog', { name: 'Sample dialog' })).toBeVisible();
        expect(screen.getByRole('textbox', { name: 'Name' })).toHaveFocus();
        await user.tab();
        expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
        await user.tab();
        expect(screen.getByRole('textbox', { name: 'Name' })).toHaveFocus();
        await user.keyboard('{Escape}');
        expect(screen.queryByRole('dialog')).toBeNull();
        expect(screen.getByRole('button', { name: 'Open' })).toHaveFocus();
    });
    it('keeps a pending form open when Escape is pressed', async () => {
        const user = userEvent.setup();
        render(<Example pending />);
        await user.click(screen.getByRole('button', { name: 'Open' }));
        await user.keyboard('{Escape}');
        expect(screen.getByRole('dialog')).toBeVisible();
    });
});
