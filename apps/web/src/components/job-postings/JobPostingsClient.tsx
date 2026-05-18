'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SFT } from '@/types/fonts/fonts';
import { motion, AnimatePresence } from 'motion/react';
import { IJobPostingDto } from '@/types/interfaces/job-posting.interface';
import { JobPostingsHeader } from './ui/JobPostingsHeader';
import { toast } from '@/lib/toast';
import { JobPostingCard } from './ui/JobPostingCard';
import { MutateJobPostingModal } from './ui/MutateJobPostingModal';
import { JobPostingsStats } from './ui/JobPostingsStats';
import { ISkillDto } from '@/types/interfaces/skill.interface';
import { IJobCategoryDto } from '@/types/interfaces/job-category.interface';
import { IRecruiterDto } from '@/types/interfaces/recruiter.interface';
import { deleteJobPostingAction } from '@/servers/job-postings/job-postings.action';

interface JobPostingsClientProps {
    jobs: IJobPostingDto[];
    skillsDb: ISkillDto[];
    categories: IJobCategoryDto[];
    currentRecruiter: IRecruiterDto | null;
}

export default function JobPostingsClient({ jobs, skillsDb, categories, currentRecruiter }: JobPostingsClientProps) {
    const router = useRouter();
    const [filter, setFilter] = useState<'all' | 'active' | 'draft' | 'closed'>('all');
    const [showMutateModal, setShowMutateModal] = useState(false);
    const [editingJob, setEditingJob] = useState<IJobPostingDto | null>(null);

    const filtered = filter === 'all' ? jobs : jobs.filter(j => j.status === filter);

    const handleAdd = () => {
        setEditingJob(null);
        setShowMutateModal(true);
    };

    const handleEdit = (job: IJobPostingDto) => {
        setEditingJob(job);
        setShowMutateModal(true);
    };

    const handleDelete = async (job: IJobPostingDto) => {
        const result = await deleteJobPostingAction(job.jobId);

        if (result.success) {
            toast.success(`Đã xóa tin "${job.title}"`);
            router.refresh();
        } else {
            toast.error(`Xóa tin "${job.title}" thất bại: ${result.message}`);
        }
    };

    return (
        <div className="p-6 lg:p-8" style={{ fontFamily: SFT }}>
            <JobPostingsHeader onAdd={handleAdd} />
            <JobPostingsStats jobs={jobs} />

            {/* Filter tabs */}
            <div className="flex items-center gap-2 mb-5">
                {(['all', 'active', 'draft', 'closed'] as const).map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                        className={`px-3.5 py-1.5 rounded-xl text-[13px] transition-all ${filter === f ? 'bg-[#1D1D1F] text-white' : 'bg-white border border-[#E5E5EA] text-[#6E6E73] hover:border-[#D2D2D7]'}`}
                        style={{ fontWeight: filter === f ? 500 : 400 }}>
                        {f === 'all' ? 'Tất cả' : f === 'active' ? 'Đang tuyển' : f === 'draft' ? 'Bản nháp' : 'Đã đóng'}
                    </button>
                ))}
            </div>

            {/* Job cards */}
            <motion.div layout className="flex flex-col gap-3">
                <AnimatePresence mode="popLayout">
                    {filtered.map((job) => (
                        <motion.div
                            key={job.jobId}
                            layout
                            initial={{ opacity: 0, scale: 0.98, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <JobPostingCard
                                job={job}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </motion.div>

            {showMutateModal && (
                <MutateJobPostingModal
                    onClose={() => { setShowMutateModal(false); setEditingJob(null); }}
                    editingJob={editingJob}
                    skillsDb={skillsDb}
                    categories={categories}
                    currentRecruiter={currentRecruiter}
                />
            )}
        </div>
    );
}
