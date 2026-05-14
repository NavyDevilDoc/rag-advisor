# IMPLEMENTATION_PLAN.md — RAG Architecture Advisor

> Living document. Detailed task trees, sequencing, and open design decisions
> for upcoming work. Updated in lockstep with [PROGRESS.md](PROGRESS.md)
> (status snapshot + session log) and [CLAUDE.md](CLAUDE.md) (frozen architecture).

---

## Strategic frame

- **Strategic ceiling:** COA 3 (cost calculator + vendor DB + code scaffolds).
  COA 4 (marketplace + consulting network) explicitly ruled out — full
  company-shaped build is out of scope.
- **Approach:** Ship polished public version (COA 1), measure traction with
  real users, decide on COA 2 / 3 from data, not gut.
- **Walk-away criterion:** Owner explicitly endorsed walking if Phase 4
  traction is weak. No sunk-cost obligation to continue.
- **Owner capacity:** ~20 hrs/week, 3-month horizon (~240 hrs total).
- **GTM stance:** Product-led, not content-led. Owner's stated preference is
  *"rather scale than talk about it."* Build for low-friction first-touch and
  maximum participation; defer account walls.

---

## Phase 4 — COA 1 · Public deploy + polish

**Goal:** Ship a polished public version of the tool that a stranger can land
on, complete, share, and that produces real usage signal we can decide Phase 5
on.

**Target launch:** 2-3 weekends from start (~30 hrs).
**Out of scope:** auth, persistence beyond `localStorage`, server-side state,
LLM cost-recovery, vendor pricing. All of those wait for Phase 5+.

### 4.1 — Railway deploy ✅ (2026-05-14)

- [x] GitHub repo created: https://github.com/NavyDevilDoc/rag-advisor (public, MIT, 6 topic tags)
- [x] Initial commit includes SlowAPI rate limiting (20/hour per IP, X-Forwarded-For aware) — smoke-tested locally at 2/hour producing 200/200/429
- [x] **Builder = Dockerfile** (multi-stage: `node:20-slim` build → `python:3.12-slim` runtime). Switched from Nixpacks after two failures around mixed Node+Python toolchain; see PROGRESS.md session log for the trail.
- [x] Deployed via Railway dashboard "Deploy from GitHub repo"
- [x] `ANTHROPIC_API_KEY` set in Railway env vars
- [x] Healthcheck path + restart policy configured in `railway.json`
- [x] Wizard verified end-to-end via screenshot (Close Call edge case + AI Reasoning rendering correctly)
- [x] curl smoke test of `/health`, `/api/analyze`, `/api/evaluate-pipeline` against deployed URL — all green at https://rag-advisor-production.up.railway.app (2026-05-14)

**Open design questions (deferred, not blocking):**
- Should `MODEL` become an env var so we can A/B Sonnet 4.6 vs Haiku 4.5 in
  production without redeploys? Leaning yes — pulls model selection out of code.
  Worth adding when we first want to experiment with cost.

### 4.2 — Custom domain

- [ ] Pick name. Candidates so far: `ragsherpa.dev`, `pickyourrag.com`,
      `rag-advisor.dev`, `ragstack.dev`, `ragdecision.com`. (Owner to choose.)
- [ ] Register via Cloudflare Registrar or Namecheap (Cloudflare = at-cost pricing)
- [ ] Configure DNS to Railway (CNAME or `A` records per Railway docs)
- [ ] Force HTTPS, verify cert provisioned automatically by Railway
- [ ] Add `www` → apex redirect (or apex → `www`, owner preference)

**Open:** Will owner want a `.com` for legitimacy, or is `.dev` fine for a
technical audience? `.dev` is cheaper and signals "for developers."

### 4.3 — Brand + SEO basics (mostly done)

- [x] Favicon — `frontend/public/favicon.svg`, three-dot mark (green/purple/orange representing the three RAG paradigms) on the brand slate background. SVG-only is sufficient in 2026; all current browsers support SVG favicons.
- [x] `<title>` + meta description in [frontend/index.html](frontend/index.html)
- [x] Open Graph tags (8 total: `og:type`, `og:url`, `og:title`, `og:description`, `og:image`, `og:image:width`, `og:image:height`, `og:image:alt`)
- [x] Twitter card tags (`summary_large_image` variant)
- [x] OG image build script — `scripts/build_og_image.py` (PEP 723 inline-deps, runs via `uv run scripts/build_og_image.py`). Reads `frontend/og-source.png` → outputs `frontend/public/og-image.png` at 1200×630.
- [ ] **Pending: drop the source screenshot at `frontend/og-source.png`, run the script, commit the generated `og-image.png`**
- [ ] `robots.txt` allowing all (deferred — small task, batch with Sprint 3 launch prep)
- [ ] `sitemap.xml` — just `/`, `/methodology`, `/privacy` (deferred to Sprint 2 alongside those pages)

### 4.4 — Landing page ✅ (2026-05-14)

Current state: `RAGAdvisor` renders the wizard as the entire page, no preamble.
We need a marketing hero above it explaining what this is, who it's for, and
what they'll get.

- [ ] New `frontend/src/components/Landing.jsx` (or refactor into `pages/Home.jsx`
      + `pages/Methodology.jsx` if we want light routing)
- [ ] Hero: headline ("Find your optimal RAG architecture in 12 questions"), subhead, CTA button
- [ ] Three-card "what you get": fit scores, deployment recommendation, AI-generated reasoning
- [ ] Sample-result screenshot (zoomed snippet of the AI Reasoning panel, ideally)
- [ ] Trust signal row: "Curated by [name], evaluates 5 RAG paradigms across 13–18 pipeline stages each"
- [ ] "Start the assessment" CTA → scrolls to or routes to the wizard

**Open design questions:**
- One-page (landing on top, wizard below, scroll) vs two-page with routing
  (`/` landing, `/assess` wizard)? **Leaning one-page** — simpler, no router
  added, landing acts as a hero for the embedded wizard. Decide before
  starting 4.4.
- Should the wizard load lazily so the landing page is super fast TTFB?
  Probably yes; React.lazy + Suspense around `RAGAdvisor`.

### 4.5 — Methodology / about page ✅ (2026-05-14, with `[TODO]` bio for owner)

- [ ] Long-form write-up of the scoring weights — for each of the 12 questions,
      explain what drives which architecture and why. ~1500 words.
- [ ] Pipeline data provenance: where the stage data comes from, when it was
      last updated, what's intentionally opinionated
- [ ] Short owner bio + "why I built this"
- [ ] Link to GitHub repo (if making public)
- [ ] Note that AI Reasoning + Pipeline Evaluation use `claude-sonnet-4-6`

**Note:** This is the single most important page for credibility. A CTO
deciding whether to trust the recommendation will read this. Spend real
writing effort here.

### 4.6 — `localStorage` persistence ✅

- [x] In `RAGAdvisor.jsx`, `useEffect` writes `{version: 1, step, answers}` to `localStorage` on every change to step or answers
- [x] On mount, lazy `useState` initializers restore from `localStorage` if present, validating the data shape and clamping `step` to a valid range
- [x] `handleReset` clears `localStorage` so Start Over truly resets
- [x] `version: 1` key included so future schema changes can invalidate stale data cleanly

### 4.7 — Shareable results link ✅

- [x] New util `frontend/src/utils/shareLink.js` — `encodeAnswers`, `decodeAnswers`, `buildShareUrl`, `parseAnswersFromHash`. Encoding is base64url-encoded JSON in the URL hash (Option A); ~200 chars, future-proof against question changes.
- [x] Validation against the known answer enums (from `STEPS`) defends against tampering / stale links — decoded payload must have every required question with a valid value or the URL is ignored.
- [x] `RAGAdvisor.jsx` hydrates from URL hash first, then `localStorage`, then defaults. A valid share link jumps directly to the results page (`step = STEPS.length`).
- [x] `handleReset` also clears the hash via `history.replaceState` so Start Over truly starts over (not back to the shared result).
- [x] "Copy share link" button as a right-aligned footer line inside the hero card. Uses `navigator.clipboard.writeText` with a `window.prompt` fallback for non-secure-origin / permission-denied cases. Shows "Copied" feedback for 2 seconds.

### 4.8 — Print-to-PDF stylesheet ✅ (2026-05-14)

- [ ] Add `@media print` rules in a new `styles/print.css` (or inline in the
      results component if simpler)
- [ ] Hide: nav buttons, copy-link button, Start Over, feedback widget
- [ ] Page-break controls: keep hero + scores on first page, force page break
      before pipeline section
- [ ] Optimize colors for print (dark theme might burn ink; consider an inverted
      print stylesheet)
- [ ] Test in Chrome / Firefox / Safari print preview
- [ ] Verify pipeline diagram readable on Letter and A4

**Open:** Do we want a "Download PDF" button that uses browser print, or do
we want server-side rendering via Puppeteer? **Leaning browser print** — zero
server complexity, works offline, no Lambda cold-start. Owner can hit Ctrl+P
or we add a button that calls `window.print()`.

### 4.9 — Anonymous analytics ✅ scaffolded (2026-05-14, activate via env var)

- [ ] Choose analytics provider. Options:
  - Plausible (most privacy-friendly, self-hostable, ~$9/mo)
  - Umami (free if self-hosted, ~$10/mo cloud)
  - Pirsch (similar to Plausible)
  - **Leaning Plausible** — most polished, EU-based, no cookies, no GDPR banner needed.
- [ ] Add script tag to `index.html`
- [ ] Define custom events to track:
  - `wizard_start`
  - `step_complete` with `step_number`
  - `assessment_complete` with `recommendation` + `confidence`
  - `share_link_copied`
  - `pdf_print_attempted` (window.matchMedia('print') listener)
  - `feedback_submitted` with `helpful: bool`
- [ ] Set up dashboard with the five questions that matter:
  1. How many people start the wizard?
  2. What's the completion rate by step?
  3. Which architecture gets recommended most?
  4. What's the close-call rate (gap < 8)?
  5. What's the share-link copy rate?
- [ ] Document data collection in `/privacy` page

### 4.10 — Feedback widget ✅ (2026-05-14)

- [ ] Simple "Did this help? 👍 / 👎 + optional one-line text" at bottom of results
- [ ] POST to a serverless endpoint or Tally / Google Form / Plausible custom event
- [ ] **Leaning:** add a new `POST /api/feedback` endpoint that writes to a
      JSON file or queues to a Discord webhook — minimal infra, owner sees
      feedback in near-realtime
- [ ] Show "Thanks!" state after submission; don't ask again in the same session
      (sessionStorage flag)

### 4.11 — Privacy / Terms pages ✅ (2026-05-14)

- [ ] `/privacy` — what we collect (analytics, no PII, anonymous feedback), how
      Anthropic API processes answers, no retention beyond the API call,
      no third-party sale
- [ ] `/terms` — boilerplate "as-is, no warranty, this is advisory only,
      consult a real engineer before betting your company on a recommendation"
- [ ] Footer link from every page

### 4.12 — Launch

- [ ] All of 4.1–4.11 verified on deployed URL
- [ ] Pre-launch smoke test: full wizard run on mobile (iOS Safari + Android Chrome)
- [ ] Pre-launch smoke test: full wizard run with throttled connection (DevTools "Slow 4G")
- [ ] Submit to Show HN (Saturday morning EST is the recommended slot)
- [ ] Cross-post to: r/MachineLearning, r/LocalLLaMA, r/LangChain
- [ ] Personal channels: LinkedIn, Bluesky / Twitter
- [ ] Watch analytics first 48 hrs; respond to any feedback within 24 hrs
- [ ] Add a `LAUNCH_NOTES.md` file capturing what surfaced, what broke, what
      to fix in v1.1

### Phase 4 exit criteria → trigger Phase 5

Move to **Phase 5 (COA 2)** if **any** of:
- 50+ completed assessments in first 30 days post-launch
- 5+ unsolicited "this helped" responses (DMs, emails, comments, replies)
- 1+ meaningful inbound (consulting lead, paid-interest signal, conference talk invite, company asking how to deploy this internally)

**Wind down** if:
- < 20 completed assessments in 60 days, AND
- No unsolicited interest beyond friends-of-the-author

Numbers are a proposal, not data. Tighten/loosen after the actual launch
surface area is known.

---

## Phase 4 follow-ups — quality, traceability, and known bugs

Items surfaced during late Phase 4 that aren't strictly blocking launch but
are worth tracking openly. Each has a current status (`bug`, `exploration`,
`resolved`) and a recommendation about timing.

### 4.13 — Robust results review

**Status:** exploration. Important. Not a launch blocker but should ship
before serious users start basing decisions on the recommendations.

**The problem.** The 12-question scoring engine is hand-tuned weights. We
trust the recommendations because the author wrote them, not because anything
has actually validated them. A weight typo or a missing edge case could be
silently routing users to the wrong architecture. Before this tool becomes a
$50k-budget-defending artifact, it needs evidence behind it.

**Approaches, in increasing order of investment:**

1. **Fixture tests** (1 evening). A `frontend/src/data/__tests__/scoring.test.js`
   with ~15 hand-curated scenarios — each is a `{answers, expected: {recommendation, confidence, deployment}}`
   tuple. Run via Vitest. Catches regressions when weights change.
   *Cheap, immediately useful, no other infrastructure needed.* Start here.

2. **Sensitivity analysis** (1 evening). A small script that programmatically
   varies one answer at a time across all 12 questions and prints the score
   deltas. Confirms each weight is doing what we think — e.g. "flipping
   `corpusChurn` from `rare` to `frequent` should drop the graph score by 6,
   raise the standard score by 3." Pair with the fixture tests as a regression
   guard.

3. **Real-world benchmark scenarios** (~2 weeks of part-time work). Curate
   10–20 published RAG cases (blog posts, conference talks, customer write-ups)
   with their actual production architecture. Encode each as a 12-answer
   scenario, run through the tool, measure hit rate. Genuine empirical validation.
   This is the gold standard.

4. **Expert review batches** (ongoing). Periodically send 5–10 anonymized
   results to RAG practitioners ("did the tool get this right? what would
   you have picked?"). Aggregate the disagreement pattern. Update weights or
   add edge-case bullets based on what surfaces.

5. **In-app A/B testing** (Phase 5+ work). Once the user base is large
   enough, show two slightly different recommendations to different
   cohorts and use the feedback-thumb ratio as a signal. Heavy lift; only
   worth doing at scale.

**Recommendation:** ship #1 and #2 pre-launch, schedule #3 for the first
spare weekend after launch. #4 and #5 are bigger investments worth doing
only if the tool gains real traction.

### 4.14 — Traceability capture

**Status:** exploration. Genuinely two features behind one name — user-facing
and admin-facing.

**The problem.** Right now the results page shows the *output* but not the
*input* — the user has to scroll back up or restart the wizard to remember
what they answered. And on the admin side, the feedback payload includes the
recommendation + confidence but not the 12 answers — so if a thumbs-down comes
in, the author can't see what the user actually said to get there.

**Two parts, related but separable:**

**A. User-facing — "Your inputs" summary on the results page** (~3 hrs).
- New `components/InputsSummary.jsx` rendered on the results page, probably between the AI Pipeline Evaluation and the Why-This-Architecture sections.
- Compact 12-row layout: question label · their answer in plain English.
- Reuses the existing `ANSWER_PHRASING` translation map from `backend/prompt.py`
  (port it to the frontend, or duplicate — small enough either way).
- Optional v2: each row has an "edit" link that jumps them back to that
  step. Probably defer to v2; the simple read-only summary is the value.

**B. Admin-facing — answers in feedback payload** (~1 hr).
- Extend `FeedbackRequest` in `backend/models.py` to include an optional
  `answers: Optional[Answers] = None` field.
- Update `FeedbackWidget.jsx` to include the answers in the POST body.
- Update the Discord webhook formatter to optionally render them.
- Update `/privacy` to disclose that feedback submissions include the 12 answers.

**Recommendation:** Both are small and ship cleanly together. Worth doing
pre-launch if you have a couple of hours; otherwise schedule for the first
week post-launch. (B) is especially valuable for tuning the scoring engine
based on real complaints.

### 4.15 — Landing-page disappearance investigation

**Status:** ⚠️ bug, root-caused, **fix applied** in the same commit that adds
this entry.

**Symptom.** After the `/` ↔ `/assessment` URL split, visiting the bare
domain (`rag-advisor-production.up.railway.app/`) redirects directly to
`/assessment` instead of showing the landing page. Any returning user — i.e.
anyone who has ever interacted with the wizard — cannot reach the landing
again from any link or URL bar entry.

**Root cause.** The auto-redirect in `App.jsx` has two arms:

```js
// before
if (path === "/" && (parseAnswersFromHash() || hasSavedProgress())) {
  navigate(`/assessment${window.location.hash}`, { replace: true });
}
```

The intent of the `hasSavedProgress()` arm was "returning users with
in-progress wizards should skip the landing." But `hasSavedProgress()`
returns true for **any** localStorage data — including completed
assessments from prior sessions. So every visit by a user who has ever
used the tool gets bounced to `/assessment`.

**Fix.** Drop the `hasSavedProgress()` arm. Keep only the share-link-hash
arm (which has unambiguous semantics: "I followed someone else's link to
see their result, take me there").

```js
// after
if (path === "/" && parseAnswersFromHash()) {
  navigate(`/assessment${window.location.hash}`, { replace: true });
}
```

**Effect of the fix.**

- Returning users now see the landing on bare-URL visits to `/`.
- Their wizard progress isn't lost — `RAGAdvisor.jsx` still restores state
  from localStorage when they navigate to `/assessment` (via the Start CTA
  or any direct path).
- Share-link visitors still bypass the landing and go straight to the result.
- The browser Back button now correctly returns to the landing from
  `/assessment`.

**What we gave up.** The "returning users skip onboarding" pattern: someone
who used the tool yesterday and visits the bare URL today now sees the
landing instead of being dropped directly into the wizard. That's the right
trade — visiting `/` is a deliberate "I want home" gesture, and the cost of
one extra Start-button click for resumption is much smaller than the cost of
making the landing unreachable.

---

## Phase 5 — COA 2 · Accounts + Save + Share + Export (conditional)

**Trigger:** Phase 4 exit criteria met.
**Estimated time:** 1-2 months at 20 hrs/week.

### High-level scope

- Passwordless email auth (magic links via Resend)
- Postgres (Supabase if we want auth+db+RLS bundled, or Railway managed PG)
- Persistent assessments per user
- Team workspaces with multi-user editing + comment threads per question
- Branded PDF export with executive-summary first page
- Mermaid + draw.io diagram exports of the pipeline
- Public read-only share URLs (like Notion shares — slug-based, not hash-based)

### Open design questions (revisit when we start Phase 5)

- **Free tier vs paid from day one?** Two camps:
  - Free at launch, monetize later → maximizes Phase 5 signal collection
  - $9/mo individual + $29/mo team from day one → forces revenue conversation early
- **Auth provider:** Supabase Auth (bundled with the DB we'd likely choose anyway) vs Clerk vs roll-our-own with Resend
- **Workspace model:** account-per-email vs workspace-with-invites. Probably workspace from the start — adding it later is migration hell.
- **PDF rendering:** client-side via `window.print` (matches Phase 4 approach) or server-side via Puppeteer/Playwright (better consistency, more infra)
- **LLM cost recovery:** free tier creates a unit-economics question. At what completion rate does each free user cost us > $0.10 in LLM calls?

### Phase 5 exit criteria → trigger Phase 6

Move to **Phase 6 (COA 3)** if:
- 10+ paying teams ($X/mo each, threshold TBD)
- Active feature requests asking for cost numbers and code scaffolds

Tighten when we have real Phase 5 pricing data.

---

## Phase 6 — COA 3 · Cost calculator + Vendor DB + Code scaffolds (conditional)

**Trigger:** Phase 5 has paying customers and explicit demand for these features.
**Estimated time:** 3-6 months, possibly a second engineer.

### High-level scope

The "killer feature" tier per owner. What makes this commercially serious:

- **Cost calculator.** Given corpus size + query volume + recommended pipeline →
  estimated monthly $ across 2-3 vendor stacks. Numbers refreshed quarterly,
  dated transparently.
- **Vendor pricing database.** Manually curated, transparent, dated. Pinecone,
  Qdrant Cloud, Weaviate Cloud, OpenAI, Anthropic, Cohere, Neo4j Aura, AWS
  Textract, Azure Document Intelligence, etc. "Last verified: YYYY-MM-DD"
  on every entry.
- **Build-vs-buy table per stage.** For each pipeline stage, show "use this
  managed service ($X/mo) or self-host (Y engineer-weeks + $Z infra/mo)."
- **"Generate starter repo" button.** Claude generates a GitHub template per
  recommended architecture: FastAPI + chosen vector DB + chosen embedding +
  Anthropic Claude + RAGAS eval suite pre-wired. Real code, real tests,
  deploys cleanly.
- **Compliance filter.** Flag user requirements (SOC2, HIPAA, FedRAMP, GDPR) →
  filter vendor recommendations to compliant options only.

### Risks specific to Phase 6

- Keeping vendor pricing fresh is a grind. Stale prices destroy credibility.
  Need a quarterly audit ritual or it slowly rots.
- Code-scaffold quality has to be high. Buggy generated repos destroy the
  "professional tool" brand fast.
- This phase actually justifies $99–999/mo pricing tiers, but only if the
  underlying data is durable and the scaffolds are best-in-class.

---

## Tracked deferred items (cross-phase)

- **`pyproject.toml` migration** — would let `uv run` work cross-platform
  without the Windows-specific venv path hack in `package.json`. Low
  priority unless we get a non-Windows contributor or want to publish the
  backend as installable.
- **Archive legacy `.jsx` files** at project root once Phase 4 deploys
  cleanly and we've confirmed nothing imports from them.
- **Test suite.** We have zero automated tests. Acceptable for prototype;
  unacceptable for Phase 5+. Add at least: scoring engine unit tests
  (Vitest), API smoke tests (pytest + httpx). Track here, schedule for
  early Phase 5.
- **Pydantic v2 strict mode** if we add untrusted external inputs (e.g.,
  signed share-link payloads in Phase 5).

## Resolved (since plan first written)

- **Rate limiting** on `/api/*` endpoints — pulled into the initial Phase 4
  commit rather than left deferred. SlowAPI's `Limiter` with a custom
  `get_real_ip` key function that prefers `X-Forwarded-For` (set by
  Railway's proxy) over `request.client.host` (the proxy itself). 20/hour
  per IP per endpoint. `/health` left unlimited so Railway's healthcheck
  isn't throttled. Verified locally: 3 requests at a 2/hour test limit
  produced `200, 200, 429` as expected.

---

## Decision log (forward-looking design decisions)

Decisions made for upcoming work but not yet implemented. When implemented,
move to the CLAUDE.md change log if it's an architectural choice, or to a
PROGRESS.md session log entry if it's tactical.

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-05-13 | Strategic ceiling = COA 3 | Owner doesn't have capacity for a full company-shaped build (COA 4). Cost calculator + vendor DB + code scaffolds is the durable feature set worth optimizing for. |
| 2026-05-13 | Phase 4 = ~30 hrs, 2-3 weekends | Real budget tied to owner's 20 hrs/week × 3-month horizon. Leaves 200+ hrs for whichever Phase 5+ direction the data points to. |
| 2026-05-13 | Phase 4 trigger to Phase 5 = 50/5/1 (completions/thanks/inbound) | Proposal, not yet tuned to data. Re-baseline after launch. |
| 2026-05-13 | Path is product-led, not content-led | Owner's stated preference: *"rather scale than talk about it."* Implication: optimize Phase 4 for discovery + polish, not for blog content / thought leadership. |
| 2026-05-13 | No auth gate in Phase 4 | Owner's stated preference: maximum first-touch participation. Account walls go in Phase 5 only if traction justifies them. |
