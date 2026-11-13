'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { Button, Field, Input, Sheet, Textarea } from '@/components/ui';
import { ICandidateDto } from '@/types/interfaces/candidate.interface';
import { updateMyCandidateProfileAction } from '@/servers/candidates/candidates.action';

interface ProfileEditModalProps {
    profile: ICandidateDto;
    open: boolean;
    onClose: () => void;
}

type ActionState = { success: boolean; message: string };
const initialState: ActionState = { success: false, message: '' };

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" loading={pending}>
            Cập nhật
        </Button>
    );
}

function ProfileForm({ profile, onClose }: { profile: ICandidateDto; onClose: () => void }) {
    const [state, formAction] = useActionState(updateMyCandidateProfileAction, initialState);

    useEffect(() => {
        if (state.success) {
            const timer = setTimeout(() => onClose(), 300);
            return () => clearTimeout(timer);
        }
    }, [state.success, onClose]);

    const pd = profile.profileData as { summary?: string; location?: string } | undefined;

    return (
        <form action={formAction} className="flex flex-col gap-4">
            <Field label="Họ và tên" required>
                {(f) => <Input {...f} type="text" name="fullName" defaultValue={profile.user?.fullName} />}
            </Field>
            <Field label="Chức danh hiện tại">
                {(f) => (
                    <Input {...f} type="text" name="currentTitle" defaultValue={profile.currentTitle || ''} placeholder="Ví dụ: Frontend Developer" />
                )}
            </Field>
            <Field label="Số năm kinh nghiệm">
                {(f) => (
                    <Input {...f} type="number" name="yearsOfExperience" min={0} max={50} defaultValue={profile.yearsOfExperience || ''} />
                )}
            </Field>
            <Field label="Số điện thoại">
                {(f) => <Input {...f} type="tel" name="phoneNumber" defaultValue={profile.user?.phoneNumber || ''} />}
            </Field>
            <Field label="Giới thiệu bản thân">
                {(f) => (
                    <Textarea {...f} name="summary" rows={3} defaultValue={pd?.summary || ''} placeholder="Mô tả ngắn về bản thân và mục tiêu nghề nghiệp" />
                )}
            </Field>
            <Field label="Vị trí">
                {(f) => <Input {...f} type="text" name="location" defaultValue={pd?.location || ''} placeholder="Ví dụ: TP. Hồ Chí Minh" />}
            </Field>

            {state.message && !state.success && (
                <p role="alert" className="rounded-ctl bg-danger-soft px-3 py-2 text-body-sm text-danger">
                    {state.message}
                </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={onClose}>
                    Hủy
                </Button>
                <SubmitButton />
            </div>
        </form>
    );
}

export function ProfileEditModal({ profile, open, onClose }: ProfileEditModalProps) {
    return (
        <Sheet open={open} onOpenChange={(next) => !next && onClose()} title="Sửa hồ sơ">
            <ProfileForm profile={profile} onClose={onClose} />
        </Sheet>
    );
}
