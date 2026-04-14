import { useState } from 'react';
import { Cpu, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ConfigProfile } from '../../../../types/interfaces/configProfile.interface';
import { SF, SFT } from '@/types/fonts/fonts';

let nextProfileId = 3;

export function AddProfileModal({
    onClose,
    onAdd,
}: {
    onClose: () => void;
    onAdd: (p: ConfigProfile) => void;
}) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [skill, setSkill] = useState({ name: 'Kỹ năng', weight: 40 });
    const [experience, setExperience] = useState({ name: 'Kinh nghiệm', weight: 40 });
    const [education, setEducation] = useState({ name: 'Học vấn', weight: 20 });
    const [threshold, setThreshold] = useState(60);

    const total = skill.weight + experience.weight + education.weight;
    const isValid = total === 100 && name.trim().length > 0;

    const handleAdd = () => {
        if (!isValid) return;
        onAdd({
            id: nextProfileId++,
            name: name.trim(),
            description: description.trim() || 'Cấu hình mới',
            isDefault: false, collapsed: false,
            skillsWeight: skill.weight,
            experienceWeight: experience.weight,
            educationWeight: education.weight,
            minimumScoreThreshold: threshold,
        });
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 16 }}
                transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
                style={{ fontFamily: SFT }}
            >
                {/* Modal header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-[#F2F2F7]">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#0071E3] flex items-center justify-center">
                            <Cpu className="w-4.5 h-4.5 text-white w-[18px] h-[18px]" />
                        </div>
                        <h2 className="text-[18px] text-[#1D1D1F] tracking-[-0.01em]" style={{ fontFamily: SF, fontWeight: 600 }}>
                            Thêm cấu hình mới
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg text-[#AEAEB2] hover:bg-[#F5F5F7] transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Modal body */}
                <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
                    {/* Tên & mô tả */}
                    <div className="space-y-3">
                        <div>
                            <label className="block text-[12px] text-[#6E6E73] mb-1.5 uppercase tracking-[0.05em]" style={{ fontWeight: 600 }}>
                                Tên cấu hình *
                            </label>
                            <input
                                type="text" placeholder="Vd: Vị trí quản lý"
                                value={name} onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5EA] focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/10 outline-none text-[14px] transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-[12px] text-[#6E6E73] mb-1.5 uppercase tracking-[0.05em]" style={{ fontWeight: 600 }}>
                                Mô tả
                            </label>
                            <input
                                type="text" placeholder="Vd: Dùng cho các vị trí cấp trung và cấp cao"
                                value={description} onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5EA] focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/10 outline-none text-[14px] transition-all"
                            />
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-[#F2F2F7]" />

                    {/* 3 criteria */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-[12px] text-[#6E6E73] uppercase tracking-[0.05em]" style={{ fontWeight: 600 }}>
                                Trọng số tiêu chí
                            </p>
                            <span
                                className={`text-[12px] px-2.5 py-1 rounded-full ${total === 100 ? 'bg-[#F0FDF4] text-[#16A34A]' :
                                    total > 100 ? 'bg-[#FFE5E5] text-[#FF3B30]' : 'bg-[#FFF4E5] text-[#FF9500]'
                                    }`}
                                style={{ fontWeight: 600 }}
                            >
                                {total}/100
                            </span>
                        </div>

                        <div className="space-y-4">
                            {/* Kỹ năng */}
                            <div className="p-4 rounded-2xl border border-[#E5E5EA] space-y-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-[#0071E3] flex-shrink-0" />
                                    <p
                                        className="flex-1 text-[13px] text-[#1D1D1F] border-b border-transparent outline-none bg-transparent"
                                        style={{ fontWeight: 500 }}
                                    >
                                        Kỹ năng
                                    </p>
                                    <div className="flex items-center gap-1">
                                        <input
                                            type="number" min="0" max="100"
                                            value={skill.weight}
                                            onChange={(e) => setSkill({ ...skill, weight: Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) })}
                                            className="w-14 px-2 py-1 text-center text-[13px] border border-[#E5E5EA] rounded-lg focus:border-[#0071E3] outline-none"
                                            style={{ fontFamily: SF, fontWeight: 700 }}
                                        />
                                        <span className="text-[12px] text-[#AEAEB2]">%</span>
                                    </div>
                                </div>
                                <input type="range" min="0" max="100" value={skill.weight}
                                    onChange={(e) => setSkill({ ...skill, weight: parseInt(e.target.value) })}
                                    className="w-full accent-[#0071E3]" />
                            </div>

                            {/* Kinh nghiệm */}
                            <div className="p-4 rounded-2xl border border-[#E5E5EA] space-y-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-[#6366F1] flex-shrink-0" />
                                    <p
                                        className="flex-1 text-[13px] text-[#1D1D1F] border-b border-transparent outline-none bg-transparent"
                                        style={{ fontWeight: 500 }}
                                    >
                                        Kinh nghiệm
                                    </p>
                                    <div className="flex items-center gap-1">
                                        <input
                                            type="number" min="0" max="100"
                                            value={experience.weight}
                                            onChange={(e) => setExperience({ ...experience, weight: Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) })}
                                            className="w-14 px-2 py-1 text-center text-[13px] border border-[#E5E5EA] rounded-lg focus:border-[#0071E3] outline-none"
                                            style={{ fontFamily: SF, fontWeight: 700 }}
                                        />
                                        <span className="text-[12px] text-[#AEAEB2]">%</span>
                                    </div>
                                </div>
                                <input type="range" min="0" max="100" value={experience.weight}
                                    onChange={(e) => setExperience({ ...experience, weight: parseInt(e.target.value) })}
                                    className="w-full" style={{ accentColor: '#6366F1' }} />
                            </div>

                            {/* Học vấn */}
                            <div className="p-4 rounded-2xl border border-[#E5E5EA] space-y-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-[#009900] flex-shrink-0" />
                                    <p
                                        className="flex-1 text-[13px] text-[#1D1D1F] border-b border-transparent outline-none bg-transparent"
                                        style={{ fontWeight: 500 }}
                                    >
                                        Học vấn
                                    </p>
                                    <div className="flex items-center gap-1">
                                        <input
                                            type="number" min="0" max="100"
                                            value={education.weight}
                                            onChange={(e) => setEducation({ ...education, weight: Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) })}
                                            className="w-14 px-2 py-1 text-center text-[13px] border border-[#E5E5EA] rounded-lg focus:border-[#0071E3] outline-none"
                                            style={{ fontFamily: SF, fontWeight: 700 }}
                                        />
                                        <span className="text-[12px] text-[#AEAEB2]">%</span>
                                    </div>
                                </div>
                                <input type="range" min="0" max="100" value={education.weight}
                                    onChange={(e) => setEducation({ ...education, weight: parseInt(e.target.value) })}
                                    className="w-full" style={{ accentColor: '#009900' }} />
                            </div>
                        </div>

                        {/* Combined bar preview */}
                        <div className="mt-4 h-2.5 bg-[#F2F2F7] rounded-full overflow-hidden flex">
                            {[
                                { w: skill.weight, color: '#0071E3' },
                                { w: experience.weight, color: '#6366F1' },
                                { w: education.weight, color: '#009900' },
                            ].map(({ w, color }, i) => w > 0 && (
                                <div key={i} className="h-full transition-all duration-200" style={{ width: `${w}%`, background: color }} />
                            ))}
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-[#F2F2F7]" />

                    {/* Threshold */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-[12px] text-[#6E6E73] uppercase tracking-[0.05em]" style={{ fontWeight: 600 }}>
                                Ngưỡng điểm tối thiểu
                            </p>
                            <span className="text-[12px] px-2.5 py-1 rounded-full bg-[#FFF4E5] text-[#FF9500]" style={{ fontWeight: 600 }}>
                                {threshold} pts
                            </span>
                        </div>
                        <div className="p-4 rounded-2xl border border-[#E5E5EA] space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-[#FF9500] flex-shrink-0" />
                                <p className="flex-1 text-[13px] text-[#1D1D1F]" style={{ fontWeight: 500 }}>Điểm tối thiểu để xét duyệt</p>
                                <div className="flex items-center gap-1">
                                    <input
                                        type="number" min="0" max="100"
                                        value={threshold}
                                        onChange={(e) => setThreshold(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                                        className="w-14 px-2 py-1 text-center text-[13px] border border-[#E5E5EA] rounded-lg focus:border-[#FF9500] outline-none"
                                        style={{ fontFamily: SF, fontWeight: 700 }}
                                    />
                                    <span className="text-[12px] text-[#AEAEB2]">pts</span>
                                </div>
                            </div>
                            <input type="range" min="0" max="100" value={threshold}
                                onChange={(e) => setThreshold(parseInt(e.target.value))}
                                className="w-full" style={{ accentColor: '#D2691E' }} />
                            <p className="text-[11px] text-[#AEAEB2]">
                                ≥ threshold + 20 → Hire &nbsp;·&nbsp; ≥ threshold → Interview &nbsp;·&nbsp; &lt; threshold → Reject
                            </p>
                        </div>
                    </div>
                </div>

                {/* Modal footer */}
                <div className="px-6 py-4 border-t border-[#F2F2F7] flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-[#E5E5EA] hover:bg-[#F5F5F7] transition-colors text-[14px]"
                        style={{ fontWeight: 500 }}
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleAdd}
                        disabled={!isValid}
                        className="flex-1 px-4 py-2.5 bg-[#0071E3] hover:bg-[#0077ED] disabled:bg-[#E5E5EA] disabled:text-[#AEAEB2] text-white rounded-xl transition-all shadow-sm text-[14px]"
                        style={{ fontWeight: 600 }}
                    >
                        Thêm cấu hình
                    </button>
                </div>
            </motion.div>
        </div>
    );
}