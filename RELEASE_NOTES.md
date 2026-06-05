# Release Notes

## v0.1.0

Initial production-ready plugin source package.

### Added

- Root Codex plugin artifact: `.codex-plugin/plugin.json`
- Root MCP artifact: `.mcp.json`
- Dataverse MCP server with OAuth-backed Web API access
- Repo-local and root-level skill layouts
- Dataverse AI action design skills
- Advanced enterprise intelligence USP documentation
- Marketing, security, production, and tenant setup documentation
- GitHub Actions validation workflow
- MCP smoke and tool tests

### MCP Capabilities

- OAuth status and `WhoAmI`
- Metadata inspection
- Record query and retrieve
- Bounded pagination
- Safety-gated create, update, delete, and action execution
- Bulk operation simulation and planning
- Trust score calculation
- Compliance evidence schema
- Change impact analysis
- ALM and solution inspection
- Security context inspection
- Optional JSONL audit logging

### Security Defaults

- Writes disabled by default
- `confirm=true` required for mutating tools
- Entity-set and column safety policy support
- No secrets committed
- Local PRD PDF ignored

### Known Limits

- No managed bulk executor
- No automatic rollback engine
- Cross-system connectors are roadmap features
- Live tenant validation must be performed by the deploying team

