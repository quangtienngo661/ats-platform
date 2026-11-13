'use client';

import { useState, type FormEvent, type ReactNode } from 'react';
import { Upload, MapPin, Phone, Mail, Globe } from 'lucide-react';
import { Button, Field, Input, PageToolbar, Select, Surface, Textarea } from '@/components/ui';

const FIELD_ICON = { 'aria-hidden': true, strokeWidth: 1.75, className: 'mr-1.5 inline size-4 align-text-bottom text-ink-3' } as const;

const INDUSTRIES = [
  'Công nghệ thông tin',
  'Tài chính - Ngân hàng',
  'Y tế - Chăm sóc sức khỏe',
  'Giáo dục - Đào tạo',
  'Sản xuất - Chế tạo',
  'Thương mại điện tử',
];

const STATS = [['Nhân viên', '524'], ['Phòng ban', '8'], ['Vị trí đang tuyển', '12'], ['Thành lập', '2018']];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Surface as="section" className="space-y-4 p-5">
      <h2 className="text-title-sm font-medium text-ink">{title}</h2>
      {children}
    </Surface>
  );
}

export function CompanySettingsClient() {
  const [saving, setSaving] = useState(false);

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => setSaving(false), 1500);
  };

  return (
    <div className="mx-auto max-w-[720px] space-y-4 p-4 lg:p-6">
      <PageToolbar title="Thông tin công ty" />

      <Surface as="dl" className="grid grid-cols-2 sm:grid-cols-4">
        {STATS.map(([label, val]) => (
          <div
            key={label}
            className="min-w-0 border-line px-4 py-3 [&:nth-child(even)]:border-l [&:nth-child(n+3)]:border-t sm:[&:nth-child(n+3)]:border-t-0 sm:[&:not(:first-child)]:border-l"
          >
            <dt className="truncate text-caption text-ink-3" title={label}>{label}</dt>
            <dd className="mt-0.5 text-title-sm tabular-nums text-ink">{val}</dd>
          </div>
        ))}
      </Surface>

      <form onSubmit={handleSave} className="space-y-4">
        <Section title="Hồ sơ công ty">
          <div>
            <span className="mb-2 block text-body-sm font-medium text-ink">Logo công ty</span>
            <div className="flex items-center gap-4">
              <div className="flex size-16 shrink-0 items-center justify-center rounded-card bg-ink text-display-sm font-semibold text-surface">
                A
              </div>
              <div className="min-w-0">
                <Button variant="secondary">
                  <Upload aria-hidden="true" strokeWidth={1.75} />
                  Tải ảnh lên
                </Button>
                <p className="mt-2 text-caption text-ink-3">JPG, PNG hoặc SVG. Tối đa 2MB.</p>
              </div>
            </div>
          </div>

          <Field label="Tên công ty">
            {(f) => <Input {...f} type="text" defaultValue="Acme Corporation" />}
          </Field>
          <Field label="Mã số thuế">
            {(f) => <Input {...f} type="text" defaultValue="0123456789" />}
          </Field>
          <Field label="Lĩnh vực hoạt động">
            {(f) => (
              <Select {...f} defaultValue={INDUSTRIES[0]}>
                {INDUSTRIES.map((industry) => (
                  <option key={industry}>{industry}</option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Về công ty">
            {(f) => (
              <Textarea
                {...f}
                rows={4}
                defaultValue="Acme Corporation là công ty công nghệ hàng đầu chuyên về phát triển giải pháp AI cho doanh nghiệp. Với đội ngũ hơn 500 nhân viên tài năng, chúng tôi cam kết mang đến những sản phẩm và dịch vụ tốt nhất cho khách hàng."
              />
            )}
          </Field>
        </Section>

        <Section title="Thông tin liên hệ">
          <Field label={<><MapPin {...FIELD_ICON} />Địa chỉ</>}>
            {(f) => <Input {...f} type="text" defaultValue="123 Nguyễn Huệ, Quận 1, TP.HCM" />}
          </Field>
          <Field label={<><Phone {...FIELD_ICON} />Số điện thoại</>}>
            {(f) => <Input {...f} type="tel" defaultValue="+84 28 1234 5678" />}
          </Field>
          <Field label={<><Mail {...FIELD_ICON} />Email</>}>
            {(f) => <Input {...f} type="email" autoComplete="off" spellCheck={false} defaultValue="contact@acme.com" />}
          </Field>
          <Field label={<><Globe {...FIELD_ICON} />Website</>}>
            {(f) => <Input {...f} type="url" defaultValue="https://acme.com" />}
          </Field>
        </Section>

        <Section title="Mạng xã hội">
          <Field label="LinkedIn">
            {(f) => <Input {...f} type="url" placeholder="https://linkedin.com/company/acme" />}
          </Field>
          <Field label="Facebook">
            {(f) => <Input {...f} type="url" placeholder="https://facebook.com/acme" />}
          </Field>
        </Section>

        <Surface variant="inset" as="aside" className="p-5">
          <h2 className="text-body-sm font-medium text-ink">Lời khuyên</h2>
          <ul className="mt-2 space-y-1 text-caption text-ink-3">
            <li>Cập nhật đầy đủ thông tin để ứng viên hiểu rõ về công ty.</li>
            <li>Logo nên rõ ràng và chuyên nghiệp.</li>
            <li>Mô tả công ty ngắn gọn nhưng thu hút.</li>
          </ul>
        </Surface>

        <footer className="flex justify-end gap-2">
          <Button type="reset" variant="secondary">
            Hủy thay đổi
          </Button>
          <Button type="submit" loading={saving}>
            {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
          </Button>
        </footer>
      </form>
    </div>
  );
}
