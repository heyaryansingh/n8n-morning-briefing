# Morning Email Briefing Setup Guide

## Prerequisites

- Docker Desktop or a local n8n installation
- one Gmail or Google Workspace account
- one Outlook or Microsoft 365 account
- one Anthropic, OpenAI, or Gemini API key
- a Slack workspace and target channel
- an Obsidian vault path or the included `demo/obsidian-vault`

## Step 1: Import Workflows

Open n8n at `http://localhost:5678` and import in this order:

1. `workflows/gmail-fetcher.json`
2. `workflows/outlook-fetcher.json`
3. `workflows/calendar-fetcher.json`
4. `workflows/obsidian-context-reader.json`
5. `workflows/main-orchestrator.json`

Import the main orchestrator last because it references the sub-workflows.

## Step 2: Configure Credentials

Create the relevant credentials in n8n for:

- Gmail OAuth2
- Microsoft Outlook OAuth2
- Google Calendar OAuth2
- Anthropic or OpenAI or Gemini API access
- Slack bot access

Use the standard n8n OAuth callback URL:

`http://localhost:5678/rest/oauth2-credential/callback`

## Step 3: Configure the Vault Path

The Docker setup mounts `/data/obsidian-vault` inside the container. For a quick demo, leave `OBSIDIAN_VAULT_PATH=./demo/obsidian-vault` in `.env`.

For a real vault, point `OBSIDIAN_VAULT_PATH` to your host machine's Obsidian vault path before starting Docker.

## Step 4: Test

1. Manually execute the main orchestrator.
2. Verify a digest file appears in `Email Digests/YYYY-MM-DD.md`.
3. Verify action items and ongoing threads files are updated.
4. Re-run the orchestrator to confirm the deduplication branch exits early.
5. Activate the schedule trigger once manual execution looks correct.

## Troubleshooting

- If OAuth fails, verify the callback URL and API scopes.
- If no digest file is written, verify the Obsidian vault mount is correct.
- If Slack messages do not appear, verify the bot token and channel name.
- If provider calls fail, check the corresponding API key environment variables.

