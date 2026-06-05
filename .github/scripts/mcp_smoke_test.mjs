import { spawn } from 'node:child_process';

const child = spawn('node', ['mcp/dataverse-mcp.mjs'], {
  cwd: process.cwd(),
  stdio: ['pipe', 'pipe', 'pipe'],
});

let output = Buffer.alloc(0);
child.stdout.on('data', (chunk) => {
  output = Buffer.concat([output, chunk]);
});

function send(message) {
  const body = Buffer.from(JSON.stringify(message), 'utf8');
  child.stdin.write(`Content-Length: ${body.length}\r\n\r\n`);
  child.stdin.write(body);
}

send({
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'ci-smoke', version: '1.0.0' },
  },
});
send({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
send({
  jsonrpc: '2.0',
  id: 3,
  method: 'tools/call',
  params: { name: 'dataverse_oauth_status', arguments: {} },
});

setTimeout(() => child.kill(), 800);

child.on('close', () => {
  const messages = output
    .toString('utf8')
    .split(/Content-Length: \d+\r\n\r\n/)
    .filter(Boolean)
    .map((text) => JSON.parse(text));
  const list = messages.find((message) => message.id === 2);
  if (!list) throw new Error('tools/list response missing');
  const tools = list.result.tools.map((tool) => tool.name);
  const required = [
    'dataverse_query_all',
    'dataverse_audit_status',
    'dataverse_calculate_action_trust_score',
    'dataverse_analyze_change_impact',
    'dataverse_list_solutions',
    'dataverse_get_security_context',
    'dataverse_evaluate_action_permission',
    'dataverse_plan_bulk_operation',
    'dataverse_result_schemas',
  ];
  const missing = required.filter((tool) => !tools.includes(tool));
  if (missing.length) {
    throw new Error(`Missing MCP tools: ${missing.join(', ')}`);
  }
  console.log(`MCP smoke test passed with ${tools.length} tools.`);
});
