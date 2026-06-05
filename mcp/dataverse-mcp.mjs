#!/usr/bin/env node

import { createHash, createSign, randomUUID } from 'node:crypto';

const serverInfo = {
  name: 'dataverse-ai-action-platform',
  version: '0.2.0',
};

const config = {
  dataverseUrl: normalizeDataverseUrl(process.env.DATAVERSE_URL || ''),
  tenantId: process.env.AZURE_TENANT_ID || '',
  clientId: process.env.AZURE_CLIENT_ID || '',
  clientSecret: process.env.AZURE_CLIENT_SECRET || '',
  clientCertificatePem: process.env.AZURE_CLIENT_CERTIFICATE_PEM || '',
  clientCertificatePrivateKeyPem: process.env.AZURE_CLIENT_CERTIFICATE_PRIVATE_KEY_PEM || '',
  clientCertificateThumbprint: process.env.AZURE_CLIENT_CERTIFICATE_THUMBPRINT || '',
  accessToken: process.env.DATAVERSE_ACCESS_TOKEN || '',
  oauthScope: process.env.DATAVERSE_OAUTH_SCOPE || '',
  authMode: process.env.DATAVERSE_AUTH_MODE || 'auto',
  managedIdentityClientId: process.env.AZURE_MANAGED_IDENTITY_CLIENT_ID || '',
  allowWrites: String(process.env.DATAVERSE_ALLOW_WRITES || '').toLowerCase() === 'true',
  maxTop: parsePositiveInt(process.env.DATAVERSE_MAX_TOP, 500),
  retryAttempts: parsePositiveInt(process.env.DATAVERSE_RETRY_ATTEMPTS, 3),
  retryBaseMs: parsePositiveInt(process.env.DATAVERSE_RETRY_BASE_MS, 500),
  requestTimeoutMs: parsePositiveInt(process.env.DATAVERSE_REQUEST_TIMEOUT_MS, 30000),
  auditLogPath: process.env.DATAVERSE_AUDIT_LOG || '',
  allowedEntitySets: parseCsv(process.env.DATAVERSE_ALLOWED_ENTITY_SETS || ''),
  blockedEntitySets: parseCsv(process.env.DATAVERSE_BLOCKED_ENTITY_SETS || ''),
  blockedColumns: parseCsv(process.env.DATAVERSE_BLOCKED_COLUMNS || ''),
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
  {
    name: 'dataverse_compliance_evidence_schema',
    description: 'Return the standard compliance evidence schema for governed Dataverse AI actions.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'dataverse_calculate_action_trust_score',
    description: 'Calculate a trust score for a proposed Dataverse AI action without mutating data.',
    inputSchema: {
      type: 'object',
      properties: {
        action_type: { type: 'string', description: 'read, create, update, delete, action, bulk_update, deployment, or governance.' },
        record_count: { type: 'number' },
        data_quality: { type: 'number', description: '0-100 score.' },
        permission_fit: { type: 'number', description: '0-100 score.' },
        policy_fit: { type: 'number', description: '0-100 score.' },
        reversibility: { type: 'number', description: '0-100 score.' },
        approval_status: { type: 'string', description: 'approved, pending, not_required, missing, or rejected.' },
        evidence_complete: { type: 'boolean' },
        dependency_risk: { type: 'number', description: '0-100 where higher means more risk.' },
        sensitive_data: { type: 'boolean' },
      },
      required: ['action_type'],
    },
  },
  {
    name: 'dataverse_analyze_change_impact',
    description: 'Analyze potential Dataverse or Power Platform change impact from metadata and optional solution context.',
    inputSchema: {
      type: 'object',
      properties: {
        component_type: { type: 'string', description: 'table, column, flow, security_role, app, view, dashboard, integration, or solution.' },
        logical_name: { type: 'string', description: 'Logical name or component identifier.' },
        include_metadata: { type: 'boolean', description: 'When true, inspect Dataverse table metadata if component_type is table.' },
      },
      required: ['component_type', 'logical_name'],
    },
  },
  {
    name: 'dataverse_list_solutions',
    description: 'List Dataverse solutions for ALM readiness inspection.',
    inputSchema: {
      type: 'object',
      properties: {
        filter: { type: 'string', description: 'Optional OData $filter.' },
        top: { type: 'number' },
      },
    },
  },
  {
    name: 'dataverse_describe_solution',
    description: 'Describe one Dataverse solution by unique name and list its solution components.',
    inputSchema: {
      type: 'object',
      properties: {
        unique_name: { type: 'string', description: 'Solution uniquename.' },
        top_components: { type: 'number' },
      },
      required: ['unique_name'],
    },
  },
  {
    name: 'dataverse_environment_variable_report',
    description: 'Report Dataverse environment variable definitions and values for ALM review.',
    inputSchema: {
      type: 'object',
      properties: {
        top: { type: 'number' },
      },
    },
  },
  {
    name: 'dataverse_check_solution_dependencies',
    description: 'Create an ALM dependency review brief for a solution using available Dataverse solution metadata.',
    inputSchema: {
      type: 'object',
      properties: {
        unique_name: { type: 'string', description: 'Solution uniquename.' },
      },
      required: ['unique_name'],
    },
  },
  {
    name: 'dataverse_get_security_context',
    description: 'Inspect current Dataverse identity and available role/team context where readable.',
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

function parseCsv(value) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
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
  const canUseCertificate = config.tenantId && config.clientId && config.clientCertificatePrivateKeyPem;
  const canUseManagedIdentity = shouldUseManagedIdentity();
  const canUseDeviceCode = config.tenantId && config.clientId;
  if (!config.accessToken && !canUseClientCredentials && !canUseCertificate && !canUseManagedIdentity && !canUseDeviceCode) {
    throw new Error(
      'Missing OAuth configuration. Set DATAVERSE_ACCESS_TOKEN, client credentials, certificate auth, managed identity, or AZURE_TENANT_ID and AZURE_CLIENT_ID for device-code auth.',
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

function assertEntitySetAllowed(entitySet) {
  assertIdentifier(entitySet, 'entity_set');
  if (config.allowedEntitySets.length && !config.allowedEntitySets.includes(entitySet)) {
    throw new Error(`entity_set '${entitySet}' is not in DATAVERSE_ALLOWED_ENTITY_SETS.`);
  }
  if (config.blockedEntitySets.includes(entitySet)) {
    throw new Error(`entity_set '${entitySet}' is blocked by DATAVERSE_BLOCKED_ENTITY_SETS.`);
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
  for (const item of select) {
    assertIdentifier(item, 'select column');
    if (config.blockedColumns.includes(item)) {
      throw new Error(`Column '${item}' is blocked by DATAVERSE_BLOCKED_COLUMNS.`);
    }
  }
  return select.join(',');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldUseDeviceCode() {
  return config.authMode === 'device_code' || (!config.clientSecret && !config.accessToken);
}

function shouldUseManagedIdentity() {
  return config.authMode === 'managed_identity';
}

function shouldUseCertificate() {
  return config.authMode === 'certificate' || (!config.clientSecret && config.clientCertificatePrivateKeyPem);
}

async function getAccessToken() {
  requireConfig();
  if (config.accessToken) return config.accessToken;

  const now = Math.floor(Date.now() / 1000);
  if (tokenCache && tokenCache.expiresAt - 60 > now) {
    return tokenCache.accessToken;
  }

  if (shouldUseManagedIdentity()) {
    return getManagedIdentityToken(now);
  }

  if (shouldUseDeviceCode()) {
    return getDeviceCodeToken(now);
  }

  if (shouldUseCertificate()) {
    return getCertificateToken(now);
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

async function getManagedIdentityToken(now) {
  const resource = config.dataverseUrl;
  const endpoint = process.env.IDENTITY_ENDPOINT || process.env.MSI_ENDPOINT || 'http://169.254.169.254/metadata/identity/oauth2/token';
  const url = new URL(endpoint);
  url.searchParams.set('api-version', '2018-02-01');
  url.searchParams.set('resource', resource);
  if (config.managedIdentityClientId) {
    url.searchParams.set('client_id', config.managedIdentityClientId);
  }
  const headers = endpoint.includes('169.254.169.254')
    ? { Metadata: 'true' }
    : { 'X-IDENTITY-HEADER': process.env.IDENTITY_HEADER || '' };
  const response = await fetch(url, { headers });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.access_token) {
    throw new Error(`Managed identity token request failed (${response.status}): ${JSON.stringify(payload)}`);
  }
  tokenCache = {
    accessToken: payload.access_token,
    expiresAt: now + Number(payload.expires_in || 3600),
  };
  return tokenCache.accessToken;
}

async function getCertificateToken(now) {
  const tokenUrl = `https://login.microsoftonline.com/${encodeURIComponent(config.tenantId)}/oauth2/v2.0/token`;
  const scope = config.oauthScope || `${config.dataverseUrl}/.default`;
  const clientAssertion = createClientAssertion(tokenUrl);
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_assertion: clientAssertion,
    client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
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
    throw new Error(`Certificate token request failed (${response.status}): ${JSON.stringify(payload)}`);
  }
  tokenCache = {
    accessToken: payload.access_token,
    expiresAt: now + Number(payload.expires_in || 3600),
  };
  return tokenCache.accessToken;
}

function createClientAssertion(audience) {
  const now = Math.floor(Date.now() / 1000);
  const thumbprint = config.clientCertificateThumbprint || certificateThumbprint(config.clientCertificatePem);
  const header = { alg: 'RS256', typ: 'JWT', x5t: base64Url(Buffer.from(thumbprint.replace(/:/g, ''), 'hex')) };
  const payload = {
    aud: audience,
    exp: now + 600,
    iss: config.clientId,
    jti: randomUUID(),
    nbf: now,
    sub: config.clientId,
  };
  const signingInput = `${base64UrlJson(header)}.${base64UrlJson(payload)}`;
  const signer = createSign('RSA-SHA256');
  signer.update(signingInput);
  signer.end();
  return `${signingInput}.${base64Url(signer.sign(config.clientCertificatePrivateKeyPem))}`;
}

function certificateThumbprint(certificatePem) {
  if (!certificatePem) {
    throw new Error('Certificate auth requires AZURE_CLIENT_CERTIFICATE_THUMBPRINT or AZURE_CLIENT_CERTIFICATE_PEM.');
  }
  const body = certificatePem.replace(/-----BEGIN CERTIFICATE-----|-----END CERTIFICATE-----|\s/g, '');
  return createHash('sha1').update(Buffer.from(body, 'base64')).digest('hex');
}

function base64UrlJson(value) {
  return base64Url(Buffer.from(JSON.stringify(value), 'utf8'));
}

function base64Url(buffer) {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
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

function complianceEvidenceSchema() {
  return {
    schemaVersion: '1.0.0',
    actionId: 'uuid',
    requestedAt: 'ISO-8601 timestamp',
    requestedBy: 'Dataverse user or application identity',
    environmentUrl: 'Dataverse organization URL',
    actionType: 'read | create | update | delete | action | deployment | governance',
    businessReason: 'Plain-language rationale',
    dataUsed: ['tables, records, columns, filters, documents, or signals used'],
    rulesApplied: ['security, policy, DLP, approval, business, or data-quality rules'],
    affectedRecords: [{ entitySet: 'accounts', id: 'guid', operation: 'update' }],
    risk: { trustScore: 0, rating: 'low | medium | high | blocked', reasons: [] },
    approval: { required: false, status: 'not_required | pending | approved | rejected', reference: '' },
    simulation: { performed: false, summary: '', recordCount: 0 },
    result: { status: 'planned | executed | blocked | failed', summary: '' },
    audit: { logReference: '', retentionClass: '', evidenceOwner: '' },
  };
}

function calculateTrustScore(args) {
  const actionType = String(args.action_type || 'read').toLowerCase();
  const recordCount = Math.max(0, Number(args.record_count || 0));
  const metrics = {
    dataQuality: boundedScore(args.data_quality, 75),
    permissionFit: boundedScore(args.permission_fit, 70),
    policyFit: boundedScore(args.policy_fit, 70),
    reversibility: boundedScore(args.reversibility, actionType === 'delete' ? 20 : 70),
    dependencySafety: 100 - boundedScore(args.dependency_risk, 25),
    evidence: args.evidence_complete === true ? 100 : 45,
  };
  const weights = {
    dataQuality: 0.15,
    permissionFit: 0.2,
    policyFit: 0.2,
    reversibility: 0.15,
    dependencySafety: 0.15,
    evidence: 0.15,
  };
  let score = Object.entries(weights).reduce((sum, [key, weight]) => sum + metrics[key] * weight, 0);
  const blockingReasons = [];
  const warnings = [];

  if (['delete', 'bulk_update', 'deployment'].includes(actionType)) score -= 10;
  if (recordCount > 100) score -= 10;
  if (recordCount > 1000) score -= 15;
  if (args.sensitive_data === true) score -= 10;
  if (args.approval_status === 'missing') score -= 20;
  if (args.approval_status === 'rejected') blockingReasons.push('Approval was rejected.');
  if (metrics.permissionFit < 50) blockingReasons.push('Permission fit is below threshold.');
  if (metrics.policyFit < 50) blockingReasons.push('Policy fit is below threshold.');
  if (metrics.evidence < 50) warnings.push('Evidence package is incomplete.');
  if (metrics.reversibility < 40) warnings.push('Action has limited reversibility.');

  score = Math.round(Math.max(0, Math.min(100, score)));
  const rating = blockingReasons.length ? 'blocked' : score >= 80 ? 'low' : score >= 60 ? 'medium' : 'high';
  return {
    score,
    rating,
    actionType,
    metrics,
    blockingReasons,
    warnings,
    recommendation: blockingReasons.length
      ? 'Do not execute until blocking reasons are resolved.'
      : rating === 'low'
        ? 'Safe to proceed under normal approval policy.'
        : 'Require preview, approval, and audit evidence before execution.',
  };
}

function boundedScore(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.min(100, parsed));
}

async function changeImpact(args) {
  const componentType = String(args.component_type || '').toLowerCase();
  const logicalName = String(args.logical_name || '');
  const impact = {
    componentType,
    logicalName,
    impactAreas: ['security', 'data quality', 'automation', 'reporting', 'user experience', 'ALM'],
    reviewChecklist: [
      'Identify owning business capability and process owner.',
      'Review dependent apps, flows, views, dashboards, reports, integrations, and security roles.',
      'Check environment variables, connection references, and solution dependencies.',
      'Run sandbox validation before production change.',
      'Prepare rollback and communication plan.',
    ],
    metadata: null,
  };
  if (componentType === 'table' && args.include_metadata !== false) {
    assertIdentifier(logicalName, 'logical_name');
    impact.metadata = await dataverseRequest(
      appendQuery(`EntityDefinitions(LogicalName='${logicalName}')`, {
        '$select': 'LogicalName,SchemaName,EntitySetName,PrimaryIdAttribute,PrimaryNameAttribute,OwnershipType,IsCustomEntity,IsActivity',
        '$expand': 'Attributes($select=LogicalName,SchemaName,AttributeType,RequiredLevel)',
      }),
    );
  }
  return impact;
}

async function findSolution(uniqueName) {
  const result = await dataverseRequest(
    appendQuery('solutions', {
      '$select': 'solutionid,uniquename,friendlyname,version,ismanaged,installedon,publisherid',
      '$filter': `uniquename eq '${String(uniqueName).replace(/'/g, "''")}'`,
      '$top': '1',
    }),
  );
  return Array.isArray(result.value) ? result.value[0] : null;
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
      assertEntitySetAllowed(args.entity_set);
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
      assertEntitySetAllowed(args.entity_set);
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
      assertEntitySetAllowed(args.entity_set);
      const id = cleanGuid(args.id);
      const params = {
        '$select': selectValue(args.select),
        '$expand': args.expand,
      };
      return jsonText(await dataverseRequest(appendQuery(`${args.entity_set}(${id})`, params)));
    }

    case 'dataverse_create_record': {
      requireWrite(args);
      assertEntitySetAllowed(args.entity_set);
      return jsonText(await dataverseRequest(args.entity_set, { method: 'POST', body: args.payload || {} }));
    }

    case 'dataverse_update_record': {
      requireWrite(args);
      assertEntitySetAllowed(args.entity_set);
      const id = cleanGuid(args.id);
      return jsonText(await dataverseRequest(`${args.entity_set}(${id})`, { method: 'PATCH', body: args.payload || {} }));
    }

    case 'dataverse_delete_record': {
      requireWrite(args);
      assertEntitySetAllowed(args.entity_set);
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
      assertEntitySetAllowed(args.entity_set);
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
      assertEntitySetAllowed(args.entity_set);
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

    case 'dataverse_compliance_evidence_schema':
      return jsonText(complianceEvidenceSchema());

    case 'dataverse_calculate_action_trust_score':
      return jsonText(calculateTrustScore(args));

    case 'dataverse_analyze_change_impact':
      return jsonText(await changeImpact(args));

    case 'dataverse_list_solutions': {
      const params = {
        '$select': 'solutionid,uniquename,friendlyname,version,ismanaged,installedon',
        '$filter': args.filter,
        '$orderby': 'friendlyname asc',
        '$top': String(topValue(args.top)),
      };
      return jsonText(await dataverseRequest(appendQuery('solutions', params)));
    }

    case 'dataverse_describe_solution': {
      const solution = await findSolution(args.unique_name);
      if (!solution) {
        throw new Error(`Solution '${args.unique_name}' was not found.`);
      }
      const components = await dataverseRequest(
        appendQuery('solutioncomponents', {
          '$select': 'solutioncomponentid,componenttype,objectid,rootsolutioncomponentid',
          '$filter': `_solutionid_value eq ${solution.solutionid}`,
          '$top': String(topValue(args.top_components || 100)),
        }),
      );
      return jsonText({ solution, components });
    }

    case 'dataverse_environment_variable_report': {
      const definitions = await dataverseRequest(
        appendQuery('environmentvariabledefinitions', {
          '$select': 'environmentvariabledefinitionid,schemaname,displayname,defaultvalue,type,valueschema',
          '$top': String(topValue(args.top || 100)),
        }),
      );
      const values = await dataverseRequest(
        appendQuery('environmentvariablevalues', {
          '$select': 'environmentvariablevalueid,value,_environmentvariabledefinitionid_value',
          '$top': String(topValue(args.top || 100)),
        }),
      );
      return jsonText({ definitions, values });
    }

    case 'dataverse_check_solution_dependencies': {
      const solution = await findSolution(args.unique_name);
      if (!solution) {
        throw new Error(`Solution '${args.unique_name}' was not found.`);
      }
      const components = await dataverseRequest(
        appendQuery('solutioncomponents', {
          '$select': 'solutioncomponentid,componenttype,objectid,rootsolutioncomponentid',
          '$filter': `_solutionid_value eq ${solution.solutionid}`,
          '$top': String(topValue(250)),
        }),
      );
      const count = Array.isArray(components.value) ? components.value.length : 0;
      return jsonText({
        solution,
        componentCount: count,
        readiness: count > 0 ? 'review_required' : 'at_risk',
        reviewChecks: [
          'Confirm all required components are included in the managed solution.',
          'Review connection references and environment variables.',
          'Check cloud flows are active and owned by service principals where appropriate.',
          'Validate security roles and sharing assumptions.',
          'Run import in a sandbox before production.',
        ],
        components,
      });
    }

    case 'dataverse_get_security_context': {
      const whoami = await dataverseRequest('WhoAmI()');
      const context = { whoami, user: null, roles: null, teams: null, warnings: [] };
      if (whoami.UserId) {
        const userId = cleanGuid(whoami.UserId);
        try {
          context.user = await dataverseRequest(
            appendQuery(`systemusers(${userId})`, {
              '$select': 'systemuserid,fullname,domainname,internalemailaddress,_businessunitid_value,isdisabled',
            }),
          );
        } catch (error) {
          context.warnings.push(`Could not read system user details: ${error instanceof Error ? error.message : String(error)}`);
        }
        try {
          context.roles = await dataverseRequest(
            appendQuery(`systemusers(${userId})/systemuserroles_association`, {
              '$select': 'roleid,name,businessunitid',
              '$top': '100',
            }),
          );
        } catch (error) {
          context.warnings.push(`Could not read role associations: ${error instanceof Error ? error.message : String(error)}`);
        }
        try {
          context.teams = await dataverseRequest(
            appendQuery(`systemusers(${userId})/teammembership_association`, {
              '$select': 'teamid,name,_businessunitid_value',
              '$top': '100',
            }),
          );
        } catch (error) {
          context.warnings.push(`Could not read team associations: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      return jsonText(context);
    }

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
