# Dataverse Tenant Setup Guide

## Goal

Configure Microsoft Entra and Dataverse so the plugin MCP server can access Dataverse Web API safely.

## Option A - Client Credentials

1. Create a Microsoft Entra app registration.
2. Record:
   - tenant ID
   - client ID
   - client secret
3. In Power Platform Admin Center, open the target environment.
4. Create or map an application user for the app registration.
5. Assign the minimum Dataverse security role required for the intended tools.
6. Configure:

```text
DATAVERSE_URL=https://your-org.crm4.dynamics.com
AZURE_TENANT_ID=<tenant-id>
AZURE_CLIENT_ID=<client-id>
AZURE_CLIENT_SECRET=
DATAVERSE_AUTH_MODE=client_credentials
DATAVERSE_ALLOW_WRITES=false
```

Set the real secret only in the runtime environment, never in source control.

## Option B - Certificate Authentication

Use certificate auth when client secrets are not acceptable.

Configure:

```text
DATAVERSE_AUTH_MODE=certificate
AZURE_CLIENT_CERTIFICATE_PEM=
AZURE_CLIENT_CERTIFICATE_PRIVATE_KEY_PEM=
AZURE_CLIENT_CERTIFICATE_THUMBPRINT=
```

The certificate must be registered on the Entra app registration.

## Option C - Device Code

Use delegated device-code OAuth for local validation when an admin approves delegated access.

Configure:

```text
DATAVERSE_AUTH_MODE=device_code
AZURE_TENANT_ID=<tenant-id>
AZURE_CLIENT_ID=<client-id>
```

The MCP server prints the Microsoft sign-in instructions to stderr.

## Option D - Managed Identity

Use managed identity when the runtime host supports it.

Configure:

```text
DATAVERSE_AUTH_MODE=managed_identity
AZURE_MANAGED_IDENTITY_CLIENT_ID=<optional-user-assigned-client-id>
```

The managed identity must be authorized in Dataverse.

## First Live Smoke Test

1. Keep writes disabled:

```text
DATAVERSE_ALLOW_WRITES=false
```

2. Call:

```text
dataverse_oauth_status
dataverse_whoami
dataverse_list_tables
dataverse_describe_table
dataverse_query
dataverse_get_security_context
```

3. Confirm:

- the expected Dataverse organization URL is used
- the expected user or application identity is returned
- only approved tables can be read
- no sensitive columns are exposed

## Recommended Safety Policy

Start with:

```text
DATAVERSE_ALLOWED_ENTITY_SETS=accounts,contacts,opportunities
DATAVERSE_BLOCKED_ENTITY_SETS=auditlogs
DATAVERSE_BLOCKED_COLUMNS=ssn,creditcardnumber
DATAVERSE_MAX_TOP=100
```

Adjust to tenant policy.

## Write Enablement

Enable writes only after:

1. Sandbox read-only tests pass.
2. Security roles are reviewed.
3. Approval policy is documented.
4. Audit-log location is configured outside source control.
5. A rollback plan exists.

Then set:

```text
DATAVERSE_ALLOW_WRITES=true
```

Every mutating tool still requires `confirm=true`.

