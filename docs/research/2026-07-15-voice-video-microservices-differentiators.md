# Research Brief: Voice AI, Video/Microservices Fit, and Product Differentiator Features — ats-platform

**Date:** 2026-07-15
**Scope:** The developer is considering three directions for the next stage of this capstone: (1) adding voice to the AI mock interview, (2) the already-roadmapped video call + microservices migration, and (3) "what else could make this stand out" versus leading/modern ATS and AI-recruiting platforms. This brief answers all three, explicitly cross-checked against the already-committed roadmap (`docs/migration-roadmap.md` Phase 3 = LiveKit video, Phase 4 = NATS/gRPC microservices) and the two prior research briefs (`docs/research/2026-07-13-ats-ai-screening-interview.md`, `docs/research/2026-07-13-ats-core-entity-models.md`) so it does not re-derive gaps already documented there.

**Method:** Two parallel research passes (voice AI integration; product differentiator features), each done by reading the actual repo code first (`GeminiService`, `package.json`, `schema.prisma`, the `.claude/rules/*` conventions, `docs/migration-roadmap.md`) before any web research, then WebSearch/WebFetch against vendor docs, official framework docs, and comparison sources — cited inline, with secondary/aggregated claims flagged as such rather than stated as fact. Full sub-agent working notes (more granular citations, longer quotes) are preserved in this repo's session history if a citation needs re-tracing; this file is the synthesized, consolidated version meant to be the durable reference.

**Freshness contract:** Voice-AI vendor pricing, model names, and GA/preview status are the fastest-moving facts in this brief — OpenAI shipped a new Realtime model 9 days before this was written, and Gemini Live's Developer-API-vs-Vertex-AI GA split has already changed once. Re-verify any $/min figure or preview/GA status before it drives a real budget or architecture decision. Feature-comparison claims (who has what) are safe to treat as stable for a few months. Compliance/legal claims (LinkedIn scraping ToS enforcement, FCRA, OAuth verification thresholds) are lower-velocity and safe to treat as stable longer, but still re-check before acting on them for real (not just for a thesis defense).

---

## Part 1 — Voice AI for the Mock Interview

### The decision-critical finding: LiveKit Agents + Gemini Live reuses both existing bets

This repo already has two relevant commitments: a working `GeminiService` (Google Gemini via `@google/genai`, the only AI vendor in the codebase) and an already-roadmapped, self-hosted **LiveKit** deployment for Phase 3's human-interview video calls. The question was whether adding voice to the AI mock interview requires a third vendor, or can reuse both.

**Answer: it can reuse both, and the integration is real and documented, not a workaround.**

- LiveKit Agents (the framework for building AI participants that join a LiveKit video/audio room) is open-source (Apache-2.0) and fully self-hostable — matching Phase 3's already-planned self-hosted LiveKit server exactly.
- Google publishes an official Node.js plugin, `@livekit/agents-plugin-google`, with a documented `RealtimeModel` class wrapping **Gemini Live** — confirmed by direct fetch of LiveKit's own docs ([docs.livekit.io/agents/models/realtime/plugins/gemini/](https://docs.livekit.io/agents/models/realtime/plugins/gemini/)). Node matters here specifically because this backend is NestJS/Node, not Python — this is not a Python-only integration that would require a second runtime.
- **Architecture**: the AI joins the LiveKit room as a participant, exactly like a human interviewer would — audio flows over WebRTC into/out of the room like any other participant's track. Internally, a LiveKit Agents worker process holds a separate outbound connection to Gemini Live to stream the room's audio to Gemini and pipe Gemini's spoken response back onto the agent's track. LiveKit's own framework README names "interview bots" as an explicit example use case. A working starter exists: [livekit-examples/gemini-live-quickstart](https://github.com/livekit-examples/gemini-live-quickstart).
- The existing `GOOGLE_API_KEY` env var works with this plugin with no new credential.

**Real caveats, not glossed over:**
- The **Gemini Developer API** (what this repo's key already uses) is still **Preview, no SLA** for the Live API — GA-with-SLA is Vertex-AI-only as of Google I/O 2026, which requires a GCP service account + billing project, a materially bigger scope item than reusing the existing key. Acceptable to stay on the Preview path for a capstone demo; not worth migrating auth just to "fix" this.
- The newest model (`gemini-3.1-flash-live-preview`) has documented compatibility limitations in the LiveKit plugin (no mid-session config updates, no agent handoff, no async function calling). The safer choice is the more mature `gemini-2.5-flash-native-audio-preview` / `gemini-live-2.5-flash-preview`.
- A LiveKit Agents worker is a **persistent background process** that registers with the LiveKit server — architecturally closer to a standalone daemon than to a NestJS controller or a BullMQ job processor. It is genuinely new infrastructure to build, deploy, and monitor, not a drop-in extension of the existing `GeminiService`/BullMQ pattern. Budget real time for this as its own deployment unit.

### What every real AI-voice-interview competitor actually does

Researched: Apriora ("Alex"), Ribbon AI, Mercor, Karat, HireVue.

- **All four real voice-AI interviewers (Apriora, Ribbon, Mercor, and — differently — Karat's human-plus-AI format) preserve the exact same follow-up-branching pattern this project already has in its text-only mock interview.** This is strong validation that the existing question→follow-up→next-question architecture is the right shape; voice would be a modality change on top of it, not a redesign.
- **The most-cited candidate complaint across the category is conversational pacing (the AI moving on too fast, not giving time to think), not raw technical latency.** This means the harder design problem for adding voice here is deciding how long to wait before treating silence as "the candidate is done answering" — not simply picking the fastest vendor.
- Mercor is the heaviest-weight example (webcam mandatory, ID verification, "verified profile" as the product, not just the interview) — useful context, not a pattern to copy for a capstone.
- HireVue's core product is still asynchronous one-way video, not live conversational voice, though it acquired Hireguide in March 2026 specifically to move toward this — worth noting that even a mature vendor treats this as a frontier they're still building toward, not a solved problem.

### Vendor comparison

| Approach / Vendor | Latency | Pricing model | Self-host vs. managed | Fits existing stack (Gemini + LiveKit)? |
|---|---|---|---|---|
| **Gemini Live API** | First-audio ~300ms–2.3s | ~$0.005/min in, $0.018/min out (secondary figures) + free tier | Managed API call, part of the SDK already installed | **Yes** — same key/SDK already in `GeminiService` |
| **LiveKit Agents + Gemini Live** (the recommended combo) | Inherits Gemini Live's latency + a small WebRTC hop | Gemini's per-token cost + self-hosting infra only (Agents framework is free) | **Self-hosted**, matches the already-planned Phase 3 deployment | **Yes, best fit** — reuses both existing investments |
| OpenAI Realtime API (`gpt-realtime-2.1`) | p95 cut ≥25% vs. prior gen | ~$0.04/min blended with caching | Fully managed only | No — third vendor |
| ElevenLabs Conversational AI | ~75ms streaming TTS | $0.08–0.10/min + separate LLM cost | Fully managed | No — third vendor |
| Deepgram Voice Agent API | Sub-300ms overall | ~$0.05–0.075/min flat | Fully managed | No — third vendor |
| Vapi / Retell AI / Bland AI | Vendor-dependent | Headline $0.05–0.11/min, real blended $0.25–0.33/min ($2K–13K/mo at volume) | Fully managed, telephony-centric | No — wrong use case (phone/call-center), enterprise pricing |
| **Web Speech API (browser-native, fallback)** | Browser-dependent, fast for short utterances | **$0** | Fully client-side | Yes, trivially — but not a real conversational agent (see below) |

### The honest cheap fallback: Web Speech API bolt-on

If a full real-time voice agent is too much scope, the browser's built-in `SpeechRecognition` (speech-to-text) and `SpeechSynthesis` (text-to-speech) can be bolted onto the *existing* text pipeline with **zero backend changes**: the candidate's spoken answer is transcribed into the same text field that already goes over Socket.IO, and the AI's question text is read aloud with `SpeechSynthesis.speak()`. The batch question generation, follow-up-decision call, async BullMQ scoring, and final report all stay exactly as they are today.

Real limitations to disclose honestly (not hide): no LLM reasoning or true conversational turn-taking is added — this is "type with your voice" + "read the question aloud," not a live back-and-forth agent. Firefox does not support the Speech Recognition part without a manual flag. Still, it's a legitimate, small, self-contained "feels more like an interview" upgrade at effectively zero cost.

### Ranked recommendation

1. **If voice is worth real timeline risk: build LiveKit Agents + Gemini Live, sequenced after Phase 3's LiveKit server exists** (see Part 2 below for why this ordering matters), on the mature `gemini-2.5-flash-native-audio-preview` model, accepting the Gemini Developer API's Preview/no-SLA status as fine for a capstone demo, and designing the silence-timeout/pacing behavior deliberately since that — not latency — is what real competitors get complaints about.
2. **If scope is tight: ship the Web Speech API bolt-on and stop there.** Zero new vendor, zero new infra, zero backend risk. Name the Firefox gap and the lack of true turn-detection openly rather than treating it as a compromise to hide.
3. **Explicitly out of scope for a capstone:** OpenAI Realtime, ElevenLabs, Deepgram, or Vapi/Retell/Bland as the primary approach (all are a third vendor with no reuse benefit); migrating to Vertex AI purely to get GA/SLA status; any avatar/video-generation layer on top of voice; any telephony/PSTN integration.

---

## Part 2 — How Voice AI Fits the Already-Planned Video Call (Phase 3) and Microservices (Phase 4) Phases

This is the connective question the user asked directly — how do the three directions (voice, video, microservices) relate, not just what each one is in isolation.

**Voice AI should be sequenced *after* Phase 3 (LiveKit video), not before or in parallel with it.** The recommended architecture (Part 1) has the AI join a LiveKit room as a participant — that only works once Phase 3's self-hosted LiveKit server actually exists. Building voice AI first would mean either standing up LiveKit early (pulling Phase 3 work forward in disguise) or building a second, throwaway voice pipeline outside LiveKit that gets replaced later. Neither is worth it — the dependency is real, not just a nice-to-have ordering preference.

**Voice AI is also a natural fit for where Phase 4 (microservices) is already heading.** A LiveKit Agents worker is, by its own nature, a persistent standalone process — not a NestJS controller, not a BullMQ job. Phase 4's extraction plan already has a **Step 7: "Extract LiveKitService as standalone microservice"** as its own late-stage step. Practical implication: if/when the voice-AI worker gets built, build it from day one as its own deployable process (own `package.json`/entry point, communicating with the rest of the system over a queue or the same NATS transport Phase 4 already plans to adopt) rather than jamming it into the existing NestJS app — that avoids a second migration later and slots naturally into Phase 4's Step 7 instead of adding new extraction work.

**Net sequencing implication for the roadmap:** Video (Phase 3) unlocks Voice (new Phase 3.5) unlocks a cleaner Phase 4 Step 7 (voice-service ships already-separated). This is reflected in the roadmap update described in Part 4 below.

---

## Part 3 — Product Differentiator Features (Beyond the Already-Documented Data-Model Gaps)

The two prior research briefs (2026-07-13) already found and roadmapped/scoped-out the core data-model gaps versus Greenhouse/Ashby/Lever/Workday (Job-vs-Posting split, Scorecard/Interview Kit, Offer-as-entity, skills taxonomy, compliance audit trail, etc.) — this section deliberately does not repeat those. It covers product/UX differentiation: features that are less about "is our data model correct" and more about "would this look genuinely current and impressive in a demo."

### What was researched

1. **AI conversational candidate assistant** (Paradox/Olivia pattern) — 24/7 FAQ + pre-screening chat. Partially realistic here: FAQ answering and structured pre-screening chat reuse the exact `GeminiService` + async pattern already proven by the mock-interview feature; scheduling-via-chat is not realistic without calendar-API integration first (the hard part is the calendar, not the chat).
2. **Talent CRM / silver-medalist re-engagement** — Ashby's "AI Talent Rediscovery" resurfaces past rejected-but-strong candidates for new roles using stage progression + scorecard data + AI classification. The prior research briefs already scoped a full Prospect/Talent-Pool *entity* out of this capstone — but a much cheaper version needs **no new schema at all**: a query joining existing `CVScreening.overallScore` (rejected applications above a threshold) against a new job's required skills, surfaced as a "candidates worth revisiting" panel.
3. **Career site / employer branding builder** — this turns out to be a niche-vendor differentiator (Teamtailor's specific market position), not a baseline expectation every serious ATS competes on (Greenhouse/Ashby/Workday treat the careers page as a simple listing or leave it to the company's own marketing site). Low priority.
4. **Calendar integration** — a *read-only* Google Calendar free/busy check before scheduling an interview is realistic (Google's OAuth verification is only required past 100 test users, comfortably above a capstone demo's real usage); full two-way multi-provider sync is not.
5. **Gamified coding assessments** — HackerRank/Codility are enterprise-only, no accessible free tier. But **Judge0**, an open-source, self-hostable sandboxed code-execution engine, ships as one more container in the Docker Compose stack this project already runs, and explicitly lists "candidate assessment platforms" as a stated use case. This is Medium effort (new container + new schema entity + a code-editor UI component) but the most concrete, demoable "we built real infrastructure" story in this research.
6. **Job-board syndication, LinkedIn scraping extensions, e-signature, background checks** — researched individually, each has a *distinct* reason to skip, not just "costs money": job-board APIs (Indeed, LinkedIn) require becoming an approved technology partner, a business relationship no capstone can get; LinkedIn scraping is active ToS/legal risk (LinkedIn sued a scraping-API vendor in 2026) and would risk the developer's own account; DocuSign has no legally-valid free tier; Checkr's API is actually affordable, but running real background checks presumes a real employer entity under US FCRA law, which a university capstone simply isn't. The cheap, honest substitute for the e-signature idea: once the already-roadmapped `Offer` entity exists, add a simple in-house Accept/Decline button with a timestamp/IP audit row — explicitly labeled as a workflow simulation, not real e-signing.
7. **What's genuinely new in 2025-2026 AI-recruiting product design** — the clearest current pattern (Ashby's rediscovery feature, Metaview's own published prediction that "the ATS becomes invisible" as AI handles routine pipeline movement with human approval) converges on one synthesized idea: **an AI co-pilot panel on the recruiter's Kanban card that proposes the next pipeline action** ("this candidate clears both the CV-screening and mock-interview thresholds — advance to interview?"), with the recruiter clicking to approve, never auto-executing. This needs no new AI capability — it can be pure business-rule logic over data that already exists (`CVScreening`, `InterviewResult`), with Gemini only used to phrase the suggestion in natural language. It also directly extends a principle this codebase has already adopted and documented: [ADR 0002](../architecture-decisions/0002-no-auto-reject-on-ai-score.md) (AI surfaces, a human decides) — this makes it an unusually strong thesis-defense point, since it's not a new philosophy, just the existing one applied one step further.
8. **PWA (installable web app) and localization** — a PWA is realistic and cheap (Next.js's App Router has official, version-matched built-in support, no upgrade needed); localization's library setup is easy but the real cost is retrofitting every hardcoded Vietnamese string in the codebase into message keys first — flagged as the actual blocker, not the library choice.

### Consolidated comparison table

| Feature | What leading/modern platforms do | Have it today? | Effort | Recommendation |
|---|---|---|---|---|
| AI co-pilot: suggest next pipeline action | Metaview: "ATS becomes invisible," AI proposes, human approves | No | S–M | **Build now** — no new AI capability needed, extends ADR 0002's existing human-in-the-loop principle, strongest thesis-defense value |
| Silver-medalist / candidate-revisit panel | Ashby AI Talent Rediscovery | No | S | **Build now** — pure query over existing data, no schema change |
| AI FAQ / pre-screening chatbot | Paradox/Olivia | No | S–M | **Build now** — reuses the existing `GeminiService` + chat-UI pattern |
| Self-hosted coding assessment (Judge0) | HackerRank/Codility (enterprise-only) | No | M | **Build now/later** — real infra story, fits existing Docker Compose + BullMQ, schedule deliberately |
| Read-only calendar availability check | Industry norm (see 2026-07-13 brief) | No | M | **Build later** — Google-only, single-recruiter OAuth, freebusy-read only |
| PWA (installable, offline shell) | General mobile-web best practice | No | S–M | **Build later** — cheap polish, do after core features |
| In-house Offer Accept/Decline + audit log | Real vendors use legal e-signature | No | S (once Offer entity exists) | **Build later** — cheap once the already-roadmapped Offer entity lands; label explicitly as simulation |
| Branded career-site builder | Teamtailor's core differentiator | Partial (plain listing exists) | M–L | **Skip / low priority** — niche-vendor feature, not a core-ATS expectation |
| Full two-way multi-provider calendar sync | Modern ATS enterprise tier | No | L | **Skip** — Outlook is a second OAuth/API surface, disproportionate |
| Localization (next-intl) | Standard for multi-market products | No | M–L (string-extraction dominates) | **Skip / later** — retrofit cost is the real blocker |
| Real DocuSign e-signature | $75+/mo, no usable free tier | No | — | **Skip — needs a paid contract** |
| Job-board syndication (Indeed/LinkedIn) | Requires approved ATS-partner status | No | — | **Skip — needs a real business relationship** |
| Browser sourcing extension (LinkedIn scraping) | Prohibited by ToS, active 2026 enforcement | No | — | **Skip — real legal/ToS risk** |
| Background-check integration (Checkr) | API is affordable, but FCRA presumes a real employer | No | — | **Skip — compliance-standing problem, not cost** |
| AI voice/video interview | Ribbon AI, Micro1, HeyMilo — 24/7 async voice screening | No (text-chat only) | L | See Part 1 — sequence after Phase 3, or ship the Web Speech fallback |

### Top-3 if only building a few differentiators

1. **AI co-pilot panel** — cheapest, and the strongest "this is a current, not dated, design pattern" story.
2. **Silver-medalist / candidate-revisit panel** — near-zero cost, pairs naturally with #1 (the co-pilot can be the thing that surfaces silver medalists).
3. **Self-hosted Judge0 coding assessment** — more work, but the most concrete "we built real infrastructure" answer to a HackerRank/Codility feature-parity question.

---

## Part 4 — What Changed in the Roadmap

Following this research, `docs/migration-roadmap.md` was updated (2026-07-15) with:
- A new **Phase 1.5 — Differentiator Features**, inserted after Phase 1 (core workflows) and before Phase 2 (RAG), covering the AI co-pilot panel, the silver-medalist panel, and the Judge0 coding assessment — chosen because none of these three depend on RAG, video, or microservices infrastructure, so there's no reason to wait.
- A new **Phase 3.5 — Voice AI for Mock Interview**, inserted after Phase 3 (video call) and before Phase 4 (microservices), covering the LiveKit Agents + Gemini Live build (with the Web Speech API bolt-on named as the fallback scope), placed here specifically because it depends on Phase 3's LiveKit server existing first (Part 2 above).
- A note on Phase 4's Step 7 (video-service extraction) that the voice-AI worker, if built, should be built from day one as its own deployable process rather than embedded in the NestJS monolith, so it doesn't need a second migration later.

Phase numbers 0–5 were kept stable (no renumbering) — the new phases use `.5` suffixes specifically so no other file that references a phase number (rule files, this document's own cross-references) needs updating.

---

## Sources (deduped, both research passes)

**Voice AI:**
- LiveKit Gemini plugin docs (fetched): https://docs.livekit.io/agents/models/realtime/plugins/gemini/
- LiveKit Agents framework (GitHub): https://github.com/livekit/agents
- LiveKit + Gemini Live quickstart: https://github.com/livekit-examples/gemini-live-quickstart
- LiveKit self-hosting docs: https://docs.livekit.io/deploy/custom/deployments/
- Gemini Live API overview (fetched): https://ai.google.dev/gemini-api/docs/live-api
- Gemini Live API get-started SDK doc: https://ai.google.dev/gemini-api/docs/live-api/get-started-sdk
- `@google/genai` Live class reference: https://googleapis.github.io/js-genai/release_docs/classes/live.Live.html
- Gemini Live API GA on Vertex AI (Google Cloud blog): https://cloud.google.com/blog/products/ai-machine-learning/gemini-live-api-available-on-vertex-ai
- OpenAI Realtime API pricing: https://developers.openai.com/api/docs/pricing, https://theplanettools.ai/blog/openai-gpt-realtime-2-1-mini-voice-latency-pricing-2026
- ElevenLabs Conversational AI pricing: https://elevenlabs.io/pricing/agents
- Deepgram Voice Agent API: https://deepgram.com/pricing
- Vapi/Retell/Bland comparison: https://techsy.io/en/blog/retell-ai-vs-vapi-vs-bland
- Apriora ("Alex"): https://www.apriora.ai/
- Ribbon AI: https://www.ribbon.ai/
- Mercor AI interview: https://talent.docs.mercor.com/support/ai-interview
- Karat: https://karat.com/
- HireVue: https://www.techtarget.com/searchhrsoftware/definition/HireVue
- Web Speech API (MDN): https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API

**Differentiator features:**
- Paradox: https://www.paradox.ai/
- Ashby AI Talent Rediscovery (fetched): https://www.ashbyhq.com/product-updates/ai-talent-rediscovery
- Gem silver-medalist rediscovery: https://www.gem.com/video/silver-medalist-candidate-rediscovery
- Teamtailor comparisons: https://www.authencio.com/blog/teamtailor-software-guide-features-pricing-pros-cons-alternatives
- Google Calendar API quota (official): https://developers.google.com/workspace/calendar/api/guides/quota
- Google OAuth 100-user verification threshold: https://www.unipile.com/google-oauth-100-user-limit/
- HackerRank ATS integration: https://www.hackerrank.com/writing/enterprise-coding-assessment-platforms-with-ats-integration-2025-guide
- Judge0 (official): https://github.com/judge0/judge0
- Indeed Job Sync API (official docs): https://docs.indeed.com/job-sync-api/
- LinkedIn scraping legal risk: https://nubela.co/blog/is-scraping-linkedin-legal-in-2026/
- DocuSign pricing: https://signb.ee/blog/e-signature-api-pricing-comparison-2026
- Checkr API: https://checkr.com/our-technology/background-check-api
- AI voice interview agents landscape: https://www.herohunt.ai/blog/ai-voice-agents-for-recruiting-2026-guide
- Metaview 2026 predictions (fetched): https://www.metaview.ai/resources/blog/future-of-recruiting-predictions
- Next.js PWA guide (official): https://nextjs.org/docs/app/guides/progressive-web-apps
- next-intl (official): https://next-intl.dev/docs/getting-started/app-router

**Repo files checked (both passes):** `apps/api/src/common/external-apis/gemini/gemini.service.ts` (full), `package.json`, `libs/backend/database/prisma/schema.prisma`, `docs/migration-roadmap.md`, `docs/architecture-decisions/0002-no-auto-reject-on-ai-score.md`, `.claude/rules/apis/*.md`, `.claude/rules/web/*.md`, `docs/research/2026-07-13-ats-ai-screening-interview.md`, `docs/research/2026-07-13-ats-core-entity-models.md`.
