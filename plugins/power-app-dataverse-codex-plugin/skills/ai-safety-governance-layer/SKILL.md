---
name: ai-safety-governance-layer
description: Use when reviewing Dataverse AI actions for permissions, policy validation, risk assessment, approval routing, auditability, and explainability. Produces governance guidance only; it does not enforce policies in a live tenant.
---

# AI Safety Governance Layer

## Purpose
Review proposed Dataverse and Power Platform AI actions before execution design is approved.

Use this skill for:
- permission and role review
- compliance and DLP risk review
- approval routing design
- explainable action requirements
- audit logging and rollback planning
- bulk update and high-impact action safety

## V1 Boundary
This skill provides governance analysis and design recommendations only. It must not claim that a live tenant policy has been checked or enforced.

## Workflow
1. Identify action impact: data sensitivity, record count, affected processes, integrations, and reversibility.
2. Assess actor authorization: role, team membership, business unit scope, field security, and environment access assumptions.
3. Define policy checks: DLP, compliance, approval threshold, segregation of duties, data retention, and business rule constraints.
4. Require simulation for risky actions: preview selected records, predicted changes, downstream effects, and blocked records.
5. Design approval routing for medium and high risk: approver roles, escalation path, timeout behavior, and evidence package.
6. Specify explainability: why the action is recommended, which data is used, which rules apply, and what will change.

## Output Format
Return:
- `Risk rating`: low, medium, high, or blocked, with rationale.
- `Required checks`: permissions, policies, dependencies, and data quality validations.
- `Approval path`: who must approve and when.
- `Simulation requirements`: preview and impact details.
- `Audit requirements`: fields, evidence, and explanation text to store.
- `Blocking issues`: items that must be resolved before implementation.

