# Production Readiness

## Readiness Status

The repository is production-ready as a repo-local Codex plugin source package when the following are true:

- `validate_plugin.py` passes.
- `node --check plugins\power-app-dataverse-codex-plugin\mcp\dataverse-mcp.mjs` passes.
- No real secrets are committed.
- `dataverseplugin.pdf` remains ignored and local-only.
- Dataverse OAuth variables are supplied through the runtime environment, not source control.
- Write access remains disabled until tenant governance approval is complete.

## Deployment Model

This plugin is distributed through the repo-local marketplace:

```text
.agents/plugins/marketplace.json
```

The marketplace points to:

```text
./plugins/power-app-dataverse-codex-plugin
```

The plugin exposes:

- Codex skills under `skills/`
- Dataverse MCP server through `.mcp.json`
- stdio MCP runtime at `mcp/dataverse-mcp.mjs`

## Runtime Requirements

- Node.js 18 or later for the MCP server. Node.js 24 was used for validation.
- Python 3.11 with `PyYAML` available for plugin validation.
- Microsoft Entra app registration with Dataverse API access.
- Dataverse application user configured in the target environment when using client credentials.

## Environment Variables

Use `.env.example` as the template. Required for OAuth client credentials:

```text
DATAVERSE_URL
AZURE_TENANT_ID
AZURE_CLIENT_ID
AZURE_CLIENT_SECRET
```

Optional:

```text
DATAVERSE_OAUTH_SCOPE
DATAVERSE_AUTH_MODE
DATAVERSE_ACCESS_TOKEN
DATAVERSE_ALLOW_WRITES
DATAVERSE_MAX_TOP
DATAVERSE_RETRY_ATTEMPTS
DATAVERSE_RETRY_BASE_MS
DATAVERSE_REQUEST_TIMEOUT_MS
DATAVERSE_AUDIT_LOG
```

## Production Safety Defaults

- `DATAVERSE_ALLOW_WRITES=false` by default.
- Mutating MCP tools require `confirm=true` per call.
- Bulk mutation is not exposed as a one-call tool.
- `dataverse_simulate_bulk_update` provides preview-only behavior.
- OData `top` is capped by `DATAVERSE_MAX_TOP`.
- Reads can use `dataverse_query_all` for bounded pagination.
- Transient 429/5xx responses are retried with backoff.
- Requests are bounded by `DATAVERSE_REQUEST_TIMEOUT_MS`.
- Optional JSONL audit events can be written to `DATAVERSE_AUDIT_LOG`.
- Tool output never prints OAuth secrets.

## Release Checklist

Before release:

1. Run plugin validation.
2. Run MCP syntax check.
3. Run MCP smoke test: `initialize`, `tools/list`, `dataverse_oauth_status`.
4. Test OAuth against a non-production Dataverse environment.
5. Confirm `dataverse_whoami` returns the expected application user or identity.
6. Run read-only metadata and query tests.
7. Review write policy and keep writes disabled unless explicitly approved.
8. Confirm no `.env`, PDF, access token, tenant secret, or client secret is staged.
9. Review `MARKETING.md` claims against what the product can actually do today.
10. Commit only validated source files.

## Operational Runbook

First live checks:

1. Call `dataverse_oauth_status` with `request_token=true`.
2. Call `dataverse_whoami`.
3. Call `dataverse_list_tables`.
4. Call `dataverse_describe_table` for a known table such as `account`.
5. Call `dataverse_query` with a small `top` value.
6. Call `dataverse_query_all` with conservative `max_pages` and `max_records` values when pagination is required.

Write enablement:

1. Review tenant permissions, environment, and operation risk.
2. Set `DATAVERSE_ALLOW_WRITES=true` only in the approved runtime environment.
3. Retrieve or preview target records before mutation.
4. Use single-record writes first.
5. Record the business approval and audit rationale outside the MCP call when required by policy.

## Known Limits

- OAuth uses client credentials or a supplied bearer token; interactive delegated OAuth is not implemented.
- Delegated device-code OAuth is available through `DATAVERSE_AUTH_MODE=device_code`, but production deployments should still prefer tenant-approved service principals or managed identity patterns where supported.
- The MCP server does not implement managed bulk execution.
- Cross-system connectors are strategic roadmap capabilities unless integrated separately.
- Advanced USP documents describe product direction and must not be represented as fully implemented runtime behavior.
