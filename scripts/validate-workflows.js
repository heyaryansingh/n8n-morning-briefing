/**
 * @fileoverview Validates n8n workflow JSON files for structural correctness.
 * Checks for required fields, valid node structure, and duplicate node names.
 * @module scripts/validate-workflows
 */

const fs = require('fs');
const path = require('path');

/**
 * Directory containing workflow JSON files
 * @type {string}
 */
const workflowsDir = path.join(__dirname, '..', 'workflows');

/**
 * List of workflow JSON files to validate
 * @type {string[]}
 */
const files = fs.readdirSync(workflowsDir).filter((file) => file.endsWith('.json'));

if (files.length === 0) {
  throw new Error('No workflow JSON files found.');
}

/**
 * Validates each workflow file for:
 * - Required 'name' field
 * - Required 'nodes' array
 * - Each node has 'name' and 'type' fields
 * - No duplicate node names within a workflow
 */
for (const file of files) {
  const fullPath = path.join(workflowsDir, file);
  const workflow = JSON.parse(fs.readFileSync(fullPath, 'utf8'));

  if (!workflow.name || !Array.isArray(workflow.nodes)) {
    throw new Error(`${file} is missing a workflow name or nodes array.`);
  }

  /** @type {Set<string>} Set of node names to detect duplicates */
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

