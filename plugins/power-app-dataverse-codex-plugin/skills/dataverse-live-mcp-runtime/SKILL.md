---
name: dataverse-live-mcp-runtime
description: Use when the user wants to inspect or operate a real Microsoft Dataverse environment through the plugin MCP server with OAuth2 client credentials. Supports metadata, query, retrieve, create, update, delete, action execution, and simulation tools.
---

# Dataverse Live MCP Runtime

## Purpose
Use the plugin's MCP server to work with a real Dataverse environment through Microsoft OAuth2 and the Dataverse Web API.

Use this skill when the user asks to:
- connect to Dataverse
- inspect table metadata
- query or retrieve records
- run `WhoAmI`
- simulate a bulk operation
- create, update, delete, or execute a Dataverse action after explicit confirmation

## Required Configuration
The MCP server reads these environment variables:
- `DATAVERSE_URL`: Dataverse org URL, for example `https://org.crm4.dynamics.com`
- `AZURE_TENANT_ID`: Microsoft Entra tenant ID
- `AZURE_CLIENT_ID`: app registration client ID
- `AZURE_CLIENT_SECRET`: client secret
- `DATAVERSE_OAUTH_SCOPE`: optional override; defaults to `<DATAVERSE_URL>/.default`
- `DATAVERSE_AUTH_MODE`: `auto`, `client_credentials`, or `device_code`
- `AZURE_CLIENT_CERTIFICATE_PRIVATE_KEY_PEM`, `AZURE_CLIENT_CERTIFICATE_THUMBPRINT`: optional certificate authentication
- `AZURE_MANAGED_IDENTITY_CLIENT_ID`: optional managed identity client ID
- `DATAVERSE_ACCESS_TOKEN`: optional direct bearer token alternative
- `DATAVERSE_ALLOW_WRITES`: must be `true` before create, update, delete, or POST action tools can mutate data
- `DATAVERSE_MAX_TOP`: optional maximum OData page size cap; defaults to `500`
- `DATAVERSE_RETRY_ATTEMPTS`: retry attempts for throttling and transient failures
- `DATAVERSE_REQUEST_TIMEOUT_MS`: request timeout in milliseconds
- `DATAVERSE_AUDIT_LOG`: optional local JSONL audit-log path
- `DATAVERSE_ALLOWED_ENTITY_SETS`, `DATAVERSE_BLOCKED_ENTITY_SETS`, `DATAVERSE_BLOCKED_COLUMNS`: optional OData safety policy

## Safety Rules
1. Prefer read-only tools first: `dataverse_oauth_status`, `dataverse_whoami`, `dataverse_list_tables`, `dataverse_describe_table`, `dataverse_query`, and `dataverse_retrieve_record`.
2. Before any write, preview or retrieve the target records and summarize the exact mutation.
3. Use write tools only when `DATAVERSE_ALLOW_WRITES=true` and the user explicitly authorizes the operation.
4. Pass `confirm=true` only after the intended mutation is clear.
5. For bulk changes, use `dataverse_simulate_bulk_update` first. The current MCP server intentionally does not provide a one-call bulk mutation tool.

## Available Tool Families
- OAuth/status: `dataverse_oauth_status`
- Identity: `dataverse_whoami`
- Metadata: `dataverse_list_tables`, `dataverse_describe_table`
- Read records: `dataverse_query`, `dataverse_retrieve_record`
- Paginated reads: `dataverse_query_all`
- Mutate records: `dataverse_create_record`, `dataverse_update_record`, `dataverse_delete_record`
- Execute actions: `dataverse_execute_unbound_action`, `dataverse_execute_bound_action`
- Safety preview: `dataverse_simulate_bulk_update`
- Audit status: `dataverse_audit_status`
- Trust and evidence: `dataverse_compliance_evidence_schema`, `dataverse_calculate_action_trust_score`
- Change impact: `dataverse_analyze_change_impact`
- ALM and solution review: `dataverse_list_solutions`, `dataverse_describe_solution`, `dataverse_environment_variable_report`, `dataverse_check_solution_dependencies`
- Security context: `dataverse_get_security_context`
- Permission evaluation: `dataverse_evaluate_action_permission`
- Bulk planning: `dataverse_plan_bulk_operation`
- Stable schemas: `dataverse_result_schemas`

## Output Expectations
When using live tools, report:
- the environment URL without secrets
- which tool was called
- whether the operation was read-only or mutating
- key returned IDs or record counts
- any follow-up safety or governance concern
