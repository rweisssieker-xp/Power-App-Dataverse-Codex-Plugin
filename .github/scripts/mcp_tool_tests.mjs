import { spawn } from 'node:child_process';

const child = spawn('node', ['mcp/dataverse-mcp.mjs'], {
  cwd: process.cwd(),
  stdio: ['pipe', 'pipe', 'pipe'],
});

let output = Buffer.alloc(0);
child.stdout.on('data', (chunk) => {
  output = Buffer.concat([output, chunk]);
});

function send(id, name, args = {}) {
  const message = {
    jsonrpc: '2.0',
    id,
    method: 'tools/call',
    params: { name, arguments: args },
  };
  const body = Buffer.from(JSON.stringify(message), 'utf8');
  child.stdin.write(`Content-Length: ${body.length}\r\n\r\n`);
  child.stdin.write(body);
}

function initialize() {
  const message = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'ci-tool-tests', version: '1.0.0' },
    },
  };
  const body = Buffer.from(JSON.stringify(message), 'utf8');
  child.stdin.write(`Content-Length: ${body.length}\r\n\r\n`);
  child.stdin.write(body);
}

initialize();
send(2, 'dataverse_compliance_evidence_schema');
send(3, 'dataverse_calculate_action_trust_score', {
  action_type: 'bulk_update',
  record_count: 250,
  data_quality: 80,
  permission_fit: 90,
  policy_fit: 85,
  reversibility: 60,
  approval_status: 'approved',
  evidence_complete: true,
  dependency_risk: 20,
  sensitive_data: false,
});
send(4, 'dataverse_plan_bulk_operation', {
  entity_set: 'accounts',
  operation: 'update',
  estimated_records: 250,
  batch_size: 50,
  proposed_changes: { status: 'reviewed' },
});
send(5, 'dataverse_result_schemas');

setTimeout(() => child.kill(), 800);

child.on('close', () => {
  const messages = output
    .toString('utf8')
    .split(/Content-Length: \d+\r\n\r\n/)
    .filter(Boolean)
    .map((text) => JSON.parse(text));
  const byId = new Map(messages.map((message) => [message.id, message]));
  for (const id of [2, 3, 4, 5]) {
    const message = byId.get(id);
    if (!message || message.error || message.result?.isError) {
      throw new Error(`Tool call ${id} failed: ${JSON.stringify(message)}`);
    }
  }
  const trust = JSON.parse(byId.get(3).result.content[0].text);
  if (typeof trust.score !== 'number' || !trust.rating) {
    throw new Error('Trust score result schema is invalid.');
  }
  const bulkPlan = JSON.parse(byId.get(4).result.content[0].text);
  if (!bulkPlan.operationId || !Array.isArray(bulkPlan.phases)) {
    throw new Error('Bulk plan result schema is invalid.');
  }
  console.log('MCP tool tests passed.');
});
