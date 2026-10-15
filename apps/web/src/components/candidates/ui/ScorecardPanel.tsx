'use client';

import { useEffect, useState } from 'react';
import { InterviewType, ScheduleStatus } from '@ats-platform/types';
import { getMyInterviewSchedulesAction } from '@/servers/interviews/interviews.action';
import { getApplicationScorecardsAction } from '@/servers/scorecards/scorecards.action';
import { SF, SFT } from '@/types/fonts/fonts';
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

const statusLabels: Record<ScheduleStatus, string> = {
  [ScheduleStatus.scheduled]: 'Đã lên lịch',
  [ScheduleStatus.completed]: 'Đã hoàn tất',
  [ScheduleStatus.cancelled]: 'Đã huỷ',
};
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
      className="space-y-5"
      style={{ fontFamily: SFT }}
    >
      <h2
        className="text-[16px] text-[#1D1D1F]"
        style={{ fontFamily: SF, fontWeight: 600 }}
      >
        Đánh giá phỏng vấn
      </h2>
      {isClosed && (
        <p className="text-[13px] text-[#6E6E73] bg-[#F5F5F7] rounded-xl p-4">
          Đơn đã chốt, chỉ có thể xem đánh giá.
        </p>
      )}
      {loading ? (
        <p role="status" className="text-[14px] text-[#6E6E73]">
          Đang tải đánh giá phỏng vấn…
        </p>
      ) : error ? (
        <div className="bg-white rounded-2xl border border-[#F2F2F7] p-6">
          <p role="alert" className="text-[13px] text-[#DC2626]">
            {error}
          </p>
          <button
            type="button"
            onClick={() => setReload((value) => value + 1)}
            className="min-h-11 mt-3 px-4 py-2 border border-[#E5E5EA] rounded-xl text-[13px] text-[#0071E3] hover:bg-[#F5F5F7]"
          >
            Thử lại
          </button>
        </div>
      ) : cards.length === 0 ? (
        <p className="bg-white rounded-2xl border border-[#F2F2F7] p-6 text-[14px] text-[#6E6E73]">
          Chưa có buổi phỏng vấn.
        </p>
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
            <article
              key={schedule.interviewId}
              aria-label={`Buổi phỏng vấn ngày ${date}`}
              className="bg-white rounded-2xl border border-[#F2F2F7] p-6 space-y-4"
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h3
                    className="text-[15px] text-[#1D1D1F]"
                    style={{ fontFamily: SF, fontWeight: 600 }}
                  >
                    <time dateTime={schedule.startAt}>{date}</time> ·{' '}
                    {schedule.interviewType === InterviewType.online
                      ? 'Trực tuyến'
                      : 'Trực tiếp'}
                  </h3>
                  <p className="text-[13px] text-[#6E6E73] mt-1">
                    Người phỏng vấn:{' '}
                    {schedule.interviewer?.fullName ?? saved?.author.fullName}
                  </p>
                </div>
                <span className="text-[12px] bg-[#F5F5F7] text-[#6E6E73] rounded-full px-2.5 py-1">
                  {statusLabels[schedule.status]}
                </span>
              </div>
              {editing === schedule.interviewId && canWrite ? (
                <div className="border-t border-[#F2F2F7] pt-4 space-y-3">
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
                  <button
                    type="button"
                    onClick={() => setEditing(null)}
                    className="min-h-11 px-4 py-2 text-[13px] text-[#6E6E73] border border-[#E5E5EA] rounded-xl hover:bg-[#F5F5F7]"
                  >
                    Huỷ
                  </button>
                </div>
              ) : (
                <>
                  {saved ? (
                    <div className="border-t border-[#F2F2F7] pt-4 space-y-3">
                      <p className="text-[13px] text-[#6E6E73]">
                        Người đánh giá: {saved.author.fullName} ·{' '}
                        <time dateTime={saved.submittedAt}>
                          {dateFormat.format(new Date(saved.submittedAt))}
                        </time>
                      </p>
                      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px] text-[#1D1D1F]">
                        {SCORECARD_RATINGS.map(({ key, label }) => (
                          <div key={key} className="flex gap-2">
                            <dt>{label}:</dt>
                            <dd style={{ fontWeight: 600 }}>{saved[key]}/5</dd>
                          </div>
                        ))}
                      </dl>
                      <p
                        className="text-[14px] text-[#0071E3]"
                        style={{ fontWeight: 600 }}
                      >
                        {SCORECARD_RECOMMENDATION_LABELS[saved.recommendation]}
                      </p>
                      {saved.comment && (
                        <p className="text-[14px] text-[#1D1D1F] leading-relaxed whitespace-pre-wrap break-words">
                          {saved.comment}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-[13px] text-[#6E6E73]">
                      Chưa có đánh giá.
                    </p>
                  )}
                  {canWrite && (
                    <button
                      type="button"
                      onClick={() => setEditing(schedule.interviewId)}
                      className="min-h-11 px-4 py-2 bg-[#0071E3] text-white text-[13px] rounded-xl hover:bg-[#005BB5] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0071E3]"
                      style={{ fontWeight: 600 }}
                    >
                      {saved ? 'Sửa đánh giá' : 'Nộp đánh giá'}
                    </button>
                  )}
                </>
              )}
            </article>
          );
        })
      )}
    </section>
  );
}
