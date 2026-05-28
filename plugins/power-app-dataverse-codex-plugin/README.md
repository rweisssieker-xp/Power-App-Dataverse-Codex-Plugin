# Dataverse AI Action Platform

Repo-local Codex plugin for the PRD vision from the local PRD PDF: a conversational enterprise execution platform for Dataverse and Power Apps.

The plugin provides both:
- Guidance skills for architecture, planning, review, governance, UX, and product positioning.
- A real stdio MCP server for Microsoft Dataverse Web API access through OAuth2 client credentials.

The MCP server can inspect metadata, query records, retrieve records, simulate bulk updates, create/update/delete records, and execute Dataverse actions. Mutating tools are blocked unless `DATAVERSE_ALLOW_WRITES=true` and the individual tool call passes `confirm=true`.

## OAuth MCP Setup

Configure these environment variables before using the MCP server:

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

The Entra app registration must be allowed to access Dataverse in the target environment. The recommended first live checks are:

1. `dataverse_oauth_status` with `request_token=true`
2. `dataverse_whoami`
3. `dataverse_list_tables`

Keep `DATAVERSE_ALLOW_WRITES=false` until the target environment, permissions, and operation risk have been reviewed.

## PRD Coverage

| PRD item | Implemented plugin skill |
| --- | --- |
| 1. Universal Action Engine | `universal-action-engine` |
| 2. Intent-to-Action Engine | `intent-to-action-engine` |
| 3. Autonomous Workflow Orchestrator | `workflow-orchestrator` |
| 4. Context-aware Dataverse AI | `context-aware-dataverse-ai` |
| 5. Conversational ERP / CRM Layer | `conversational-erp-crm-layer` |
| 6. AI-generated UI on Demand | `ai-generated-ui-on-demand` |
| 7. Multi-Agent Action System | `multi-agent-action-system` |
| 8. Autonomous Data Operations | `dataverse-data-operations` |
| 9. AI Memory & Organizational Knowledge | `ai-memory-organizational-knowledge` |
| 10. Voice-first Enterprise Operations | `voice-first-enterprise-operations` |
| 11. AI Action Marketplace | `ai-action-marketplace` |
| 12. Universal Enterprise Command Bar | `universal-enterprise-command-bar` |
| 13. Predictive Action Intelligence | `predictive-action-intelligence` |
| 14. AI Safety & Governance Layer | `ai-safety-governance-layer` |
| 15. Explainable Actions | `explainable-actions` |
| 16. Enduser UX Principles | `enduser-first-ux` |
| 17. Future Vision | `future-vision` |
| 18. Strategic Differentiation | `strategic-differentiation` |
| 19. Revolutionary USP | `revolutionary-usp` |

Additional delivery skills:

- `alm-solution-readiness` supports Dataverse and Power Platform solution delivery quality.
- `dataverse-live-mcp-runtime` covers real OAuth MCP usage and live Dataverse safety rules.
- `advanced-enterprise-intelligence-platform` covers the advanced USP expansion from Organizational Cognitive Graph through Intent-Driven Enterprise Computing.
- `enterprise-usp-monetization-pack` covers compliance evidence, ROI scoring, remediation playbooks, tenant-specific skill generation, cross-tenant rollout, capability maps, trust scoring, exception management, change impact, and operating cadence.

## Advanced AI USP Expansion

The advanced USP expansion is documented in `ADVANCED_USPS.md`. It extends the product from a Dataverse AI action plugin into an autonomous enterprise intelligence platform:

- Enterprise Cognitive Execution System
- Enterprise Intelligence as Runtime
- AI Operating System for enterprises
- Dataverse as enterprise memory, semantic graph, runtime layer, decision model, and process network
- Power Platform as an autonomous execution system
- AI as the enterprise orchestrator

The monetizable USP pack extends this with:

- Compliance Evidence Automation
- ROI and Process Value Scoring
- Autonomous Remediation Playbooks
- Tenant-Specific AI Skill Factory
- Governed Cross-Tenant Rollout
- Business Capability Map
- Trust Score for AI Actions
- Autonomous Exception Management
- Enterprise Change Impact AI
- AI-Controlled Operating Cadence

## Live MCP Tools

| Tool | Purpose |
| --- | --- |
| `dataverse_oauth_status` | Check OAuth and Dataverse configuration without exposing secrets |
| `dataverse_whoami` | Verify the connected Dataverse identity |
| `dataverse_list_tables` | List table metadata from `EntityDefinitions` |
| `dataverse_describe_table` | Inspect table metadata and attributes |
| `dataverse_query` | Run OData reads against an entity set |
| `dataverse_retrieve_record` | Retrieve one record by GUID |
| `dataverse_simulate_bulk_update` | Preview bulk-update scope without mutating records |
| `dataverse_create_record` | Create a record, gated by write enablement and confirmation |
| `dataverse_update_record` | Update a record, gated by write enablement and confirmation |
| `dataverse_delete_record` | Delete a record, gated by write enablement and confirmation |
| `dataverse_execute_unbound_action` | Execute unbound Dataverse actions/functions |
| `dataverse_execute_bound_action` | Execute bound Dataverse actions on a record |
