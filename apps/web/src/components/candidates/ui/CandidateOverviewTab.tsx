import { Hourglass } from 'lucide-react';
import { effectiveScreeningScores } from '@ats-platform/types';
import { ReviewScreeningButton } from './ReviewScreeningButton';
import { Badge, EmptyState, ScoreBar, Surface } from '@/components/ui';
import { IApplicationDto } from '@/types/interfaces/application.interface';
import { WORK_TYPE_LABELS, type WorkType } from '@/lib/work-types';

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

interface CandidateOverviewTabProps {
  application: IApplicationDto;
}

export function CandidateOverviewTab({
  application,
}: CandidateOverviewTabProps) {
  const screening = application.screening;
  // The reviewer's scores once the screening is reviewed, the AI's otherwise.
  const effective = effectiveScreeningScores(screening ?? {});
  const skillsScore = effective.skills || 0;
  const experienceScore = effective.experience || 0;
  const educationScore = effective.education || 0;
  const overallScore = effective.overall || 0;
  const recommendation = screening?.aiRecommendation;
  const aiReasoning = screening?.aiReasoning;

  let matchedHardSkills: string[] = [];
  let matchedNiceToHaveSkills: string[] = [];
  if (screening?.matchedSkills) {
    let parsedMatch = screening.matchedSkills;
    if (typeof parsedMatch === 'string') {
      try {
        parsedMatch = JSON.parse(parsedMatch);
      } catch {
        /* ignore */
      }
    }
    if (Array.isArray(parsedMatch)) {
      matchedHardSkills = parsedMatch;
    } else if (parsedMatch && typeof parsedMatch === 'object') {
      matchedHardSkills = stringArray((parsedMatch as Record<string, unknown>).hardSkills);
      matchedNiceToHaveSkills = stringArray((parsedMatch as Record<string, unknown>).niceToHaveSkills);
    }
  }

  let missingSkillsList: string[] = [];
  if (screening?.missingSkills) {
    let parsedMiss = screening.missingSkills;
    if (typeof parsedMiss === 'string') {
      try {
        parsedMiss = JSON.parse(parsedMiss);
      } catch {
        /* ignore */
      }
    }
    if (Array.isArray(parsedMiss)) {
      missingSkillsList = parsedMiss;
    }
  }

  const recLabel =
    recommendation === 'interview'
      ? 'Nên phỏng vấn'
      : recommendation === 'reject'
        ? 'Không phù hợp'
        : 'Chưa đánh giá';
  const screeningStatus = screening?.status || 'pending';
  const originalOverall = screening?.overallScore;
  const workType = WORK_TYPE_LABELS[(application.jobPosting?.locationType || 'N/A') as WorkType] || 'N/A';
  const hasSkills =
    matchedHardSkills.length > 0 || matchedNiceToHaveSkills.length > 0 || missingSkillsList.length > 0;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
      <div className="space-y-4">
        <Surface className="p-5">
          <h2 className="mb-4 text-title-sm text-ink">Thông tin ứng tuyển</h2>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <InfoItem label="Vị trí" value={application.jobPosting?.title || 'N/A'} />
            <InfoItem label="Hình thức" value={workType} />
            <InfoItem
              label="Ngày nộp"
              value={application.appliedAt ? new Date(application.appliedAt).toLocaleDateString('vi-VN') : 'N/A'}
            />
            <InfoItem label="Phòng ban" value={application.jobPosting?.department?.name || 'N/A'} />
            <InfoItem label="Trạng thái sàng lọc" value={screeningStatus === 'completed' ? 'Hoàn tất' : 'Đang chờ'} />
          </dl>
        </Surface>

        {screeningStatus === 'completed' && hasSkills && (
          <Surface className="space-y-4 p-5">
            <h2 className="text-title-sm text-ink">Kỹ năng đối chiếu</h2>
            <SkillGroup label="Đáp ứng (Bắt buộc)" tone="success" skills={matchedHardSkills} />
            <SkillGroup label="Điểm cộng (Nice to have)" tone="accent" skills={matchedNiceToHaveSkills} />
            <SkillGroup label="Thiếu sót" tone="danger" skills={missingSkillsList} />
          </Surface>
        )}
      </div>

      <div>
        {screeningStatus === 'completed' ? (
          <Surface as="section" aria-label="Gợi ý AI" className="space-y-5 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-title-sm text-ink">Gợi ý AI</h2>
              {effective.isReviewed && <Badge tone="accent">Đã duyệt</Badge>}
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-display-sm tabular-nums text-ink" aria-hidden="true">{overallScore}</span>
                <span className="text-body-sm text-ink-3">/100 · {recLabel}</span>
              </div>
              <ScoreBar score={overallScore} label="Gợi ý AI" className="mt-2" />
              {effective.isReviewed && originalOverall != null && (
                <p className="mt-2 text-caption text-ink-3">Điểm AI ban đầu: {String(Math.round(Number(originalOverall.toString())))}</p>
              )}
            </div>

            <div className="space-y-3">
              <CriterionBar label="Kỹ năng" score={skillsScore} />
              <CriterionBar label="Kinh nghiệm" score={experienceScore} />
              <CriterionBar label="Học vấn" score={educationScore} />
            </div>

            {aiReasoning && (
              <div>
                <h3 className="mb-1 text-body-sm font-medium text-ink">Lý do từ AI</h3>
                <p className="whitespace-pre-wrap break-words text-body text-ink-2">{aiReasoning}</p>
              </div>
            )}

            <p className="rounded-ctl bg-surface-2 px-3 py-2 text-caption text-ink-3">
              Điểm AI chỉ là gợi ý. Bạn quyết định vòng tiếp theo.
            </p>

            <ReviewScreeningButton applicationId={application.applicationId} screening={screening} />
          </Surface>
        ) : (
          <Surface as="section" aria-label="Gợi ý AI">
            <EmptyState
              icon={Hourglass}
              title={screeningStatus === 'processing' ? 'Đang sàng lọc CV…' : 'Chưa bắt đầu sàng lọc'}
              description="Gợi ý AI sẽ hiện khi sàng lọc hoàn tất."
            />
          </Surface>
        )}
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-caption text-ink-3">{label}</dt>
      <dd className="mt-0.5 break-words text-body-sm font-medium text-ink">{value}</dd>
    </div>
  );
}

function SkillGroup({ label, tone, skills }: { label: string; tone: 'success' | 'accent' | 'danger'; skills: string[] }) {
  if (skills.length === 0) return null;
  return (
    <div>
      <p className="mb-2 text-caption font-medium text-ink-3">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {skills.map((skill, idx) => (
          <Badge key={`${skill}-${idx}`} tone={tone} className="h-6 px-2">{skill}</Badge>
        ))}
      </div>
    </div>
  );
}

function CriterionBar({ label, score }: { label: string; score: number }) {
  return (
    <div>
      <p className="mb-1 text-body-sm text-ink-2">{label}</p>
      <ScoreBar score={score} label={label} />
    </div>
  );
}
