import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import { Checkbox, type CheckboxProps } from './Checkbox';
import { Field, type FieldControl } from './Field';
import { Input, type InputProps } from './Input';
import { Select, type SelectProps } from './Select';
import { Switch } from './Switch';
import { Textarea, type TextareaProps } from './Textarea';

/** Text of each element `aria-describedby` points at, in order. */
function descriptions(el: HTMLElement): Array<string | null | undefined> {
    const ids = el.getAttribute('aria-describedby')?.split(' ') ?? [];
    return ids.map((id) => document.getElementById(id)?.textContent);
}

/** Classes on `el` matching `pattern`, e.g. every `h-*` height class. */
function classesLike(el: HTMLElement, pattern: RegExp): string[] {
    return [...el.classList].filter((c) => pattern.test(c));
}

function EmailField(props: { hint?: string; error?: string }) {
    return <Field label="Email" {...props}>{(f) => <Input type="email" {...f} />}</Field>;
}

describe('Field', () => {
    it('lets a control take the Field wiring by spread', () => {
        render(
            <Field label="Email" error="Email không đúng định dạng." hint="Dùng email công việc.">
                {(f) => <Input {...f} />}
            </Field>,
        );
        const input = screen.getByRole('textbox', { name: 'Email' });
        expect(input).toHaveAccessibleDescription('Email không đúng định dạng. Dùng email công việc.');
        expect(input).toHaveAttribute('aria-invalid', 'true');
        expect(input).not.toHaveAttribute('describedby');
    });

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

    it('leaves a control with neither hint nor error undescribed and optional', () => {
        render(<EmailField />);
        const input = screen.getByLabelText('Email');
        expect(input).not.toHaveAttribute('aria-invalid');
        expect(input).not.toHaveAttribute('aria-describedby');
        expect(input).not.toBeRequired();
    });

    it('passes required to the control and keeps the marker out of the name', () => {
        render(<Field label="Tên" required>{(f) => <Input {...f} />}</Field>);
        const input = screen.getByLabelText('Tên');
        expect(input).toBeRequired();
        expect(input).toHaveAccessibleName('Tên');
    });

    it('hands over only keys every control accepts (checked by tsc)', () => {
        expectTypeOf<Exclude<keyof FieldControl, keyof InputProps>>().toEqualTypeOf<never>();
        expectTypeOf<Exclude<keyof FieldControl, keyof TextareaProps>>().toEqualTypeOf<never>();
        expectTypeOf<Exclude<keyof FieldControl, keyof SelectProps>>().toEqualTypeOf<never>();
        expectTypeOf<Exclude<keyof FieldControl, keyof CheckboxProps>>().toEqualTypeOf<never>();
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

    it('map describedBy to aria-describedby and take required on Textarea, Select and Checkbox', () => {
        render(
            <>
                <p id="note">Ghi chú.</p>
                <Textarea aria-label="Mô tả" describedBy="note" required />
                <Select aria-label="Phòng ban" describedBy="note" required>
                    <option value="">Chọn phòng ban</option>
                </Select>
                <Checkbox aria-label="Đồng ý điều khoản" describedBy="note" required />
            </>,
        );
        const controls = [
            screen.getByRole('textbox', { name: 'Mô tả' }),
            screen.getByRole('combobox', { name: 'Phòng ban' }),
            screen.getByRole('checkbox', { name: 'Đồng ý điều khoản' }),
        ];
        for (const control of controls) {
            expect(control).toHaveAccessibleDescription('Ghi chú.');
            expect(control).toBeRequired();
            expect(control).not.toHaveAttribute('describedby');
        }
    });

    it('lets an explicit aria-describedby win over describedBy', () => {
        render(
            <>
                <p id="from-field">Từ Field.</p>
                <p id="explicit">Ghi đè.</p>
                <Input aria-label="Tên" describedBy="from-field" aria-describedby="explicit" />
            </>,
        );
        expect(screen.getByRole('textbox', { name: 'Tên' })).toHaveAccessibleDescription('Ghi đè.');
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

describe('control sizes', () => {
    it('gives Input exactly one height class per size, md by default', () => {
        render(
            <>
                <Input aria-label="Nhỏ" size="sm" />
                <Input aria-label="Vừa" />
                <Input aria-label="Lớn" size="lg" />
            </>,
        );
        expect(classesLike(screen.getByRole('textbox', { name: 'Nhỏ' }), /^h-\d+$/)).toEqual(['h-8']);
        expect(classesLike(screen.getByRole('textbox', { name: 'Vừa' }), /^h-\d+$/)).toEqual(['h-9']);
        expect(classesLike(screen.getByRole('textbox', { name: 'Lớn' }), /^h-\d+$/)).toEqual(['h-11']);
        expect(screen.getByRole('textbox', { name: 'Nhỏ' })).not.toHaveAttribute('size');
    });

    it('sizes the Select height and only the Textarea min-height', () => {
        render(
            <>
                <Select aria-label="Phòng ban" size="lg">
                    <option value="">Chọn phòng ban</option>
                </Select>
                <Textarea aria-label="Mô tả" size="sm" />
            </>,
        );
        const select = screen.getByRole('combobox', { name: 'Phòng ban' });
        expect(classesLike(select, /^h-\d+$/)).toEqual(['h-11']);
        expect(select).not.toHaveAttribute('size');
        const textarea = screen.getByRole('textbox', { name: 'Mô tả' });
        expect(classesLike(textarea, /^min-h-\d+$/)).toEqual(['min-h-16']);
        expect(classesLike(textarea, /^h-\d+$/)).toEqual([]);
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

    it('turns on from the keyboard', async () => {
        const user = userEvent.setup();
        const onCheckedChange = vi.fn();
        render(<Switch checked={false} onCheckedChange={onCheckedChange} label="Thông báo email" />);
        await user.tab();
        expect(screen.getByRole('switch', { name: 'Thông báo email' })).toHaveFocus();
        await user.keyboard(' ');
        expect(onCheckedChange).toHaveBeenCalledTimes(1);
        expect(onCheckedChange).toHaveBeenCalledWith(true);
    });

    it('does not change when disabled', async () => {
        const user = userEvent.setup();
        const onCheckedChange = vi.fn();
        render(<Switch checked={false} onCheckedChange={onCheckedChange} label="Thông báo email" disabled />);
        const toggle = screen.getByRole('switch', { name: 'Thông báo email' });
        expect(toggle).toBeDisabled();
        await user.click(toggle);
        expect(onCheckedChange).not.toHaveBeenCalled();
    });
});
