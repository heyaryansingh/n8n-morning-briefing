#!/usr/bin/env node

/**
 * @fileoverview Updates Execute Workflow nodes in the main orchestrator
 * to use name-based workflow lookups instead of hardcoded IDs.
 * @module fix-workflow-refs
 */

'use strict';

const fs = require('fs');
const path = require('path');

const wfDir = path.join(__dirname, 'workflows');
const orchPath = path.join(wfDir, 'main-orchestrator.json');

let orch;
try {
  const data = fs.readFileSync(orchPath, 'utf8');
  orch = JSON.parse(data);
  if (!orch.nodes || !Array.isArray(orch.nodes)) {
    throw new Error('Invalid workflow: missing nodes array');
  }
} catch (err) {
  console.error(`Failed to read/parse workflow: ${err.message}`);
  process.exit(1);
}

/**
 * Mapping of Execute Workflow node names to the target workflow names.
 * @type {Object.<string, string>}
 */
const workflowMappings = {
  "Fetch Obsidian Context": "Obsidian Context Reader",
  "Fetch Gmail": "Gmail Fetcher",
  "Fetch Outlook": "Outlook Fetcher",
  "Fetch Calendar": "Calendar Fetcher"
};

// Update each Execute Workflow node to use name-based lookup
for (const node of orch.nodes) {
  if (node.type === "n8n-nodes-base.executeWorkflow" && workflowMappings[node.name]) {
    node.parameters.workflowId = {
      __rl: true,
      mode: "name",
      value: workflowMappings[node.name]
    };
    console.log(`Updated: ${node.name} -> ${workflowMappings[node.name]}`);
  }
}

try {
  fs.writeFileSync(orchPath, JSON.stringify(orch, null, 2) + '\n', 'utf8');
  console.log('\nWorkflow references updated to use name-based lookup.');
} catch (err) {
  console.error(`Failed to write workflow: ${err.message}`);
  process.exit(1);
}
