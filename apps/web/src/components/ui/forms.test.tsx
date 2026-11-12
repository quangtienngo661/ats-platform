import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Checkbox } from './Checkbox';
import { Field } from './Field';
import { Input } from './Input';
import { Select } from './Select';
import { Switch } from './Switch';
import { Textarea } from './Textarea';

/** Text of each element `aria-describedby` points at, in order. */
function descriptions(el: HTMLElement): Array<string | null | undefined> {
    const ids = el.getAttribute('aria-describedby')?.split(' ') ?? [];
    return ids.map((id) => document.getElementById(id)?.textContent);
}

function EmailField(props: { hint?: string; error?: string }) {
    return (
        <Field label="Email" {...props}>
            {(f) => (
                <Input id={f.id} type="email" aria-describedby={f.describedBy} invalid={f.invalid} />
            )}
        </Field>
    );
}

describe('Field', () => {
    it('marks the control invalid and points aria-describedby at the exact error', () => {
        render(<EmailField error="Email không đúng định dạng." />);
        const input = screen.getByLabelText('Email');
        expect(input).toHaveAttribute('aria-invalid', 'true');
        expect(descriptions(input)).toEqual(['Email không đúng định dạng.']);
        expect(input).toHaveAccessibleDescription('Email không đúng định dạng.');
    });

    it('joins the hint into aria-describedby, after the error', () => {
        render(<EmailField hint="Dùng email công ty." error="Email không đúng định dạng." />);
        const input = screen.getByLabelText('Email');
        expect(descriptions(input)).toEqual(['Email không đúng định dạng.', 'Dùng email công ty.']);
    });

    it('describes a valid control by its hint alone and does not mark it invalid', () => {
        render(<EmailField hint="Dùng email công ty." />);
        const input = screen.getByLabelText('Email');
        expect(input).not.toHaveAttribute('aria-invalid');
        expect(descriptions(input)).toEqual(['Dùng email công ty.']);
    });

    it('leaves a control with neither hint nor error undescribed', () => {
        render(<EmailField />);
        const input = screen.getByLabelText('Email');
        expect(input).not.toHaveAttribute('aria-invalid');
        expect(input).not.toHaveAttribute('aria-describedby');
    });

    it('keeps the required marker out of the accessible name', () => {
        render(
            <Field label="Họ và tên" required>
                {(f) => <Input id={f.id} required />}
            </Field>,
        );
        expect(screen.getByRole('textbox', { name: 'Họ và tên' })).toBeRequired();
    });
});

describe('form controls', () => {
    it('set aria-invalid="true" only when invalid', () => {
        render(
            <>
                <Textarea aria-label="Mô tả" invalid />
                <Select aria-label="Phòng ban" invalid>
                    <option value="">Chọn phòng ban</option>
                </Select>
                <Checkbox aria-label="Đồng ý điều khoản" invalid />
                <Input aria-label="Tên" />
            </>,
        );
        expect(screen.getByRole('textbox', { name: 'Mô tả' })).toHaveAttribute('aria-invalid', 'true');
        expect(screen.getByRole('combobox', { name: 'Phòng ban' })).toHaveAttribute('aria-invalid', 'true');
        expect(screen.getByRole('checkbox', { name: 'Đồng ý điều khoản' })).toHaveAttribute(
            'aria-invalid',
            'true',
        );
        expect(screen.getByRole('textbox', { name: 'Tên' })).not.toHaveAttribute('aria-invalid');
    });

    it('lets a Checkbox be toggled through its label', async () => {
        const user = userEvent.setup();
        render(
            <>
                <Checkbox id="remember" />
                <label htmlFor="remember">Ghi nhớ đăng nhập</label>
            </>,
        );
        const checkbox = screen.getByRole('checkbox', { name: 'Ghi nhớ đăng nhập' });
        expect(checkbox).not.toBeChecked();
        await user.click(screen.getByText('Ghi nhớ đăng nhập'));
        expect(checkbox).toBeChecked();
    });
});

describe('Switch', () => {
    it('is a named switch that reports off and asks to turn on', async () => {
        const user = userEvent.setup();
        const onCheckedChange = vi.fn();
        render(<Switch checked={false} onCheckedChange={onCheckedChange} label="Thông báo email" />);
        const toggle = screen.getByRole('switch', { name: 'Thông báo email' });
        expect(toggle).toHaveAttribute('aria-checked', 'false');
        await user.click(toggle);
        expect(onCheckedChange).toHaveBeenCalledTimes(1);
        expect(onCheckedChange).toHaveBeenCalledWith(true);
    });

    it('reports on and asks to turn off', async () => {
        const user = userEvent.setup();
        const onCheckedChange = vi.fn();
        render(<Switch checked onCheckedChange={onCheckedChange} label="Thông báo email" />);
        const toggle = screen.getByRole('switch', { name: 'Thông báo email' });
        expect(toggle).toHaveAttribute('aria-checked', 'true');
        await user.click(toggle);
        expect(onCheckedChange).toHaveBeenCalledWith(false);
    });
});
