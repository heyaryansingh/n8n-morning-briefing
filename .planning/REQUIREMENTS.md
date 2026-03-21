# Requirements: Morning Email Intelligence Briefing

**Defined:** 2026-03-21
**Core Value:** Zero-effort morning intelligence briefing with cross-day continuity

## v1 Requirements

### Email Fetching

- [ ] **FETCH-01**: System fetches Gmail emails received since last successful run
- [ ] **FETCH-02**: System fetches Outlook emails received since last successful run
- [ ] **FETCH-03**: System normalizes emails from both sources to a common schema
- [ ] **FETCH-04**: System strips HTML, removes signatures and quoted replies, truncates body to 2000 chars
- [ ] **FETCH-05**: System excludes sent emails and drafts from analysis
- [ ] **FETCH-06**: System falls back to 18-hour fetch window if last-run timestamp missing

### Calendar Integration

- [ ] **CAL-01**: System fetches Google Calendar events for today through tomorrow noon
- [ ] **CAL-02**: System fetches Outlook Calendar events for same time range
- [ ] **CAL-03**: System merges and deduplicates calendar events from both sources

### AI Analysis

- [ ] **AI-01**: System sends email batch + calendar + context to Claude API for analysis
- [ ] **AI-02**: Claude scores each email 1-10 importance with content-driven hybrid weighting
- [ ] **AI-03**: Claude extracts specific action items with deadline, effort, priority, and context
- [ ] **AI-04**: Claude cross-references emails with calendar events
- [ ] **AI-05**: Claude identifies ongoing thread context
- [ ] **AI-06**: Claude generates 3-5 sentence executive summary
- [ ] **AI-07**: System falls back to OpenAI GPT-4o if Claude fails, then Gemini
- [ ] **AI-08**: System batches emails in groups of ~15 and merges results for large inboxes

### Digest Delivery

- [ ] **DEL-01**: System writes full 7-section markdown digest to Obsidian vault
- [ ] **DEL-02**: System sends compact Block Kit message to Slack (workspaceofaryan)
- [ ] **DEL-03**: System sends HTML email digest to aryanrheasingh@gmail.com
- [ ] **DEL-04**: Obsidian digest includes YAML frontmatter and wikilinks to previous day
- [ ] **DEL-05**: Slack message includes emoji priority indicators and top 5 priority emails
- [ ] **DEL-06**: Email subject includes date and count of urgent items

### Continuity

- [ ] **CONT-01**: System reads previous day's digest for comparison stats
- [ ] **CONT-02**: System maintains action-items.md with running to-do list
- [ ] **CONT-03**: System carries forward unresolved action items from previous digests
- [ ] **CONT-04**: System maintains ongoing-threads.md tracking multi-message conversations
- [ ] **CONT-05**: System flags stale action items (3+ days unactioned)
- [ ] **CONT-06**: System auto-cleans completed items older than 7 days

### Reliability

- [ ] **REL-01**: System retries failed email fetches 2x with 30s delay
- [ ] **REL-02**: System delivers partial digest if one email source fails
- [ ] **REL-03**: System sends Slack alert if both email sources fail
- [ ] **REL-04**: System skips execution if today's digest already exists (dedup)
- [ ] **REL-05**: System updates .last-run.txt only after successful delivery
- [ ] **REL-06**: Each delivery channel fails independently (one failure doesn't block others)

### Scheduling

- [ ] **SCHED-01**: Main workflow triggers at 9:00 AM Eastern daily
- [ ] **SCHED-02**: Weekend mode raises importance threshold to 8+ for priority emails
- [ ] **SCHED-03**: Weekend mode suppresses newsletters from executive summary

### Monitoring

- [ ] **MON-01**: Ralph loop checks that digest ran successfully each morning
- [ ] **MON-02**: Ralph loop alerts via Slack if workflow didn't execute by 9:15 AM

## v2 Requirements

### Intelligence

- **INT-01**: VIP sender learning from user behavior over time
- **INT-02**: Weekly/monthly digest summaries
- **INT-03**: Auto-draft replies for routine emails

### Delivery

- **DEL-07**: Mobile push notifications
- **DEL-08**: Real-time urgent email alerts

## Out of Scope

| Feature | Reason |
|---------|--------|
| Interactive Slack checkboxes | Requires full Slack app with interaction endpoint — too complex for v1 |
| Supabase storage | No database needed — Obsidian files are sufficient |
| Custom web dashboard | Slack + Obsidian + email covers all use cases |
| Email auto-responses | Too much autonomy without user validation |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FETCH-01 | Phase 2 | Pending |
| FETCH-02 | Phase 2 | Pending |
| FETCH-03 | Phase 2 | Pending |
| FETCH-04 | Phase 2 | Pending |
| FETCH-05 | Phase 2 | Pending |
| FETCH-06 | Phase 2 | Pending |
| CAL-01 | Phase 3 | Pending |
| CAL-02 | Phase 3 | Pending |
| CAL-03 | Phase 3 | Pending |
| CONT-01 | Phase 3 | Pending |
| CONT-02 | Phase 3 | Pending |
| CONT-04 | Phase 3 | Pending |
| AI-01 | Phase 4 | Pending |
| AI-02 | Phase 4 | Pending |
| AI-03 | Phase 4 | Pending |
| AI-04 | Phase 4 | Pending |
| AI-05 | Phase 4 | Pending |
| AI-06 | Phase 4 | Pending |
| AI-07 | Phase 4 | Pending |
| AI-08 | Phase 4 | Pending |
| DEL-01 | Phase 5 | Pending |
| DEL-02 | Phase 5 | Pending |
| DEL-03 | Phase 5 | Pending |
| DEL-04 | Phase 5 | Pending |
| DEL-05 | Phase 5 | Pending |
| DEL-06 | Phase 5 | Pending |
| CONT-03 | Phase 5 | Pending |
| CONT-05 | Phase 5 | Pending |
| CONT-06 | Phase 5 | Pending |
| REL-01 | Phase 6 | Pending |
| REL-02 | Phase 6 | Pending |
| REL-03 | Phase 6 | Pending |
| REL-04 | Phase 6 | Pending |
| REL-05 | Phase 6 | Pending |
| REL-06 | Phase 6 | Pending |
| SCHED-01 | Phase 6 | Pending |
| SCHED-02 | Phase 6 | Pending |
| SCHED-03 | Phase 6 | Pending |
| MON-01 | Phase 7 | Pending |
| MON-02 | Phase 7 | Pending |

**Coverage:**
- v1 requirements: 36 total
- Mapped to phases: 36
- Unmapped: 0
- Phase 1 (Foundation): 0 requirements (infrastructure setup enabling all phases)
- Phase 2 (Email Fetchers): 6 requirements
- Phase 3 (Calendar and Context Readers): 6 requirements
- Phase 4 (AI Analysis Orchestrator): 8 requirements
- Phase 5 (Digest Builder and Delivery): 9 requirements
- Phase 6 (Reliability and Scheduling): 9 requirements
- Phase 7 (Monitoring and End-to-End Testing): 2 requirements

---
*Requirements defined: 2026-03-21*
*Last updated: 2026-03-21 after roadmap creation*
