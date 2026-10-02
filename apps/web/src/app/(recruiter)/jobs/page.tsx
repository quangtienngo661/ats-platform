import JobPostingsClient from '@/components/job-postings/JobPostingsClient';
import { getJobCategoriesAction } from '@/servers/job-categories/job-categories.action';
import { getJobPostingsAction } from '@/servers/job-postings/job-postings.action';
import { getMeAction } from '@/servers/users/users.action';
import { getMyRecruiterProfileAction, getRecruitersAction } from '@/servers/recruiters/recruiters.action';
import { getSkillsAction } from '@/servers/skills/skills.action';

export default async function JobPostingsPage() {
    const result = await getJobPostingsAction();
    const { items: jobs } = result;
    const skillsDb = await getSkillsAction();
    const categories = await getJobCategoriesAction();
    const me = await getMeAction();
    const currentRecruiter = me?.role === 'recruiter' ? await getMyRecruiterProfileAction() : null;
    const recruiters = me?.role === 'admin' || me?.role === 'org_admin' ? await getRecruitersAction() : [];

    return (
        <JobPostingsClient
            jobs={jobs}
            skillsDb={skillsDb}
            categories={categories}
            currentRecruiter={currentRecruiter}
            recruiters={recruiters}
            userRole={me?.role}
        />
    );
}
