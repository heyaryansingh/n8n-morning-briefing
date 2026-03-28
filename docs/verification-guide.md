# Verification Guide

Use this checklist after importing the workflows.

## Static Validation

Run:

```bash
npm.cmd run validate
```

Expected result: all workflow JSON files parse successfully and every node has a unique name.

## Manual Workflow Verification

1. Confirm each imported workflow opens in n8n without node-type errors.
2. Confirm the main orchestrator references the four sub-workflows correctly.
3. Run each sub-workflow with minimal test data.
4. Run the main orchestrator manually and confirm:
   - a digest markdown file is created
   - action items are updated
   - ongoing thread tracking is updated
5. Re-run the orchestrator on the same day and confirm the deduplication path exits early.

## Runtime Checks

- Confirm `docker compose up -d` starts n8n cleanly.
- Confirm the Obsidian vault mount is writable from inside the container.
- Confirm at least one AI provider key is configured.
- Confirm Slack alerts work when the primary provider fails.

## Success Criteria

- workflow JSON validates
- n8n imports all workflows cleanly
- manual execution produces a digest
- repeated execution is deduplicated
- the schedule can be activated without configuration errors
