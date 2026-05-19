"use client"

import { CheckCircle, ChevronDown, ChevronUp, Copy, MoreHorizontal, Pencil, Save, Star, Trash2, X } from "lucide-react";
import { useState } from "react";
import { ConfigProfile } from "../../../types/interfaces/configProfile.interface";
import { motion, AnimatePresence } from 'motion/react';
import { WeightRow } from "./WeightRow";
import { SF } from "@/types/fonts/fonts";
import { aiConfigToast } from "@/lib/toast";

function totalOf(p: ConfigProfile) {
    return p.skillsWeight + p.experienceWeight + p.educationWeight;
}

export function ConfigCard({
    profile, onUpdate, onDelete, onSetDefault, onDuplicate,
}: {
    profile: ConfigProfile;
    onUpdate: (p: ConfigProfile) => void | Promise<void>;
    onDelete: () => void | Promise<void>;
    onSetDefault: () => void | Promise<void>;
    onDuplicate: () => void | Promise<void>;
}) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    // Draft state — only applied when user clicks Save
    const [draft, setDraft] = useState<ConfigProfile>(profile);
    const [isCollapsed, setIsCollapsed] = useState(profile.collapsed)

    // useEffect(() => {
    //     setIsCollapsed(profile.collapsed);
    // }, [isCollapsed]);

    const total = totalOf(draft);
    const isValid = total === 100;
    const remaining = 100 - total;

    const handleStartEdit = () => {
        setDraft(profile); // reset to latest saved state
        setIsEditing(true);
        setMenuOpen(false);
    };

    const handleCancelEdit = () => {
        setDraft(profile); // discard changes
        setIsEditing(false);
    };

    const handleSave = () => {
        if (!isValid) {
            aiConfigToast.invalidWeights();
            return;
        }
        onUpdate(draft);
        setIsEditing(false);
    };

    const handleCollapse = () => {
        setIsCollapsed(prev => !prev);
    };

    const handleDuplicate = () => {
        onDuplicate();
        setMenuOpen(false);
    }

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            className={`bg-white rounded-2xl border transition-all ${profile.isDefault ? 'border-[#0071E3] shadow-md shadow-[#0071E3]/10' : 'border-[#E5E5EA]'
                }`}
        >
            {/* ── Header ── */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-[#F2F2F7]">
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${profile.isDefault ? 'bg-[#34C759]' : 'bg-[#33CCFF]'}`} />

                <div className="flex-1 min-w-0">
                    {/* Title input */}
                    <div className="relative">
                        <input
                            type="text"
                            disabled={!isEditing}
                            value={isEditing ? (draft.name || '') : (profile.name || '')}
                            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                            className="text-[15px] text-[#1D1D1F] tracking-[-0.01em] bg-transparent outline-none w-full disabled:cursor-default disabled:select-none pb-px"
                            style={{ fontFamily: SF, fontWeight: 600 }}
                        />
                        {isEditing && (
                            <div className={`absolute bottom-0 left-0 right-0 h-px transition-colors ${draft.name !== profile.name ? 'bg-[#FF9500]' : 'bg-[#0071E3]'}`} />
                        )}
                    </div>
                    {/* Description input */}
                    <div className="relative">
                        <input
                            type="text"
                            disabled={!isEditing}
                            value={isEditing ? (draft.description || '') : (profile.description || '')}
                            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                            className="text-[12px] text-[#AEAEB2] bg-transparent outline-none w-full disabled:cursor-default disabled:select-none pb-px"
                            style={{ fontFamily: SF }}
                        />
                        {isEditing && (
                            <div className={`absolute bottom-0 left-0 right-0 h-px transition-colors ${draft.description !== profile.description ? 'bg-[#FF9500]' : 'bg-[#D1D1D6]'}`} />
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                    {/* Status badges — alongside the weight badge */}
                    {profile.isDefault && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#eaffe3] text-[#019b22] flex-shrink-0" style={{ fontWeight: 600 }}>
                            Mặc định
                        </span>
                    )}
                    {isEditing && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FFF4E5] text-[#FF9500] flex-shrink-0" style={{ fontWeight: 600 }}>
                            Đang chỉnh sửa
                        </span>
                    )}
                    {/* Tổng trọng số badge — show draft total when editing */}
                    <span
                        className={`text-[11px] px-2.5 py-1 rounded-full mr-1 ${isEditing
                            ? (isValid ? 'bg-[#F0FDF4] text-[#16A34A]' : total > 100 ? 'bg-[#FFE5E5] text-[#FF3B30]' : 'bg-[#FFF4E5] text-[#FF9500]')
                            : 'bg-[#F5F5F7] text-[#6E6E73]'
                            }`}
                        style={{ fontWeight: 600 }}
                    >
                        {isEditing ? `${total}/100` : `${totalOf(profile)}/100`}
                    </span>

                    {/* Cancel edit button — visible only when editing */}
                    <AnimatePresence>
                        {isEditing && (
                            <motion.button
                                key="cancel-edit"
                                initial={{ opacity: 0, scale: 0.7 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.7 }}
                                transition={{ duration: 0.15 }}
                                onClick={() => { handleCancelEdit(); setIsCollapsed(profile.isDefault ? false : true); }}
                                title="Hủy chỉnh sửa"
                                className="p-1.5 rounded-lg text-[#FF3B30] hover:bg-[#FFE5E5] transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </motion.button>
                        )}
                    </AnimatePresence>

                    {/* Kebab menu */}
                    <div className="relative">
                        <button
                            onClick={() => setMenuOpen(!menuOpen)}
                            className="p-2 rounded-lg text-[#AEAEB2] hover:bg-[#F5F5F7] transition-colors"
                        >
                            <MoreHorizontal className="w-4 h-4" />
                        </button>
                        {menuOpen && (
                            <>
                                <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
                                <div className="absolute right-0 top-full mt-1 w-[190px] bg-white rounded-xl shadow-xl border border-[#E5E5EA] z-40 overflow-hidden">
                                    {/* Edit option */}
                                    <button
                                        onClick={() => { handleStartEdit(); setIsCollapsed(false); }}
                                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors"
                                    >
                                        <Pencil className="w-3.5 h-3.5 text-[#0071E3]" />Chỉnh sửa cấu hình
                                    </button>
                                    {!profile.isDefault && (
                                        <button
                                            onClick={() => { onSetDefault(); setMenuOpen(false); }}
                                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors"
                                        >
                                            <Star className="w-3.5 h-3.5 text-[#0071E3]" />Đặt làm mặc định
                                        </button>
                                    )}
                                    <button
                                        onClick={() => { handleDuplicate(); setMenuOpen(false); }}
                                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors"
                                    >
                                        <Copy className="w-3.5 h-3.5 text-[#6E6E73]" />Nhân bản
                                    </button>
                                    {!profile.isDefault && (
                                        <button
                                            onClick={() => { onDelete(); setMenuOpen(false); }}
                                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#FF3B30] hover:bg-[#FFE5E5] transition-colors"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />Xóa cấu hình
                                        </button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Collapse */}
                    <button
                        onClick={handleCollapse}
                        className="p-2 rounded-lg text-[#AEAEB2] hover:bg-[#F5F5F7] transition-colors"
                    >
                        {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}

                    </button>
                </div>
            </div>

            {/* ── Body (collapsible) ── */}
            <AnimatePresence initial={false}>
                {!isCollapsed && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                        className="overflow-hidden"
                    >
                        <div className="p-5 space-y-3">
                            {/* 3 criteria weight rows */}
                            <WeightRow
                                color="#0071E3" label="Kỹ năng" weight={isEditing ? draft.skillsWeight : profile.skillsWeight}
                                disabled={!isEditing}
                                onWeightChange={(v) => setDraft({ ...draft, skillsWeight: v })}
                            />
                            <WeightRow
                                color="#6366F1" label="Kinh nghiệm" weight={isEditing ? draft.experienceWeight : profile.experienceWeight}
                                disabled={!isEditing}
                                onWeightChange={(v) => setDraft({ ...draft, experienceWeight: v })}
                            />
                            <WeightRow
                                color="#009900" label="Học vấn" weight={isEditing ? draft.educationWeight : profile.educationWeight}
                                disabled={!isEditing}
                                onWeightChange={(v) => setDraft({ ...draft, educationWeight: v })}
                            />

                            {/* Threshold row */}
                            <div className={`p-4 rounded-2xl border space-y-3 transition-colors ${isEditing ? 'border-[#E5E5EA] bg-[#FAFAFA]' : 'border-[#F2F2F7] bg-[#FAFAFA] opacity-70'}`}>
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-[#D2691E]" />
                                        <span className="text-[13px] text-[#1D1D1F] truncate" style={{ fontWeight: 500 }}>
                                            Ngưỡng điểm tối thiểu
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                        <input
                                            type="number" min="0" max="100"
                                            disabled={!isEditing}
                                            value={isEditing ? draft.minimumScoreThreshold : profile.minimumScoreThreshold}
                                            onChange={(e) => setDraft({ ...draft, minimumScoreThreshold: Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) })}
                                            className="w-14 px-2 py-1 text-center text-[13px] border border-[#E5E5EA] rounded-lg focus:border-[#FF9500] outline-none bg-white disabled:bg-[#F5F5F7] disabled:cursor-not-allowed"
                                            style={{ fontFamily: SF, fontWeight: 700 }}
                                        />
                                        <span className="text-[12px] text-[#AEAEB2]">pts</span>
                                    </div>
                                </div>
                                <input
                                    type="range" min="0" max="100"
                                    disabled={!isEditing}
                                    value={isEditing ? draft.minimumScoreThreshold : profile.minimumScoreThreshold}
                                    onChange={(e) => setDraft({ ...draft, minimumScoreThreshold: parseInt(e.target.value) })}
                                    className="w-full disabled:cursor-not-allowed"
                                    style={{ accentColor: isEditing ? '#D2691E' : '#D1D1D6' }}
                                />
                                <p className="text-[11px] text-[#AEAEB2]">
                                    ≥ threshold + 20 → Hire &nbsp;·&nbsp; ≥ threshold → Interview &nbsp;·&nbsp; &lt; threshold → Reject
                                </p>
                            </div>

                            {/* Remaining hint — only shown in edit mode */}
                            {isEditing && !isValid && (
                                <p className={`text-[12px] text-center ${remaining > 0 ? 'text-[#FF9500]' : 'text-[#FF3B30]'}`}>
                                    {remaining > 0
                                        ? `Còn thiếu ${remaining}% — tổng phải bằng 100`
                                        : `Vượt quá ${-remaining}% — tổng phải bằng 100`}
                                </p>
                            )}

                            {/* Visual combined bar */}
                            <div className="h-2.5 bg-[#F2F2F7] rounded-full overflow-hidden flex">
                                {[
                                    { key: 'skills', w: isEditing ? draft.skillsWeight : profile.skillsWeight, color: '#0071E3' },
                                    { key: 'experience', w: isEditing ? draft.experienceWeight : profile.experienceWeight, color: '#6366F1' },
                                    { key: 'education', w: isEditing ? draft.educationWeight : profile.educationWeight, color: '#009900' },
                                ].map(({ key, w, color }) => (
                                    w > 0 && (
                                        <div key={key} className="h-full transition-all duration-300" style={{ width: `${w}%`, background: color }} />
                                    )
                                ))}
                            </div>

                            {/* Legend */}
                            <div className="flex items-center justify-between text-[11px] text-[#AEAEB2]">
                                {[
                                    { label: 'Kỹ năng', w: isEditing ? draft.skillsWeight : profile.skillsWeight, color: '#0071E3' },
                                    { label: 'Kinh nghiệm', w: isEditing ? draft.experienceWeight : profile.experienceWeight, color: '#6366F1' },
                                    { label: 'Học vấn', w: isEditing ? draft.educationWeight : profile.educationWeight, color: '#009900' },
                                ].map(({ label, w, color }) => (
                                    <div key={label} className="flex items-center gap-1">
                                        <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                                        <span>{label} {w}%</span>
                                    </div>
                                ))}
                            </div>

                            {/* Save button — only enabled when in edit mode AND weights are valid */}
                            <div className="pt-2 border-t border-[#F2F2F7]">
                                <button
                                    disabled={!isEditing || !isValid}
                                    onClick={handleSave}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0071E3] hover:bg-[#0077ED] disabled:bg-[#E5E5EA] disabled:text-[#AEAEB2] text-white rounded-xl transition-all shadow-sm text-[13px]"
                                    style={{ fontWeight: 600 }}
                                >
                                    {isEditing ? <Save className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                                    {isEditing ? 'Lưu cấu hình' : 'Đã lưu'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
