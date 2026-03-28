const fs = require('fs');
const path = require('path');

const workflowsDir = path.join(__dirname, '..', 'workflows');
const files = fs.readdirSync(workflowsDir).filter((file) => file.endsWith('.json'));

if (files.length === 0) {
  throw new Error('No workflow JSON files found.');
}

for (const file of files) {
  const fullPath = path.join(workflowsDir, file);
  const workflow = JSON.parse(fs.readFileSync(fullPath, 'utf8'));

  if (!workflow.name || !Array.isArray(workflow.nodes)) {
    throw new Error(`${file} is missing a workflow name or nodes array.`);
  }

  const nodeNames = new Set();
  for (const node of workflow.nodes) {
    if (!node.name || !node.type) {
      throw new Error(`${file} contains a node without a name or type.`);
    }
    if (nodeNames.has(node.name)) {
      throw new Error(`${file} contains duplicate node name: ${node.name}`);
    }
    nodeNames.add(node.name);
  }

  console.log(`OK ${file}: ${workflow.nodes.length} nodes`);
}

console.log(`Validated ${files.length} workflow files.`);

