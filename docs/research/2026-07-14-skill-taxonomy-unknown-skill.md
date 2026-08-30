# Research Brief: How Large Platforms Handle the "Unknown Skill" Problem
Date: 2026-07-14
Researcher: tech-research subagent

> ## TÓM TẮT (đọc cái này trước — bản chi tiết + nguồn ở bên dưới)
>
> **Câu hỏi:** Khi AI đọc CV thấy một kỹ năng lạ chưa có trong bảng `Skill`, xử lý sao — nhận thẳng, để chờ duyệt, hay bỏ? Các nền tảng lớn (LinkedIn, Lightcast, ESCO) làm gì?
>
> **Kết luận — làm gì:**
> - **Chọn cách A:** thêm cột `isVerified Boolean @default(false)` vào bảng `Skill` đã có. Kỹ năng AI thêm mới = chưa duyệt; admin ngó qua rồi bật `verified`. Đây là migration **1 dòng**.
> - **KHÔNG dựng bảng staging riêng (cách B).** Ở quy mô đồ án (vài chục CV), một cột boolean làm đúng việc "tách skill đã tin khỏi skill mới thấy" với chi phí bằng một phần nhỏ. Ngành lớn cũng chỉ cần "truy vấn tách được hai loại", không bắt buộc phải là bảng riêng.
> - **KHÔNG thay bảng skill bằng so khớp vector/embedding (cách C).** Mọi nền tảng lớn vẫn giữ một bảng taxonomy rời, kể cả ở quy mô khổng lồ. Thêm vector lúc này là giải quyết vấn đề *chưa tồn tại*, lại đẻ ra lỗi mới: âm thầm bỏ mất skill thật sự lạ.
> - **Nỗi sợ "rác skill" là lo hơi xa** ở quy mô này. Cả đời dự án chỉ vài chục skill lạ — admin ngồi gộp "ReactJS"/"React" trong 5 phút là xong. Dùng sẵn cột `synonyms Json` đã có (`schema.prisma:275`) để lưu bí danh khi gộp, và trỏ lại các tham chiếu cũ về skill chuẩn.
> - **Mẹo rẻ:** nhờ Gemini gợi ý "skill này có gần skill nào đã có không" như một bước phân loại một lần (không phải index vector chạy thường trực) — được gần hết lợi ích của C mà gần như không tốn hạ tầng.
>
> **Cần làm rõ trước khi code:** (1) UI để admin duyệt skill đã có chưa, hay phải xây mới? (2) Skill `isVerified: false` có được dùng trong chấm điểm không — hay chỉ là bộ lọc UI? Lưu ý: bảng `Skill` hiện **chưa** nằm trong luồng chấm điểm (nó đọc `parsedRequirements` free-text), nên việc này có thể ít quan trọng hơn vẻ ngoài.

## Method / sources

Web search + WebFetch against primary engineering blogs (LinkedIn Engineering), vendor docs
(Lightcast, Textkernel, Affinda), governance docs (ESCO, O*NET, Wikidata, Stack Exchange Meta),
GitHub Engineering blog, and secondary aggregators (ZenML LLMOps DB, Medium write-ups, academic
PDFs) where primary sources didn't go deep enough. No paywalled/patent-only material was fetched
in full (one Google Patent — "Job skill taxonomy," US11321671B2 — surfaced but not read in depth;
flagged as unexplored, not cited as evidence below).

**Confidence caveats, upfront and important:**
- LinkedIn's *own* engineering blog posts (fetched directly, quoted verbatim below) describe the
  extraction/matching pipeline (trie tagger + two-tower BERT semantic model) and the taxonomy's
  curation model (human taxonomists + ML) in real detail, with real numbers. **They do NOT
  explicitly state, in the two posts fetched, what concretely happens the moment a free-text skill
  fails to match anything in the 39-41k-skill taxonomy** — i.e. no verbatim sentence saying "if
  match confidence < X, we do Y." This was fetched twice (the extraction post and the taxonomy
  post) and confirmed absent both times, including via a third source (ZenML LLMOps case-study
  aggregation of a LinkedIn talk) that also came up empty on this specific point. This is a real
  gap, not laziness — treat the LinkedIn "auto-admit vs stage vs reject" answer below as
  **reasonably inferred from the discovery-pipeline description**, not a verbatim confirmed fact.
- Workday's "self-cleaning" claim is sourced entirely from Workday's own blog/marketing pages —
  **no independent technical/engineering source corroborates the internal mechanism**. Treat
  everything under Workday as marketing-tier, not verified engineering fact.
- Stack Overflow's tag-creation/synonym reputation numbers came from a secondary academic paper
  (Beyer et al., "Synonym Suggestion for Tags on Stack Overflow") rather than a live fetch of
  Stack Exchange's own help-center page; a follow-up search for the primary meta.stackexchange.com
  page did not resolve. Numbers are widely corroborated elsewhere (they match general Stack
  Exchange community knowledge) but are marked secondary below.
- Eightfold/SeekOut/Gloat findings are shallow — mostly vendor blog/marketing language about
  "inferring skills via embeddings," with no concrete description of an unmatched-term code path.
  Treat as directional only.
- Wikidata's "notability" criteria is a real, primary, well-documented governance policy — but it
  is a *general entity* policy, not skill-specific; used here only as a folksonomy→curated-taxonomy
  governance precedent, not as an HR-domain data point.

---

## Q1 — Auto-admit vs. staging vs. reject: what happens per platform, concretely

| Platform | Mechanism | Evidence tier |
|---|---|---|
| **LinkedIn** | Free text → matched against taxonomy via trie (exact/token) + two-tower BERT (semantic) match, then "skill expansion" via the Skills Graph. Separately, an **entity discovery pipeline** mines free text (member profiles, job search queries, job postings, recruiter searches, ad campaigns) for **new skill candidates**, which are then **sanitized** ("reduce noise and redundancy, and remove obsolete or malformed terms") before **human taxonomists**, assisted by an ML model (KGBert) generating recommendations, decide admission and disambiguation (e.g. "Cadence" → "Cadence Software"). This reads as a **staging + human-curation model (b)**, not auto-create (a) and not embedding-only (c). Primary source, but the exact code path for a *single* unmatched profile skill (does it show as free text immediately, pending a later taxonomist pass?) is not stated. | Primary (LinkedIn Eng blog), inferred synthesis |
| **Workday Skills Cloud** | Vendor language: "leverages machine learning to recognize and identify related skills, **consume new skills**, and continuously learn"; "self-cleaning" framed as synonym-consolidation (a single skill can have "20-plus synonyms") plus cross-customer aggregated learning. No mechanism for staging/rejection is described; marketing copy implies near-automatic (a)-style ingestion with never-detailed QA. | Marketing only, unverified |
| **Lightcast Open Skills** | Public/transparent taxonomy (34,000+ skills), updated ~biweekly/monthly, drawn from "hundreds of millions of online job postings, profiles, and resumes." Explicitly has "a dedicated team of taxonomists and engineers" that "cleans, checks, and updates each entry," plus a public "skill suggestions forum." This is a **staged/reviewed model (b)**: skills are mined from real-world text, then curated by named humans before being versioned into the published taxonomy — not instant auto-create. | Primary (Lightcast docs/blog), moderate detail |
| **ESCO** (EU) | Formal governmental process: Directorate-General for Employment (European Commission) + ESCO Member States Working Group. Major vs. minor version releases; "Delta files" document every change. May-2024 major version added **42 new skills and 196 new knowledge concepts**, produced via "a data-driven approach which combines human expertise and AI techniques, including leveraging AI to extract information on occupation and skills terms used in online job advertisements." This is the most heavyweight **staging + governance-board review model (b)** of anything researched — new skills go through committee-style review before a dated release. | Primary (European Commission / ESCO site) |
| **O*NET** | Updated ~twice/year via multiple input streams incl. "AI/Expert, AI/SME, Analyst Ratings... Employer Job Postings... Machine Learning, NLP." Notably migrated in 2022 to sourcing job-posting-derived tech-skill signal from **Lightcast** (successor to Burning Glass), i.e. O*NET partly **outsources** its "new skill discovery" step to a labor-market-data vendor, then folds curated results in on a fixed release cadence (its "Hot Technologies" list: 171 tech skills → 11,500+ occupation linkages in one update). Staged/batch model (b), not real-time. | Primary (onetcenter.org) |
| **Textkernel/Sovren** | ~12,000 skill concepts, 300,000+ synonyms across 25 languages, output includes a `Normalized` field alongside raw extracted text — implying **free text can coexist un-normalized** when nothing matches (closer to option (d): keep as free text, tag separately as matched-or-not). Docs found do not explicitly describe an "unrecognized term" queue or say whether Textkernel auto-adds new canonical skills from client volume; likely proprietary/internal, not publicly documented. | Primary docs, but incomplete on this exact question |
| **Affinda** | Defaults to the **Lightcast** taxonomy (i.e. doesn't roll its own — reuses model (b) governance by proxy) but explicitly supports **customer-defined custom taxonomies** replacing or supplementing Lightcast/ESCO. This means Affinda's actual behavior for an unmatched term is configurable per customer, not fixed. | Primary (Affinda docs), thin on internals |
| **Eightfold/SeekOut/Gloat** | Framed around embedding an entire profile/JD into a vector space and inferring skills/proficiency by similarity to a trained model, rather than a literal string→taxonomy-row lookup. This is directionally an **embedding-based model (c)** — skills aren't so much "added to a table" as they're a byproduct of a continuously retrained inference model. No vendor clearly states what happens when a novel term has no nearby neighbor (silently ignored is the reasonable inference, but unconfirmed). | Marketing-tier, weak |
| **GitHub Topics** (non-HR precedent) | User-typed topics run through: (1) a logistic-regression "good/bad" quality classifier "tuned for high recall," (2) a minimum-frequency floor before a candidate is suggested at all (number itself not published), (3) tf-idf-based ranking, (4) **canonicalization** — edit-distance + stemming + Jaccard similarity collapses variants ("neural-network"/"neural-networks"/"neuralnetwork") to one preferred form, (5) a greedy dedup pass removing near-duplicate suggestions. This is folksonomy staged into a **curated, but still auto-computed (no named human reviewer described), canonical set** — closest analogue to option (a)+(c) combined: auto-admit with algorithmic self-merge, not human staging. | Primary (GitHub Engineering blog) |
| **Stack Overflow** (non-HR precedent) | Reputation-gated: **1,500 rep to create a new tag** at all; **≥2,500 rep to suggest a tag synonym**, and a synonym suggestion needs a **net score ≥ +5** (community votes) to be auto-approved. "Burnination" (tag deletion/merge) is a moderator/high-rep community action, not automatic. This is a **human-gated staging model with an explicit numeric threshold** — the cleanest real "N-times/reputation-before-canonical" pattern found in the whole research pass. | Secondary (academic paper citing SO policy) — not independently re-verified against the live meta.stackexchange.com page in this session |
| **Wikidata** (non-HR precedent) | No numeric "seen N times" threshold. Governance is qualitative: an item is admissible only if it has a sitelink to another Wikimedia project, OR is a "clearly identifiable conceptual/material entity" backed by "serious and publicly available references," OR fills a structural modeling need. Explicitly: "quality is valued over quantity," and new editors are steered toward editing existing items before minting new ones. | Primary (Wikidata policy page) |

## Q2 — The frequency/threshold pattern

- **Stack Overflow is the one platform in this research with a genuine, numeric, publicly stated
  threshold**: 1,500 reputation to create a tag; 2,500 rep to propose a synonym; synonym approved
  automatically at community score ≥ +5. This is a *reputation-and-vote* gate, not a raw
  occurrence-count gate — i.e. it's "trusted user says so + peer approval," not "term appeared
  50 times."
- **No frequency-count threshold ("skill X must appear N times before becoming canonical") was
  found published by LinkedIn, Workday, Lightcast, ESCO, or O*NET.** All of them describe
  volume/frequency as an *input signal* to a scoring or ranking model (LinkedIn's TF-IDF-like
  "skill genome" scoring; GitHub's tf-idf topic ranking) but none publish a hard cutoff number for
  taxonomy admission. This may exist internally and simply not be publicized — treat its absence
  as "not found," not "doesn't exist."
- **GitHub's system uses an unpublished minimum-frequency floor** ("Topics must meet a minimum
  frequency count to avoid rejection") — confirmed as existing but the actual number was not
  disclosed in the source fetched.
- Net: a literal frequency threshold is real and precedented (Stack Overflow, and implicitly
  GitHub), but at LinkedIn/Lightcast/ESCO scale it is folded into ML scoring + human judgment
  rather than a simple counter.

## Q3 — Canonical + alias/synonym modeling; merges

- **LinkedIn**: each canonical skill node carries "aliases (e.g. abbreviations like 'ML' or
  language translations)" — i.e., functionally a one-to-many canonical→alias relation, described
  in prose as part of the node's own record rather than a separate joined table (the blog doesn't
  expose the literal schema, but "374k aliases" against "39k skills" implies an alias table/array
  keyed to a canonical skill ID, which is exactly the `synonyms Json` field design already in this
  repo's `Skill` model). No public detail found on what happens to existing rows/edges when two
  skills are later merged by taxonomists — this is a genuine, confirmed gap, not glossed over.
- **Workday**: describes consolidating "up to 20-plus synonyms" per skill and exposing skill-to-
  skill *relationships* via a graph (e.g. "patient management" related to "urgent care" for
  nurses) — alias handling again folded into a graph model; no schema-level detail disclosed
  (marketing tier).
- **Textkernel**: 12,000 concepts / 300,000+ synonyms — same canonical:alias ratio pattern as
  LinkedIn (roughly 1:8–1:10 aliases per canonical skill in both cases), suggesting this ratio is
  a fairly stable real-world constant for HR skill taxonomies, not taxonomy-specific noise.
- **GitHub**: canonicalization is done algorithmically (edit-distance + stemming + Jaccard) at
  suggestion time, not via a persistent alias table — i.e. GitHub Topics doesn't really model
  "canonical + alias" as stored data the way LinkedIn/Workday/Textkernel do; it recomputes
  similarity each time.
- **Stack Overflow**: explicit alias mechanism is the "tag synonym" system — one tag is declared a
  synonym of another via community vote, and historical posts tagged with the old (deprecated) tag
  are **retagged/merged into the canonical tag** ("burnination" for full removal, synonym-merge for
  softer consolidation) — this is the clearest real precedent for "what happens to rows that
  already pointed at the now-merged term": they get **retroactively repointed**, not orphaned.

## Q4 — Embedding-based mapping instead of a growing table

- This is explicitly how **LinkedIn's semantic matching stage** works day-to-day (the two-tower
  BERT model matches free text to *existing* canonical skills by embedding similarity) — but
  critically, LinkedIn runs this **in addition to**, not **instead of**, a still-growing curated
  taxonomy fed by the separate discovery pipeline. So LinkedIn is *not* a pure "stop growing the
  table, embed everything" system — it's both a growing taxonomy AND an embedding-based matcher
  layered on top of it.
- **Eightfold** most closely resembles the pure embedding-only approach in marketing language
  (profiles/JDs embedded into a shared vector space, skills "inferred" via similarity rather than
  parsed into a fixed table) — but no vendor source disclosed what happens when nothing is near
  enough (a distance-threshold cutoff is functionally required for this to work sanely, and it's a
  very common academic-paper pattern — e.g. papers found on resume/JD matching describe "a skill
  is considered relevant if cosine similarity... is less than [above] a certain threshold" — but no
  source stated a concrete number, and none confirmed what "below threshold" does with the term
  (silently drop vs. flag as unknown).
- **Practical implication for a small system**: nobody found in this research runs *purely*
  embedding-based skill normalization with zero taxonomy — even LinkedIn, at 39-41k skills and
  massive engineering investment, still maintains and grows a discrete table. Pure embedding-only
  is more of an academic/smaller-vendor pattern (Eightfold-style) than an "instead of a taxonomy"
  replacement at the biggest, most mature platforms.

## Q5 — Taxonomy size and junk

| Taxonomy | Size (skills) | Size (aliases) | Stated defense against junk |
|---|---|---|---|
| LinkedIn | ~39,000–41,000 (two blog posts, different dates, cite 39k and "over 41,000" — treat as the taxonomy grew between posts) | 374,000 aliases, 26 locales, 200k+ edges | Sanitization step explicitly "remove[s] obsolete or malformed terms" before candidates reach taxonomists; human taxonomist review is the final gate |
| Lightcast Open Skills | 34,000+ | not stated | Named "dedicated team of taxonomists and engineers," public changelog, public skill-suggestion forum (transparency as a defense, not automation) |
| Textkernel | ~12,000 concepts | 300,000+ synonyms, 25 languages | Not detailed beyond the taxonomy itself being "curated"; no published junk-rate figure |
| ESCO | thousands of skills/competences (exact current count not captured in this pass) + 196 new knowledge concepts and 42 new skills added in the May 2024 major release alone | not captured | Formal Member-State governance board + "combines human expertise and AI techniques" |
| O*NET | tied to 923(ish, not verified this pass) SOC occupations; "Hot Technologies" subset = 171 tech skills | n/a | Vendor-outsourced discovery (Lightcast) + fixed biannual release cadence acts as the batching/QA gate |

- **No source in this research published a concrete "% of extracted skills that fail to map"
  number** for any platform. This is a real, notable gap across the entire research pass — despite
  explicit searching, none of LinkedIn/Workday/Lightcast/Textkernel/ESCO disclosed an
  extraction-to-canonical hit-rate. Any number quoted elsewhere on the web for this should be
  treated as unsourced until proven otherwise.
- All platforms that discuss taxonomy growth frame it as **routine and expected**, not as a failure
  mode to be prevented — LinkedIn's taxonomy grew 35% in under two years; ESCO adds tens of new
  skills per major release; ONet/Lightcast update on fixed cadences. None of them describe
  "taxonomy explosion" as an active fear; their stated defenses are about **quality of what's
  added** (sanitization, dedup, human review), not about **capping how much gets added**.

## Q6 — Does un-normalized free text coexist with the taxonomy?

- **Yes, functionally, at every platform researched.** LinkedIn shows both a normalized Skills
  Graph *and* raw member-entered skill strings pre-normalization (the whole reason an extraction
  pipeline exists is that raw text enters the system first, is possibly imperfectly matched, and
  is then progressively cleaned). Textkernel's own field naming — `Value.ResumeData.Skills` (raw)
  vs. `...Skills.Normalized` (mapped) — is the most explicit *public* confirmation that a
  resume-parsing vendor deliberately keeps **both** the raw string and its normalized mapping (if
  any) side by side, i.e. option (d)-style coexistence is real and, for Textkernel, appears to be
  the default behavior, not an edge case.
- No platform found in this research **forces** every extracted term through the taxonomy with no
  fallback — that would silently drop legitimate, merely-not-yet-catalogued skills, which
  contradicts every platform's own stated goal of capturing labor-market signal as it emerges.

## Q7 — Curation cost: how much human effort is actually admitted publicly

- **LinkedIn is explicit** that curation is "a combination of human taxonomists and machine
  learning" and describes actual taxonomist judgment calls (disambiguating "Cadence" →
  "Cadence Software"). This is a **primary, first-party confirmation that LinkedIn employs human
  taxonomists**, not just an ML pipeline.
- **Lightcast** likewise names "a dedicated team of taxonomists and engineers" who "clean, check,
  and update each entry."
- **ESCO** is run by a formal EU governance board (Directorate-General + Member States Working
  Group) — the heaviest human-governance model of any platform researched, consistent with it
  being a public-sector reference standard rather than a commercial product.
- **Workday's "self-cleaning" claim has no counter-evidence of human curation, but also no
  confirmation of its absence** — it's simply undocumented at the technical level; treat "Workday
  needs zero human curation" as an unverified vendor claim, not a fact.
- Net: **every platform with disclosed internals (LinkedIn, Lightcast, ESCO) relies on named human
  curators as part of the pipeline, not ML alone.** This directly undercuts any assumption that
  "ML/embeddings alone" is how big players actually keep a skills taxonomy clean at scale.

---

## Option A / B / C — who does this in the real world, and what breaks

**Option A — auto-create with `isVerified: false`, hide unverified from filters, admin merges later**
- Real-world analogue: closest to **GitHub Topics** (algorithmic auto-admission + algorithmic
  canonicalization, no named human reviewer) and, per vendor marketing only, **Workday's**
  "consume new skills" framing.
- What breaks at LinkedIn/Lightcast/ESCO scale: none of the platforms with disclosed, credible
  internals (LinkedIn, Lightcast, ESCO) do *pure* auto-create with no human gate — all three
  explicitly keep named human curators in the loop before a term is treated as fully canonical.
  Pure auto-create's failure mode is exactly the one the developer already fears: near-duplicate
  proliferation ("React"/"React.js"/"ReactJS") — which is precisely why GitHub had to build
  edit-distance + stemming + Jaccard canonicalization *and* a dedup pass on top of auto-admission,
  and why Stack Overflow gates tag creation behind reputation instead of leaving it fully open.
- At capstone scale (tens of CVs, one developer, no dedicated taxonomist), the *human-review* half
  of this option is trivially cheap — an admin merge queue with a handful of rows is minutes of
  work, not a curation team. The `isVerified` flag is functionally a miniature version of
  LinkedIn's/Lightcast's staged-then-reviewed model, just with a much smaller volume and a lone
  reviewer instead of a "team of taxonomists."

**Option B — separate `SkillSuggestion` staging table, `Skill` stays pristine by construction**
- Real-world analogue: this is structurally the closest match to what **LinkedIn** (discovery
  pipeline → sanitize → taxonomist review → promote to Skills Graph), **Lightcast** (skill
  suggestions forum → taxonomist team → published/versioned taxonomy), and **ESCO** (AI-assisted
  extraction → Member State/Commission review → dated major/minor release) all actually do at
  scale. It is, per this research, **the dominant pattern among the platforms with disclosed
  internals** — none of LinkedIn/Lightcast/ESCO auto-admits into the canonical set without a
  distinct pre-canonical staging step.
- What breaks: at capstone scale, the only real cost is one extra Prisma model and one extra
  admin-review screen — cheap. The failure mode at LinkedIn/ESCO scale (a huge backlog nobody
  reviews) is not a realistic risk with tens of CVs; the reviewer (the solo developer) will see
  every suggestion.

**Option C — don't grow the table; map free text to nearest existing skill via embeddings, drop
what doesn't match**
- Real-world analogue: closest to **Eightfold's** marketed approach and to the *semantic-matching
  half* of LinkedIn's pipeline (two-tower BERT) — but, importantly, **no platform researched runs
  this as the *entire* strategy with zero taxonomy growth**. LinkedIn runs embedding-matching
  *alongside* a taxonomy that keeps growing via the discovery pipeline; even Eightfold's own
  marketing doesn't claim to have literally stopped curating an underlying skill/ontology concept
  list.
- What breaks: this option silently discards any genuinely novel, currently-uncommon, or
  domain-specific skill that isn't near any existing canonical embedding — for a resume-screening
  ATS, that specifically risks dropping the very things that make a candidate distinctive (a niche
  library, a specific tool, a real but recently-emerged skill), which directly contradicts the
  product's stated purpose of accurately screening candidates. It also introduces the operational
  cost of running/maintaining an embedding model + vector similarity search for a system with
  "tens of CVs" — engineering overhead disproportionate to the data volume, and unnecessary since
  Gemini itself (already used for parsing) can do free-text semantic comparison inline without a
  separate vector index.

---

## Recommendation for this capstone project

**Go with Option A, not B, but treat this as "B in spirit."** The distinction between A and B
turns out to be smaller than it looks in practice: at capstone scale (tens of CVs, solo
developer, no dedicated taxonomist), a `SkillSuggestion` staging table (B) and an
`isVerified: false` flag directly on `Skill` (A) do the *same job* — keep the canonical/trusted set
separate from freshly-seen candidates until a human looks at them — the only real difference is
whether that separation is a second table or a boolean column. Given `Skill` already exists with
`name` unique + `synonyms Json` (`libs/backend/database/prisma/schema.prisma:271-280`), adding
`isVerified Boolean @default(false)` is a one-line migration versus standing up a whole parallel
model with its own promotion workflow — and the research shows the *industry pattern being
approximated* (LinkedIn/Lightcast/ESCO: stage → human review → promote) doesn't actually require
the staging area to be schema-separate; it requires that unreviewed and reviewed skills be
**queryable separately**, which a boolean flag does just as well as a second table, at a fraction
of the implementation cost. Recommend A over B specifically because B's only real advantage
(keeping `Skill` "pristine by construction") doesn't matter here — nothing else in the current
codebase actually reads from `Skill`/`JobPostingSkill` for real work (confirmed:
`apps/api/src/app/cv-screenings/processors/cv-screenings.processor.ts:84` fetches
`jobPostingSkills.include.skill` but the processor only ever reads `parsedRequirements`
downstream — `jobPostingSkills` is fetched and discarded, matching what the prompt described).

**Reject Option C outright for this project.** Every credible primary source in this research
(LinkedIn, Lightcast, ESCO) keeps growing a discrete taxonomy rather than replacing it with
pure embedding-matching, even at massive scale and with far more engineering resources than a
solo capstone has. At tens-of-CVs scale, adding a vector-similarity layer is solving a problem
("taxonomy growing too large to browse/manage") that doesn't exist yet, while introducing a new
failure mode (silently dropping genuinely novel skills) that actively hurts the product's stated
purpose. If Gemini is already parsing text, asking it to also suggest "is this close to any
existing Skill row" as a one-shot classification (not a standing vector index) gets most of C's
practical benefit — deduping "ReactJS" into "React" — for near-zero extra infrastructure, and can
be layered on top of Option A's review queue rather than replacing it.

**Is the developer's junk-fear well-founded or overblown?** Overblown at this scale, per the
research. The platforms that actually operate at a size where junk accumulation is a real risk
(LinkedIn: hundreds of millions of profiles feeding the discovery pipeline; GitHub: millions of
repos self-tagging) all needed dedicated automated canonicalization (edit-distance/stemming/
Jaccard dedup) or dedicated human taxonomist teams to keep it clean — neither of which a tens-of-
CVs capstone will ever produce enough volume to need. A solo developer looking at, at most, a few
dozen distinct new skill strings across the whole project's lifetime can eyeball and merge
"ReactJS"/"React.js" duplicates in a five-minute admin session; that's not a scale where the
industry's heavyweight mechanisms (reputation gates, ML dedup classifiers, governance boards) are
buying anything. The one thing worth borrowing cheaply from the research: model the alias/merge
relationship the way Stack Overflow's tag-synonym system and (implicitly) LinkedIn's alias field
do — when the admin merges "ReactJS" into "React," retarget existing `JobPostingSkill` /
CV-skill references to the canonical row rather than leaving them orphaned or requiring a
data-migration script each time. The existing `synonyms Json` field on `Skill`
(`libs/backend/database/prisma/schema.prisma:275`) is exactly the right shape for this — it just
isn't being populated/used today.

**Open questions for the main agent to resolve before implementing:**
1. Does the admin-review UI already exist anywhere in `apps/web`, or does adding `isVerified`
   require also building a new review screen? (Not checked in this pass — scoped to the taxonomy
   research question only.)
2. Should `isVerified: false` skills still be usable by the screening/matching logic (since that
   logic currently reads `parsedRequirements`/free text anyway, not `Skill` rows), or is
   `isVerified` purely a UI/filter concern? If the `Skill` table isn't actually in the screening
   hot path today, this decision may matter less than it initially appears — worth confirming
   whether Phase 1 plans (`docs/migration-roadmap.md`) intend to route screening through `Skill`
   at all before investing further in its correctness.

---

## Sources (deduped)

Primary / official:
- https://www.linkedin.com/blog/engineering/data/building-maintaining-the-skills-taxonomy-that-powers-linkedins-skills-graph
- https://www.linkedin.com/blog/engineering/skills-graph/extracting-skills-from-content
- https://engineering.linkedin.com/blog/2023/extracting-skills-from-content-to-fuel-the-linkedin-skills-graph
- https://www.linkedin.com/blog/engineering/skills-graph/how-we-mapped-the-skills-genome-of-emerging-jobs
- https://www.linkedin.com/blog/engineering/skills-graph/building-linkedin-s-skills-graph-to-power-a-skills-first-world
- https://lightcast.io/open-skills
- https://lightcast.io/open-skills/faqs
- https://lightcast.io/resources/blog/open-skills-taxonomy
- https://esco.ec.europa.eu/en/classification/skill_main
- https://esco.ec.europa.eu/en/about-esco/escopedia/escopedia/esco-versions
- https://digital-skills-jobs.europa.eu/en/latest/news/new-version-european-classification-skills-competences-occupations-and-qualifications
- https://www.onetcenter.org/taxonomy.html
- https://www.onetcenter.org/dataUpdates.html
- https://www.onetcenter.org/dl_files/Hot_Technologies_Demand.pdf
- https://developer.textkernel.com/tx-platform/v9/resume-parser/api/
- https://www.textkernel.com/products-solutions/skills-intelligence/
- https://docs.affinda.com/page/resume-parser-product-guide
- https://github.blog/engineering/user-experience/topics/
- https://www.wikidata.org/wiki/Wikidata:Notability
- https://blog.workday.com/en-us/2020/foundation-workday-skills-cloud.html
- https://blog.workday.com/en-us/2022/how-workday-delivering-next-generation-skills-technology-scale.html

Secondary / aggregation (used only where primary was silent, flagged inline above):
- https://www.researchgate.net/publication/306013975_Synonym_Suggestion_for_Tags_on_Stack_Overflow (Stack Overflow tag-creation/synonym reputation thresholds)
- https://www.zenml.io/llmops-database/building-and-deploying-large-language-models-for-skills-extraction-at-scale (LinkedIn skills-extraction case study aggregation)
- https://eightfold.ai/engineering-blog/ai-powered-talent-matching-the-tech-behind-smarter-and-fairer-hiring/ (Eightfold, vendor blog)
- Assorted academic/blog material on embedding-based resume-JD matching (Sentence-BERT, cosine similarity threshold framing) — no single canonical paper singled out as load-bearing; used only to confirm the "distance threshold = unknown" pattern is a known but not uniformly specified technique.

Repo files checked for grounding (not web sources):
- `e:\...\ats-platform\libs\backend\database\prisma\schema.prisma:271-317` (`Skill`, `JobPosting`, `JobPostingSkill` models)
- `e:\...\ats-platform\apps\api\src\app\cv-screenings\processors\cv-screenings.processor.ts` (confirms `jobPostingSkills` is fetched via Prisma include but only `parsedRequirements` is read downstream — the "Skill table is nearly dead" claim from the prompt is consistent with what the code does)
