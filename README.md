# n8n Morning Briefing

Portable n8n workflows for generating a daily morning briefing from email, calendar, and Obsidian context, with fallback across multiple LLM providers.

## MVP

- orchestrator workflow plus dedicated Gmail, Outlook, Calendar, and Obsidian context sub-workflows
- Docker-based local demo via `docker-compose`
- portable `.env` configuration instead of machine-specific paths
- workflow validation script to catch broken JSON before import

## Quick Start

```bash
copy .env.example .env
npm.cmd run validate
docker compose up -d
```

Then open `http://localhost:5678` and import the workflows from the `workflows/` directory, with `main-orchestrator.json` imported last.

## Demo Mode

By default, the Docker setup mounts `./demo/obsidian-vault` into the container so the workflows have a safe local vault path for testing. Replace `OBSIDIAN_VAULT_PATH` in `.env` when connecting a real Obsidian vault.

## Validation

```bash
npm.cmd run validate
```

This checks that each workflow JSON file parses correctly and that every node has a unique name and a declared n8n node type.

## Files

- `workflows/`: importable n8n workflow JSON files
- `docs/setup-guide.md`: setup instructions
- `docs/verification-guide.md`: manual verification checklist
- `demo/obsidian-vault/`: local demo vault mount

