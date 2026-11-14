"use client"

import { CheckCircle, ChevronDown, ChevronUp, Copy, MoreHorizontal, Pencil, Save, Star, Trash2, X } from "lucide-react";
import { useState } from "react";
import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import { ConfigProfile } from "../../../types/interfaces/configProfile.interface";
import {
    Badge,
    Button,
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    IconButton,
} from "@/components/ui";
import { cn } from "@/components/ui/cn";
import { duration, ease, exitDuration } from "@/lib/motion";
import { aiConfigToast } from "@/lib/toast";
import { WeightBar, WeightRow } from "./WeightRow";

function totalOf(p: ConfigProfile) {
    return p.skillsWeight + p.experienceWeight + p.educationWeight;
}

const ICON = { 'aria-hidden': true, strokeWidth: 1.75 } as const;

export function ConfigCard({
    profile, organizationName, onUpdate, onDelete, onSetDefault, onDuplicate,
}: {
    profile: ConfigProfile;
    organizationName?: string;
    onUpdate: (p: ConfigProfile) => void | Promise<void>;
    onDelete: () => void | Promise<void>;
    onSetDefault: () => void | Promise<void>;
    onDuplicate: () => void | Promise<void>;
}) {
    const [isEditing, setIsEditing] = useState(false);
    // Draft state — only applied when user clicks Save
    const [draft, setDraft] = useState<ConfigProfile>(profile);
    const [isCollapsed, setIsCollapsed] = useState(profile.collapsed)

    const total = totalOf(draft);
    const isValid = total === 100;
    const remaining = 100 - total;
    const shown = isEditing ? draft : profile;

    const handleStartEdit = () => {
        setDraft(profile); // reset to latest saved state
        setIsEditing(true);
        setIsCollapsed(false);
    };

    const handleCancelEdit = () => {
        setDraft(profile); // discard changes
        setIsEditing(false);
        setIsCollapsed(profile.isDefault ? false : true);
    };

    const handleSave = () => {
        if (!isValid) {
            aiConfigToast.invalidWeights();
            return;
        }
        onUpdate(draft);
        setIsEditing(false);
    };

    const totalTone = isEditing ? (isValid ? 'success' : total > 100 ? 'danger' : 'warning') : 'neutral';

    return (
        <m.div
            exit={{ opacity: 0, transition: { duration: exitDuration(duration.base) } }}
            className={cn('rounded-card bg-surface', profile.isDefault ? 'shadow-e2' : 'shadow-e1')}
        >
            {/* ── Header ── */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-5 py-4">
                <div className="min-w-0 flex-1 basis-[12rem]">
                    {organizationName && (
                        <p className="mb-1 truncate text-caption text-ink-3" title={organizationName}>{`Tổ chức: ${organizationName}`}</p>
                    )}
                    <input
                        aria-label="Tên cấu hình"
                        type="text"
                        disabled={!isEditing}
                        value={shown.name || ''}
                        title={shown.name || undefined}
                        onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                        className={cn(
                            'block w-full min-w-0 truncate rounded-ctl text-title-sm font-medium text-ink outline-none disabled:cursor-default',
                            isEditing ? 'h-8 bg-surface-2 px-2' : 'bg-transparent',
                        )}
                    />
                    <input
                        aria-label="Mô tả cấu hình"
                        type="text"
                        disabled={!isEditing}
                        value={shown.description || ''}
                        title={shown.description || undefined}
                        onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                        className={cn(
                            'mt-0.5 block w-full min-w-0 truncate rounded-ctl text-caption text-ink-3 outline-none disabled:cursor-default',
                            isEditing ? 'h-8 bg-surface-2 px-2' : 'bg-transparent',
                        )}
                    />
                </div>

                <div className="ml-auto flex min-w-0 max-w-full flex-wrap items-center justify-end gap-1.5">
                    {profile.isDefault && <Badge tone="accent">Mặc định</Badge>}
                    {isEditing && <Badge tone="warning">Đang chỉnh sửa</Badge>}
                    <Badge tone={totalTone} className="tabular-nums">{`${isEditing ? total : totalOf(profile)}/100`}</Badge>

                    {isEditing && (
                        <IconButton size="sm" aria-label="Hủy chỉnh sửa" onClick={handleCancelEdit}>
                            <X {...ICON} />
                        </IconButton>
                    )}

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <IconButton size="sm" aria-label="Tùy chọn">
                                <MoreHorizontal {...ICON} />
                            </IconButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={handleStartEdit}>
                                <Pencil {...ICON} className="size-4 text-ink-3" />Chỉnh sửa cấu hình
                            </DropdownMenuItem>
                            {!profile.isDefault && (
                                <DropdownMenuItem onSelect={() => { onSetDefault(); }}>
                                    <Star {...ICON} className="size-4 text-ink-3" />Đặt làm mặc định
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onSelect={() => { onDuplicate(); }}>
                                <Copy {...ICON} className="size-4 text-ink-3" />Nhân bản
                            </DropdownMenuItem>
                            {!profile.isDefault && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem destructive onSelect={() => { onDelete(); }}>
                                        <Trash2 {...ICON} className="size-4" />Xóa cấu hình
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <IconButton
                        size="sm"
                        aria-label={isCollapsed ? 'Mở rộng cấu hình' : 'Thu gọn cấu hình'}
                        aria-expanded={!isCollapsed}
                        onClick={() => setIsCollapsed((prev) => !prev)}
                    >
                        {isCollapsed ? <ChevronDown {...ICON} /> : <ChevronUp {...ICON} />}
                    </IconButton>
                </div>
            </div>

            {/* ── Body (collapsible) ── */}
            <AnimatePresence initial={false}>
                {!isCollapsed && (
                    <m.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, transition: { duration: exitDuration(duration.base) } }}
                        transition={{ duration: duration.base, ease: ease.out }}
                    >
                        <div className="space-y-3 px-5 pb-5">
                            <WeightRow
                                tone="skills" label="Kỹ năng" weight={shown.skillsWeight}
                                disabled={!isEditing}
                                onWeightChange={(v) => setDraft({ ...draft, skillsWeight: v })}
                            />
                            <WeightRow
                                tone="experience" label="Kinh nghiệm" weight={shown.experienceWeight}
                                disabled={!isEditing}
                                onWeightChange={(v) => setDraft({ ...draft, experienceWeight: v })}
                            />
                            <WeightRow
                                tone="education" label="Học vấn" weight={shown.educationWeight}
                                disabled={!isEditing}
                                onWeightChange={(v) => setDraft({ ...draft, educationWeight: v })}
                            />
                            <WeightRow
                                tone="threshold" label="Ngưỡng điểm tối thiểu" ariaLabel="Ngưỡng điểm tối thiểu" unit="pts"
                                weight={shown.minimumScoreThreshold}
                                disabled={!isEditing}
                                onWeightChange={(v) => setDraft({ ...draft, minimumScoreThreshold: v })}
                            >
                                <p className="text-micro text-ink-3">
                                    ≥ threshold + 20 → Hire &nbsp;·&nbsp; ≥ threshold → Interview &nbsp;·&nbsp; &lt; threshold → Reject
                                </p>
                            </WeightRow>

                            <WeightBar skills={shown.skillsWeight} experience={shown.experienceWeight} education={shown.educationWeight} />

                            <div className="flex items-center justify-between text-micro tabular-nums text-ink-3">
                                <span>{`Kỹ năng ${shown.skillsWeight}%`}</span>
                                <span>{`Kinh nghiệm ${shown.experienceWeight}%`}</span>
                                <span>{`Học vấn ${shown.educationWeight}%`}</span>
                            </div>

                            {/* Save — enabled only when editing AND the weights add up */}
                            <div className="flex items-center justify-between gap-3 pt-2">
                                <p
                                    role="status"
                                    className={cn('min-w-0 text-caption', remaining > 0 ? 'text-warning' : 'text-danger')}
                                >
                                    {isEditing && !isValid
                                        ? remaining > 0
                                            ? `Còn thiếu ${remaining}% — tổng phải bằng 100`
                                            : `Vượt quá ${-remaining}% — tổng phải bằng 100`
                                        : null}
                                </p>
                                <Button disabled={!isEditing || !isValid} onClick={handleSave} className="ml-auto">
                                    {isEditing ? <Save {...ICON} /> : <CheckCircle {...ICON} />}
                                    {isEditing ? 'Lưu cấu hình' : 'Đã lưu'}
                                </Button>
                            </div>
                        </div>
                    </m.div>
                )}
            </AnimatePresence>
        </m.div>
    );
}
