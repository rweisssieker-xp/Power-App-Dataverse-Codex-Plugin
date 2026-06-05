#!/usr/bin/env node

const serverInfo = {
  name: 'dataverse-ai-action-platform',
  version: '0.2.0',
};

const config = {
  dataverseUrl: normalizeDataverseUrl(process.env.DATAVERSE_URL || ''),
  tenantId: process.env.AZURE_TENANT_ID || '',
  clientId: process.env.AZURE_CLIENT_ID || '',
  clientSecret: process.env.AZURE_CLIENT_SECRET || '',
  accessToken: process.env.DATAVERSE_ACCESS_TOKEN || '',
  oauthScope: process.env.DATAVERSE_OAUTH_SCOPE || '',
  authMode: process.env.DATAVERSE_AUTH_MODE || 'auto',
  allowWrites: String(process.env.DATAVERSE_ALLOW_WRITES || '').toLowerCase() === 'true',
  maxTop: parsePositiveInt(process.env.DATAVERSE_MAX_TOP, 500),
  retryAttempts: parsePositiveInt(process.env.DATAVERSE_RETRY_ATTEMPTS, 3),
  retryBaseMs: parsePositiveInt(process.env.DATAVERSE_RETRY_BASE_MS, 500),
  requestTimeoutMs: parsePositiveInt(process.env.DATAVERSE_REQUEST_TIMEOUT_MS, 30000),
  auditLogPath: process.env.DATAVERSE_AUDIT_LOG || '',
};

let tokenCache = null;
let inputBuffer = Buffer.alloc(0);

const tools = [
  {
    name: 'dataverse_oauth_status',
    description: 'Show Dataverse OAuth configuration status without exposing secrets.',
    inputSchema: {
      type: 'object',
      properties: {
        request_token: {
          type: 'boolean',
          description: 'When true, request an OAuth token to verify client-credentials auth.',
        },
      },
    },
  },
  {
    name: 'dataverse_whoami',
    description: 'Call Dataverse WhoAmI() with OAuth and return the connected user/organization IDs.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'dataverse_list_tables',
    description: 'List Dataverse table metadata from EntityDefinitions.',
    inputSchema: {
      type: 'object',
      properties: {
        filter: { type: 'string', description: 'Optional OData $filter for EntityDefinitions.' },
        top: { type: 'number', description: 'Maximum tables to return.' },
      },
    },
  },
  {
    name: 'dataverse_describe_table',
    description: 'Describe a Dataverse table by logical name, including key metadata and attributes.',
    inputSchema: {
      type: 'object',
      properties: {
        logical_name: { type: 'string', description: 'Dataverse table logical name, for example account.' },
        include_attributes: { type: 'boolean', description: 'Include table attributes when true.' },
      },
      required: ['logical_name'],
    },
  },
  {
    name: 'dataverse_query',
    description: 'Run a Dataverse Web API OData query against an entity set.',
    inputSchema: {
      type: 'object',
      properties: {
        entity_set: { type: 'string', description: 'Entity set name, for example accounts.' },
        select: { type: 'array', items: { type: 'string' }, description: 'Columns for $select.' },
        filter: { type: 'string', description: 'OData $filter expression.' },
        orderby: { type: 'string', description: 'OData $orderby expression.' },
        expand: { type: 'string', description: 'OData $expand expression.' },
        top: { type: 'number', description: 'Maximum records to return.' },
      },
      required: ['entity_set'],
    },
  },
  {
    name: 'dataverse_query_all',
    description: 'Run a paginated Dataverse OData query and follow @odata.nextLink up to safety limits.',
    inputSchema: {
      type: 'object',
      properties: {
        entity_set: { type: 'string', description: 'Entity set name, for example accounts.' },
        select: { type: 'array', items: { type: 'string' }, description: 'Columns for $select.' },
        filter: { type: 'string', description: 'OData $filter expression.' },
        orderby: { type: 'string', description: 'OData $orderby expression.' },
        expand: { type: 'string', description: 'OData $expand expression.' },
        top: { type: 'number', description: 'Page size for each Dataverse request.' },
        max_pages: { type: 'number', description: 'Maximum pages to fetch. Default 3.' },
        max_records: { type: 'number', description: 'Maximum records to return. Default 500.' },
      },
      required: ['entity_set'],
    },
  },
  {
    name: 'dataverse_retrieve_record',
    description: 'Retrieve one Dataverse record by entity set and GUID.',
    inputSchema: {
      type: 'object',
      properties: {
        entity_set: { type: 'string' },
        id: { type: 'string', description: 'Record GUID.' },
        select: { type: 'array', items: { type: 'string' } },
        expand: { type: 'string' },
      },
      required: ['entity_set', 'id'],
    },
  },
  {
    name: 'dataverse_create_record',
    description: 'Create a Dataverse record. Requires DATAVERSE_ALLOW_WRITES=true and confirm=true.',
    inputSchema: {
      type: 'object',
      properties: {
        entity_set: { type: 'string' },
        payload: { type: 'object', description: 'Dataverse Web API JSON payload.' },
        confirm: { type: 'boolean', description: 'Must be true to perform the write.' },
      },
      required: ['entity_set', 'payload', 'confirm'],
    },
  },
  {
    name: 'dataverse_update_record',
    description: 'Update a Dataverse record. Requires DATAVERSE_ALLOW_WRITES=true and confirm=true.',
    inputSchema: {
      type: 'object',
      properties: {
        entity_set: { type: 'string' },
        id: { type: 'string' },
        payload: { type: 'object', description: 'Dataverse Web API JSON PATCH payload.' },
        confirm: { type: 'boolean', description: 'Must be true to perform the write.' },
      },
      required: ['entity_set', 'id', 'payload', 'confirm'],
    },
  },
  {
    name: 'dataverse_delete_record',
    description: 'Delete a Dataverse record. Requires DATAVERSE_ALLOW_WRITES=true and confirm=true.',
    inputSchema: {
      type: 'object',
      properties: {
        entity_set: { type: 'string' },
        id: { type: 'string' },
        confirm: { type: 'boolean', description: 'Must be true to perform the delete.' },
      },
      required: ['entity_set', 'id', 'confirm'],
    },
  },
  {
    name: 'dataverse_execute_unbound_action',
    description: 'Execute an unbound Dataverse Web API action/function. Writes require DATAVERSE_ALLOW_WRITES=true and confirm=true.',
    inputSchema: {
      type: 'object',
      properties: {
        action_name: { type: 'string', description: 'Action/function name, for example WhoAmI.' },
        method: { type: 'string', enum: ['GET', 'POST'], description: 'HTTP method. Default POST.' },
        payload: { type: 'object', description: 'Optional JSON payload for POST actions.' },
        confirm: { type: 'boolean', description: 'Required for POST actions unless DATAVERSE_ALLOW_WRITES is false.' },
      },
      required: ['action_name'],
    },
  },
  {
    name: 'dataverse_execute_bound_action',
    description: 'Execute a bound Dataverse Web API action on a record. Requires DATAVERSE_ALLOW_WRITES=true and confirm=true for POST.',
    inputSchema: {
      type: 'object',
      properties: {
        entity_set: { type: 'string' },
        id: { type: 'string' },
        action_name: { type: 'string', description: 'Bound action name, optionally namespace-qualified.' },
        payload: { type: 'object', description: 'Optional JSON payload.' },
        confirm: { type: 'boolean', description: 'Must be true to perform the action.' },
      },
      required: ['entity_set', 'id', 'action_name', 'confirm'],
    },
  },
  {
    name: 'dataverse_simulate_bulk_update',
    description: 'Preview records selected by a potential bulk update without mutating Dataverse.',
    inputSchema: {
      type: 'object',
      properties: {
        entity_set: { type: 'string' },
        select: { type: 'array', items: { type: 'string' } },
        filter: { type: 'string' },
        top: { type: 'number', description: 'Maximum preview records.' },
        proposed_changes: { type: 'object', description: 'Changes to describe in the simulation output.' },
      },
      required: ['entity_set', 'proposed_changes'],
    },
  },
  {
    name: 'dataverse_audit_status',
    description: 'Show local MCP audit-log configuration and whether audit logging is enabled.',
    inputSchema: { type: 'object', properties: {} },
  },
];

function normalizeDataverseUrl(value) {
  return value.trim().replace(/\/+$/, '');
}

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value || '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function jsonText(value) {
  return {
    content: [
      {
        type: 'text',
        text: typeof value === 'string' ? value : JSON.stringify(value, null, 2),
      },
    ],
  };
}

function errorText(message) {
  return {
    isError: true,
    content: [{ type: 'text', text: message }],
  };
}

function requireConfig() {
  if (!config.dataverseUrl) {
    throw new Error('Missing DATAVERSE_URL, for example https://org.crm4.dynamics.com');
  }
  const canUseClientCredentials = config.tenantId && config.clientId && config.clientSecret;
  const canUseDeviceCode = config.tenantId && config.clientId;
  if (!config.accessToken && !canUseClientCredentials && !canUseDeviceCode) {
    throw new Error(
      'Missing OAuth configuration. Set DATAVERSE_ACCESS_TOKEN, client credentials, or AZURE_TENANT_ID and AZURE_CLIENT_ID for device-code auth.',
    );
  }
}

function requireWrite(args) {
  if (!config.allowWrites) {
    throw new Error('Write blocked. Set DATAVERSE_ALLOW_WRITES=true to enable Dataverse mutations.');
  }
  if (!args || args.confirm !== true) {
    throw new Error('Write blocked. Pass confirm=true after reviewing the intended change.');
  }
}

function assertIdentifier(value, label) {
  if (typeof value !== 'string' || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) {
    throw new Error(`${label} must be a simple Dataverse identifier.`);
  }
}

function cleanGuid(value) {
  if (typeof value !== 'string') {
    throw new Error('id must be a GUID string.');
  }
  const cleaned = value.trim().replace(/[{}]/g, '');
  if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(cleaned)) {
    throw new Error('id must be a valid GUID.');
  }
  return cleaned;
}

function topValue(value) {
  const requested = Number.parseInt(value ?? '', 10);
  if (!Number.isFinite(requested) || requested <= 0) {
    return Math.min(50, config.maxTop);
  }
  return Math.min(requested, config.maxTop);
}

function appendQuery(path, params) {
  const query = [];
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    query.push(`${key}=${encodeURIComponent(value)}`);
  }
  return query.length ? `${path}?${query.join('&')}` : path;
}

function selectValue(select) {
  if (!Array.isArray(select) || select.length === 0) return undefined;
  for (const item of select) assertIdentifier(item, 'select column');
  return select.join(',');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldUseDeviceCode() {
  return config.authMode === 'device_code' || (!config.clientSecret && !config.accessToken);
}

async function getAccessToken() {
  requireConfig();
  if (config.accessToken) return config.accessToken;

  const now = Math.floor(Date.now() / 1000);
  if (tokenCache && tokenCache.expiresAt - 60 > now) {
    return tokenCache.accessToken;
  }

  if (shouldUseDeviceCode()) {
    return getDeviceCodeToken(now);
  }

  const scope = config.oauthScope || `${config.dataverseUrl}/.default`;
  const tokenUrl = `https://login.microsoftonline.com/${encodeURIComponent(config.tenantId)}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    grant_type: 'client_credentials',
    scope,
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.access_token) {
    throw new Error(`OAuth token request failed (${response.status}): ${JSON.stringify(payload)}`);
  }

  tokenCache = {
    accessToken: payload.access_token,
    expiresAt: now + Number(payload.expires_in || 3600),
  };
  return tokenCache.accessToken;
}

async function getDeviceCodeToken(now) {
  const scope = config.oauthScope || `${config.dataverseUrl}/user_impersonation offline_access`;
  const deviceCodeUrl = `https://login.microsoftonline.com/${encodeURIComponent(config.tenantId)}/oauth2/v2.0/devicecode`;
  const tokenUrl = `https://login.microsoftonline.com/${encodeURIComponent(config.tenantId)}/oauth2/v2.0/token`;
  const deviceBody = new URLSearchParams({
    client_id: config.clientId,
    scope,
  });

  const deviceResponse = await fetch(deviceCodeUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: deviceBody,
  });
  const devicePayload = await deviceResponse.json().catch(() => ({}));
  if (!deviceResponse.ok || !devicePayload.device_code) {
    throw new Error(`Device-code request failed (${deviceResponse.status}): ${JSON.stringify(devicePayload)}`);
  }

  console.error(devicePayload.message || `Open ${devicePayload.verification_uri} and enter code ${devicePayload.user_code}.`);

  const intervalSeconds = Number(devicePayload.interval || 5);
  const expiresAt = now + Number(devicePayload.expires_in || 900);
  while (Math.floor(Date.now() / 1000) < expiresAt) {
    await sleep(intervalSeconds * 1000);
    const tokenBody = new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
      client_id: config.clientId,
      device_code: devicePayload.device_code,
    });
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: tokenBody,
    });
    const tokenPayload = await tokenResponse.json().catch(() => ({}));
    if (tokenResponse.ok && tokenPayload.access_token) {
      tokenCache = {
        accessToken: tokenPayload.access_token,
        expiresAt: Math.floor(Date.now() / 1000) + Number(tokenPayload.expires_in || 3600),
      };
      return tokenCache.accessToken;
    }
    if (!['authorization_pending', 'slow_down'].includes(tokenPayload.error)) {
      throw new Error(`Device-code token request failed (${tokenResponse.status}): ${JSON.stringify(tokenPayload)}`);
    }
  }

  throw new Error('Device-code authorization expired before sign-in completed.');
}

async function dataverseRequest(path, options = {}) {
  return dataverseRequestUrl(`${config.dataverseUrl}/api/data/v9.2/${path.replace(/^\/+/, '')}`, options);
}

async function dataverseRequestUrl(url, options = {}) {
  const token = await getAccessToken();
  const method = options.method || 'GET';
  const headers = {
    authorization: `Bearer ${token}`,
    accept: 'application/json',
    'odata-version': '4.0',
    'odata-maxversion': '4.0',
    ...options.headers,
  };
  let body;
  if (options.body !== undefined) {
    headers['content-type'] = 'application/json';
    body = JSON.stringify(options.body);
  }

  const startedAt = new Date().toISOString();
  let lastError;
  for (let attempt = 1; attempt <= config.retryAttempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.requestTimeoutMs);
    try {
      const response = await fetch(url, {
        method,
        headers,
        body,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const text = await response.text();
      const payload = text ? tryParseJson(text) : null;
      await writeAuditEvent({
        startedAt,
        completedAt: new Date().toISOString(),
        method,
        url: redactUrl(url),
        status: response.status,
        ok: response.ok,
        attempt,
        mutating: method !== 'GET',
      });

      if (!response.ok) {
        const retryAfter = Number(response.headers.get('retry-after') || 0);
        const retryable = response.status === 429 || response.status >= 500;
        lastError = new Error(`Dataverse request failed (${response.status} ${response.statusText}): ${text}`);
        if (retryable && attempt < config.retryAttempts) {
          await sleep(retryAfter ? retryAfter * 1000 : config.retryBaseMs * attempt);
          continue;
        }
        throw lastError;
      }

      const entityId = response.headers.get('odata-entityid') || response.headers.get('OData-EntityId');
      if (response.status === 204) {
        return entityId ? { status: response.status, entityId } : { status: response.status };
      }
      return payload ?? { status: response.status, entityId };
    } catch (error) {
      clearTimeout(timeout);
      lastError = error;
      const retryable = error?.name === 'AbortError';
      await writeAuditEvent({
        startedAt,
        completedAt: new Date().toISOString(),
        method,
        url: redactUrl(url),
        ok: false,
        attempt,
        mutating: method !== 'GET',
        error: error instanceof Error ? error.message : String(error),
      });
      if (retryable && attempt < config.retryAttempts) {
        await sleep(config.retryBaseMs * attempt);
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

function redactUrl(url) {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}${parsed.search ? '?...' : ''}`;
  } catch {
    return url;
  }
}

async function writeAuditEvent(event) {
  if (!config.auditLogPath) return;
  const { appendFile, mkdir } = await import('node:fs/promises');
  const { dirname } = await import('node:path');
  await mkdir(dirname(config.auditLogPath), { recursive: true });
  await appendFile(config.auditLogPath, `${JSON.stringify(event)}\n`, 'utf8');
}

function tryParseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function callTool(name, args = {}) {
  switch (name) {
    case 'dataverse_oauth_status': {
      const status = {
        dataverseUrlConfigured: Boolean(config.dataverseUrl),
        tenantConfigured: Boolean(config.tenantId),
        clientIdConfigured: Boolean(config.clientId),
        clientSecretConfigured: Boolean(config.clientSecret),
        accessTokenConfigured: Boolean(config.accessToken),
        authMode: config.authMode,
        deviceCodeAvailable: Boolean(config.tenantId && config.clientId),
        oauthScope: config.oauthScope || (config.dataverseUrl ? `${config.dataverseUrl}/.default` : ''),
        writesEnabled: config.allowWrites,
        maxTop: config.maxTop,
        retryAttempts: config.retryAttempts,
        requestTimeoutMs: config.requestTimeoutMs,
        auditLogEnabled: Boolean(config.auditLogPath),
      };
      if (args.request_token === true) {
        const token = await getAccessToken();
        status.tokenRequestSucceeded = Boolean(token);
      }
      return jsonText(status);
    }

    case 'dataverse_whoami':
      return jsonText(await dataverseRequest('WhoAmI()'));

    case 'dataverse_list_tables': {
      const params = {
        '$select': 'LogicalName,SchemaName,EntitySetName,OwnershipType,IsCustomEntity,IsActivity',
        '$top': String(topValue(args.top)),
        '$filter': args.filter,
      };
      return jsonText(await dataverseRequest(appendQuery('EntityDefinitions', params)));
    }

    case 'dataverse_describe_table': {
      assertIdentifier(args.logical_name, 'logical_name');
      const expand = args.include_attributes === false
        ? undefined
        : 'Attributes($select=LogicalName,SchemaName,AttributeType,RequiredLevel,DisplayName)';
      const params = {
        '$select': 'LogicalName,SchemaName,EntitySetName,PrimaryIdAttribute,PrimaryNameAttribute,OwnershipType,IsCustomEntity,IsActivity',
        '$expand': expand,
      };
      return jsonText(await dataverseRequest(appendQuery(`EntityDefinitions(LogicalName='${args.logical_name}')`, params)));
    }

    case 'dataverse_query': {
      assertIdentifier(args.entity_set, 'entity_set');
      const params = {
        '$select': selectValue(args.select),
        '$filter': args.filter,
        '$orderby': args.orderby,
        '$expand': args.expand,
        '$top': String(topValue(args.top)),
      };
      return jsonText(await dataverseRequest(appendQuery(args.entity_set, params)));
    }

    case 'dataverse_query_all': {
      assertIdentifier(args.entity_set, 'entity_set');
      const params = {
        '$select': selectValue(args.select),
        '$filter': args.filter,
        '$orderby': args.orderby,
        '$expand': args.expand,
        '$top': String(topValue(args.top)),
      };
      const maxPages = Math.min(parsePositiveInt(args.max_pages, 3), 25);
      const maxRecords = Math.min(parsePositiveInt(args.max_records, 500), config.maxTop * maxPages);
      const records = [];
      let nextUrl = `${config.dataverseUrl}/api/data/v9.2/${appendQuery(args.entity_set, params)}`;
      let pagesFetched = 0;
      while (nextUrl && pagesFetched < maxPages && records.length < maxRecords) {
        const page = await dataverseRequestUrl(nextUrl);
        pagesFetched += 1;
        const values = Array.isArray(page?.value) ? page.value : [];
        for (const record of values) {
          if (records.length >= maxRecords) break;
          records.push(record);
        }
        nextUrl = typeof page?.['@odata.nextLink'] === 'string' ? page['@odata.nextLink'] : '';
      }
      return jsonText({
        records,
        count: records.length,
        pagesFetched,
        hasMore: Boolean(nextUrl),
        nextLinkOmitted: Boolean(nextUrl),
      });
    }

    case 'dataverse_retrieve_record': {
      assertIdentifier(args.entity_set, 'entity_set');
      const id = cleanGuid(args.id);
      const params = {
        '$select': selectValue(args.select),
        '$expand': args.expand,
      };
      return jsonText(await dataverseRequest(appendQuery(`${args.entity_set}(${id})`, params)));
    }

    case 'dataverse_create_record': {
      requireWrite(args);
      assertIdentifier(args.entity_set, 'entity_set');
      return jsonText(await dataverseRequest(args.entity_set, { method: 'POST', body: args.payload || {} }));
    }

    case 'dataverse_update_record': {
      requireWrite(args);
      assertIdentifier(args.entity_set, 'entity_set');
      const id = cleanGuid(args.id);
      return jsonText(await dataverseRequest(`${args.entity_set}(${id})`, { method: 'PATCH', body: args.payload || {} }));
    }

    case 'dataverse_delete_record': {
      requireWrite(args);
      assertIdentifier(args.entity_set, 'entity_set');
      const id = cleanGuid(args.id);
      return jsonText(await dataverseRequest(`${args.entity_set}(${id})`, { method: 'DELETE' }));
    }

    case 'dataverse_execute_unbound_action': {
      assertIdentifier(args.action_name, 'action_name');
      const method = args.method || 'POST';
      if (method !== 'GET' && method !== 'POST') throw new Error('method must be GET or POST.');
      if (method === 'POST') requireWrite(args);
      const path = method === 'GET' ? `${args.action_name}()` : args.action_name;
      return jsonText(await dataverseRequest(path, { method, body: method === 'POST' ? args.payload || {} : undefined }));
    }

    case 'dataverse_execute_bound_action': {
      requireWrite(args);
      assertIdentifier(args.entity_set, 'entity_set');
      const id = cleanGuid(args.id);
      const actionName = String(args.action_name || '');
      if (!/^[A-Za-z_][A-Za-z0-9_.]*$/.test(actionName)) {
        throw new Error('action_name must be a Dataverse action identifier.');
      }
      return jsonText(
        await dataverseRequest(`${args.entity_set}(${id})/${actionName}`, {
          method: 'POST',
          body: args.payload || {},
        }),
      );
    }

    case 'dataverse_simulate_bulk_update': {
      assertIdentifier(args.entity_set, 'entity_set');
      const preview = await dataverseRequest(
        appendQuery(args.entity_set, {
          '$select': selectValue(args.select),
          '$filter': args.filter,
          '$top': String(topValue(args.top || 25)),
        }),
      );
      return jsonText({
        simulationOnly: true,
        proposedChanges: args.proposed_changes,
        preview,
        nextStep: 'Review selected records and proposedChanges. To mutate data, use dataverse_update_record with DATAVERSE_ALLOW_WRITES=true and confirm=true per record or implement a governed bulk action.',
      });
    }

    case 'dataverse_audit_status':
      return jsonText({
        auditLogEnabled: Boolean(config.auditLogPath),
        auditLogPathConfigured: Boolean(config.auditLogPath),
        auditLogPath: config.auditLogPath ? '[configured]' : '',
      });

    default:
      return errorText(`Unknown tool: ${name}`);
  }
}

async function handleRequest(message) {
  if (!message || typeof message !== 'object') return null;
  if (!('id' in message)) return null;

  try {
    if (message.method === 'initialize') {
      return {
        jsonrpc: '2.0',
        id: message.id,
        result: {
          protocolVersion: message.params?.protocolVersion || '2024-11-05',
          capabilities: { tools: {} },
          serverInfo,
        },
      };
    }

    if (message.method === 'tools/list') {
      return { jsonrpc: '2.0', id: message.id, result: { tools } };
    }

    if (message.method === 'tools/call') {
      const result = await callTool(message.params?.name, message.params?.arguments || {});
      return { jsonrpc: '2.0', id: message.id, result };
    }

    return {
      jsonrpc: '2.0',
      id: message.id,
      error: { code: -32601, message: `Method not found: ${message.method}` },
    };
  } catch (error) {
    return {
      jsonrpc: '2.0',
      id: message.id,
      error: {
        code: -32000,
        message: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

function writeMessage(message) {
  const json = JSON.stringify(message);
  const body = Buffer.from(json, 'utf8');
  process.stdout.write(`Content-Length: ${body.length}\r\n\r\n`);
  process.stdout.write(body);
}

function parseMessages() {
  const messages = [];
  while (inputBuffer.length > 0) {
    const headerEnd = inputBuffer.indexOf('\r\n\r\n');
    if (headerEnd === -1) break;

    const header = inputBuffer.slice(0, headerEnd).toString('utf8');
    const match = header.match(/Content-Length:\s*(\d+)/i);
    if (!match) {
      inputBuffer = Buffer.alloc(0);
      throw new Error('Invalid MCP frame: missing Content-Length header.');
    }

    const length = Number.parseInt(match[1], 10);
    const bodyStart = headerEnd + 4;
    const bodyEnd = bodyStart + length;
    if (inputBuffer.length < bodyEnd) break;

    const body = inputBuffer.slice(bodyStart, bodyEnd).toString('utf8');
    inputBuffer = inputBuffer.slice(bodyEnd);
    messages.push(JSON.parse(body));
  }
  return messages;
}

process.stdin.on('data', async (chunk) => {
  inputBuffer = Buffer.concat([inputBuffer, chunk]);
  try {
    for (const message of parseMessages()) {
      const response = await handleRequest(message);
      if (response) writeMessage(response);
    }
  } catch (error) {
    writeMessage({
      jsonrpc: '2.0',
      id: null,
      error: { code: -32700, message: error instanceof Error ? error.message : String(error) },
    });
  }
});

process.stdin.resume();
