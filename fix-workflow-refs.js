const fs = require('fs');
const path = require('path');

const wfDir = path.join(__dirname, 'workflows');
const orchPath = path.join(wfDir, 'main-orchestrator.json');
const orch = JSON.parse(fs.readFileSync(orchPath, 'utf8'));

// Map of Execute Workflow node names to the workflow names they should call
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

fs.writeFileSync(orchPath, JSON.stringify(orch, null, 2) + '\n', 'utf8');
console.log('\nWorkflow references updated to use name-based lookup.');
