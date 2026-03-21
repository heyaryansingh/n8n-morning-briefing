# Roadmap: Morning Email Intelligence Briefing

## Overview

This roadmap delivers a daily n8n automation that fetches emails from Gmail and Outlook, cross-references with calendar events, analyzes everything with Claude API, and delivers an actionable intelligence briefing to Slack, Obsidian, and email. The build order follows n8n's natural pattern: foundation assets first, then input sub-workflows, then orchestration and AI, then output formatting, then hardening, then monitoring. Each phase produces a testable n8n workflow artifact.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation** - Prompt templates, output templates, and seed Obsidian vault structure
- [ ] **Phase 2: Email Fetchers** - Gmail and Outlook sub-workflows that fetch and normalize emails
- [ ] **Phase 3: Calendar and Context Readers** - Calendar sub-workflows and Obsidian context reader for continuity
- [ ] **Phase 4: AI Analysis Orchestrator** - Main workflow that sends data to Claude API for analysis
- [ ] **Phase 5: Digest Builder and Delivery** - Format and deliver briefing to Slack, Obsidian, and email
- [ ] **Phase 6: Reliability and Scheduling** - Error handling, retries, dedup, scheduling, weekend mode
- [ ] **Phase 7: Monitoring and End-to-End Testing** - Ralph loop monitoring and full pipeline validation

## Phase Details

### Phase 1: Foundation
**Goal**: All prompt templates, output format templates, and Obsidian vault seed files exist so downstream phases can reference them
**Depends on**: Nothing (first phase)
**Requirements**: None directly (infrastructure that enables all other phases)
**Success Criteria** (what must be TRUE):
  1. System prompt and analysis prompt templates exist as reusable assets in the project
  2. Obsidian vault has a morning-briefings/ directory with action-items.md and ongoing-threads.md seed files
  3. Output format templates (Slack Block Kit, Obsidian markdown, HTML email) exist and can be referenced by digest builder
**Plans**: TBD

Plans:
- [ ] 01-01: Create prompt templates, output templates, and seed Obsidian vault

### Phase 2: Email Fetchers
**Goal**: Two independent n8n sub-workflows reliably fetch, clean, and normalize emails from Gmail and Outlook into a common schema
**Depends on**: Phase 1
**Requirements**: FETCH-01, FETCH-02, FETCH-03, FETCH-04, FETCH-05, FETCH-06
**Success Criteria** (what must be TRUE):
  1. Gmail sub-workflow fetches emails received since last run and returns them in a normalized schema
  2. Outlook sub-workflow fetches emails received since last run and returns them in a normalized schema
  3. Both sub-workflows strip HTML, remove signatures/quoted replies, and truncate body to 2000 chars
  4. Both sub-workflows exclude sent emails and drafts
  5. If last-run timestamp is missing, both sub-workflows fall back to an 18-hour fetch window
**Plans**: TBD

Plans:
- [ ] 02-01: Build Gmail fetcher sub-workflow
- [ ] 02-02: Build Outlook fetcher sub-workflow

### Phase 3: Calendar and Context Readers
**Goal**: Sub-workflows fetch calendar events from both sources and read continuity context from Obsidian, providing the full input picture for AI analysis
**Depends on**: Phase 1
**Requirements**: CAL-01, CAL-02, CAL-03, CONT-01, CONT-02, CONT-04
**Success Criteria** (what must be TRUE):
  1. Google Calendar sub-workflow returns events for today through tomorrow noon
  2. Outlook Calendar sub-workflow returns events for the same time range
  3. Calendar events from both sources are merged and deduplicated
  4. Context reader sub-workflow reads previous day's digest, action-items.md, and ongoing-threads.md from Obsidian vault
**Plans**: TBD

Plans:
- [ ] 03-01: Build calendar fetcher sub-workflows
- [ ] 03-02: Build Obsidian context reader sub-workflow

### Phase 4: AI Analysis Orchestrator
**Goal**: Main n8n workflow calls all input sub-workflows in parallel, sends combined data to Claude API, and receives structured analysis output
**Depends on**: Phase 2, Phase 3
**Requirements**: AI-01, AI-02, AI-03, AI-04, AI-05, AI-06, AI-07, AI-08
**Success Criteria** (what must be TRUE):
  1. Orchestrator calls email and calendar sub-workflows in parallel and merges results
  2. Claude API receives email batch, calendar events, and continuity context and returns structured JSON with importance scores, action items, calendar cross-references, thread context, and executive summary
  3. If Claude API fails, system falls back to OpenAI GPT-4o, then Gemini
  4. For large inboxes, emails are batched in groups of approximately 15 and results are merged
**Plans**: TBD

Plans:
- [ ] 04-01: Build main orchestrator workflow with parallel sub-workflow calls
- [ ] 04-02: Build Claude API analysis node with fallback chain

### Phase 5: Digest Builder and Delivery
**Goal**: Analysis output is formatted into three delivery formats and sent to Slack, Obsidian, and email, with continuity files updated
**Depends on**: Phase 4
**Requirements**: DEL-01, DEL-02, DEL-03, DEL-04, DEL-05, DEL-06, CONT-03, CONT-05, CONT-06
**Success Criteria** (what must be TRUE):
  1. Full 7-section markdown digest is written to Obsidian vault with YAML frontmatter and wikilinks to previous day
  2. Compact Slack Block Kit message is sent with emoji priority indicators and top 5 priority emails
  3. HTML email digest is sent with date and urgent item count in subject line
  4. action-items.md is updated: unresolved items carried forward, stale items (3+ days) flagged, completed items older than 7 days auto-cleaned
  5. ongoing-threads.md is updated with current thread tracking data
**Plans**: TBD

Plans:
- [ ] 05-01: Build Obsidian digest writer and continuity file updater
- [ ] 05-02: Build Slack and email delivery nodes

### Phase 6: Reliability and Scheduling
**Goal**: Workflow runs automatically on schedule with error handling, retries, dedup, and weekend mode so it works unattended every morning
**Depends on**: Phase 5
**Requirements**: REL-01, REL-02, REL-03, REL-04, REL-05, REL-06, SCHED-01, SCHED-02, SCHED-03
**Success Criteria** (what must be TRUE):
  1. Workflow triggers at 9:00 AM Eastern daily via cron
  2. Failed email fetches retry 2x with 30s delay; partial digest is delivered if one source fails
  3. If both email sources fail, a Slack alert is sent instead of a digest
  4. Workflow skips execution if today's digest already exists in Obsidian
  5. Weekend mode raises importance threshold to 8+ and suppresses newsletters from executive summary
**Plans**: TBD

Plans:
- [ ] 06-01: Add scheduling, dedup check, and last-run tracking
- [ ] 06-02: Add retry logic, partial digest fallback, and independent delivery failure handling

### Phase 7: Monitoring and End-to-End Testing
**Goal**: A separate Ralph loop workflow monitors that the briefing ran successfully, and the full pipeline is validated end-to-end
**Depends on**: Phase 6
**Requirements**: MON-01, MON-02
**Success Criteria** (what must be TRUE):
  1. Ralph loop checks each morning that a digest was successfully created
  2. If workflow did not execute by 9:15 AM Eastern, Ralph loop sends a Slack alert
  3. Full pipeline runs end-to-end with real accounts and produces a valid digest in all three channels
**Plans**: TBD

Plans:
- [ ] 07-01: Build Ralph loop monitoring workflow
- [ ] 07-02: End-to-end pipeline validation

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 0/1 | Not started | - |
| 2. Email Fetchers | 0/2 | Not started | - |
| 3. Calendar and Context Readers | 0/2 | Not started | - |
| 4. AI Analysis Orchestrator | 0/2 | Not started | - |
| 5. Digest Builder and Delivery | 0/2 | Not started | - |
| 6. Reliability and Scheduling | 0/2 | Not started | - |
| 7. Monitoring and End-to-End Testing | 0/2 | Not started | - |
