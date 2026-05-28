# AI USP Positioning

## Core USP

Dataverse AI Action Platform is not "AI for Power Apps". It is a governed conversational enterprise execution layer for Dataverse and Power Platform.

## Top USPs

| USP | Target user | Pain solved | AI mechanism | Differentiation | MVP | Success signal |
| --- | --- | --- | --- | --- | --- | --- |
| Governed Autonomous Execution | Business users, process owners, IT governance | Users need actions completed, but enterprises need control | Intent planning plus permission, policy, approval, simulation, and audit gates | Moves beyond assistance into controlled execution | MCP reads plus confirmed single-record writes | Time from request to approved action drops |
| Dataverse Semantic Graph Intelligence | Architects, makers, admins | Dataverse relationships and dependencies are hard to reason about | Metadata and relationship-aware action planning | Treats Dataverse as enterprise graph, not flat tables | Metadata tools plus action-design skills | Fewer missed dependencies in action plans |
| Action Simulation Before Execution | Operations, compliance, admins | Bulk changes are risky and hard to review | Preview selected records and proposed impact before mutation | Safety-first execution model | `dataverse_simulate_bulk_update` | Lower rollback/error rate |
| Business User Command Layer | Sales, service, operations, management | Users waste time in forms, views, ribbons, and table navigation | Natural-language command parsing to Dataverse actions | Replaces navigation with intent | Command-bar design skill plus MCP reads | More actions completed without app navigation |
| Explainable Enterprise Actions | Compliance, managers, auditors | AI actions are hard to trust | Every action explains why, data used, rules, dependencies, and impact | Audit-ready AI behavior | Explainability skill plus MCP evidence collection | Higher approval rate for AI-assisted actions |
| AI Governance Copilot for Power Platform | Platform admins, ALM teams | Deployments fail from dependencies, flows, environment variables, and connection references | Structured ALM readiness review and Dataverse metadata inspection | Combines ALM and AI governance | ALM skill plus metadata tools | Fewer failed imports and hotfixes |
| AI Action Marketplace | Center of Excellence, partners | Reusable process automation is hard to package and govern | Action packs with metadata, permissions, policy, and lifecycle | Extensible enterprise action ecosystem | Marketplace design skill | Reuse rate of approved action packs |
| Compliance Evidence Automation | Compliance, audit, governance | AI actions need proof, not just output | Evidence capture for actor, reason, data, rule, approval, and impact | Makes AI actions audit-ready by design | Evidence template plus action audit payload | Lower audit preparation effort |
| Trust Score for AI Actions | Business approvers, admins, risk owners | Users cannot quickly judge whether AI actions are safe | Score combining data quality, permissions, policy, reversibility, and impact | Turns trust into an operational control | Trust score rubric in action plans | More actions approved with fewer escalations |
| Enterprise Change Impact AI | Platform owners, architects, release teams | Power Platform changes have hidden downstream effects | Dependency and impact analysis across assets, teams, KPIs, and systems | Converts technical change into business impact | Metadata-backed impact brief | Fewer release surprises |
| Tenant-Specific AI Skill Factory | Center of Excellence, solution owners | Generic AI workflows do not fit tenant-specific processes | Generates local skills from metadata, terminology, approvals, and governance | Makes the platform defensible through tenant context | Skill blueprint generator | Number of reusable tenant skills adopted |
| Autonomous Exception Management | Operations, service, PMO | Exceptions are detected late and routed manually | Classify exceptions, recommend next action, and route ownership | Makes AI operational, not only analytical | Exception triage playbook | Faster exception resolution |

## Fast MVP

Use OAuth MCP for read-only metadata and record inspection, then combine it with guidance skills to produce:

1. intent-to-action design
2. Dataverse metadata evidence
3. risk and approval model
4. simulation preview
5. implementation brief

## Do Not Build

Do not ship broad autonomous bulk mutation as the first runtime feature. Start with read-only inspection, simulation, and confirmed single-record operations. Bulk execution needs stronger transaction design, approval routing, rollback strategy, and tenant-specific governance.

Do not claim autonomous remediation, cross-tenant rollout automation, or continuous learning as production-complete until live telemetry, approval routing, and audit evidence have been validated in a tenant.
