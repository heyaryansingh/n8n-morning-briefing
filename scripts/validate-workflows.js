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
 * Collects every node name referenced as a connection target.
 *
 * n8n stores connections as { sourceName: { main: [ [ { node, type, index } ] ] } },
 * keyed and targeted by node *name*. Renaming a node without updating the
 * connections leaves a dangling reference, and n8n silently drops that branch
 * instead of failing, so the check has to happen here.
 *
 * @param {Object} connections The workflow's connections object.
 * @param {string} file Workflow filename, for error messages.
 * @returns {Set<string>} Names referenced as a target of some connection.
 */
function collectConnectionTargets(connections, file) {
  const targets = new Set();

  for (const [source, outputs] of Object.entries(connections)) {
    if (!outputs || typeof outputs !== 'object') {
      throw new Error(`${file}: connections for "${source}" is not an object.`);
    }

    for (const [outputType, branches] of Object.entries(outputs)) {
      if (!Array.isArray(branches)) {
        throw new Error(`${file}: "${source}".${outputType} is not an array.`);
      }

      for (const branch of branches) {
        // A branch may legitimately be null when an output is left unwired.
        if (branch === null) {
          continue;
        }
        if (!Array.isArray(branch)) {
          throw new Error(`${file}: a branch of "${source}".${outputType} is not an array.`);
        }

        for (const connection of branch) {
          if (!connection || !connection.node) {
            throw new Error(`${file}: "${source}" has a connection without a target node.`);
          }
          targets.add(connection.node);
        }
      }
    }
  }

  return targets;
}

/**
 * Validates each workflow file for:
 * - Required 'name' field
 * - Required 'nodes' array
 * - Each node has 'name' and 'type' fields
 * - No duplicate node names within a workflow
 * - Every connection source and target names an existing node
 * - No node is left completely unwired
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

  const connections = workflow.connections ?? {};
  if (typeof connections !== 'object' || Array.isArray(connections)) {
    throw new Error(`${file}: connections must be an object.`);
  }

  for (const source of Object.keys(connections)) {
    if (!nodeNames.has(source)) {
      throw new Error(`${file}: connections reference unknown source node "${source}".`);
    }
  }

  const targets = collectConnectionTargets(connections, file);
  for (const target of targets) {
    if (!nodeNames.has(target)) {
      throw new Error(`${file}: connections reference unknown target node "${target}".`);
    }
  }

  // A node with no inbound and no outbound connection can never run. Single-node
  // workflows are the one legitimate exception.
  if (workflow.nodes.length > 1) {
    const orphans = workflow.nodes
      .filter((node) => !targets.has(node.name) && !(node.name in connections))
      .map((node) => node.name);

    if (orphans.length > 0) {
      throw new Error(`${file}: unwired node(s): ${orphans.join(', ')}.`);
    }
  }

  console.log(
    `OK ${file}: ${workflow.nodes.length} nodes, ${Object.keys(connections).length} wired`
  );
}

console.log(`Validated ${files.length} workflow files.`);

