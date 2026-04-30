'use client';

import { useActionState, useEffect, useState } from 'react';
import {
    X, Briefcase, GraduationCap, Code, Award, FolderGit2,
    User, Mail, Phone, CheckCircle, ChevronDown, ChevronUp, UserCheck
} from 'lucide-react';
import { SF, SFT } from '@/types/fonts/fonts';
import { motion, AnimatePresence } from 'motion/react';
import SubmitButton from '@/components/common/SubmitButton';
import { ICvDto } from '@/types/interfaces/cv.interface';
import { ICvParsedData } from '@ats-platform/types';
import { confirmCvAction } from '@/servers/cvs/cvs.action';
import { toast } from '@/lib/toast';

interface CvDetailModalProps {
    cv: ICvDto;
    onClose: () => void;
}

// ── Placeholder action ────────────────────────────────────────────────────────
type ActionState = { success: boolean; message: string };
const initialState: ActionState = { success: false, message: '' };

// ── Sub-components ───────────────────────────────────────────────────────────

function SectionTitle({ icon, title, count }: { icon: React.ReactNode; title: string; count?: number }) {
    return (
        <h3 className="text-[13px] text-[#1D1D1F] mb-3 flex items-center gap-2" style={{ fontWeight: 600 }}>
            {icon}
            {title}
            {count !== undefined && (
                <span className="text-[11px] text-[#AEAEB2] bg-[#F5F5F7] rounded-full px-2 py-0.5">
                    {count}
                </span>
            )}
        </h3>
    );
}

function SkillBadge({ label, color, bg }: { label: string; color: string; bg: string }) {
    return (
        <span
            className="text-[12px] rounded-lg px-2.5 py-1 inline-block"
            style={{ color, background: bg, fontWeight: 500 }}
        >
            {label}
        </span>
    );
}

function ExperienceItem({ exp }: { exp: ICvParsedData['experience'][number] }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="bg-[#F5F5F7] rounded-xl p-3.5">
            <button
                type="button"
                onClick={() => setOpen((p) => !p)}
                className="w-full flex items-start justify-between text-left gap-2"
            >
                <div>
                    <p className="text-[13px] text-[#1D1D1F]" style={{ fontWeight: 500 }}>
                        {exp.position ?? '—'}
                    </p>
                    <p className="text-[12px] text-[#6E6E73] mt-0.5">
                        {exp.company ?? '—'}
                        {(exp.start_date || exp.end_date) && (
                            <span className="text-[#AEAEB2]">
                                {' '}· {exp.start_date} – {exp.end_date ?? 'Present'}
                            </span>
                        )}
                    </p>
                </div>
                {exp.description && (
                    open
                        ? <ChevronUp className="w-3.5 h-3.5 text-[#AEAEB2] flex-shrink-0 mt-0.5" />
                        : <ChevronDown className="w-3.5 h-3.5 text-[#AEAEB2] flex-shrink-0 mt-0.5" />
                )}
            </button>
            {open && exp.description && (
                <p className="text-[12px] text-[#6E6E73] mt-2 leading-relaxed border-t border-[#E5E5EA] pt-2">
                    {exp.description}
                </p>
            )}
        </div>
    );
}

function ProjectItem({ proj }: { proj: ICvParsedData['projects'][number] }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="bg-[#F5F5F7] rounded-xl p-3.5">
            <button
                type="button"
                onClick={() => setOpen((p) => !p)}
                className="w-full flex items-start justify-between text-left gap-2"
            >
                <div>
                    <p className="text-[13px] text-[#1D1D1F]" style={{ fontWeight: 500 }}>
                        {proj.name ?? '—'}
                    </p>
                    <p className="text-[12px] text-[#6E6E73] mt-0.5">
                        {proj.role ?? ''}
                        {(proj.start_date || proj.end_date) && (
                            <span className="text-[#AEAEB2]">
                                {proj.role ? ' · ' : ''}{proj.start_date} – {proj.end_date ?? 'Present'}
                            </span>
                        )}
                    </p>
                    {proj.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                            {proj.technologies.map((t) => (
                                <span key={t} className="text-[10px] text-[#6366F1] bg-[#F5F3FF] rounded-md px-1.5 py-0.5">
                                    {t}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
                {proj.description && (
                    open
                        ? <ChevronUp className="w-3.5 h-3.5 text-[#AEAEB2] flex-shrink-0 mt-0.5" />
                        : <ChevronDown className="w-3.5 h-3.5 text-[#AEAEB2] flex-shrink-0 mt-0.5" />
                )}
            </button>
            {open && proj.description && (
                <p className="text-[12px] text-[#6E6E73] mt-2 leading-relaxed border-t border-[#E5E5EA] pt-2">
                    {proj.description}
                </p>
            )}
        </div>
    );
}

// ── Main Modal ────────────────────────────────────────────────────────────────
export function CvDetailModal({ cv, onClose }: CvDetailModalProps) {
    const [state, formAction] = useActionState(confirmCvAction, initialState);

    useEffect(() => {
        if (state.success) {
            const timer = setTimeout(() => onClose(), 500);
            toast.success(state.message);
            return () => clearTimeout(timer);
        } else if (!state.success && state.message) {
            toast.error(state.message);
        }
    }, [state, onClose]);

    const data = cv.parsedData;
    if (!data) return null;

    const isAlreadyConfirmed = data.isConfirmed;
    const hasSkills = data.skills.technical.length > 0 || data.skills.soft.length > 0 || data.skills.languages.length > 0;

    return (
        <AnimatePresence>
            <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center z-50 p-4"
                onClick={onClose}
            >
                <motion.div
                    key="modal"
                    initial={{ opacity: 0, scale: 0.96, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 12 }}
                    transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden max-h-[90vh] flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-start justify-between p-6 border-b border-[#F2F2F7] flex-shrink-0">
                        <div>
                            <h2 className="text-[18px] text-[#1D1D1F] tracking-[-0.01em]" style={{ fontFamily: SF, fontWeight: 600 }}>
                                Chi tiết sơ yếu lý lịch
                            </h2>
                            <p className="text-[12px] text-[#AEAEB2] mt-0.5">{cv.fileName}</p>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-lg text-[#AEAEB2] hover:bg-[#F5F5F7] transition-colors mt-0.5" type="button">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Scrollable content */}
                    <div className="overflow-y-auto flex-1 p-6 space-y-6" style={{ fontFamily: SFT }}>

                        {/* ── Confirm CTA Banner ────────────────────────── */}
                        {!isAlreadyConfirmed ? (
                            <div className="bg-[#EBF3FD] rounded-2xl p-4 flex items-start gap-3">
                                <UserCheck className="w-5 h-5 text-[#0071E3] flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-[13px] text-[#0071E3]" style={{ fontWeight: 600 }}>
                                        Xác nhận để cập nhật hồ sơ
                                    </p>
                                    <p className="text-[12px] text-[#3B82F6] mt-0.5">
                                        AI đã trích xuất thông tin từ CV. Hãy kiểm tra và bấm xác nhận để đồng bộ vào hồ sơ của bạn.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-[#E8F5E9] rounded-2xl p-4 flex items-center gap-3">
                                <CheckCircle className="w-5 h-5 text-[#34C759] flex-shrink-0" />
                                <p className="text-[13px] text-[#16A34A]" style={{ fontWeight: 600 }}>
                                    Hồ sơ đã được xác nhận từ CV này
                                </p>
                            </div>
                        )}

                        {/* ── Skills ────────────────────────────────────── */}
                        {hasSkills && (
                            <div>
                                <SectionTitle
                                    icon={<Code className="w-4 h-4 text-[#6366F1]" />}
                                    title="Kỹ năng"
                                    count={data.skills.technical.length + data.skills.soft.length + data.skills.languages.length}
                                />
                                <div className="space-y-2.5">
                                    {data.skills.technical.length > 0 && (
                                        <div>
                                            <p className="text-[11px] text-[#AEAEB2] mb-1.5 uppercase tracking-wide" style={{ fontWeight: 600 }}>Kỹ thuật</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {data.skills.technical.map((s) => (
                                                    <SkillBadge key={s} label={s} color="#6366F1" bg="#F5F3FF" />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {data.skills.soft.length > 0 && (
                                        <div>
                                            <p className="text-[11px] text-[#AEAEB2] mb-1.5 uppercase tracking-wide" style={{ fontWeight: 600 }}>Kỹ năng mềm</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {data.skills.soft.map((s) => (
                                                    <SkillBadge key={s} label={s} color="#0071E3" bg="#EBF3FD" />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {data.skills.languages.length > 0 && (
                                        <div>
                                            <p className="text-[11px] text-[#AEAEB2] mb-1.5 uppercase tracking-wide" style={{ fontWeight: 600 }}>Ngoại ngữ</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {data.skills.languages.map((s) => (
                                                    <SkillBadge key={s} label={s} color="#059669" bg="#ECFDF5" />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ── Experience ────────────────────────────────── */}
                        {data.experience.length > 0 && (
                            <div>
                                <SectionTitle
                                    icon={<Briefcase className="w-4 h-4 text-[#0071E3]" />}
                                    title="Kinh nghiệm làm việc"
                                    count={data.experience.length}
                                />
                                <div className="space-y-2">
                                    {data.experience.map((exp, i) => (
                                        <ExperienceItem key={i} exp={exp} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── Projects ──────────────────────────────────── */}
                        {data.projects.length > 0 && (
                            <div>
                                <SectionTitle
                                    icon={<FolderGit2 className="w-4 h-4 text-[#EC4899]" />}
                                    title="Dự án"
                                    count={data.projects.length}
                                />
                                <div className="space-y-2">
                                    {data.projects.map((proj, i) => (
                                        <ProjectItem key={i} proj={proj} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── Education ─────────────────────────────────── */}
                        {data.education.length > 0 && (
                            <div>
                                <SectionTitle
                                    icon={<GraduationCap className="w-4 h-4 text-[#34C759]" />}
                                    title="Học vấn"
                                    count={data.education.length}
                                />
                                <div className="space-y-2">
                                    {data.education.map((edu, i) => (
                                        <div key={i} className="bg-[#F5F5F7] rounded-xl p-3.5">
                                            <p className="text-[13px] text-[#1D1D1F]" style={{ fontWeight: 500 }}>
                                                {edu.degree} {edu.major ? `— ${edu.major}` : ''}
                                            </p>
                                            <p className="text-[12px] text-[#6E6E73] mt-0.5">{edu.institution ?? '—'}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── Certificates ──────────────────────────────── */}
                        {data.certificates.length > 0 && (
                            <div>
                                <SectionTitle
                                    icon={<Award className="w-4 h-4 text-[#F59E0B]" />}
                                    title="Chứng chỉ"
                                    count={data.certificates.length}
                                />
                                <div className="flex flex-col gap-2">
                                    {data.certificates.map((cert, i) => (
                                        <div key={i} className="flex items-center gap-2.5 bg-[#FFFBEB] rounded-xl px-3.5 py-2.5">
                                            <Award className="w-3.5 h-3.5 text-[#F59E0B] flex-shrink-0" />
                                            <span className="text-[13px] text-[#92400E]">{cert}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Success message */}
                        {state.success && (
                            <div className="bg-[#E8F5E9] rounded-xl p-4 flex items-center gap-3">
                                <CheckCircle className="w-5 h-5 text-[#34C759]" />
                                <p className="text-[13px] text-[#16A34A]" style={{ fontWeight: 500 }}>{state.message}</p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-5 border-t border-[#F2F2F7] flex-shrink-0">
                        {!isAlreadyConfirmed && !state.success ? (
                            <form action={formAction} className="flex flex-col gap-4">
                                <div className="flex items-center gap-2 px-1">
                                    <input
                                        type="checkbox"
                                        id="syncToProfile"
                                        name="syncToProfile"
                                        value="true"
                                        className="w-[18px] h-[18px] text-[#007AFF] rounded-[4px] border-[#C7C7CC] focus:ring-[#007AFF] cursor-pointer"
                                    />
                                    <label htmlFor="syncToProfile" className="text-[14px] text-[#1D1D1F] select-none cursor-pointer">
                                        Dùng thông tin này làm hồ sơ mặc định
                                    </label>
                                </div>
                                <div className="flex gap-3">
                                    <input type="hidden" name="cvId" value={cv.cvId} />
                                    <input type="hidden" name="markAsConfirmed" value="true" />
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="flex-1 mt-[3px] py-3 rounded-xl border border-[#E5E5EA] hover:bg-[#F5F5F7] transition-colors text-[14px] text-[#1D1D1F]"
                                        style={{ fontWeight: 500 }}
                                    >
                                        Đóng
                                    </button>
                                    <div className="flex-[2]">
                                        <SubmitButton content="Xác nhận CV" />
                                    </div>
                                </div>
                            </form>
                        ) : (
                            <form action={formAction} className="flex gap-3">
                                <input type="hidden" name="cvId" value={cv.cvId} />
                                <input type="hidden" name="syncToProfile" value="true" />
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 mt-[3px] py-3 rounded-xl border border-[#E5E5EA] hover:bg-[#F5F5F7] transition-colors text-[14px] text-[#1D1D1F]"
                                    style={{ fontWeight: 500 }}
                                >
                                    Đóng
                                </button>
                                <div className="flex-[2]">
                                    <SubmitButton content="Sử dụng profile này" />
                                </div>
                            </form>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
