'use client';

import { useId, useRef, useState, type FormEvent } from 'react';
import { ScorecardRecommendation } from '@ats-platform/types';
import { toast } from '@/lib/toast';
import { submitScorecardAction } from '@/servers/scorecards/scorecards.action';
import { SF, SFT } from '@/types/fonts/fonts';
import type { IScorecardInput } from '@/types/interfaces/evaluation.interface';

export const SCORECARD_RATINGS = [
  { key: 'technicalSkills', label: 'Kỹ năng chuyên môn' },
  { key: 'problemSolving', label: 'Giải quyết vấn đề' },
  { key: 'communication', label: 'Giao tiếp' },
  { key: 'cultureFit', label: 'Phù hợp văn hoá' },
] as const;

export const SCORECARD_RECOMMENDATION_LABELS: Record<
  ScorecardRecommendation,
  string
> = {
  [ScorecardRecommendation.strong_no]: 'Không nên tuyển',
  [ScorecardRecommendation.no]: 'Chưa phù hợp',
  [ScorecardRecommendation.yes]: 'Nên tuyển',
  [ScorecardRecommendation.strong_yes]: 'Rất nên tuyển',
};

interface ScorecardFormProps {
  interviewId: string;
  initial?: IScorecardInput;
  disabled: boolean;
  onSaved: () => void;
}

export function ScorecardForm({
  interviewId,
  initial,
  disabled,
  onSaved,
}: ScorecardFormProps) {
  const formId = useId();
  const commentRef = useRef<HTMLTextAreaElement>(null);
  const [values, setValues] = useState<Partial<IScorecardInput>>(initial ?? {});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const valid =
    SCORECARD_RATINGS.every(({ key }) => {
      const score = values[key];
      return (
        score !== undefined &&
        Number.isInteger(score) &&
        score >= 1 &&
        score <= 5
      );
    }) && !!values.recommendation;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const {
      technicalSkills,
      problemSolving,
      communication,
      cultureFit,
      recommendation,
    } = values;
    if (
      disabled ||
      saving ||
      !valid ||
      !technicalSkills ||
      !problemSolving ||
      !communication ||
      !cultureFit ||
      !recommendation
    )
      return;
    const comment = commentRef.current?.value ?? '';
    if (comment.length > 2000) {
      setError('Nhận xét không được vượt quá 2000 ký tự');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const result = await submitScorecardAction(interviewId, {
        technicalSkills,
        problemSolving,
        communication,
        cultureFit,
        recommendation,
        comment,
      });
      if (!result.success) {
        setError(result.message);
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      onSaved();
    } catch {
      const message = 'Không thể lưu đánh giá. Vui lòng thử lại.';
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Đánh giá phỏng vấn"
      aria-busy={saving}
      className="space-y-5"
      style={{ fontFamily: SFT }}
    >
      {disabled && (
        <p className="text-[13px] text-[#6E6E73]">
          Đơn đã chốt, chỉ có thể xem đánh giá.
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {SCORECARD_RATINGS.map(({ key, label }) => (
          <fieldset
            key={key}
            role="radiogroup"
            aria-label={label}
            disabled={disabled || saving}
          >
            <legend
              id={`${formId}-${key}`}
              className="text-[13px] text-[#1D1D1F] mb-2"
              style={{ fontWeight: 500 }}
            >
              {label}
            </legend>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((score) => (
                <label
                  key={score}
                  className={`flex items-center justify-center gap-1.5 min-h-11 min-w-11 px-2 rounded-xl border text-[13px] focus-within:ring-2 focus-within:ring-[#0071E3] ${values[key] === score ? 'border-[#0071E3] bg-[#EBF3FD] text-[#0071E3]' : 'border-[#E5E5EA] text-[#1D1D1F]'}`}
                >
                  <input
                    type="radio"
                    aria-label={String(score)}
                    name={`${formId}-${key}`}
                    value={score}
                    checked={values[key] === score}
                    onChange={() =>
                      setValues((previous) => ({ ...previous, [key]: score }))
                    }
                    className="accent-[#0071E3]"
                  />
                  {score}
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>
      <div>
        <label
          htmlFor={`${formId}-recommendation`}
          className="block text-[13px] text-[#1D1D1F] mb-2"
          style={{ fontWeight: 500 }}
        >
          Khuyến nghị
        </label>
        <select
          id={`${formId}-recommendation`}
          value={values.recommendation ?? ''}
          disabled={disabled || saving}
          onChange={(event) => {
            const recommendation = Object.values(ScorecardRecommendation).find(
              (value) => value === event.target.value,
            );
            setValues((previous) => ({ ...previous, recommendation }));
          }}
          className="w-full min-h-11 border border-[#E5E5EA] rounded-xl px-3 text-[14px] text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#0071E3] disabled:bg-[#F5F5F7]"
        >
          <option value="">Chọn khuyến nghị</option>
          {Object.values(ScorecardRecommendation).map((recommendation) => (
            <option key={recommendation} value={recommendation}>
              {SCORECARD_RECOMMENDATION_LABELS[recommendation]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label
          htmlFor={`${formId}-comment`}
          className="block text-[13px] text-[#1D1D1F] mb-2"
          style={{ fontWeight: 500 }}
        >
          Nhận xét
        </label>
        <textarea
          ref={commentRef}
          id={`${formId}-comment`}
          defaultValue={initial?.comment ?? ''}
          maxLength={2000}
          rows={4}
          disabled={disabled || saving}
          aria-describedby={`${formId}-comment-limit`}
          className="w-full border border-[#E5E5EA] rounded-xl p-3 text-[14px] text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#0071E3] disabled:bg-[#F5F5F7]"
        />
        <p
          id={`${formId}-comment-limit`}
          className="text-[12px] text-[#6E6E73] mt-1"
        >
          Tối đa 2000 ký tự
        </p>
      </div>
      {error && (
        <p role="alert" className="text-[13px] text-[#DC2626]">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={disabled || saving || !valid}
        className="min-h-11 px-4 py-2 bg-[#0071E3] text-white text-[13px] rounded-xl hover:bg-[#005BB5] transition-colors disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0071E3]"
        style={{ fontFamily: SF, fontWeight: 600 }}
      >
        {saving
          ? 'Đang lưu đánh giá...'
          : initial
            ? 'Lưu đánh giá'
            : 'Nộp đánh giá'}
      </button>
    </form>
  );
}
