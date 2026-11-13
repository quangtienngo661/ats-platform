'use client';

import { useId, useRef, useState, type FormEvent } from 'react';
import { ScorecardRecommendation } from '@ats-platform/types';
import { toast } from '@/lib/toast';
import { submitScorecardAction } from '@/servers/scorecards/scorecards.action';
import { Button, Field, Select, Textarea } from '@/components/ui';
import { cn } from '@/components/ui/cn';
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
    >
      {disabled && (
        <p className="text-body-sm text-ink-3">
          Đơn đã chốt, chỉ có thể xem đánh giá.
        </p>
      )}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {SCORECARD_RATINGS.map(({ key, label }) => (
          <fieldset
            key={key}
            role="radiogroup"
            aria-label={label}
            disabled={disabled || saving}
          >
            <legend
              id={`${formId}-${key}`}
              className="mb-2 text-body-sm font-medium text-ink"
            >
              {label}
            </legend>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((score) => (
                <label
                  key={score}
                  className={cn(
                    'flex size-9 cursor-pointer items-center justify-center rounded-ctl text-body-sm tabular-nums transition-colors duration-hover has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent',
                    values[key] === score
                      ? 'bg-ink text-surface'
                      : 'bg-surface text-ink shadow-e2 hover:bg-surface-2',
                  )}
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
                    className="sr-only"
                  />
                  {score}
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>
      <Field label="Khuyến nghị">
        {(control) => (
          <Select
            {...control}
            value={values.recommendation ?? ''}
            disabled={disabled || saving}
            onChange={(event) => {
              const recommendation = Object.values(ScorecardRecommendation).find(
                (value) => value === event.target.value,
              );
              setValues((previous) => ({ ...previous, recommendation }));
            }}
          >
            <option value="">Chọn khuyến nghị</option>
            {Object.values(ScorecardRecommendation).map((recommendation) => (
              <option key={recommendation} value={recommendation}>
                {SCORECARD_RECOMMENDATION_LABELS[recommendation]}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <Field label="Nhận xét" hint="Tối đa 2000 ký tự">
        {(control) => (
          <Textarea
            {...control}
            ref={commentRef}
            defaultValue={initial?.comment ?? ''}
            maxLength={2000}
            rows={4}
            disabled={disabled || saving}
          />
        )}
      </Field>
      {error && (
        <p role="alert" className="text-body-sm text-danger">
          {error}
        </p>
      )}
      <Button type="submit" disabled={disabled || saving || !valid}>
        {saving
          ? 'Đang lưu đánh giá…'
          : initial
            ? 'Lưu đánh giá'
            : 'Nộp đánh giá'}
      </Button>
    </form>
  );
}
