'use client'

import { useState, useActionState, useEffect, useRef } from 'react';
import { Badge, Button, Dialog, Field, Input, Select } from '@/components/ui';
import { createAIConfigFormAction, AIConfigActionState } from '@/servers/ai-config/ai-config.action';
import { toast } from '@/lib/toast';
import { IOrganizationOption } from '@ats-platform/types';
import { WeightBar, WeightRow } from './WeightRow';

const initialState: AIConfigActionState = { success: false, message: '' };

const FORM_ID = 'add-ai-profile-form';

export function AddProfileModal({
    onClose,
    open = true,
    organizations = [],
}: {
    onClose: () => void;
    /** The caller may keep the modal mounted so the close animation plays; remount it (new key) to reset the form. */
    open?: boolean;
    /** Offered only to a platform admin, which must say whose config this is. */
    organizations?: IOrganizationOption[];
}) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [skill, setSkill] = useState({ name: 'Kỹ năng', weight: 40 });
    const [experience, setExperience] = useState({ name: 'Kinh nghiệm', weight: 40 });
    const [education, setEducation] = useState({ name: 'Học vấn', weight: 20 });
    const [threshold, setThreshold] = useState(60);

    const total = skill.weight + experience.weight + education.weight;
    const isValid = total === 100 && name.trim().length > 0;
    const totalTone = total === 100 ? 'success' : total > 100 ? 'danger' : 'warning';

    const [state, dispatch, isPending] = useActionState(createAIConfigFormAction, initialState);

    const onCloseRef = useRef(onClose);
    useEffect(() => {
        onCloseRef.current = onClose;
    }, [onClose]);

    useEffect(() => {
        if (state.success && state.data) {
            toast.success('Thành công', state.message);
            onCloseRef.current();
        } else if (state.message) {
            toast.error('Lỗi', state.message);
        }
    }, [state]);

    return (
        <Dialog
            open={open}
            onOpenChange={(open) => {
                if (!open && !isPending) onClose();
            }}
            title="Thêm cấu hình mới"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>
                        Hủy
                    </Button>
                    <Button type="submit" form={FORM_ID} disabled={!isValid} loading={isPending}>
                        {isPending ? 'Đang thêm…' : 'Thêm cấu hình'}
                    </Button>
                </>
            }
        >
            <form id={FORM_ID} action={dispatch} className="space-y-6">
                {/* The weights are controlled inputs without a name, so the form reads them from here. */}
                <input aria-label="Trọng số kỹ năng (%)" type="hidden" name="skillsWeight" value={skill.weight} />
                <input aria-label="Trọng số kinh nghiệm (%)" type="hidden" name="experienceWeight" value={experience.weight} />
                <input aria-label="Trọng số học vấn (%)" type="hidden" name="educationWeight" value={education.weight} />
                <input aria-label="Ngưỡng điểm tối thiểu" type="hidden" name="minimumScoreThreshold" value={threshold} />

                <div className="space-y-4">
                    {organizations.length > 0 && (
                        <Field label="Tổ chức" required>
                            {(f) => (
                                <Select
                                    {...f}
                                    name="organizationId"
                                    defaultValue={organizations.length === 1 ? organizations[0].organizationId : ''}
                                >
                                    <option value="" disabled>Chọn tổ chức áp dụng cấu hình</option>
                                    {organizations.map((organization) => (
                                        <option key={organization.organizationId} value={organization.organizationId}>
                                            {organization.name}
                                        </option>
                                    ))}
                                </Select>
                            )}
                        </Field>
                    )}
                    <Field label="Tên cấu hình" required>
                        {(f) => (
                            <Input
                                {...f}
                                name="name"
                                type="text"
                                placeholder="Vd: Vị trí quản lý"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        )}
                    </Field>
                    <Field label="Mô tả">
                        {(f) => (
                            <Input
                                {...f}
                                name="description"
                                type="text"
                                placeholder="Vd: Dùng cho các vị trí cấp trung và cấp cao"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        )}
                    </Field>
                </div>

                <section className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                        <h3 className="text-body-sm font-medium text-ink">Trọng số tiêu chí</h3>
                        <Badge tone={totalTone} className="tabular-nums">{`${total}/100`}</Badge>
                    </div>
                    <WeightRow
                        tone="skills" label="Kỹ năng" ariaLabel="Trọng số kỹ năng (%)" weight={skill.weight}
                        onWeightChange={(v) => setSkill({ ...skill, weight: v })}
                    />
                    <WeightRow
                        tone="experience" label="Kinh nghiệm" ariaLabel="Trọng số kinh nghiệm (%)" weight={experience.weight}
                        onWeightChange={(v) => setExperience({ ...experience, weight: v })}
                    />
                    <WeightRow
                        tone="education" label="Học vấn" ariaLabel="Trọng số học vấn (%)" weight={education.weight}
                        onWeightChange={(v) => setEducation({ ...education, weight: v })}
                    />
                    <WeightBar skills={skill.weight} experience={experience.weight} education={education.weight} />
                </section>

                <section className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                        <h3 className="text-body-sm font-medium text-ink">Ngưỡng điểm tối thiểu</h3>
                        <Badge className="tabular-nums">{`${threshold} pts`}</Badge>
                    </div>
                    <WeightRow
                        tone="threshold" label="Điểm tối thiểu để xét duyệt" ariaLabel="Ngưỡng điểm tối thiểu" unit="pts"
                        weight={threshold}
                        onWeightChange={setThreshold}
                    >
                        <p className="text-micro text-ink-3">
                            ≥ threshold + 20 → Hire &nbsp;·&nbsp; ≥ threshold → Interview &nbsp;·&nbsp; &lt; threshold → Reject
                        </p>
                    </WeightRow>
                </section>
            </form>
        </Dialog>
    );
}
