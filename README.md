# Power App Dataverse Codex Plugin

This repository contains a repo-local Codex plugin for Dataverse and Power Platform:

`plugins/power-app-dataverse-codex-plugin`

The plugin positions Dataverse as an autonomous enterprise intelligence platform with:

- Dataverse and Power Platform AI action design skills
- Advanced AI USP coverage from organizational cognitive graph to intent-driven enterprise computing
- Monetizable enterprise USPs such as trust scoring, compliance evidence, change impact intelligence, autonomous remediation playbooks, tenant-specific skill generation, and operating cadence automation
- A real stdio MCP server for Microsoft Dataverse Web API access through OAuth2 client credentials
- Safety-gated write tools for create, update, delete, and Dataverse action execution

## Production and Marketing Docs

- [Production Readiness](PRODUCTION.md)
- [Security Model](SECURITY.md)
- [Marketing Positioning](MARKETING.md)
- [Environment Template](.env.example)

## Repository Layout

```text
.codex-plugin/plugin.json
.mcp.json
.agents/plugins/marketplace.json
mcp/dataverse-mcp.mjs
skills/
plugins/power-app-dataverse-codex-plugin/
  .codex-plugin/plugin.json
  .mcp.json
  mcp/dataverse-mcp.mjs
  skills/
  README.md
  POSITIONING.md
  ADVANCED_USPS.md
```

## Plugin Discovery

GitHub and Codex artifact validation can discover the plugin from the repository root:

```text
.codex-plugin/plugin.json
.mcp.json
skills/
mcp/
```

The repo-local marketplace entry points to:

```text
./plugins/power-app-dataverse-codex-plugin
```

Plugin manifest:

```text
.codex-plugin/plugin.json
plugins/power-app-dataverse-codex-plugin/.codex-plugin/plugin.json
```

MCP manifest:

```text
.mcp.json
plugins/power-app-dataverse-codex-plugin/.mcp.json
```

## Dataverse MCP OAuth Setup

Set these environment variables before using the live Dataverse MCP tools:

```text
DATAVERSE_URL=https://your-org.crm4.dynamics.com
AZURE_TENANT_ID=<tenant-id>
AZURE_CLIENT_ID=<app-registration-client-id>
AZURE_CLIENT_SECRET=
DATAVERSE_ALLOW_WRITES=false
```

Optional:

```text
DATAVERSE_OAUTH_SCOPE=https://your-org.crm4.dynamics.com/.default
DATAVERSE_ACCESS_TOKEN=<direct-bearer-token-instead-of-client-credentials>
DATAVERSE_MAX_TOP=500
```

Writes are blocked unless `DATAVERSE_ALLOW_WRITES=true` and the tool call includes `confirm=true`.

## Validation

Run plugin validation with:

```powershell
python 'C:\Users\reinerw\.codex\skills\.system\plugin-creator\scripts\validate_plugin.py' 'D:\temp\Power-App-Dataverse-Codex-Plugin'
```

Run the MCP syntax check with:

```powershell
node --check mcp\dataverse-mcp.mjs
```

Run the MCP smoke test manually by starting the plugin in Codex after setting the variables in `.env.example`, then call:

1. `dataverse_oauth_status`
2. `dataverse_whoami`
3. `dataverse_list_tables`

## Local PRD PDF

`dataverseplugin.pdf` is intentionally local-only and ignored by Git. Do not commit it to GitHub.
