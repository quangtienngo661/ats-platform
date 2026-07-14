# Application/Interview/Notification Service Audit — 2026-07-12

**Freshness contract:** static snapshot of `apps/api/src/app/{applications,interviews,notifications}` + `common/socket-io` and `schema.prisma` as of 2026-07-12 (branch `feat/ats-with-ai-implementation`). Every finding is **observed** (read from code, `file:line` cited) — none are reported from other docs. Re-verify against code before acting on any finding if this is more than a few weeks old; fixes may already have landed.

## Method

Read directly (no test run, static code read only):
- `libs/backend/database/prisma/schema.prisma` (models: Application, ApplicationHistory, CVScreening, AiConfig, InterviewTopic, InterviewSession, InterviewQnA, InterviewResult, InterviewSchedule, Notification; enums: ApplicationStatus, InterviewStatus, InterviewType, ScheduleStatus, NotificationType, RelatedEntityType, DifficultyLevel, ScreeningStatus)
- `apps/api/src/app/applications/applications.service.ts`, `applications.controller.ts`, `dtos/application.dto.ts`
- `apps/api/src/app/interviews/interviews.service.ts`, `interviews.controller.ts`, `dto/create-interview.dto.ts`, `dto/update-interview.dto.ts`
- `apps/api/src/app/interviews/session/interview-session.service.ts`, `interview.gateway.ts`, `interview.processor.ts`, `interview-generation.processor.ts`
- `apps/api/src/app/notifications/notifications.service.ts`, `notifications.controller.ts`, `dto/create-notification.dto.ts`
- `apps/api/src/common/socket-io/socket-io.service.ts`
- `apps/api/src/common/utils/include-options.util.ts` (all `*IncludeOptions` constants used by the above)
- Grep sweep of `apps/api/src` for: `RelatedEntityType.`, `NotificationType.`, `currentStageSince`, `sessionId` (InterviewSchedule write sites), `interviewSchedule.(update|create)`, `application\.(schedules)|schedules:\s*true`, `TODO|FIXME` in the three module scopes.

Did not run the app or tests — this is a static-read audit only, per task scope.

## Underused/dead DB fields

### `InterviewSchedule.sessionId` — completely unwritten (dead link)
Field exists on the model (`libs/backend/database/prisma/schema.prisma:530` `sessionId String? @map("session_id")`, relation to `InterviewSession` at line 540) but no service ever sets it.
- `interviews.service.ts:176-187` `createSchedule()` builds the `create` payload with `applicationId, scheduledBy, interviewerId, interviewType, scheduledDate, scheduledTime, onlineMeetingLink` — no `sessionId`.
- `CreateInterviewScheduleDto` (`apps/api/src/app/interviews/dto/create-interview.dto.ts:4-23`) has no `sessionId` field at all, so it can't even be supplied by a client.
- `interviews.service.ts:260-295` `updateSchedule()` builds `updateData` from `dto.interviewerId/interviewType/scheduledDate/scheduledTime/onlineMeetingLink/status` only — no `sessionId` branch.
- `UpdateInterviewScheduleDto` (`apps/api/src/app/interviews/dto/update-interview.dto.ts:4-28`) also has no `sessionId` field.
- Confirmed via grep `interviewSchedule\.(update|create)` across all of `apps/api/src` — only the two call sites above exist, neither touches `sessionId`.
- `scheduleIncludeOptions` (`apps/api/src/common/utils/include-options.util.ts:119-143`) never includes the `session` relation either, so even read-side there's no consumption.
- Effect: the schema models a link between a human-scheduled `InterviewSchedule` (recruiter books an interviewer) and a candidate's AI mock-interview `InterviewSession`, but the two subsystems are entirely decoupled in application code — this FK is vestigial.

### `Application.schedules` relation — never read
`Application` model (`schema.prisma:375`) has `schedules InterviewSchedule[]`. Grepped whole `apps/api/src` for `application\.(schedules)|schedules:\s*true|include:.*schedules` — no matches. `applicationIncludeOptions` (`include-options.util.ts:65-93`) includes `candidate`, `jobPosting`, `cv`, `screening`, `history` but not `schedules`. Result: viewing an application's detail (`getApplicationById`, `applications.service.ts:353-370`) never surfaces whether an interview has been scheduled for it — a caller has to separately query `GET /interviews/schedules/my?applicationId=...` to know.

### `NotificationType.interview` and `RelatedEntityType.interview` / `RelatedEntityType.job` — dead enum values
Grep for `RelatedEntityType\.|NotificationType\.` across `apps/api/src` (excluding specs) turns up exactly 3 call sites, all `NotificationType.application` / `RelatedEntityType.application` (`applications.service.ts:525,529`, `cv-screenings/processors/cv-screenings.processor.ts:207,211`) plus one `NotificationType.system` (`cvs/processors/cv-parsing.processor.ts:116`). No code anywhere constructs a notification with `type: NotificationType.interview` or `relatedEntityType: RelatedEntityType.interview`/`RelatedEntityType.job`. Concretely: `interviews.service.ts` never imports `NotificationsService` at all (confirmed no `NotificationsService` import in that file), so:
- Creating/updating/cancelling an `InterviewSchedule` never notifies the candidate or the interviewer.
- Completing an AI mock `InterviewSession` (`interview-session.service.ts:281-287` sets `status: InterviewStatus.completed`) never creates a `Notification` — only a Socket.IO `interview:session_completed` emit (`interview-session.service.ts:293-298`), which requires the client to be live-connected; there's no persistent/offline notification fallback.

### `ApplicationHistory.rejectionReason` — write path exists but never enforced
It IS written when supplied: `applications.service.ts:396` (isReverted branch) and `:426` (normal branch) both pass `rejectionReason: dto.rejectionReason`. But `UpdateApplicationStatusDto.rejectionReason` (`dtos/application.dto.ts:33-35`) is `@IsString() @IsOptional()` — nothing conditionally requires it when `dto.status === ApplicationStatus.rejected`. A recruiter can reject an application with `rejectionReason` left `undefined`, and it will silently be stored as `null`. Read side is fine — `getApplicationHistory` (`applications.service.ts:438-454`) does a plain `findMany` with no `select`, so `rejectionReason` comes back whenever it was set.

### `Application.currentStageSince` — written correctly, never used for anything but sort order
Write sites confirmed via grep `currentStageSince` in `applications.service.ts`: line 209 (`withdraw`), line 385 (isReverted branch), line 415 (normal `updateStatus` branch) — all three status-changing paths correctly reset it. Read sites: only `orderBy: { currentStageSince: 'asc' }` in `getAllKanbanBoard` (`:247`) and `getKanbanBoard` (`:283`). No SLA/aging computation, no "days in current stage" field returned to the client, no alert/report reads it — the field is fully wired for writes but the intended aging/SLA use case (implied by the field name and the audit prompt) doesn't exist yet.

## Business logic gaps

### 1. `isReverted: true` completely bypasses the ApplicationStatus state machine
`applications.service.ts:381-402`:
```
if (dto.isReverted) {
    return await this.prisma.$transaction(async (tx) => {
        const updated = await tx.application.update({
            where: { applicationId },
            data: { status: dto.status, currentStageSince: new Date() },
            include: applicationIncludeOptions,
        });
        await tx.applicationHistory.create({
            data: { applicationId, fromStatus: application.status, toStatus: dto.status, changedBy: userId, notes: dto.notes, rejectionReason: dto.rejectionReason },
        });
        return updated;
    });
}
```
This branch runs *before* the `VALID_TRANSITIONS[application.status]` check at line 404. `dto.status` is validated only by `@IsEnum(ApplicationStatus)` (`dtos/application.dto.ts:22-23`) — any enum value is accepted. Failure scenario: a recruiter (or any caller who discovers the flag) can `PATCH /applications/:id/status` with `{status: "hired", isReverted: true}` on an application currently `applied`, skipping `screening`/`interview`/`offer` entirely, with no validation error. There is no separate "allowed revert targets" list — `isReverted` isn't actually constrained to reverting to a *previous* status at all.

### 2. The `isReverted` path never calls `notifyCandidateStatusChangeSafe`
Compare the two branches in `updateStatus`: the non-reverted path (`applications.service.ts:412-435`) ends with `await this.notifyCandidateStatusChangeSafe(updated);` before returning. The `isReverted` branch (`:381-402`) returns directly from inside the `$transaction` callback and never reaches that call. Failure scenario: a recruiter reverts an application into `rejected` or `interview` (both in `NOTIFY_CANDIDATE_ON`, `applications.service.ts:24-29`) via the revert flag — the candidate gets a `history` row but no `Notification` and no realtime signal, unlike the same status reached through the normal path.

### 3. `InterviewSchedule.status` can be set to any `ScheduleStatus` with no transition validation
`interviews.service.ts:277` `if (dto.status) updateData.status = dto.status;` — no check that e.g. `completed → scheduled` or `cancelled → completed` is disallowed. `UpdateInterviewScheduleDto.status` (`update-interview.dto.ts:25-27`) is just `@IsEnum(ScheduleStatus) @IsOptional()`. Contrast with `applications.service.ts`'s explicit `VALID_TRANSITIONS` map — no equivalent exists for `InterviewSchedule`.

### 4. Marking an `InterviewSchedule` completed never advances the `Application` or notifies anyone
`updateSchedule` (`interviews.service.ts:260-295`) only ever calls `this.prisma.interviewSchedule.update(...)`. There is no call into `ApplicationsService` (not injected — `InterviewsService`'s constructor at `interviews.service.ts:13-14` takes only `PrismaService`) and no `NotificationsService` (not imported). Failure scenario: recruiter sets an `InterviewSchedule.status = completed` after the interview happens — the `Application.status` stays `interview` forever unless a human separately remembers to `PATCH /applications/:id/status`, and neither the candidate nor the interviewer's manager gets any signal that the interview happened.

### 5. `removeSchedule` hard-deletes with no audit trail
`interviews.service.ts:297-303`:
```
async removeSchedule(interviewId: string, userId: string, role: string) {
    await this.assertCanMutateSchedule(userId, role, interviewId);
    return this.prisma.interviewSchedule.delete({ where: { interviewId } });
}
```
No `ApplicationHistory` entry, no notification, no soft-cancel (`ScheduleStatus.cancelled` exists but isn't used here — `updateSchedule` is the only way to reach it). A deleted schedule leaves zero trace it ever existed, including for the double-booking check (`assertNoScheduleConflict`, `:100-120`), which is arguably fine (frees the slot) but means there's no record for dispute resolution ("recruiter says they scheduled it, candidate says they never got a slot").

### 6. No guard against multiple concurrent `InterviewSession`s for the same candidate
`startSession` (`interview-session.service.ts:24-57`) creates a new `InterviewSession` unconditionally — no check for an existing `in_progress`/`generating`/`pending_result` session for `candidate.candidateId` before creating another. `resumeSession` (`:304-327`) can only ever surface the most-recently-started `in_progress` session (`orderBy: { startedAt: 'desc' }`), so a candidate who accidentally (or deliberately) calls `startSession` twice ends up with an orphaned first session stuck `in_progress`/`generating` indefinitely alongside the second one, both consuming Gemini quota.

### 7. No timeout/disconnect path ever sets `InterviewStatus.abandon`
Grep of `interview.gateway.ts` and `socket-io.service.ts` confirms: `socket-io.service.ts:60-68` `handleDisconnect()` only logs — it doesn't look up or touch any `InterviewSession`. `interview.gateway.ts` implements no `OnGatewayDisconnect` at all (only `@SubscribeMessage` handlers for `join_session`/`submit_answer`/`submit_followup`). The only two code paths that ever write `InterviewStatus.abandon` are: (a) the candidate's own explicit `PATCH /interviews/sessions/:id/abandon` → `interview-session.service.ts:329-356` `abandonSession()`, and (b) `interview-generation.processor.ts:84-90`, the final-attempt failure path when Gemini fails to generate questions. Failure scenario: a candidate closes the browser tab mid-interview (mid `in_progress`) without calling abandon — the session sits `in_progress` forever; nothing ever times it out or flips it to `abandon`. `InterviewStatus.abandon` is reachable, so not fully dead, but the "abandoned via inactivity" scenario implied by the enum's existence next to `in_progress` is unimplemented.

### 8. `InterviewType.online` doesn't require or auto-generate `onlineMeetingLink`
`CreateInterviewScheduleDto` (`create-interview.dto.ts:4-23`) and `UpdateInterviewScheduleDto` (`update-interview.dto.ts:4-28`) both declare `onlineMeetingLink` as `@IsString() @IsOptional()` with no conditional-required validation tied to `interviewType === online`, and no service-side check either (`createSchedule`, `interviews.service.ts:169-188`, passes `dto.onlineMeetingLink` straight through, whatever it is, including `undefined`). There is no meeting-link generation logic anywhere in the codebase (no Zoom/Meet/Jitsi integration) — it is purely a manually-typed free-text field. Failure scenario: recruiter creates an `online` interview schedule without an `onlineMeetingLink`; the schedule is created successfully, `Application.status` was already `interview`, and now the candidate has no way to join.

### 9. `triggerScreening` blocks re-trigger on `pending`/`processing`/`completed` but not on other statuses — fine; noted only as confirmed-correct, not a gap
(`applications.service.ts:483-494`). Included here only to record that this part of the audit's suspicion (screened twice) was checked and found handled correctly — `ScreeningStatus.failed` is deliberately left re-triggerable, which is reasonable.

### 10. Duplicate-application protection is present and correct
`apply()` (`applications.service.ts:136-143`) checks all existing `Application` rows for `{jobId, candidateId}` and blocks with `ConflictException` unless every existing one is `cancelled`. Confirmed correct — not a gap, included for completeness since the audit prompt asked about it explicitly.

### 11. No guard against multiple simultaneous `InterviewSchedule`s per `Application`
`createSchedule` (`interviews.service.ts:169-188`) only checks `assertCanScheduleApplication` (application must be in `interview` status) and `assertNoScheduleConflict` (same interviewer + exact same date/time). It does not check whether the application already has an active (`scheduled`) `InterviewSchedule`. This may be intentional (multi-round interviews plausibly need several schedules per application), so flagged as an open question rather than a confirmed bug — but there is no explicit design signal (comment, dto field like "round number") indicating it's deliberate either.

### 12. Follow-up Q&A fields — confirmed fully wired (not a gap)
For completeness: `InterviewQnA.hasFollowup/followupQuestion/followupAnswer/followupReason` ARE fully wired end-to-end:
- Written on first answer: `interview-session.service.ts:131-139` (`submitAnswer`, sets `hasFollowup`, `followupQuestion`, `followupReason` from `geminiService.checkInterviewFollowup`).
- Written on follow-up answer: `interview-session.service.ts:165-168` (`submitFollowupAnswer`, sets `followupAnswer`).
- Read to decide "still pending": `getCurrentQuestion` (`:82-105`) explicitly queries for rows where `hasFollowup: true AND followupAnswer: null`.
- Read for AI evaluation: `interview.processor.ts:45-51` includes `followupQuestion`/`followupAnswer` in the Gemini evaluation prompt.
- Read for final result JSON: `interview-session.service.ts:249-250` includes both in `resultContent`.
No gap found here — listed to close out the audit prompt's explicit question.

### 13. No transition validation on Gemini-scored `InterviewQnA.correctnessScore` being partially null at `endSession` time — handled correctly (not a gap)
`endSession` (`interview-session.service.ts:179-288`) correctly detects `hasPendingEvaluation` and defers to `InterviewStatus.pending_result` rather than computing a partial score. Noted only for completeness.
