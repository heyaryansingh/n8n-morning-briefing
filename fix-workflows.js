/**
 * @fileoverview n8n Workflow Node Replacement Script
 * @module fix-workflows
 *
 * This script replaces credential-requiring n8n nodes with Code nodes that use
 * native HTTP fetch. This eliminates design-time credential validation errors
 * and allows the workflow to run with environment variables instead.
 *
 * @example
 * ```bash
 * node fix-workflows.js
 * ```
 */

const fs = require('fs');
const path = require('path');

/** @type {string} Path to the workflows directory */
const wfDir = path.join(__dirname, 'workflows');

/** @type {string} Path to the main orchestrator workflow JSON file */
const orchPath = path.join(wfDir, 'main-orchestrator.json');

/** @type {Object} Parsed workflow configuration object */
const j = JSON.parse(fs.readFileSync(orchPath, 'utf8'));

/**
 * Replaces a node in the workflow by name with a new node configuration.
 * Logs the replacement status to the console.
 *
 * @param {string} name - The name of the node to replace
 * @param {Object} newNode - The new node configuration object
 * @returns {void}
 */
function replaceNode(name, newNode) {
  const idx = j.nodes.findIndex(n => n.name === name);
  if (idx >= 0) {
    j.nodes[idx] = newNode;
    console.log(`Replaced: ${name}`);
  } else {
    console.log(`NOT FOUND: ${name}`);
  }
}

// 1. Replace "Fetch Obsidian Context" Execute Workflow → Code node that reads files directly
replaceNode('Fetch Obsidian Context', {
  parameters: {
    jsCode: `const fs = require('fs');
const dateCtx = $('Setup Date Context').first().json;
const vaultPath = dateCtx.vaultPath;
const digestDir = dateCtx.digestDir;
const previousDate = dateCtx.previousDate;

function readFile(p) { try { return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : ''; } catch(e) { return ''; } }

const lastRunRaw = readFile(digestDir + '/.last-run.txt');
let lastRunTimestamp = lastRunRaw.trim();
if (!lastRunTimestamp || lastRunTimestamp.length < 10) {
  const fb = new Date(Date.now() - 18*60*60*1000);
  lastRunTimestamp = fb.toISOString();
}

const actionItemsRaw = readFile(digestDir + '/action-items.md');
const prevDigestRaw = readFile(digestDir + '/' + previousDate + '.md');
const threadsRaw = readFile(digestDir + '/ongoing-threads.md');

let previousDigestSummary = '';
const sumMatch = prevDigestRaw.match(/## Executive Summary\\n\\n([\\s\\S]*?)\\n\\n---/);
if (sumMatch) previousDigestSummary = sumMatch[1].trim();

return [{ json: {
  lastRunTimestamp,
  actionItems: actionItemsRaw,
  previousDigestSummary,
  ongoingThreads: threadsRaw
}}];`
  },
  id: 'orch-fetch-context-005',
  name: 'Fetch Obsidian Context',
  type: 'n8n-nodes-base.code',
  typeVersion: 2,
  position: [880, 460],
  onError: 'continueRegularOutput'
});

// 2. Replace "Fetch Gmail" Execute Workflow → Code node (placeholder - needs OAuth)
replaceNode('Fetch Gmail', {
  parameters: {
    jsCode: `// Gmail fetch - returns empty until OAuth is configured via env vars
// To enable: set GMAIL_ACCESS_TOKEN env var
const token = $env.GMAIL_ACCESS_TOKEN || '';
if (!token) {
  return [{ json: { emails: [], count: 0, error: 'GMAIL_ACCESS_TOKEN not set' } }];
}
try {
  const lastRun = $json.lastRunTimestamp || '';
  const after = lastRun ? lastRun.split('T')[0].replace(/-/g, '/') : '';
  const q = encodeURIComponent('after:' + after + ' -from:me -in:drafts');
  const resp = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=50&q=' + q, {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const data = await resp.json();
  return [{ json: { emails: data.messages || [], count: (data.messages || []).length } }];
} catch(e) {
  return [{ json: { emails: [], count: 0, error: e.message } }];
}`
  },
  id: 'orch-fetch-gmail-006',
  name: 'Fetch Gmail',
  type: 'n8n-nodes-base.code',
  typeVersion: 2,
  position: [1100, 300],
  onError: 'continueRegularOutput'
});

// 3. Replace "Fetch Outlook" Execute Workflow → Code node
replaceNode('Fetch Outlook', {
  parameters: {
    jsCode: `// Outlook fetch - returns empty until OAuth is configured
const token = $env.OUTLOOK_ACCESS_TOKEN || '';
if (!token) {
  return [{ json: { emails: [], count: 0, error: 'OUTLOOK_ACCESS_TOKEN not set' } }];
}
try {
  const lastRun = $json.lastRunTimestamp || '';
  const filter = lastRun ? "&$filter=receivedDateTime ge " + lastRun : "";
  const resp = await fetch('https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages?$top=50' + filter, {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const data = await resp.json();
  return [{ json: { emails: data.value || [], count: (data.value || []).length } }];
} catch(e) {
  return [{ json: { emails: [], count: 0, error: e.message } }];
}`
  },
  id: 'orch-fetch-outlook-007',
  name: 'Fetch Outlook',
  type: 'n8n-nodes-base.code',
  typeVersion: 2,
  position: [1100, 500],
  onError: 'continueRegularOutput'
});

// 4. Replace "Fetch Calendar" Execute Workflow → Code node
replaceNode('Fetch Calendar', {
  parameters: {
    jsCode: `// Calendar fetch - returns empty until OAuth is configured
return [{ json: { events: [], count: 0, note: 'Calendar fetch requires OAuth - configure tokens to enable' } }];`
  },
  id: 'orch-fetch-calendar-008',
  name: 'Fetch Calendar',
  type: 'n8n-nodes-base.code',
  typeVersion: 2,
  position: [1100, 700],
  onError: 'continueRegularOutput'
});

// 5. Replace "Claude API" HTTP Request → Code node with fetch
replaceNode('Claude API', {
  parameters: {
    jsCode: `const apiKey = $env.ANTHROPIC_API_KEY || '';
if (!apiKey) {
  return [{ json: { statusCode: 401, body: { error: 'ANTHROPIC_API_KEY not set' } } }];
}
try {
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify($json.requestBody)
  });
  const body = await resp.json();
  return [{ json: { statusCode: resp.status, body } }];
} catch(e) {
  return [{ json: { statusCode: 500, body: { error: e.message } } }];
}`
  },
  id: 'orch-claude-api-012',
  name: 'Claude API',
  type: 'n8n-nodes-base.code',
  typeVersion: 2,
  position: [1980, 400],
  onError: 'continueRegularOutput'
});

// 6. Replace "OpenAI API" HTTP Request → Code node
replaceNode('OpenAI API', {
  parameters: {
    jsCode: `const apiKey = $env.OPENAI_API_KEY || '';
if (!apiKey) {
  return [{ json: { statusCode: 401, body: { error: 'OPENAI_API_KEY not set' } } }];
}
try {
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + apiKey,
      'content-type': 'application/json'
    },
    body: JSON.stringify($json.openAIBody)
  });
  const body = await resp.json();
  return [{ json: { statusCode: resp.status, body } }];
} catch(e) {
  return [{ json: { statusCode: 500, body: { error: e.message } } }];
}`
  },
  id: 'orch-openai-api-015',
  name: 'OpenAI API',
  type: 'n8n-nodes-base.code',
  typeVersion: 2,
  position: [2640, 600],
  onError: 'continueRegularOutput'
});

// 7. Replace "Gemini API" HTTP Request → Code node
replaceNode('Gemini API', {
  parameters: {
    jsCode: `const apiKey = $env.GEMINI_API_KEY || '';
if (!apiKey) {
  return [{ json: { statusCode: 401, body: { error: 'GEMINI_API_KEY not set' } } }];
}
try {
  const url = $json.geminiUrl || ('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + apiKey);
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify($json.geminiBody)
  });
  const body = await resp.json();
  return [{ json: { statusCode: resp.status, body } }];
} catch(e) {
  return [{ json: { statusCode: 500, body: { error: e.message } } }];
}`
  },
  id: 'orch-gemini-api-018',
  name: 'Gemini API',
  type: 'n8n-nodes-base.code',
  typeVersion: 2,
  position: [3300, 800],
  onError: 'continueRegularOutput'
});

// 8. Replace "Send Failure Alert" Slack → Code node
replaceNode('Send Failure Alert', {
  parameters: {
    jsCode: `const slackToken = $env.SLACK_BOT_TOKEN || '';
const channel = $env.SLACK_CHANNEL || '#morning-briefing';
if (!slackToken) {
  console.log('SLACK_BOT_TOKEN not set - skipping failure alert');
  return [{ json: { ok: false, error: 'SLACK_BOT_TOKEN not set' } }];
}
try {
  const resp = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + slackToken, 'content-type': 'application/json' },
    body: JSON.stringify({ channel, text: 'All AI providers failed for the morning briefing. Manual review required.' })
  });
  return [{ json: await resp.json() }];
} catch(e) {
  return [{ json: { ok: false, error: e.message } }];
}`
  },
  id: 'orch-slack-failure-020',
  name: 'Send Failure Alert',
  type: 'n8n-nodes-base.code',
  typeVersion: 2,
  position: [3740, 1000],
  onError: 'continueRegularOutput'
});

// 9. Replace "Send Slack Digest" Slack → Code node
replaceNode('Send Slack Digest', {
  parameters: {
    jsCode: `const slackToken = $env.SLACK_BOT_TOKEN || '';
const channel = $env.SLACK_CHANNEL || '#morning-briefing';
if (!slackToken) {
  console.log('SLACK_BOT_TOKEN not set - skipping Slack digest');
  return [{ json: { ok: false, error: 'SLACK_BOT_TOKEN not set' } }];
}
try {
  const blocks = $('Build Slack Message').first().json.slackBlocks;
  const resp = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + slackToken, 'content-type': 'application/json' },
    body: JSON.stringify({ channel, blocks, text: 'Daily Briefing' })
  });
  return [{ json: await resp.json() }];
} catch(e) {
  return [{ json: { ok: false, error: e.message } }];
}`
  },
  id: 'orch-slack-send-030',
  name: 'Send Slack Digest',
  type: 'n8n-nodes-base.code',
  typeVersion: 2,
  position: [4340, 60],
  onError: 'continueRegularOutput'
});

// 10. Replace "Send Email Digest" Gmail → Code node
replaceNode('Send Email Digest', {
  parameters: {
    jsCode: `const gmailToken = $env.GMAIL_ACCESS_TOKEN || '';
if (!gmailToken) {
  console.log('GMAIL_ACCESS_TOKEN not set - skipping email digest');
  return [{ json: { ok: false, error: 'GMAIL_ACCESS_TOKEN not set' } }];
}
try {
  const html = $('Build Email HTML').first().json.emailHtml;
  const obsData = $('Build Obsidian Digest').first().json;
  const subject = 'Daily Briefing — ' + obsData.dateFormatted + ' — ' + obsData.urgentCount + ' urgent items';
  const to = 'aryanrheasingh@gmail.com';
  
  const raw = btoa(
    'To: ' + to + '\\r\\n' +
    'Subject: ' + subject + '\\r\\n' +
    'Content-Type: text/html; charset=utf-8\\r\\n\\r\\n' +
    html
  ).replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=+$/, '');
  
  const resp = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + gmailToken, 'content-type': 'application/json' },
    body: JSON.stringify({ raw })
  });
  return [{ json: await resp.json() }];
} catch(e) {
  return [{ json: { ok: false, error: e.message } }];
}`
  },
  id: 'orch-gmail-send-031',
  name: 'Send Email Digest',
  type: 'n8n-nodes-base.code',
  typeVersion: 2,
  position: [4340, 220],
  onError: 'continueRegularOutput'
});

// Remove the now-unused "Prep Context Input" and "Prep Parallel Inputs" nodes
// and update connections so "Already Ran Today?" false → Fetch Obsidian Context directly
const removeNodes = ['Prep Context Input', 'Prep Parallel Inputs'];
j.nodes = j.nodes.filter(n => !removeNodes.includes(n.name));
delete j.connections['Prep Context Input'];
delete j.connections['Prep Parallel Inputs'];

// Fix connections: Already Ran Today? false branch → Fetch Obsidian Context
j.connections['Already Ran Today?'] = {
  main: [
    [], // true branch (already ran) - empty/stop
    [{ node: 'Fetch Obsidian Context', type: 'main', index: 0 }] // false branch
  ]
};

// Fetch Obsidian Context → parallel: Fetch Gmail, Fetch Outlook, Fetch Calendar
j.connections['Fetch Obsidian Context'] = {
  main: [[
    { node: 'Fetch Gmail', type: 'main', index: 0 },
    { node: 'Fetch Outlook', type: 'main', index: 0 },
    { node: 'Fetch Calendar', type: 'main', index: 0 }
  ]]
};

fs.writeFileSync(orchPath, JSON.stringify(j, null, 2) + '\n', 'utf8');
console.log('\nAll nodes replaced with Code nodes. Zero credential requirements!');
