---
name: alm-solution-readiness
description: Use when reviewing Power Apps, Dataverse, Dynamics, or Power Platform solution readiness for ALM, dependencies, environment variables, connection references, flows, security, and deployment planning. Produces review guidance only.
---

# ALM Solution Readiness

## Purpose
Review a Dataverse or Power Platform solution for deployment readiness and operational quality.

Use this skill for:
- managed solution release planning
- dependency validation
- environment variable review
- connection reference review
- cloud flow readiness
- security role and sharing model review
- solution checker interpretation
- deployment runbook creation

## V1 Boundary
This skill does not inspect live environments, run solution checker, export solutions, or deploy packages. It produces review plans, checklists, and implementation guidance.

## Workflow
1. Identify source and target environments, solution type, publisher, dependencies, and deployment path.
2. Review Dataverse components: tables, columns, relationships, forms, views, commands, business rules, processes, and security roles.
3. Review Power Platform components: canvas apps, model-driven apps, cloud flows, custom connectors, environment variables, and connection references.
4. Define pre-deployment checks: missing dependencies, unmanaged customizations, inactive flows, hard-coded IDs, DLP conflicts, and environment-specific configuration.
5. Define release controls: backup, import sequence, smoke tests, rollback plan, owner handoff, and post-deployment monitoring.

## Output Format
Return:
- `Readiness rating`: ready, at risk, or blocked.
- `Component review`: Dataverse and Power Platform areas to inspect.
- `Dependency risks`: missing or environment-specific dependencies.
- `Configuration checklist`: environment variables, connection references, owners, and permissions.
- `Deployment runbook`: import sequence, smoke tests, rollback, and acceptance criteria.
- `Open risks`: unresolved issues before release.

