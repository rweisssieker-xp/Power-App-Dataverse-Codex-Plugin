# Security Model

## Authentication

The MCP server authenticates to Microsoft Dataverse through either:

- OAuth2 client credentials using `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, and `AZURE_CLIENT_SECRET`
- a supplied `DATAVERSE_ACCESS_TOKEN` for local troubleshooting
- delegated device-code OAuth using `DATAVERSE_AUTH_MODE=device_code`, `AZURE_TENANT_ID`, and `AZURE_CLIENT_ID`

No token or secret is stored by the plugin. Runtime secrets must be provided through environment variables.

## Authorization

Dataverse authorization is enforced by Microsoft Dataverse through the configured application user or bearer token identity.

Production setup should use least privilege:

- dedicated app registration
- dedicated Dataverse application user
- minimum required security roles
- separate non-production and production registrations where possible
- restricted write privileges unless needed

## Write Safety

Mutating tools are blocked unless both conditions are true:

- `DATAVERSE_ALLOW_WRITES=true`
- the tool call includes `confirm=true`

Affected tools:

- `dataverse_create_record`
- `dataverse_update_record`
- `dataverse_delete_record`
- `dataverse_execute_unbound_action` for `POST`
- `dataverse_execute_bound_action`

Bulk mutation is intentionally not exposed as a one-call operation.

## Data Handling

The MCP server:

- sends requests directly to the configured Dataverse Web API endpoint
- does not persist Dataverse responses
- does not log secrets
- returns Dataverse responses to the MCP client as tool output
- can write optional local JSONL audit events when `DATAVERSE_AUDIT_LOG` is configured

Users must treat tool output as tenant data and handle it according to internal policy.

## Recommended Controls

- Start with read-only validation in a sandbox environment.
- Keep `DATAVERSE_ALLOW_WRITES=false` for routine analysis.
- Require human approval for production writes.
- Use `dataverse_simulate_bulk_update` before any high-impact change.
- Limit `DATAVERSE_MAX_TOP` to a conservative value.
- Keep `DATAVERSE_AUDIT_LOG` outside source control and protect it as tenant metadata.
- Rotate client secrets according to tenant policy.
- Prefer managed identities or certificate-based auth in future production hardening if the host supports it.

## Incident Response

If a credential is exposed:

1. Revoke or rotate the Microsoft Entra client secret.
2. Review Dataverse audit logs for the application user.
3. Remove the secret from any local files.
4. If the secret was committed, clean repository history before pushing.
5. Reinstall or restart the plugin runtime with the new secret.

## Non-Goals

The plugin does not currently provide:

- interactive delegated OAuth
- row-level policy beyond Dataverse native authorization
- managed bulk rollback
- SIEM integration
- automated DLP policy remediation
