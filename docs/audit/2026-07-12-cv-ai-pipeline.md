# CV/AI Pipeline Service Audit — 2026-07-12

**Freshness contract:** static snapshot of `apps/api/src/app/{cvs,cv-screenings,ai-config,ai-usage-logs}` + `common/external-apis/gemini` and `schema.prisma` as of 2026-07-12 (branch `feat/ats-with-ai-implementation`). Every finding is **observed** (read from code, `file:line` cited) — none are reported from other docs. Re-verify against code before acting on any finding if this is more than a few weeks old; fixes may already have landed.

## Method

Read directly (no code executed, no tests run):
- Schema: `libs/backend/database/prisma/schema.prisma` lines 323-455 (models `CV`, `CVParsedData`, `Application`, `CVScreening`, `AiConfig`, `AiUsageLog`) and lines 61-101 (enums `ParsingStatus`, `ScreeningStatus`, `AiRecommendation`, `AiActionType`, `AiLogStatus`).
- `apps/api/src/app/cvs/cvs.service.ts`, `cvs.controller.ts`, `cvs.module.ts`
- `apps/api/src/app/cvs/processors/cv-parsing.processor.ts`
- `apps/api/src/app/cvs/cv-parsed-data/cv-parsed-data.service.ts`
- `apps/api/src/app/cv-screenings/cv-screenings.service.ts`, `cv-screenings.controller.ts`, `cv-screenings.module.ts`
- `apps/api/src/app/cv-screenings/processors/cv-screenings.processor.ts`
- `apps/api/src/app/ai-config/ai-config.service.ts`, `ai-config.controller.ts`, `dtos/ai-config.dto.ts`
- `apps/api/src/app/ai-usage-logs/ai-usage-logs.service.ts`, `ai-usage-logs.controller.ts`
- `apps/api/src/common/external-apis/gemini/gemini.service.ts`
- `apps/api/src/common/utils/include-options.util.ts` (all `*IncludeOptions` constants that select/omit fields for these models)
- `apps/api/src/app/applications/applications.service.ts` lines 440-511 (`triggerScreening` — the only caller of `createScreeningRecord`), to trace how CV screening is actually invoked and retried.

Grepped repo-wide for: `retryCount`, `errorLog`, `createScreeningRecord`, `aiRecommendation`/`AiRecommendation.reject`/`autoReject`/`ApplicationStatus.rejected`, `retry|reparse|reprocess` under `cvs/`.

Did not run the app or tests; all findings are static-read evidence with file:line citations below.

## Underused/dead DB fields

### `CVScreening.retryCount` — incremented but never read/enforced
- Written: `apps/api/src/app/cv-screenings/cv-screenings.service.ts:106-125`, inside `createScreeningRecord`'s `upsert`:
  ```
  update: {
    configId: config.configId,
    status: ScreeningStatus.processing,
    retryCount: { increment: 1 },
    ...
  },
  ```
  This only fires when a `CVScreening` row already exists for the `applicationId` (i.e. a retrigger). The sole caller is `applications.service.ts:510` (`triggerScreening`), invoked manually by a recruiter/admin hitting the "run AI screening" endpoint again — there is no automatic retry loop.
- Read: grepped the whole `apps/api/src` tree for `retryCount` — the only other hit is the pre-existing unit test assertion `cv-screenings.service.spec.ts:28` (`retryCount: { increment: 1 } }`). No code path anywhere reads `screening.retryCount` to cap retries, throttle re-triggers, or surface "N attempts so far" to the caller. It IS returned in raw API responses (since `cvScreeningIncludeOptions` in `include-options.util.ts:95-99` only restricts *relations*, all scalar fields including `retryCount` pass through by Prisma default), but nothing consumes it. A recruiter can call `triggerScreening` unboundedly on a `failed` screening; each retry bumps the counter with no ceiling.

### `CVScreening.errorLog` — write-only in effect (no code reads/branches on it)
- Written on failure: `apps/api/src/app/cv-screenings/processors/cv-screenings.processor.ts:174-184` (`handleScreeningFailed`):
  ```
  await this.prisma.cVScreening.update({
    where: { screeningId },
    data: { status: 'failed', aiReasoning: null, screenedAt: new Date(), errorLog: error.message },
  });
  ```
- Cleared on retrigger: `cv-screenings.service.ts:123` (`errorLog: null` in the upsert `update` branch).
- Read: no service method selects `errorLog` for a dedicated "why did this fail" surface; it passes through only as an incidental default-scalar in the raw Prisma object returned by `createScreeningRecord` (not by `getScreeningResult`, whose `screeningResultIncludeOptions` at `cv-screenings.service.ts:9-31` also doesn't explicitly select it but the base scalar still flows through). No controller endpoint, DTO, or frontend-facing shape in this module explicitly surfaces it, and no code branches on its presence (e.g. to decide whether a failure is retryable vs. terminal).

### `CV.errorLog` — read only as a passthrough, no business logic
- Written on parse failure: `apps/api/src/app/cvs/processors/cv-parsing.processor.ts:82-91`.
- Returned in `getCVById`/`getMyCVs` (`cvs.service.ts:80-108`, no `omit` for `errorLog`) — so it does reach the API response — but nothing in `cvs.service.ts` or `cvs.controller.ts` ever reads it to decide behavior (e.g. no "is this a retryable error" check, no surfaced retry action).

### `AiConfig.isDefault` — NOT dead; confirmed correctly implemented
Checked because the task flagged it as a thing to verify. It IS implemented correctly:
- Selection: `cv-screenings.service.ts:282-298` (`getActiveConfig`) falls back to `prisma.aiConfig.findFirst({ where: { isDefault: true } })` when no explicit `configId` is passed.
- Single-default invariant enforced transactionally on both create and update: `ai-config.service.ts:19-25` and `:60-67` (`updateMany({ where: { isDefault: true, configId: { not } }, data: { isDefault: false } })`), plus a dedicated `setDefault` transactional method (`ai-config.service.ts:101-115`).
- Not removable while default: `ai-config.service.ts:86-88` blocks `remove()` if `config.isDefault`.
This is a correctly-used field, not a gap — noted here only to close out the audit's explicit question.

### `CVParsedData.projects` / `CVParsedData.certificates` — written, returned, but silently dropped on profile sync
- Written: `apps/api/src/app/cvs/cv-parsed-data/cv-parsed-data.service.ts:11-27` (`create`) persists both.
- Read back via `getCVById`/`getParsedData` (full record, no omit).
- But `cvs.service.ts:135-143` (`confirmCV`'s `profileData` built for `candidatesService.updateProfileData`) only copies `summary`, `location`, `experience`, `education`, `skills` — `projects` and `certificates` are never included when syncing a confirmed CV into the candidate's profile:
  ```
  const profileData: Record<string, unknown> = {
    summary: cv.parsedData.summary,
    location: cv.parsedData.location,
    experience: cv.parsedData.experience as Prisma.InputJsonValue,
    education: cv.parsedData.education as Prisma.InputJsonValue,
    skills: cv.parsedData.skills as Prisma.InputJsonValue,
    source_cv_id: cv.cvId,
    last_updated_from_cv: new Date().toISOString(),
  };
  ```
  If the candidate profile schema has (or is meant to have) project/certificate sections, this is a silent data-loss gap at confirm-time.

## Business logic gaps

### 1. CVScreening failures never trigger a BullMQ retry — the processor swallows the error
`apps/api/src/app/cv-screenings/processors/cv-screenings.processor.ts:30-69` (`process`):
```ts
try {
  ...
} catch (error) {
  await this.emitScreeningCompletedFailure(applicationId);
  await this.handleScreeningFailed(screeningId, error);
}
```
There is no `throw error;` at the end of the `catch` block — unlike the sibling `cv-parsing.processor.ts:80-108`, whose `catch` block explicitly ends with `throw error; // BullMQ retry` (line 107). Per this repo's own documented convention (`.claude/rules/apis/anti-patterns.md`, `code-conventions.md`: "A processor's catch block must rethrow on error... swallowing the error makes BullMQ record the job as completed regardless of attempts"), this means:
- The `cv-screening` queue's job is marked **completed** by BullMQ after the very first failed attempt, even though `app.module.ts`'s global default (`attempts: 3` with backoff) would otherwise apply to this bare `.add()` call (`cv-screenings.service.ts:132-137`).
- So the automatic-retry-via-BullMQ path that `CVScreening.retryCount` implies exists (the field name, plus the increment-on-retry logic) never actually runs for transient Gemini failures (timeouts, 429s, etc.) — a screening fails once and sits in `ScreeningStatus.failed` permanently until a human recruiter manually re-triggers it via `POST` (routed through `applications.service.ts:456` `triggerScreening`).
- This is a functional regression relative to the pattern the codebase itself documents as correct and already applies to CV parsing.

### 2. `retryCount` has no cap — a stuck screening can be retried indefinitely by a recruiter with no limit or backoff
`applications.service.ts:483-494` (`triggerScreening`) only blocks re-triggering when status is `pending`, `processing`, or `completed`:
```ts
if (application.screening && application.screening.status) {
  if (application.screening.status === ScreeningStatus.pending) { throw ... }
  if (application.screening.status === ScreeningStatus.processing) { throw ... }
  if (application.screening.status === ScreeningStatus.completed) { throw ... }
}
```
`ScreeningStatus.failed` falls through with no exception, so retriggering is always allowed. Combined with Gap #1 (retries are entirely manual, not automatic), and the fact `retryCount` is write-only (see Underused Fields section), there is no maximum-retry business rule anywhere — a recruiter (or a buggy frontend retry-button loop) can hit this endpoint an unbounded number of times per application.

### 3. `AiRecommendation.reject` / `AiConfig.minimumScoreThreshold` computes a label but never enforces it — no auto-reject
`cv-screenings.service.ts:264-274` (`determineRecommendation`) computes `hire`/`interview`/`reject` purely as a label stored on `CVScreening.aiRecommendation` (written at `cv-screenings.processor.ts:153`). Grepped the whole `apps/api/src` tree for `aiRecommendation`, `AiRecommendation.reject`, `autoReject`, and `ApplicationStatus.rejected` — every hit is either: the computation/storage above, the `getScreeningStats` tally (`cv-screenings.service.ts:223-236`), or `Application` status-transition code in `applications.service.ts` that is driven entirely by explicit human `updateStatus` calls (`ALLOWED_TRANSITIONS` map at lines 18-21, human-triggered rejection at lines 256/292). **Nothing reads `CVScreening.aiRecommendation` or compares `overallScore` against `minimumScoreThreshold` to automatically transition `Application.status` to `rejected`.** The task's framing ("is minimumScoreThreshold enforced — auto-reject below threshold?") — answer: no, it is only used to *compute* a recommendation string; no enforcement/action follows from it. A candidate scoring below threshold stays in whatever application status a human left them in, with only a passive `aiRecommendation: 'reject'` label sitting on the screening record for a recruiter to notice manually.

### 4. No retry/reparse path for a CV stuck in `ParsingStatus.failed` — candidate must re-upload as a brand-new record
Grepped `apps/api/src/app/cvs` for `retry|reparse|re-parse|reprocess` — the only hit is the comment at `cv-parsing.processor.ts:107` (`throw error; // BullMQ retry`, which only covers the 3 in-queue BullMQ attempts for a single job, not a candidate-initiated retry after final failure). `cvs.controller.ts` exposes only `upload`, `me`, `:cvId`, `:cvId/parsed-data`, `:cvId/download`, `:cvId/confirm`, `:cvId/delete` — no `POST :cvId/retry` or similar. Once a CV exhausts its 3 BullMQ attempts and lands in `ParsingStatus.failed` (with `errorLog` populated), the only way for a candidate to get a working parse is to upload the same file again under a brand-new `cvId` — the failed row is permanently orphaned (still returned by `getMyCVs`, `cvs.service.ts:80-93`, with no `omit` on `parsingStatus`/`errorLog`, so at least the candidate can see it failed, but there is no in-place fix).

### 5. No candidate-eligibility check inside `cv-screenings` itself
`createScreeningRecord` (`cv-screenings.service.ts:78-140`) validates only that the `Application` and `CV` rows exist (lines 88-102) — it does not check that the `cvId` passed in actually belongs to the candidate on that `Application`, nor that the CV's `parsingStatus` is `completed` (i.e. a screening could theoretically be created/run against a CV that's still `pending`/`processing`/`failed`, since the only guard on `parsedData` existing is inside the processor at runtime, not the service that creates the DB row and enqueues the job — see `cv-screenings.processor.ts:34-50`, where `cvParsedData` can be `null` and only then throws `NotFoundException`, meaning the row briefly sits as `processing` before failing rather than being rejected up front at creation time). This is a narrower gap than a hard security hole (the `cvId` come from `application.cvId` set at application time, not attacker-controlled in `triggerScreening`), but it means a screening job is unconditionally enqueued even when the source CV clearly isn't parsed yet, guaranteeing a wasted Gemini-adjacent failure cycle (fetch → `NotFoundException` → `handleScreeningFailed`, and per Gap #1, no automatic retry).

## TODO/FIXME found
None. Grepped all files read above for `TODO`/`FIXME` — no matches in this scope's files.
