# Morning Email Briefing — Setup Guide

## Prerequisites

- n8n installed locally (tested with v2.4.4)
- Gmail account: aryanrheasingh@gmail.com
- Outlook account: asing168@jh.edu
- Anthropic API key (console.anthropic.com)
- OpenAI API key (platform.openai.com) — fallback
- Google Gemini API key — fallback
- Slack workspace: workspaceofaryan
- Obsidian vault at `C:\Users\aryan\OneDrive\Documents\Obsidian Vault`

## Step 1: Import Workflows

Open n8n at http://localhost:5678 and import in this order:

1. `workflows/gmail-fetcher.json`
2. `workflows/outlook-fetcher.json`
3. `workflows/calendar-fetcher.json`
4. `workflows/obsidian-context-reader.json`
5. `workflows/main-orchestrator.json` (import LAST — references the others)

## Step 2: Configure Credentials

### Gmail OAuth2

1. Go to [Google Cloud Console](https://console.cloud.google.com/) > APIs & Services > Credentials
2. Create OAuth 2.0 Client ID (type: Web application)
3. Add redirect URI: `http://localhost:5678/rest/oauth2-credential/callback`
4. Enable APIs: **Gmail API** and **Google Calendar API**
5. In n8n: Settings > Credentials > Add "Gmail OAuth2"
6. Paste Client ID and Client Secret
7. Click "Connect" to authorize with aryanrheasingh@gmail.com

### Google Calendar OAuth2

- Uses the same Google Cloud project as Gmail
- In n8n: Settings > Credentials > Add "Google Calendar OAuth2"
- Same Client ID/Secret, authorize with same account

### Microsoft Outlook OAuth2

1. Go to [Azure Portal](https://portal.azure.com/) > App registrations > New registration
2. Name: "Morning Briefing"
3. Supported account types: "Accounts in any organizational directory and personal accounts"
4. Redirect URI: `http://localhost:5678/rest/oauth2-credential/callback`
5. API Permissions > Add:
   - `Mail.Read` (Delegated)
   - `Calendars.Read` (Delegated)
6. Certificates & secrets > New client secret
7. In n8n: Settings > Credentials > Add "Microsoft Outlook OAuth2"
8. Paste Application (client) ID and Client Secret
9. Click "Connect" to authorize with asing168@jh.edu

**Note:** JHU Azure AD may require admin consent. If OAuth fails, contact JHU IT.

### Anthropic API Key

1. Get API key from [console.anthropic.com](https://console.anthropic.com/)
2. In n8n: Settings > Credentials > Add "Header Auth"
3. Name: `Anthropic API`
4. Header Name: `x-api-key`
5. Header Value: your Anthropic API key

### OpenAI API Key (Fallback)

1. Get API key from [platform.openai.com](https://platform.openai.com/)
2. In n8n: Settings > Credentials > Add "Header Auth"
3. Name: `OpenAI API`
4. Header Name: `Authorization`
5. Header Value: `Bearer sk-your-key-here`

### Slack Bot

1. Go to [api.slack.com](https://api.slack.com/) > Create App > From scratch
2. App name: "Morning Briefing"
3. Workspace: workspaceofaryan
4. OAuth & Permissions > Bot Token Scopes:
   - `chat:write`
   - `channels:read`
   - `groups:read`
5. Install App to workspace
6. Copy Bot User OAuth Token
7. In n8n: Settings > Credentials > Add "Slack OAuth2"
8. Paste Bot Token
9. Create a `#morning-digest` channel and invite the bot

## Step 3: Configure Workflow References

1. Open **main-orchestrator** in n8n editor
2. For each "Execute Workflow" node, click it and select the correct sub-workflow:
   - "Fetch Obsidian Context" → select "Obsidian Context Reader"
   - "Fetch Gmail" → select "Gmail Fetcher"
   - "Fetch Outlook" → select "Outlook Fetcher"
   - "Fetch Calendar" → select "Calendar Fetcher"
3. Verify credential assignments on:
   - Gmail nodes (Gmail OAuth2)
   - Outlook nodes (Microsoft Outlook OAuth2)
   - Google Calendar node (Google Calendar OAuth2)
   - Claude API HTTP Request (Anthropic API header auth)
   - Slack node (Slack OAuth2)
4. Verify vault path in Write File nodes: `C:\Users\aryan\OneDrive\Documents\Obsidian Vault\Email Digests\`

## Step 4: Set Environment Variable (Optional)

To change the Claude model without editing the workflow:

```bash
export N8N_CLAUDE_MODEL="claude-sonnet-4-6-20250514"
```

Or set in n8n Settings > Environment Variables.

## Step 5: Test

1. **Manual trigger test:** Click "Execute Workflow" on the main orchestrator
2. **Verify outputs:**
   - Obsidian: Check `Email Digests\2026-03-21.md` exists
   - Slack: Check `#morning-digest` for message
   - Email: Check inbox for HTML digest
   - `.last-run.txt`: Check it was created/updated
3. **Verify dedup:** Re-trigger — should skip (already ran today)
4. **Activate cron:** Toggle workflow to Active

## Step 6: Verify Cron Schedule

After activating, check the Schedule Trigger node shows:
- Next execution: 9:00 AM Eastern (next day)
- Timezone: America/New_York

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Gmail auth fails | Ensure Gmail API enabled in GCP. Check redirect URI matches exactly. |
| Outlook auth fails | Check Azure AD app has correct redirect URI. JHU may need admin consent. |
| Claude API fails | Verify API key in credential. Check billing at console.anthropic.com. |
| No Obsidian file | Check vault path exists. Ensure n8n has write permissions. |
| Slack message missing | Verify bot is in the channel. Check bot token scopes. |
| Email not received | Check spam folder. Verify Gmail send permission in OAuth scope. |
| Cron not triggering | Verify workflow is Active (toggle ON). Check timezone in settings. |
| "Already ran today" | Delete today's digest file from Obsidian vault to re-run. |

## Cost Estimate

- Claude API: ~$0.15-0.25/day (sonnet, 15-30 emails)
- OpenAI fallback: ~$0.10-0.20/day (GPT-4o)
- Total: ~$5-8/month
