# Morning Email Intelligence Briefing

## What This Is

An automated n8n workflow system that runs daily at 9:00 AM Eastern, fetching emails from Gmail (personal) and Outlook (JHU school), cross-referencing with Google Calendar, analyzing with Claude API, and delivering a comprehensive Daily Intelligence Briefing to Slack, Obsidian, and email. Built for Aryan Singh, a Johns Hopkins student who wants zero-effort morning inbox intelligence.

## Core Value

Wake up to a complete, actionable intelligence briefing that requires zero manual effort — with continuity across days so nothing falls through the cracks.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Fetch emails from Gmail (aryanrheasingh@gmail.com) and Outlook (asing168@jh.edu) since last run
- [ ] Fetch calendar events from Google Calendar and Outlook Calendar
- [ ] Analyze emails with Claude API (fallback: OpenAI, Gemini)
- [ ] Score importance 1-10 with content-driven hybrid weighting
- [ ] Extract specific action items with deadlines, effort, and priority
- [ ] Cross-reference emails with calendar events
- [ ] Track ongoing threads across days
- [ ] Carry forward unresolved action items from previous digests
- [ ] Deliver to Slack (workspaceofaryan) — compact Block Kit message
- [ ] Deliver to Obsidian (local vault) — full 7-section markdown briefing
- [ ] Deliver to email (aryanrheasingh@gmail.com) — HTML digest
- [ ] Maintain action-items.md and ongoing-threads.md in Obsidian vault
- [ ] Weekend mode with adjusted urgency thresholds
- [ ] Deduplication — skip if today's digest already exists
- [ ] Error handling — retry 2x, partial digest on single source failure, Slack alert on total failure

### Out of Scope

- Real-time urgent email alerts — overkill for morning digest use case
- Auto-draft replies — too much autonomy without user validation
- Weekly/monthly summaries — defer to v2
- VIP sender learning — defer to v2
- Mobile push notifications — Slack handles this

## Context

- n8n 2.4.4 installed locally on Windows 11
- Obsidian vault at C:\Users\aryan\OneDrive\Documents\Obsidian Vault
- Slack workspace: workspaceofaryan
- Full design spec at docs/superpowers/specs/2026-03-21-morning-email-briefing-design.md
- Implementation plan at docs/superpowers/plans/2026-03-21-morning-email-briefing.md
- n8n has no native Anthropic node — using HTTP Request node for Claude API
- JHU Outlook may require Azure AD app registration for OAuth2

## Constraints

- **Platform**: n8n workflows (JSON exports), runs locally on Windows
- **AI Model**: Claude API primary, must have fallback chain for reliability
- **File I/O**: Obsidian accessed via n8n Read/Write File nodes (same machine)
- **Cost**: Target ~$0.15-0.25/day for Claude API usage
- **Timezone**: All scheduling in America/New_York

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Parallel pipeline architecture | Fast, modular, independently testable | — Pending |
| Claude API via HTTP Request node | n8n has no native Anthropic node | — Pending |
| Templates inlined in Code nodes | Avoids runtime file reads, simpler workflow | — Pending |
| Content-driven importance scoring (50%) | User wants AI to judge urgency, not just sender-based | — Pending |
| Obsidian via filesystem (not REST API) | n8n runs locally, direct access is simpler | — Pending |

---
*Last updated: 2026-03-21 after initialization*
