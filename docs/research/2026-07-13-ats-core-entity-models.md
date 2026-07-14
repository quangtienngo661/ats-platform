# Research Brief: Core Entity Models of Established ATS Platforms vs. ats-platform (Student Capstone)

**Date:** 2026-07-13 (also noted 2026-07-12 in surrounding context — treat as same research session)
**What was researched:** How Greenhouse, Lever, Ashby, SmartRecruiters, Workday Recruiting, Teamtailor, and Merge.dev's unified ATS API model the core recruiting entity graph (Candidate/Application/Job/Stage/Offer/Scorecard/etc.), compared against `libs/backend/database/prisma/schema.prisma` in this repo.
**Method:**
- **Repo side (observed, not reported):** read `libs/backend/database/prisma/schema.prisma` directly (567 lines, all models/enums quoted below verbatim from that read) rather than trusting the task prompt's paraphrase. All repo claims below are `schema.prisma:<line>` citations against that read.
- **External side:** WebSearch + WebFetch against public developer docs (Greenhouse `developers.greenhouse.io` / `github.com/grnhse/greenhouse-api-docs` markdown source / `harvestdocs.greenhouse.io`, Lever `hire.lever.co/developer/documentation` + `github.com/lever/postings-api`, Ashby `developers.ashbyhq.com`, SmartRecruiters `developers.smartrecruiters.com`, Teamtailor `docs.teamtailor.com`, Merge `docs.merge.dev/merge-unified/ats`), plus general web search for Workday Recruiting (no public developer API docs exist for Workday Recruiting's object model the way the others do — findings there are lower-confidence, sourced from consulting/admin-facing material, not primary API reference docs; flagged explicitly below).
- Where WebFetch returned only a 404 or stub (e.g. Ashby's actual object schema pages, Merge's Scorecard page), that is noted — the underlying claim is still reported via the WebSearch snippet that surfaced it, marked as lower-confidence/no-verbatim-quote-available.

**Freshness contract:** This is a one-shot snapshot of public docs as of July 2026. Greenhouse explicitly states Harvest API v1/v2 will be deprecated after **Aug 31, 2026** in favor of v3 — re-check `harvestdocs.greenhouse.io` if reading this after that date, endpoint paths may have moved. Everything else (Lever, Ashby, SmartRecruiters, Teamtailor, Merge) has no stated deprecation window at time of writing. Re-verify against the repo schema if `schema.prisma` has since changed — check `git log` on that file.

---

## Q1. Core entity model — canonical entities and relations

### Job Requisition vs. Job Posting — are they separate, and why

**Greenhouse** treats these as genuinely distinct entities in the data model, not just UI labels. From the Job object schema (`github.com/grnhse/greenhouse-api-docs/.../_jobs.md`, fetched):
> `"job_post_name": "External Name That Appears On Job Boards"` vs. `"job_name": "Internal Name That Appears On Hiring Plans"`

A **Job** is the internal hiring-coordination record (has `departments[]`, `offices[]`, `hiring_team` with `hiring_managers`/`recruiters`/`coordinators`/`sourcers`, `openings[]` array each with its own `status`/`close_reason`, and overall `status`: `open`/`closed`/`draft`). A **Job Post** is a separate, subordinate entity: the externally-published listing derived from a Job, and a Job can have **multiple** Job Posts (e.g. one per job board, or internal vs. external phrasing). The Harvest Application object carries `job_post_id`: "The ID of the job post through which the candidate applied. This value is null if the application was created through other means." (`_applications.md`, fetched) — i.e. the system tracks *which specific posting* a candidate came through, separately from which Job they're applied to.

Critically, Greenhouge also has **Job Opening** as a third, even finer-grained entity: a Job can have N `openings`, each independently trackable (`opened_at`, `closed_at`, `close_reason`), so "we have 3 headcount for this role" is modeled explicitly, not inferred from status.

**SmartRecruiters** confirms the same split at the API-surface level even though the fetched overview page didn't spell out the conceptual "why": it exposes separate `/jobs` and `/postings` resources, and its "Posting API... contains snapshots of all published jobs as of last time published" (developers.smartrecruiters.com/docs/customer-overview, fetched) — i.e. a Posting is an immutable published snapshot of a Job, decoupled from the live Job record so historical postings don't retroactively change when the Job is edited.

**Why this split matters (synthesized, not a direct quote):** one Job requisition is a single approved headcount/internal-process object; it can be advertised on many external boards simultaneously (LinkedIn, company site, Indeed) with different copy/wording per board, and needs to track per-board application-source attribution. Collapsing Job + Posting into one row (as our schema does) makes multi-board publishing and per-board conversion-funnel analysis structurally impossible without ad-hoc workarounds.

### Candidate as person vs. Application

**Greenhouse:** "Applications associate candidates with jobs." "There are 2 kinds of applications: candidates and prospects. Candidate applications always have exactly 1 job. Prospect applications can have 0 or more jobs." (`_applications.md`, fetched, quoted verbatim). So Candidate is the durable person-entity; Application is the per-job join record, and a **Prospect** is a third state — someone in the CRM before they've formally applied to anything.

**Lever:** "Candidate records will be merged when email addresses match" and "name and email address" are the required fields for candidate creation (`github.com/lever/postings-api`, fetched). Per Lever's help docs (via search): "Candidates can be applied to multiple job postings with multiple applications, with each application on a unique Opportunity, and an Opportunity having no more than one Application." So Lever's model is Candidate (person) → many Opportunities (one per pipeline the person is in) → each Opportunity has exactly one Application (the artifact of how they entered that pipeline — referral/user-added/via posting).

**Merge unified model** (`docs.merge.dev/merge-unified/ats/overview`, WebSearch snippet, corroborated by the Scorecard-page WebSearch result): "The Candidate object is used to represent profile information about a given Candidate. Because it is specific to a Candidate, this information stays constant across applications." "The Application Object is used to represent a candidate's journey through a particular Job's recruiting process. If a Candidate applies for multiple Jobs, there will be a separate Application for each Job if the third-party integration allows it." — Merge normalizes across dozens of vendors and still lands on **Candidate 1—N Application** as the universal shape, which is strong signal this is load-bearing, not vendor idiosyncrasy.

**Candidate deduplication/merge as a first-class feature — confirmed on 2 of 3 platforms directly:**
- **Ashby**: the API exposes a `candidate.merge` capability and a dedicated `candidateMerge` webhook — "triggered when a candidate is merged and includes the deleted candidate's id and merged candidate data" (`developers.ashbyhq.com/reference/candidatemergewebhook`, WebSearch snippet). Ashby's docs describe the candidate object as "the central CRM entity in Ashby's all-in-one recruiting platform," with merge/anonymize/hire all as native operations.
- **Lever**: dedup happens automatically on email match at creation time (quoted above) — a lighter-weight, implicit version of the same feature.
- Greenhouse doesn't surface an explicit merge endpoint in what was fetched, but its Candidate/Application split (Candidate ID appears on every Application) presupposes the same identity model.

### Job Stage / Pipeline Stage — configurable per job, not a fixed enum

**Greenhouse Job Stages** are queried per-job: `GET /v1/jobs/{id}/stages` and `GET /v1/job_stages` (`_job_stages.md`, WebSearch synthesis, quoted structure): "The job stage object includes the following fields: `id`, `name`, `created_at`, `updated_at`, `job_id`, `priority`, and `interviews`." Each stage embeds an `interviews` array of **interview steps**, each with `id`, `name`, `schedulable` (bool), and `interview_kit` (prep content + custom questions) — i.e. the pipeline *and* the interview plan attached to each stage are both configured per Job, not shared globally or hardcoded. Applications reference `current_stage: { id, name }` (`_applications.md`) — a **pointer** to one of that job's configured stages, not a value from a fixed enum.

**Lever**: "Disposition stages return the complete pipeline stage configuration and archive reasons for an account, combining pipeline stages and archive reasons into a single call" — stages here are described as account-wide-configurable ("Common stages include New Applicant and New Lead at the beginning of each pipeline, and Offer at the end of each pipeline" — WebSearch synthesis of Lever docs), suggesting Lever's stage list is more account-level-templated than Greenhouse's strictly-per-job model, but still fully configurable rather than a fixed enum baked into the platform.

**Ashby**: exposes `interviewStage`, `interviewPlan`, `interviewStageGroup` as distinct, separately-manageable objects ("interviews, interview schedules..., interview stages and stage groups, interview plans, interview briefings" — `developers.ashbyhq.com` overview, WebSearch synthesis) — the most granular of the three: Stage Group (a phase like "Onsite") containing multiple Stages, each with its own Interview Plan.

**Teamtailor** models this as its own first-class object: "The `JobInterviewStage` object is used to represent a particular recruiting stage for an Application, and a given Application typically has the `JobInterviewStage` object represented in the `current_stage` field... it's possible to filter on stage-type when listing job applications." (WebSearch synthesis of `docs.teamtailor.com`) — and lists `JobInterviewStage` as one of only 6 core objects in its *unified* ATS API surface (Applications, Attachments, Candidates, Job Interview Stages, Jobs, Users), underscoring how central this concept is even in a deliberately minimal API.

**Stage transitions — event/history table vs. current-stage pointer, or both:** every platform examined does **both**. Greenhouse's Application carries a live `current_stage` pointer *and* Greenhouse fires stage-change webhooks / the Harvest API models `last_activity_at`; Teamtailor's application has a `changed_stage_at` attribute recording when the current pointer last moved (WebSearch synthesis: "The API includes a `changed_stage_at` attribute on job applications"). None of the fetched docs exposed a literal "stage_history" table by name in what was retrievable, but the presence of `changed_stage_at`/webhooks alongside a `current_stage` pointer strongly implies history is reconstructed from event logs/webhooks even where there isn't a single queryable "StageHistory" REST resource — functionally the same shape as our own `ApplicationHistory` table (`schema.prisma:381-396`), just event-sourced via webhook stream in some vendors rather than a first-party history table in others.

**Time-in-stage / funnel metrics — what the data model needs:** the recurring pattern across vendors is: (a) a stage-transition timestamp on the current pointer (Teamtailor's `changed_stage_at`, our own `currentStageSince` at `schema.prisma:369`), (b) a **per-job, not global**, ordered list of stages (`priority`/ordinal field — Greenhouse's job_stage has `priority`), so "how far through this job's specific pipeline" is computable, and (c) either a durable history table of every transition (fromStage/toStage/timestamp) or a reconstructible webhook/event stream. Our schema has (a) and a `ApplicationHistory` history table equivalent to (c), but is missing (b): stages are a fixed global enum (`ApplicationStatus`, `schema.prisma:49-59`), not a per-job configurable/orderable set, so "average time in Job A's custom 'Technical Screen' stage vs. Job B's" is not representable — only the 7 fixed statuses are.

### Scorecard / Interview Feedback / Interview Kit

**Greenhouse Scorecard** (`_scorecards.md`, fetched, fields quoted verbatim): `id`, `updated_at`, `created_at`, `interview` (stage name string), `interview_step {id, name}`, `candidate_id`, `application_id`, `interviewed_at`, `submitted_by` (user object), `interviewer` (user object), `submitted_at`, `overall_recommendation`, `attributes[]`, `ratings{}`, `questions[]`. `overall_recommendation`: **"One of: `definitely_not`, `no`, `yes`, `strong_yes`, `no_decision`"** — a structured enum, not free text. `submitted_by`: "The user who submitted this scorecard. Note that this user may not necessarily be the interviewer, since scorecards can be submitted on behalf of other users." — i.e. the model explicitly separates *who did the interview* from *who recorded the feedback*.

**Ashby**: "read interview feedback and scorecards submitted by interviewers, including ratings, free-text responses, and recommendation values" plus, distinctly, **Interview Kits/Plans**: "interview stages and stage groups, interview plans, interview briefings" (`developers.ashbyhq.com`, WebSearch synthesis) — an Interview Plan/Kit is the *template* (what questions/competencies to probe for a given stage), while a Scorecard is the *filled-in instance* per interviewer per interview. This template/instance split is the same pattern Greenhouse expresses via `interview_kit` nested under `job_stage.interviews[]` (prep content + custom questions) feeding into a per-interviewer Scorecard.

**Merge unified model**: "The Scorecard object is used to represent an interviewer's candidate recommendation based on a particular interview... Each interview typically contains Scorecards per interviewer with timestamps and the interviewer's recommendation." (WebSearch synthesis of `docs.merge.dev`) — confirming **Scorecard is 1 per (Interview × Interviewer)**, not 1 per Application, across the normalized model.

Our system has **no equivalent at all** — no Scorecard/feedback model exists in `schema.prisma`; `InterviewSchedule` (`schema.prisma:527-545`) only tracks logistics (who/when/where/link/status), with no structured feedback capture after the interview happens.

### Offer as its own entity with approval chain

**Greenhouse Offer** (`_offers.md`, WebSearch synthesis): fields include `id`, `version`, `application_id`, `job_id`, `candidate_id`, `opening {id, opening_id, status, opened_at, closed_at, application_id, close_reason}`, `created_at`, `updated_at`, `sent_at`, `resolved_at`, `starts_at`, `status`, `custom_fields`. `status`: **"One of: `unresolved`, `accepted`, `rejected`, `deprecated`"**. Note `version` — offers are versioned (a comp change/counter-offer creates a new version, not an edit-in-place), and the Offer links back to the specific `opening` it's meant to fill, closing that opening on acceptance.

**Ashby** goes further with an explicit approval workflow as a distinct API surface: "create and manage candidate offers, offer versions, the offer process (start), and approval workflows — including force-approve for individual approval steps or the entire offer" and a separate **Approvals API**: "programmatically define approval definitions for entities in scope of API-managed approvals and supports multi-step approval workflows" (`developers.ashbyhq.com/reference/offerprocessstart`, WebSearch synthesis). This is a generalized, multi-step, entity-agnostic approval-chain object — not offer-specific plumbing bolted on, but a reusable approval-workflow primitive Ashby also uses elsewhere.

**Merge unified model**: "When a candidate's Application makes it all the way through a successful interview process they receive Offers. The Offers object contains information about when the offer was sent, when the offer closed, the start date, and the offer status." — confirms Offer-as-entity (not offer-as-status) is universal enough to appear in the cross-vendor normalized model.

Our system has **no Offer entity** — `offer` is just one value of the `ApplicationStatus` enum (`schema.prisma:49-59`). No comp/start-date/version/approval-chain data can be recorded.

### Source / Referral tracking

Greenhouse Application carries `source {id, public_name}` and `credited_to {id}` — "The ID of the user who will receive credit for this application" (`_applications.md`, quoted) — separating *channel* (job board, referral, agency) from *the specific person who gets credit* (a recruiter or the referring employee). Ashby's candidate object explicitly manages "sourcing sequences, referrals" as native candidate-level concerns. Our schema has **no source field anywhere** on `Application` or `Candidate` — not even a free-text column.

### Talent Pool / Candidate Tag

Ashby: "candidate tags, projects" as native candidate-level entities, and the Greenhouse "Prospect" concept (a person tracked before/without a formal application) is functionally a talent-pool primitive. Our schema has no tagging, no pooling, no prospect-without-application state — every `Candidate` row implies at least the possibility of an `Application`, and there's no way to hold someone in a pipeline-adjacent state without a Job.

### Activity Feed / Notes / @mentions

Greenhouse: `GET /v1/candidates/{id}/activity_feed` — "the list of activities on a candidate's profile, including interviews, notes, and emails. The response includes an array of notes... an array of emails... and an array of events" (WebSearch synthesis of `_activity_feed.md`). Notes have a `visibility` field: **"admin_only, public, or private"** — i.e. notes are permission-scoped by design, not a flat comment table. Our schema has **no notes/activity-feed model** at all; `Notification` (`schema.prisma:551-566`) is a one-way system-to-user push message (polymorphic `relatedEntityId`/`relatedEntityType`), not a recruiter-authored note or a per-candidate timeline.

### Attachment (multiple docs per candidate)

Greenhouse's Application object includes an `attachments[]` array (`_applications.md`), and the Merge unified model lists `Attachment` as a top-level normalized entity separate from Candidate/Application. Our schema hard-codes **exactly one CV per Application** via `Application.cvId` (`schema.prisma:366,373`) and `CV` (`schema.prisma:323-339`) has no generic attachment/document type — no cover letters, portfolios, reference letters, or transcripts distinct from the parsed-CV flow.

### Email threading / candidate communication log

Greenhouse's activity feed explicitly includes "an array of emails sent to and from the candidate" and a dedicated `POST /v1/candidates/{id}/activity_feed/emails` endpoint for logging candidate email notes (WebSearch synthesis). No equivalent exists in our schema.

### EEO/demographic data as a separate table

Greenhouse: `GET /v3/eeoc` — "EEOC responses capture a candidate's voluntary self-identification of race, gender, veteran status, and disability status... Each row belongs to a single application and is keyed by `application_id`; a candidate who applies to multiple jobs may have multiple responses." (`harvestdocs.greenhouse.io/reference/get_v3-eeoc` via WebSearch synthesis, and corroborated by `support.greenhouse.io` guidance that this data is collected via a separate, gated, federally-approved questionnaire, restricted by an `harvest:eeoc:list` scope, and — importantly — kept out of the in-app recruiter view: "Unlike the in-app EEOC report (which only exposes aggregated, anonymized counts)..."). This is a deliberate **separation of compliance-sensitive PII from the operational recruiting data recruiters see day to day** — a real legal/architecture pattern (in the US, hiring decisions must not be visibly influenced by this data, so it's walled off). Merge's unified model also lists `EEOC` as a top-level normalized object. Our schema has no such table.

---

## Q2. Pipeline / stage modeling — summary answer

Fixed enum vs. configurable pipeline: **every major platform examined (Greenhouse, Lever, Ashby, Teamtailor) uses a configurable, per-job (or per-account-template) ordered list of stages, not a fixed global status enum.** This is the single most consistent finding across all five vendor docs plus the vendor-neutral Merge/Teamtailor normalized models. Our system's `ApplicationStatus` enum (`applied|screening|interview|offer|hired|rejected|cancelled`, `schema.prisma:49-59`) is the fixed-enum pattern these platforms have all moved away from at the core-model level (though the fixed set is still often used at the UI/reporting layer as a normalized "stage type" bucket — e.g. Lever's disposition/archive-reason model groups configurable stages under exactly this kind of coarse category for reporting).

Stage transitions are recorded via **both** a live current-stage pointer (with a last-changed timestamp) **and** a durable transition history (either a first-party history resource or a reconstructible webhook/event stream) — our `Application.currentStageSince` + `ApplicationHistory` (`schema.prisma:369, 381-396`) already matches this shape structurally; the gap is that the *stages themselves* aren't a per-job configurable set.

Time-in-stage/funnel metrics need: ordered per-job stages (a `priority`/ordinal), stage-entry timestamps, and either a history table or event stream — see Q1 above for the detailed breakdown of what's present vs. missing in our schema.

---

## Q3. Rejection & disposition

**Greenhouse**: `rejection_reason` on Application is a *reference to a taxonomy entity*, not free text: `"The ID of the reason why this application was rejected"`, with a nested object carrying `id`, `name`, and a `type` sub-object with its own `id`/`name` (`_applications.md`, quoted verbatim) — i.e. rejection reasons are categorized (a `type` groups multiple specific `reason`s), a real taxonomy table, plus a separate free-text `rejection_details` field for the specific note.

**Lever**: archive reasons are an explicit, account-level, listable/retrievable resource — `GET /v1/archive_reasons`, `GET /v1/archive_reasons/{id}` — and are unioned with "Hired" as the terminal outcome: **"There is one archive reason common to all accounts called Hired, and all other archive reasons provide granular insight into the reasons why a candidate was rejected."** (WebSearch synthesis) — i.e. Lever's model treats "hired" and "rejected(reason X)" as the same kind of object (a disposition/archive reason), just with one reserved value meaning success. This is a notably different design from ours, where `hired`/`rejected`/`cancelled` are three separate enum values with no shared taxonomy.

**Merge unified model** lists `RejectReason` as a distinct top-level normalized entity, confirming this is universal enough across vendors to be worth normalizing.

Our system's `ApplicationHistory.rejectionReason` (`schema.prisma:388`) is a **free-text `String?` column**, not a foreign key into a reason taxonomy — no categorization (e.g. "failed technical screen" vs. "compensation mismatch" vs. "position cancelled"), no legally-structured disposition codes, no way to run "why do we lose candidates" analytics without parsing free text.

Legally-required disposition codes: not independently verified from primary legal-compliance sources in this pass (that would need EEOC/OFCCP guidance directly, not ATS vendor docs) — flagging this as **reported, not verified**: the presence of a structured rejection-reason taxonomy across every vendor examined is strong circumstantial evidence that this is at least a common compliance/reporting expectation in the industry, particularly for US federal contractors (tied to the same EEOC apparatus in Q1), but I did not independently confirm a specific legal mandate for reason-code granularity.

---

## Q4. Multi-tenancy / org model

None of the fetched docs described a "recruiter belongs to exactly one department, required" constraint as a norm — if anything, the evidence points the other way:

- **Greenhouse** Job's `hiring_team` models **many-to-many, role-based** membership: `hiring_managers`, `recruiters`, `coordinators`, `sourcers` are each arrays of user objects **per job**, not a single owning department per user. A recruiter can appear on many jobs across many departments simultaneously; departments (`departments[]`, with `parent_id`/`child_ids` — a hierarchy) are attached to the **Job**, not exclusively owned by a single Recruiter.
- **Workday Recruiting** (lower-confidence — no primary API docs found, sourced from consulting/admin material via WebSearch): "Job Requisition (the open position, linked to Organization and Position objects)... Organization (supervisory hierarchy that governs positions and access)." Here the org hierarchy attaches to the **Job Requisition** (via a Position within a Supervisory Organization), and a Worker (recruiter) can be granted access across multiple supervisory orgs by security-group role assignment — again, not a rigid one-recruiter-one-department ownership model. This is the weakest-sourced finding in this brief (no Workday public developer portal for Recruiting's object model was found — this is an enterprise HCM module usually accessed only by paying customers/implementation partners); treat as directional, not authoritative.
- **Ashby/Teamtailor/SmartRecruiters** docs fetched didn't surface an explicit "recruiter's department" constraint either way — this is a gap in what was retrievable, not a confirmed absence.

**Synthesized conclusion for Q4**: the "recruiter belongs to exactly one required Department" constraint in our schema (`Recruiter.departmentId String @map("department_id")` — non-nullable, `schema.prisma:243,247`, with the pre-existing `// TODO: consider making departmentId nullable` comment at `schema.prisma:239`) is **more rigid than what production ATS platforms model**. The universal pattern observed is: Department/Org attaches to the **Job** (many jobs per department, hierarchy on the department itself — which we do have, `schema.prisma:203-214`), while a Recruiter/hiring-team-member is a **many-to-many role assignment per job**, not a single fixed home department. Our repo's own TODO comment already flags this as suspect — this research corroborates that instinct with external precedent, though it's a design smell more than a functional gap for a single-tenant capstone (see Q5/recommendation).

---

## Q5. What a serious ATS has that a student project typically misses

Ranked roughly by how load-bearing each is in production ATS platforms (not yet weighted by capstone effort/value — that ranking is in the final section):

1. **Configurable per-job Pipeline Stage entity** (Greenhouse Job Stage, Lever Stage, Ashby Interview Stage/Stage Group, Teamtailor JobInterviewStage) — replacing a fixed global status enum. Universal across every vendor examined.
2. **Scorecard / structured interview feedback**, separate from interview *scheduling* — present in Greenhouse, Ashby, and the vendor-neutral Merge model; recorded per (interview × interviewer), with a structured recommendation enum, not free text.
3. **Offer as a first-class, versioned entity** with its own status lifecycle and (in Ashby) a generalized multi-step approval chain — not a status value on Application.
4. **Rejection Reason as a taxonomy/reference entity** (categorized, sometimes with a `type` grouping), not a free-text column — Greenhouse, Lever, Merge all confirm this.
5. **Job Posting as an entity distinct from Job/Requisition** (multiple postings per job, per-board publishing, source attribution) — Greenhouse, SmartRecruiters.
6. **Source/Referral tracking** on Application, with a "credited to" user distinct from the interviewer/recruiter — Greenhouse, Ashby.
7. **Notes / Activity Feed with visibility scoping** — Greenhouse's `admin_only`/`public`/`private` note visibility is a specific, non-obvious detail: recruiter notes aren't a flat comment table, they're permission-scoped.
8. **Candidate deduplication/merge as a first-class operation** — Ashby (explicit `candidate.merge` + webhook), Lever (implicit email-match merge). Both product surface and cross-vendor Merge model.

Two more that showed up but rank lower in the "load-bearing in production, missing here" sense specifically because they're compliance/enterprise-scale features rather than core-workflow features: **EEO/demographic data as a walled-off table** (Greenhouse, Merge) and **generic multi-attachment support** (Greenhouse `attachments[]`, Merge `Attachment`).

---

## Gap table: what big ATS have vs. what ours has

| Entity/Concept | Big ATS (Greenhouse/Lever/Ashby/Merge norm) | ats-platform (this repo) | Verified against |
|---|---|---|---|
| Job Requisition vs. Job Posting | Separate entities; 1 Job → N Job Posts (per board), Job has `openings[]` for headcount | Single `JobPosting` model conflates requisition + posting; no per-board posting, no `openings` sub-entity | `schema.prisma:282-304` |
| Candidate vs. Application | Candidate is durable person; N Applications per Candidate; dedup/merge is a native op (Ashby, Lever) | `Candidate` 1—N `Application` already matches this shape (`schema.prisma:220-233, 362-379`) — **this part is actually aligned** | `schema.prisma:220-233, 362-379` |
| Prospect / Talent Pool | Distinct state: a person tracked pre-application (Greenhouse Prospect, Ashby tags/projects) | None — no way to hold a candidate without an Application | `schema.prisma` (absence) |
| Pipeline Stage | Configurable, per-job (or per-account-template) entity with ordinal/priority | Fixed global `ApplicationStatus` enum, 7 values, same for every job | `schema.prisma:49-59` vs. Greenhouse `_job_stages.md` |
| Stage transition history | Both a `current_stage` pointer + timestamp AND a durable transition log/event stream | Matches: `currentStageSince` pointer + `ApplicationHistory` table — **structurally aligned**, just built on the wrong stage granularity | `schema.prisma:369, 381-396` |
| Scorecard / Interview Feedback | Structured, per-(interview × interviewer), enum recommendation + ratings + free text | None — `InterviewSchedule` only tracks logistics, no post-interview feedback capture | `schema.prisma:527-545` (absence of feedback fields) |
| Interview Kit / Plan (template) | Per-stage question/competency template, separate from the filled-in Scorecard | None | absence |
| Offer | Own entity: versioned, `status` enum, `opening` link, approval chain (Ashby) | `offer` is just one `ApplicationStatus` value; no comp/start-date/version/approval data at all | `schema.prisma:49-59` |
| Rejection Reason | Taxonomy/reference entity, often with a `type` category | Free-text `String?` column | `schema.prisma:388` |
| Disposition unification (hired = a kind of "reason") | Lever: Hired is one of the archive_reasons, same object family as rejections | `hired`/`rejected`/`cancelled` are separate unrelated enum values, no shared taxonomy | `schema.prisma:49-59` |
| Source / Referral | `source{id, public_name}` + `credited_to` user on Application | None — no source field anywhere | absence |
| Notes / Activity Feed | Visibility-scoped (`admin_only`/`public`/`private`), unified feed of notes+emails+events | None — `Notification` is one-way system push only, not a recruiter-authored timeline | `schema.prisma:551-566` |
| Email/communication log | Native, logged, part of the activity feed | None | absence |
| Attachment (multi-doc) | Generic `attachments[]` on Application/Candidate | Exactly one CV per Application (`Application.cvId`), no other doc types | `schema.prisma:323-339, 362-379` |
| EEO/demographic data | Separate, access-gated table, kept out of the in-app recruiter view | None | absence |
| Org/Department ↔ Recruiter | Department/Org attaches to the Job; hiring-team membership is many-to-many, per-job | `Recruiter.departmentId` is required, single, exclusive-ownership — repo's own TODO already flags this | `schema.prisma:239-252` |

---

## What's worth adding to a student capstone (ranked by value/effort)

Ranking basis: (academic/demo value) ÷ (implementation effort), for a **single-tenant university capstone**, not a product roadmap. "Academic/demo value" weighs: does it make the ERD/data-model defensible in front of examiners who know real ATS shape, does it unlock a visibly better demo flow, does it teach a technique the project is meant to showcase (AI screening, real-time interview — this project's actual differentiators). Effort weighs schema migration + new endpoints + new UI, not schema alone.

**Tier 1 — high value, low-to-moderate effort (do these if pursuing this direction at all):**

1. **Rejection Reason as a small lookup table** (`RejectionReason { id, name, category }`, FK from `ApplicationHistory.rejectionReason`) instead of free text. Tiny migration (one new model + one FK column swap), directly fixes the weakest-designed field already in the schema (a free-text column doing a taxonomy's job), and is an easy, concrete talking point in a defense ("we modeled this after Greenhouse's reason/type taxonomy" — cite this brief).
2. **Offer as its own entity** (`Offer { applicationId, status, salary, startDate, sentAt, resolvedAt, version }`) replacing the `offer` status value. Moderate effort (new model, migration, a few endpoints, minor status-enum shrink), but this is the single most visible "toy vs. real" gap examiners are likely to probe, since "offer" currently has zero structure behind it despite being a named pipeline stage.
3. **Source field on Application** (`source: String?` or a small enum: `job_board|referral|direct|other`). Trivial effort (one nullable column), decent demo value for a "candidate sourcing funnel" chart if the capstone has any analytics/dashboard component.

**Tier 2 — real value, but bigger effort; worth it only if there's a dedicated sprint for pipeline/recruiter-workflow features:**

4. **Configurable per-job Pipeline Stage** replacing the fixed `ApplicationStatus` enum. This is conceptually the most important gap in the whole comparison, but it's a genuine architecture change (new `PipelineStage` model, per-job ordering, migrating every `status` reference across the API, rewriting the Kanban-style board UI if one exists) — appropriate only if "recruiter pipeline customization" becomes an explicit feature goal, not a drive-by addition.
5. **Scorecard / structured interview feedback** attached to `InterviewSchedule`. Medium effort (one new model + a feedback-submission endpoint + UI form), good value because it's a natural extension of the interview flow this project already has, and pairs well with the project's AI angle (e.g. AI-assisted feedback summarization is a plausible "look, we thought about this" feature).

**Tier 3 — fine to skip explicitly, with reasons:**

- **Job Posting as an entity distinct from Job/Requisition** — this exists in production ATS to solve multi-board publishing at scale; a single-tenant capstone with one internal job board has no external boards to differentiate. Skip.
- **Candidate deduplication/merge** — solves a cross-application identity problem that only matters at real applicant volume across time; for a capstone demo dataset this is over-engineering. Skip, note it as a known simplification.
- **Talent Pool / Candidate Tag / Prospect state** — a CRM-adjacent feature for sourcing at scale; no natural fit for a capstone scoped around the apply→screen→interview flow. Skip.
- **Notes / Activity Feed with visibility scoping** — nice-to-have collaboration feature, meaningful mainly with multiple recruiters collaborating on one candidate at volume; low demo payoff relative to build cost (new model + feed UI + auth-scoping logic). Skip unless the capstone's rubric specifically rewards "collaboration features."
- **Email threading / communication log** — requires real email integration (send/receive/thread) which is a substantial infra lift (mail server or provider API) disproportionate to its demo value here. Skip.
- **EEO/demographic data table** — this exists in real ATS to satisfy specific US federal-contractor legal requirements; entirely inapplicable to a university project with no such compliance obligation. Skip, and don't apologize for skipping it — it's out of scope by design, not a shortcut.
- **Recruiter↔Department many-to-many / hiring-team-per-job model** — real value is at multi-department, multi-tenant scale; the repo's own `// TODO: consider making departmentId nullable` is worth resolving to `nullable` at most (cheap), but building a full per-job hiring-team join table is not proportionate for a single-tenant academic project. **Low-effort partial fix**: make `departmentId` nullable per the existing TODO — this alone removes the most artificial constraint at near-zero cost, without taking on the full many-to-many model.

**One honest cross-cutting note:** the "Candidate has many Applications" shape and the "current-stage-pointer + history-table" shape are things this schema **already gets right** relative to the production ATS pattern — the report above should not read as "everything is wrong." The concrete, prioritized gap is narrower than the full taxonomy in Q1: fixed-enum stages, offer-as-status, and free-text rejection reason are the three structural choices that most diverge from every vendor examined, and Tier 1 above targets exactly those three.

---

## Sources

- Greenhouse Harvest API overview: https://developers.greenhouse.io/harvest.html
- Greenhouse Harvest API docs source (GitHub, markdown): 
  - Applications: https://github.com/grnhse/greenhouse-api-docs/blob/master/source/includes/harvest/_applications.md
  - Scorecards: https://github.com/grnhse/greenhouse-api-docs/blob/master/source/includes/harvest/_scorecards.md
  - Jobs: https://github.com/grnhse/greenhouse-api-docs/blob/master/source/includes/harvest/_jobs.md
  - Job Stages: https://github.com/grnhse/greenhouse-api-docs/blob/master/source/includes/harvest/_job_stages.md
  - Offers: https://github.com/grnhse/greenhouse-api-docs/blob/master/source/includes/harvest/_offers.md
  - Activity Feed: https://github.com/grnhse/greenhouse-api-docs/blob/master/source/includes/harvest/_activity_feed.md
  - EEOC: https://github.com/grnhse/greenhouse-api-docs/blob/master/source/includes/harvest/_eeoc.md
  - EEOC reference: https://harvestdocs.greenhouse.io/reference/get_v3-eeoc
  - EEOC support article: https://support.greenhouse.io/hc/en-us/articles/8292714720667-Collect-candidate-demographic-data
  - Harvest API overview (support): https://support.greenhouse.io/hc/en-us/articles/360029266032-Harvest-API-overview
- Lever developer docs: https://hire.lever.co/developer/documentation
- Lever Postings API (GitHub): https://github.com/lever/postings-api
- Lever Help Center — Candidates and Opportunities: https://help.lever.co/hc/en-us/articles/20087348604445-Candidates-and-opportunities-in-the-pipeline
- Ashby API documentation (root): https://developers.ashbyhq.com/
- Ashby candidate.info reference: https://developers.ashbyhq.com/reference/candidateinfo
- Ashby application.create reference: https://developers.ashbyhq.com/reference/applicationcreate
- Ashby offerProcess.start reference: https://developers.ashbyhq.com/reference/offerprocessstart
- Ashby candidateMerge webhook reference: https://developers.ashbyhq.com/reference/candidatemergewebhook
- Ashby API Evangelist profile (secondary, corroborating): https://github.com/api-evangelist/ashby-hq
- SmartRecruiters developer docs (overview): https://developers.smartrecruiters.com/docs/customer-overview
- SmartRecruiters Application API: https://developers.smartrecruiters.com/docs/application-api-1
- Teamtailor API docs: https://docs.teamtailor.com/
- Merge Unified ATS API overview: https://docs.merge.dev/merge-unified/ats/overview
- Merge ATS Scorecards page (fetch returned 404; content only via search snippet): https://docs.merge.dev/ats/scorecards/
- Workday Recruiting (secondary/consulting sources only — no primary developer API portal found, lowest-confidence section of this brief):
  - https://kognitivinc.com/blog/a-simple-guide-to-business-process-reporting-in-workday-recruiting
  - https://clonepartner.com/blog/icims-to-workday-migration-the-ctos-technical-guide
- Repo ground truth: `libs/backend/database/prisma/schema.prisma` (read in full, 567 lines, this session)
