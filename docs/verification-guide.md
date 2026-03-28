# Verification Guide

This guide helps you verify that the Morning Intelligence Briefing system is set up correctly and functioning as expected.

## Pre-Flight Checklist

Before running the full workflow, verify each component individually.

### 1. Credential Verification

Open n8n at http://localhost:5678 and test each credential:

| Credential | How to Test | Expected Result |
|------------|-------------|-----------------|
| Gmail OAuth2 | Click "Test" in credential | "Connection successful" |
| Microsoft Outlook OAuth2 | Click "Test" in credential | "Connection successful" |
| Google Calendar OAuth2 | Click "Test" in credential | "Connection successful" |
| Anthropic API | Execute a simple HTTP Request | 200 OK response |
| Slack OAuth2 | Click "Test" in credential | "Connection successful" |

### 2. Sub-Workflow Tests

Test each sub-workflow individually before running the orchestrator.

#### Gmail Fetcher

1. Open the Gmail Fetcher workflow
2. Add a Code node before "Gmail - Fetch Emails" to inject test data:
   ```javascript
   return [{ json: { lastRunTimestamp: '2026-03-01T00:00:00Z' } }];
   ```
3. Execute the workflow
4. Expected: Array of normalized email objects with fields: `id`, `source`, `from`, `to`, `subject`, `body`, `date`

#### Outlook Fetcher

1. Open the Outlook Fetcher workflow
2. Add a Code node to inject test timestamp (same as above)
3. Execute the workflow
4. Expected: Array of normalized email objects with `source: 'outlook'`

#### Calendar Fetcher

1. Open the Calendar Fetcher workflow
2. Add a Code node to inject:
   ```javascript
   return [{ json: { currentDate: '2026-03-27' } }];
   ```
3. Execute the workflow
4. Expected: Array of calendar events from both Google and Outlook

#### Obsidian Context Reader

1. Open the Obsidian Context Reader workflow
2. Ensure Obsidian vault path is accessible
3. Add test input with `currentDate` and `vaultPath`
4. Execute the workflow
5. Expected: Object with `lastRunTimestamp`, `previousActionItems`, `previousDigestSummary`

### 3. Main Orchestrator Test

#### Manual Trigger Test

1. Open Main Orchestrator workflow
2. Ensure all sub-workflow references are correct:
   - Click each "Execute Workflow" node
   - Verify it points to the correct sub-workflow
3. Click "Execute Workflow"
4. Monitor execution in the canvas

#### Expected Outputs

After successful execution, verify:

| Output | Location | What to Check |
|--------|----------|---------------|
| Obsidian Digest | `Email Digests/YYYY-MM-DD.md` | 7-section markdown file with YAML frontmatter |
| Action Items | `Email Digests/action-items.md` | Updated action items list |
| Ongoing Threads | `Email Digests/ongoing-threads.md` | Thread tracking file |
| Last Run | `Email Digests/.last-run.txt` | ISO timestamp of execution |
| Slack Message | `#morning-digest` channel | Block Kit formatted message |
| Email Digest | Your inbox | HTML formatted email |

### 4. Deduplication Test

1. Run the workflow successfully once
2. Immediately run again
3. Expected: Workflow should exit early at "Already Ran Today?" check
4. To re-run: Delete today's digest file from Obsidian vault

### 5. AI Fallback Chain Test

Test the AI provider fallback chain:

1. **Claude works**: Normal execution
2. **Claude fails, OpenAI works**: Temporarily set invalid `ANTHROPIC_API_KEY`
3. **Both fail, Gemini works**: Set invalid keys for both Claude and OpenAI
4. **All fail**: Set all keys invalid; verify Slack failure alert is sent

### 6. Error Handling Tests

| Scenario | How to Test | Expected Behavior |
|----------|-------------|-------------------|
| Gmail fetch fails | Invalid Gmail credential | Continues with Outlook only |
| Outlook fetch fails | Invalid Outlook credential | Continues with Gmail only |
| Both email sources fail | Invalid both credentials | Generates "no emails" digest |
| Slack send fails | Invalid Slack token | Other outputs still work |
| Email send fails | Invalid Gmail send scope | Other outputs still work |
| Obsidian write fails | Invalid vault path | Logs error, continues |

## Scheduled Execution Verification

After verifying manual execution:

1. **Activate the workflow**: Toggle ON in n8n
2. **Check schedule**: Verify Schedule Trigger shows:
   - Expression: `0 9 * * *`
   - Timezone: America/New_York
   - Next execution: 9:00 AM ET next day
3. **Wait for scheduled run**: Check outputs the next morning
4. **Check execution history**: n8n > Executions tab

## Health Check Script

Run this quick verification after setup:

```bash
# Check n8n is running
curl -s http://localhost:5678/healthz

# Check Obsidian vault is accessible
ls -la "C:/Users/aryan/OneDrive/Documents/Obsidian Vault/Email Digests/" 2>/dev/null || echo "Vault not accessible"

# Check environment variables are set
echo "ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY:0:10}..."
echo "SLACK_BOT_TOKEN: ${SLACK_BOT_TOKEN:0:10}..."
```

## Common Issues and Solutions

### Issue: Workflow imports but shows errors

**Solution**: Import workflows in correct order. The main orchestrator must be imported last because it references the sub-workflows.

### Issue: OAuth authorization loop

**Solution**: Ensure redirect URI in Google/Azure matches exactly: `http://localhost:5678/rest/oauth2-credential/callback`

### Issue: "fs is not defined" error

**Solution**: Set `NODE_FUNCTION_ALLOW_BUILTIN=fs,path` in n8n environment or Settings > Settings > Environment Variables.

### Issue: Obsidian files not appearing

**Solution**:
1. Check vault path in workflow matches your Obsidian vault location
2. Ensure `Email Digests` folder exists in vault
3. If using Docker, verify volume mount is correct

### Issue: Slack message not posting

**Solution**:
1. Verify bot is invited to the target channel
2. Check bot has `chat:write` scope
3. Verify channel name matches (with or without `#`)

### Issue: Claude API returns 401

**Solution**:
1. Verify API key is correct
2. Check billing status at console.anthropic.com
3. Ensure `x-api-key` header is set correctly in credential

## Success Criteria

The system is working correctly when:

- [ ] Manual trigger produces all three outputs (Obsidian, Slack, Email)
- [ ] Deduplication prevents duplicate runs on the same day
- [ ] AI fallback chain works (test with invalid primary key)
- [ ] Error handling allows partial success
- [ ] Scheduled trigger activates at 9:00 AM ET
- [ ] Weekend mode adjusts thresholds on Saturday/Sunday

## Monitoring

After deployment, monitor:

1. **n8n Executions**: Check for failed runs
2. **Slack channel**: Confirm daily briefings arrive
3. **Obsidian vault**: Verify digest files are created
4. **API billing**: Monitor Claude/OpenAI usage costs
