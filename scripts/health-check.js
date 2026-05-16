#!/usr/bin/env node
/**
 * Health check utility for n8n morning briefing workflow.
 * Validates workflow configuration and dependency availability.
 *
 * Usage:
 *   node scripts/health-check.js
 */

const fs = require('fs');
const path = require('path');

const WORKFLOW_FILE = path.join(__dirname, '..', 'morning-briefing-workflow.json');

/**
 * Check if workflow file exists and is valid JSON
 */
function checkWorkflowFile() {
  console.log('🔍 Checking workflow file...');

  if (!fs.existsSync(WORKFLOW_FILE)) {
    console.error('❌ Workflow file not found');
    return false;
  }

  try {
    const content = fs.readFileSync(WORKFLOW_FILE, 'utf8');
    const workflow = JSON.parse(content);

    if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
      console.error('❌ Invalid workflow structure: missing nodes array');
      return false;
    }

    if (!workflow.connections) {
      console.error('❌ Invalid workflow structure: missing connections');
      return false;
    }

    console.log(`✅ Workflow file valid (${workflow.nodes.length} nodes)`);
    return true;
  } catch (error) {
    console.error(`❌ Workflow file parsing failed: ${error.message}`);
    return false;
  }
}

/**
 * Check required environment variables
 */
function checkEnvVariables() {
  console.log('\n🔍 Checking environment variables...');

  const required = [
    'N8N_WEBHOOK_URL',
    'EMAIL_ADDRESS',
  ];

  const optional = [
    'OPENAI_API_KEY',
    'WEATHER_API_KEY',
    'NEWS_API_KEY',
  ];

  let allRequired = true;

  for (const varName of required) {
    if (!process.env[varName]) {
      console.error(`❌ Missing required environment variable: ${varName}`);
      allRequired = false;
    } else {
      console.log(`✅ ${varName} is set`);
    }
  }

  for (const varName of optional) {
    if (!process.env[varName]) {
      console.warn(`⚠️  Optional environment variable not set: ${varName}`);
    } else {
      console.log(`✅ ${varName} is set`);
    }
  }

  return allRequired;
}

/**
 * Check node dependencies
 */
function checkDependencies() {
  console.log('\n🔍 Checking dependencies...');

  try {
    const packageJson = require('../package.json');

    if (!packageJson.dependencies) {
      console.warn('⚠️  No dependencies listed in package.json');
      return true;
    }

    const deps = Object.keys(packageJson.dependencies);
    let allInstalled = true;

    for (const dep of deps) {
      try {
        require.resolve(dep);
        console.log(`✅ ${dep} installed`);
      } catch (error) {
        console.error(`❌ ${dep} not installed`);
        allInstalled = false;
      }
    }

    return allInstalled;
  } catch (error) {
    console.error(`❌ Could not read package.json: ${error.message}`);
    return false;
  }
}

/**
 * Check workflow node types
 */
function checkNodeTypes() {
  console.log('\n🔍 Checking workflow node types...');

  try {
    const content = fs.readFileSync(WORKFLOW_FILE, 'utf8');
    const workflow = JSON.parse(content);

    const nodeTypes = new Set();
    for (const node of workflow.nodes) {
      nodeTypes.add(node.type);
    }

    console.log(`Found ${nodeTypes.size} unique node types:`);
    for (const type of nodeTypes) {
      console.log(`  - ${type}`);
    }

    return true;
  } catch (error) {
    console.error(`❌ Could not analyze node types: ${error.message}`);
    return false;
  }
}

/**
 * Generate health report
 */
function generateReport(results) {
  console.log('\n' + '='.repeat(50));
  console.log('📊 Health Check Report');
  console.log('='.repeat(50));

  const passed = results.filter(r => r.passed).length;
  const total = results.length;

  console.log(`\n${passed}/${total} checks passed\n`);

  if (passed === total) {
    console.log('✅ All checks passed! Workflow is ready to deploy.');
    process.exit(0);
  } else {
    console.log('❌ Some checks failed. Please fix the issues above.');
    process.exit(1);
  }
}

// Run all checks
const results = [
  { name: 'Workflow File', passed: checkWorkflowFile() },
  { name: 'Environment Variables', passed: checkEnvVariables() },
  { name: 'Dependencies', passed: checkDependencies() },
  { name: 'Node Types', passed: checkNodeTypes() },
];

generateReport(results);
