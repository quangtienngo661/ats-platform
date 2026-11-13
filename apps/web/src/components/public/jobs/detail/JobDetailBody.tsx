import { IJobPostingDto } from '@/types/interfaces/job-posting.interface';
import { Reveal } from '@/components/ui';
import { JobParsedRequirements } from './JobParsedRequirements';

interface JobDetailBodyProps {
    job: IJobPostingDto;
}

/** Rich-text rhythm for the (server-sanitised) description: lists, headings, links and spacing. */
const RICH_TEXT = [
    'max-w-[68ch] break-words text-body text-ink-2',
    '[&_p]:my-3 [&_p:first-child]:mt-0',
    '[&_h1]:mb-2 [&_h1]:mt-7 [&_h1]:text-title [&_h1]:text-ink',
    '[&_h2]:mb-2 [&_h2]:mt-7 [&_h2]:text-title [&_h2]:text-ink',
    '[&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-title-sm [&_h3]:text-ink',
    '[&_h4]:mb-1 [&_h4]:mt-5 [&_h4]:font-semibold [&_h4]:text-ink',
    '[&_strong]:font-semibold [&_strong]:text-ink',
    '[&_ul]:my-3 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5',
    '[&_ol]:my-3 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-5',
    '[&_li]:pl-1 [&_li::marker]:text-ink-4',
    '[&_a]:text-accent-text [&_a]:underline [&_a]:underline-offset-2',
    '[&_blockquote]:my-4 [&_blockquote]:border-l-2 [&_blockquote]:border-line-strong [&_blockquote]:pl-4',
].join(' ');

export function JobDetailBody({ job }: JobDetailBodyProps) {
    return (
        <div className="space-y-10">
            {job.description && (
                <Reveal as="section" delay={0.06}>
                    <h2 className="mb-4 text-title text-ink">Mô tả công việc</h2>
                    <div className={RICH_TEXT} dangerouslySetInnerHTML={{ __html: job.description }} />
                </Reveal>
            )}

            <Reveal delay={0.12}>
                <JobParsedRequirements parsedRequirements={job.parsedRequirements} />
            </Reveal>
        </div>
    );
}
