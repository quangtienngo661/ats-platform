'use client';

import { useEffect, useState } from 'react';
import { InterviewType, ScheduleStatus } from '@ats-platform/types';
import { getMyInterviewSchedulesAction } from '@/servers/interviews/interviews.action';
import { getApplicationScorecardsAction } from '@/servers/scorecards/scorecards.action';
import { ClipboardList } from 'lucide-react';
import { Button, EmptyState, Skeleton, StatusChip, Surface } from '@/components/ui';
import type { IScorecardListItem } from '@/types/interfaces/evaluation.interface';
import type { IInterviewSchedule } from '@/types/interfaces/interview.interface';
import {
  ScorecardForm,
  SCORECARD_RATINGS,
  SCORECARD_RECOMMENDATION_LABELS,
} from './ScorecardForm';

interface ScorecardPanelProps {
  applicationId: string;
  currentUserId: string;
  isClosed: boolean;
}

const dateFormat = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

export function ScorecardPanel({
  applicationId,
  currentUserId,
  isClosed,
}: ScorecardPanelProps) {
  const [schedules, setSchedules] = useState<IInterviewSchedule[]>([]);
  const [scorecards, setScorecards] = useState<IScorecardListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [page, saved] = await Promise.all([
          getMyInterviewSchedulesAction({ applicationId }),
          getApplicationScorecardsAction(applicationId),
        ]);
        const allSchedules = [...page.items];
        for (let next = 2; next <= page.pagination.totalPages; next++) {
          const additional = await getMyInterviewSchedulesAction({
            applicationId,
            page: next,
          });
          if (!active) return;
          allSchedules.push(...additional.items);
        }
        if (active) {
          setSchedules(allSchedules);
          setScorecards(saved);
        }
      } catch {
        if (active)
          setError('Không thể tải đánh giá phỏng vấn. Vui lòng thử lại.');
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [applicationId, reload]);

  const cardsById = new Map<
    string,
    IScorecardListItem['interview'] &
      Partial<Pick<IInterviewSchedule, 'interviewerId' | 'interviewer'>>
  >(schedules.map((schedule) => [schedule.interviewId, schedule]));
  for (const scorecard of scorecards) {
    if (!cardsById.has(scorecard.interview.interviewId)) {
      cardsById.set(scorecard.interview.interviewId, scorecard.interview);
    }
  }
  const cards = [...cardsById.values()].sort(
    (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
  );

  return (
    <section
      aria-label="Nội dung đánh giá"
      aria-busy={loading}
      className="space-y-4"
    >
      <h2 className="text-title-sm text-ink">Đánh giá phỏng vấn</h2>
      {isClosed && (
        <p className="rounded-card bg-surface-2 p-4 text-body-sm text-ink-3">
          Đơn đã chốt, chỉ có thể xem đánh giá.
        </p>
      )}
      {loading ? (
        <div role="status" className="space-y-3">
          <span className="sr-only">Đang tải đánh giá phỏng vấn…</span>
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : error ? (
        <Surface className="p-4">
          <p role="alert" className="text-body-sm text-danger">
            {error}
          </p>
          <Button
            variant="secondary"
            className="mt-3"
            onClick={() => setReload((value) => value + 1)}
          >
            Thử lại
          </Button>
        </Surface>
      ) : cards.length === 0 ? (
        <Surface>
          <EmptyState
            icon={ClipboardList}
            title="Chưa có buổi phỏng vấn."
            description="Đánh giá mở ra sau khi buổi phỏng vấn hoàn tất."
          />
        </Surface>
      ) : (
        cards.map((schedule) => {
          const saved = scorecards.find(
            (scorecard) => scorecard.interviewId === schedule.interviewId,
          );
          const canWrite =
            !isClosed &&
            schedule.status === ScheduleStatus.completed &&
            schedule.interviewerId === currentUserId &&
            (!saved || saved.author.userId === currentUserId);
          const date = dateFormat.format(new Date(schedule.startAt));
          return (
            <Surface
              as="article"
              key={schedule.interviewId}
              aria-label={`Buổi phỏng vấn ngày ${date}`}
              className="space-y-4 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-body font-medium text-ink">
                    <time dateTime={schedule.startAt}>{date}</time> ·{' '}
                    {schedule.interviewType === InterviewType.online
                      ? 'Trực tuyến'
                      : 'Trực tiếp'}
                  </h3>
                  <p className="mt-1 text-body-sm text-ink-3">
                    Người phỏng vấn:{' '}
                    {schedule.interviewer?.fullName ?? saved?.author.fullName}
                  </p>
                </div>
                <StatusChip kind="schedule" value={schedule.status} />
              </div>
              {editing === schedule.interviewId && canWrite ? (
                <div className="space-y-3 border-t border-line pt-4">
                  <ScorecardForm
                    interviewId={schedule.interviewId}
                    initial={
                      saved
                        ? {
                            technicalSkills: saved.technicalSkills,
                            problemSolving: saved.problemSolving,
                            communication: saved.communication,
                            cultureFit: saved.cultureFit,
                            recommendation: saved.recommendation,
                            comment: saved.comment ?? '',
                          }
                        : undefined
                    }
                    disabled={isClosed}
                    onSaved={() => {
                      setEditing(null);
                      setReload((value) => value + 1);
                    }}
                  />
                  <Button variant="ghost" onClick={() => setEditing(null)}>
                    Huỷ
                  </Button>
                </div>
              ) : (
                <>
                  {saved ? (
                    <div className="space-y-3 border-t border-line pt-4">
                      <p className="text-body-sm text-ink-3">
                        Người đánh giá: {saved.author.fullName} ·{' '}
                        <time dateTime={saved.submittedAt}>
                          {dateFormat.format(new Date(saved.submittedAt))}
                        </time>
                      </p>
                      <dl className="grid grid-cols-1 gap-3 text-body-sm text-ink sm:grid-cols-2">
                        {SCORECARD_RATINGS.map(({ key, label }) => (
                          <div key={key} className="flex gap-2">
                            <dt className="text-ink-3">{label}:</dt>
                            <dd className="font-medium tabular-nums">{saved[key]}/5</dd>
                          </div>
                        ))}
                      </dl>
                      <p className="text-body font-medium text-accent-text">
                        {SCORECARD_RECOMMENDATION_LABELS[saved.recommendation]}
                      </p>
                      {saved.comment && (
                        <p className="whitespace-pre-wrap break-words text-body text-ink-2">
                          {saved.comment}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-body-sm text-ink-3">Chưa có đánh giá.</p>
                  )}
                  {canWrite && (
                    <Button onClick={() => setEditing(schedule.interviewId)}>
                      {saved ? 'Sửa đánh giá' : 'Nộp đánh giá'}
                    </Button>
                  )}
                </>
              )}
            </Surface>
          );
        })
      )}
    </section>
  );
}
