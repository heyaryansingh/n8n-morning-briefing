# n8n Morning Intelligence Briefing

An automated n8n workflow system that delivers a comprehensive daily intelligence briefing every morning at 9:00 AM Eastern. Fetches emails from Gmail and Outlook, cross-references with calendar events, analyzes content with AI, and delivers actionable briefings to Slack, Obsidian, and email.

## Features

- **Multi-source email aggregation**: Fetches from both Gmail and Outlook accounts
- **Calendar cross-referencing**: Links emails to relevant Google Calendar and Outlook Calendar events
- **AI-powered analysis**: Uses Claude API (with OpenAI and Gemini fallbacks) for intelligent prioritization
- **Smart importance scoring**: 1-10 scale based on content urgency, sender significance, and category
- **Action item extraction**: Specific, actionable tasks with deadlines, effort estimates, and priority levels
- **Thread continuity**: Tracks ongoing conversations across days
- **Multi-channel delivery**:
  - Slack: Compact Block Kit message to `#morning-digest`
  - Obsidian: Full 7-section markdown briefing with YAML frontmatter
  - Email: HTML digest with inline CSS
- **Weekend mode**: Adjusted urgency thresholds for weekends
- **Deduplication**: Skips if today's digest already exists
- **Error handling**: Retry logic, partial digest on single-source failure, Slack alerts on total failure

## Project Structure

```
n8n-morning-briefing/
├── workflows/
│   ├── main-orchestrator.json      # Primary workflow with all logic
│   ├── gmail-fetcher.json          # Gmail email fetching sub-workflow
│   ├── outlook-fetcher.json        # Outlook email fetching sub-workflow
│   ├── calendar-fetcher.json       # Calendar events sub-workflow
│   └── obsidian-context-reader.json # Previous digest context reader
├── prompts/
│   ├── system-prompt.md            # AI system prompt for analysis
│   └── analysis-schema.json        # JSON schema for AI output
├── templates/
│   ├── obsidian-template.md        # Obsidian digest template
│   ├── email-template.html         # HTML email template
│   └── slack-blocks.json           # Slack Block Kit template
├── docs/
│   └── setup-guide.md              # Detailed setup instructions
├── docker-compose.yml              # Docker configuration for n8n
├── .env.example                    # Environment variables template
└── README.md                       # This file
```

## Prerequisites

- n8n v2.4.4 or later (local installation or Docker)
- Gmail account with OAuth2 credentials
- Outlook account with Azure AD app registration
- Anthropic API key (Claude)
- OpenAI API key (fallback)
- Google Gemini API key (fallback)
- Slack workspace with bot app
- Obsidian vault (local filesystem access)

## Quick Start

### Option 1: Docker (Recommended)

1. Clone this repository
2. Copy `.env.example` to `.env` and fill in your credentials
3. Start n8n:
   ```bash
   docker-compose up -d
   ```
4. Open http://localhost:5678
5. Import workflows in order (see Setup Guide)

### Option 2: Local n8n Installation

1. Install n8n: `npm install -g n8n`
2. Start n8n: `n8n start`
3. Import workflows from the `workflows/` directory

## Setup

For detailed setup instructions including OAuth configuration for Gmail, Outlook, and Slack, see **[docs/setup-guide.md](docs/setup-guide.md)**.

### Import Order

Import workflows in this order (the orchestrator references the others):

1. `gmail-fetcher.json`
2. `outlook-fetcher.json`
3. `calendar-fetcher.json`
4. `obsidian-context-reader.json`
5. `main-orchestrator.json` (import LAST)

### Required Credentials

Configure these in n8n Settings > Credentials:

| Credential | Type | Purpose |
|------------|------|---------|
| Gmail OAuth2 | OAuth2 | Fetch Gmail emails |
| Microsoft Outlook OAuth2 | OAuth2 | Fetch Outlook emails |
| Google Calendar OAuth2 | OAuth2 | Fetch calendar events |
| Anthropic API | Header Auth | AI analysis (primary) |
| OpenAI API | Header Auth | AI analysis (fallback) |
| Slack OAuth2 | OAuth2 | Post to Slack |

### Environment Variables

Set these in n8n or via `.env`:

| Variable | Description | Default |
|----------|-------------|---------|
| `ANTHROPIC_API_KEY` | Anthropic API key | Required |
| `OPENAI_API_KEY` | OpenAI API key | Optional (fallback) |
| `GEMINI_API_KEY` | Google Gemini API key | Optional (fallback) |
| `SLACK_BOT_TOKEN` | Slack bot OAuth token | Required |
| `SLACK_CHANNEL` | Target Slack channel | `#morning-briefing` |
| `N8N_CLAUDE_MODEL` | Claude model to use | `claude-sonnet-4-6-20250514` |

## Usage

### Manual Execution

1. Open the **Main Orchestrator** workflow in n8n
2. Click "Execute Workflow"
3. Check outputs:
   - Obsidian vault: `Email Digests/YYYY-MM-DD.md`
   - Slack: `#morning-digest` channel
   - Email: Your inbox

### Scheduled Execution

1. Activate the workflow (toggle ON)
2. The schedule trigger runs at 9:00 AM Eastern daily
3. Deduplication prevents re-running if digest exists

### Output Locations

| Destination | Path/Channel |
|-------------|--------------|
| Obsidian | `{vault}/Email Digests/YYYY-MM-DD.md` |
| Action Items | `{vault}/Email Digests/action-items.md` |
| Ongoing Threads | `{vault}/Email Digests/ongoing-threads.md` |
| Slack | `#morning-digest` |
| Email | HTML digest to configured address |

## Verification

To verify the setup works:

1. **Test credentials**: In n8n, test each credential individually
2. **Test sub-workflows**: Execute each fetcher workflow manually
3. **Test orchestrator**: Run main-orchestrator with manual trigger
4. **Check outputs**: Verify Obsidian file, Slack message, and email

See [docs/setup-guide.md](docs/setup-guide.md) for troubleshooting tips.

## Cost Estimate

| Service | Daily Cost | Monthly Cost |
|---------|------------|--------------|
| Claude API | ~$0.15-0.25 | ~$4.50-7.50 |
| OpenAI (fallback) | ~$0.10-0.20 | ~$3-6 |
| **Total** | ~$0.15-0.25 | ~$5-8 |

## Architecture

```
Schedule Trigger (9:00 AM ET)
       │
       ▼
Setup Date Context
       │
       ▼
Check Deduplication ──────► Skip (already ran)
       │
       ▼ (No existing digest)
┌──────┴──────┬──────────────┐
│             │              │
▼             ▼              ▼
Fetch Gmail   Fetch Outlook  Fetch Calendar
│             │              │
└──────┬──────┴──────────────┘
       │
       ▼
  Merge All Data
       │
       ▼
Has Emails? ──────────────────► No Emails Digest
       │
       ▼ (Has emails)
   Claude API
       │
       ▼
Claude Success? ──► OpenAI ──► Gemini ──► Failure Alert
       │
       ▼ (Success)
Parse AI Response
       │
       ▼
┌──────┴──────┬──────────────┬──────────────┐
│             │              │              │
▼             ▼              ▼              ▼
Build         Build          Build          Build
Obsidian      Slack          Email          Action Items
Digest        Message        HTML           MD
       │
       ▼
┌──────┴──────┬──────────────┐
│             │              │
▼             ▼              ▼
Write         Send           Send
Obsidian      Slack          Email
Files         Digest         Digest
       │
       ▼
Update Last Run Timestamp
```

## License

MIT

## Support

For issues or questions, please open an issue in this repository.
