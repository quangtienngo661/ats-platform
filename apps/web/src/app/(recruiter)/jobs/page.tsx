import JobPostingsClient from '@/components/job-postings/JobPostingsClient';
import { getJobCategoriesAction } from '@/servers/job-categories/job-categories.action';
import { getJobPostingsAction } from '@/servers/job-postings/job-postings.action';
import { getMyRecruiterProfileAction } from '@/servers/recruiters/recruiters.action';
import { getSkillsAction } from '@/servers/skills/skills.action';

export default async function JobPostingsPage() {
    const result = await getJobPostingsAction();
    const { data: jobs } = result;
    const skillsDb = await getSkillsAction();
    const categories = await getJobCategoriesAction();
    const currentRecruiter = await getMyRecruiterProfileAction();

    return (
        <JobPostingsClient
            jobs={jobs}
            skillsDb={skillsDb}
            categories={categories}
            currentRecruiter={currentRecruiter}
        />
    );
}


