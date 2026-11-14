import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RichTextEditor } from './RichTextEditor';

describe('plain text paste', () => {
    it('inserts literal text without importing pasted HTML, including the fallback path', () => {
        const onChange = vi.fn();
        render(<RichTextEditor value="" onChange={onChange} ariaLabel="Description" />);
        const editor = screen.getByRole('textbox', { name: 'Description' });
        fireEvent.paste(editor, { clipboardData: { getData: (type: string) => type === 'text/plain' ? '<img src=x onerror=alert(1)>Hello' : '<script>alert(1)</script>' } });
        expect(editor.textContent).toBe('<img src=x onerror=alert(1)>Hello');
        expect(editor.querySelector('img, script')).toBeNull();
        expect(onChange).toHaveBeenCalledWith('&lt;img src=x onerror=alert(1)&gt;Hello');
    });
});
