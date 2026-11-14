'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Briefcase, SearchX } from 'lucide-react';
import { Button, EmptyState, Stagger } from '@/components/ui';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { IJobPostingDto } from '@/types/interfaces/job-posting.interface';
import { JobPostingsHeader, type JobFilter } from './ui/JobPostingsHeader';
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
    recruiters?: IRecruiterDto[];
    userRole?: string;
}

export default function JobPostingsClient({ jobs, skillsDb, categories, currentRecruiter, recruiters = [], userRole }: JobPostingsClientProps) {
    const router = useRouter();
    const [filter, setFilter] = useState<JobFilter>('all');
    const [search, setSearch] = useState('');
    const [showMutateModal, setShowMutateModal] = useState(false);
    const [editingJob, setEditingJob] = useState<IJobPostingDto | null>(null);
    const [deletingJob, setDeletingJob] = useState<IJobPostingDto | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const isManager = userRole === 'admin' || userRole === 'org_admin';
    const scoped = isManager ? jobs : jobs.filter((j) => j.recruiter?.recruiterId === currentRecruiter?.recruiterId);

    const counts: Record<JobFilter, number> = {
        all: scoped.length,
        active: scoped.filter((j) => j.status === 'active').length,
        draft: scoped.filter((j) => j.status === 'draft').length,
        closed: scoped.filter((j) => j.status === 'closed').length,
    };

    const query = search.trim().toLowerCase();
    const filtered = scoped.filter(
        (j) =>
            (filter === 'all' || j.status === filter) &&
            (!query || j.title.toLowerCase().includes(query) || (j.department?.name ?? '').toLowerCase().includes(query)),
    );

    const handleAdd = () => {
        setEditingJob(null);
        setShowMutateModal(true);
    };

    const handleEdit = (job: IJobPostingDto) => {
        setEditingJob(job);
        setShowMutateModal(true);
    };

    const confirmDelete = async () => {
        if (!deletingJob) return;
        setIsDeleting(true);
        const result = await deleteJobPostingAction(deletingJob.jobId);
        setIsDeleting(false);

        if (result.success) {
            toast.success(`Đã xóa tin "${deletingJob.title}"`);
            router.refresh();
        } else {
            toast.error(`Xóa tin "${deletingJob.title}" thất bại: ${result.message}`);
        }
        setDeletingJob(null);
    };

    return (
        <div className="space-y-4 p-4 lg:p-6">
            <JobPostingsHeader
                onAdd={handleAdd}
                filter={filter}
                onFilterChange={setFilter}
                counts={counts}
                search={search}
                onSearchChange={setSearch}
            />
            <JobPostingsStats jobs={scoped} />

            {scoped.length === 0 ? (
                <EmptyState
                    icon={Briefcase}
                    title="Chưa có tin tuyển dụng"
                    description="Tạo tin đầu tiên để bắt đầu nhận ứng viên."
                    action={<Button onClick={handleAdd}>Tạo tin tuyển dụng</Button>}
                />
            ) : filtered.length === 0 ? (
                <EmptyState
                    icon={SearchX}
                    title="Không có tin phù hợp"
                    description="Đổi bộ lọc hoặc từ khóa tìm kiếm."
                />
            ) : (
                <Stagger className="flex flex-col gap-3">
                    {filtered.map((job) => (
                        <div key={job.jobId}>
                            <JobPostingCard job={job} onEdit={handleEdit} onDelete={setDeletingJob} />
                        </div>
                    ))}
                </Stagger>
            )}

            {showMutateModal && (
                <MutateJobPostingModal
                    onClose={() => { setShowMutateModal(false); setEditingJob(null); }}
                    editingJob={editingJob}
                    skillsDb={skillsDb}
                    categories={categories}
                    currentRecruiter={currentRecruiter}
                    recruiters={recruiters}
                    userRole={userRole}
                />
            )}

            <ConfirmModal
                isOpen={deletingJob !== null}
                title="Xóa tin tuyển dụng"
                description={`Xóa tin "${deletingJob?.title ?? ''}"? Không hoàn tác được.`}
                confirmText="Xóa tin"
                isConfirming={isDeleting}
                onConfirm={confirmDelete}
                onCancel={() => setDeletingJob(null)}
            />
        </div>
    );
}
