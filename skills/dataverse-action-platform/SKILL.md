---
name: dataverse-action-platform
description: Use when a user wants to turn a business request into a Dataverse or Power Platform AI action design. Produces guidance, action plans, checks, and implementation prompts only; it does not connect to or execute against live Dataverse.
---

# Dataverse Action Platform

## Purpose
Turn natural-language business intent into a governed Dataverse and Power Platform action design.

Use this skill for requests such as:
- "Create an offer from this customer request."
- "Start a supplier onboarding workflow."
- "Build an AI action for opportunity-to-project conversion."
- "Make Dataverse usable through a universal command bar."

## V1 Boundary
This skill is guidance-only. It can design actions, checks, prompts, data mappings, and implementation steps. It must not claim to authenticate to Dataverse, call Dataverse APIs, mutate records, run flows, or verify live tenant state.

## Workflow
1. Capture the business intent, actor, desired outcome, triggering phrase, and expected confirmation flow.
2. Identify likely Dataverse tables, relationships, security roles, business process flows, Power Automate flows, plugins, and integration touchpoints.
3. Classify the action as create, read, update, delete, approval, workflow start, report, analysis, escalation, migration, or bulk operation.
4. Define the action contract: required inputs, inferred context, validation checks, generated records, changed records, side effects, and audit events.
5. Add safety controls: permissions, policy checks, risk level, approval thresholds, simulation mode, rollback guidance, and explainability requirements.
6. Produce an implementation-ready action brief for a maker, Dataverse developer, or solution architect.

## Output Format
Return:
- `Action summary`: one paragraph describing the enterprise action.
- `Intent model`: supported utterances, required entities, and disambiguation questions.
- `Dataverse design`: tables, columns, relationships, flows, business rules, and integrations to inspect or create.
- `Execution plan`: ordered steps the future runtime or human implementer would perform.
- `Governance controls`: permission checks, approvals, audit trail, and risk handling.
- `Open decisions`: only the product or tenant-specific decisions that cannot be inferred.

