'use client';

import { useState } from 'react';
import { Cpu, Plus } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { ConfigProfile } from '@/types/interfaces/configProfile.interface';
import { IOrganizationOption } from '@ats-platform/types';
import { ConfigCard } from '@/components/ai-configuration/ui/ConfigCard';
import { AddProfileModal } from '@/components/ai-configuration/ui/AddProfileModal';
import { Button, EmptyState, PageToolbar, Surface } from '@/components/ui';
import {
    deleteAIConfigAction,
    duplicateAIConfigAction,
    setDefaultAIConfigAction,
    updateAIConfigAction,
} from '@/servers/ai-config/ai-config.action';
import { aiConfigToast } from '@/lib/toast';

interface Props {
    profiles: ConfigProfile[];
    /** Non-empty only for a platform admin — see getOrganizationOptionsForCurrentUser. */
    organizations: IOrganizationOption[];
}

export default function AIScreeningConfigClient({ profiles, organizations }: Props) {
    const [showModal, setShowModal] = useState(false);

    const updateProfile = async (updated: ConfigProfile) => {
        const result = await updateAIConfigAction(updated);

        if (result.success) {
            aiConfigToast.updateSuccess(updated.name);
        } else {
            aiConfigToast.updateError();
        }
    };

    const deleteProfile = async (configId: string, name?: string) => {
        const result = await deleteAIConfigAction(configId);
        if (result.success) {
            aiConfigToast.deleteSuccess(name);
        } else {
            aiConfigToast.deleteError();
        }
    };

    const setDefault = async (configId: string, name?: string) => {
        const result = await setDefaultAIConfigAction(configId);
        if (result.success) {
            aiConfigToast.setDefaultSuccess(name);
        } else {
            aiConfigToast.setDefaultError();
        }
    };

    const duplicateProfile = async (configId: string, name?: string) => {
        const result = await duplicateAIConfigAction(configId);
        if (result.success) {
            aiConfigToast.duplicateSuccess(name);
        } else {
            aiConfigToast.duplicateError();
        }
    };

    const stats = [
        { label: 'Tổng cấu hình', value: profiles.length },
        { label: 'Mặc định', value: profiles.filter((p) => p.isDefault).length },
    ];

    return (
        <div className="space-y-4 p-4 lg:p-6">
            <PageToolbar title="Cấu hình AI Screening">
                <Button onClick={() => setShowModal(true)}>
                    <Plus aria-hidden="true" strokeWidth={1.75} />
                    Thêm cấu hình mới
                </Button>
            </PageToolbar>

            <Surface as="dl" className="grid grid-cols-2 divide-x divide-line">
                {stats.map(({ label, value }) => (
                    <div key={label} className="px-4 py-3">
                        <dt className="text-caption text-ink-3">{label}</dt>
                        <dd className="mt-0.5 text-title-sm tabular-nums text-ink">{value}</dd>
                    </div>
                ))}
            </Surface>

            {profiles.length === 0 ? (
                <Surface>
                    <EmptyState
                        icon={Cpu}
                        title="Chưa có cấu hình"
                        description="Cấu hình đầu tiên đặt trọng số cho việc sàng lọc CV."
                        action={
                            <Button onClick={() => setShowModal(true)}>
                                <Plus aria-hidden="true" strokeWidth={1.75} />
                                Thêm cấu hình mới
                            </Button>
                        }
                    />
                </Surface>
            ) : (
                <div className="space-y-4">
                    <AnimatePresence>
                        {profiles.map((profile) => (
                            <ConfigCard
                                key={profile.configId}
                                profile={profile}
                                organizationName={organizations.find((org) => org.organizationId === profile.organizationId)?.name}
                                onUpdate={(updated) => updateProfile(updated)}
                                onDelete={() => deleteProfile(profile.configId || '', profile.name)}
                                onSetDefault={() => setDefault(profile.configId || '', profile.name)}
                                onDuplicate={() => duplicateProfile(profile.configId || '', profile.name)}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            )}

            <ul className="space-y-1 text-caption text-ink-3">
                <li>Tổng 3 trọng số phải đúng bằng 100%.</li>
                <li>Dùng &quot;Nhân bản&quot; để tạo biến thể nhanh.</li>
            </ul>

            {showModal && <AddProfileModal organizations={organizations} onClose={() => setShowModal(false)} />}
        </div>
    );
}
