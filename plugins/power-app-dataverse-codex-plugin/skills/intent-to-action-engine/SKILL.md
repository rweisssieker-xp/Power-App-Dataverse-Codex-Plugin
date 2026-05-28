---
name: intent-to-action-engine
description: Use when mapping a natural-language Dataverse or Power Apps request to CRUD, workflow, approval, reporting, analysis, escalation, migration, or bulk-operation behavior. Produces plans only and performs no live execution.
---

# Intent To Action Engine

## Purpose
Map end-user language to safe, explicit Dataverse action semantics.

Use this skill when the user provides an intent such as:
- "Move all opportunities over 100k into Q4 forecast."
- "Show critical tickets from the last seven days."
- "Approve all vacation requests under three days."
- "Fix orphaned contacts in the north region."

## V1 Boundary
This skill does not query Dataverse or perform actions. It produces an intent classification and action plan for implementation or review.

## Workflow
1. Parse the request into actor, verb, target records, filters, thresholds, time window, destination state, and expected result.
2. Classify the intent into one or more action types: CRUD, approval, workflow start, report, analysis, escalation, migration, bulk update, or compliance action.
3. Identify required Dataverse context: tables, relationships, ownership model, status/state fields, security roles, business rules, and solution components.
4. Define validation requirements before execution: record selection preview, permission check, duplicate/constraint check, dependency check, and confirmation requirement.
5. Describe expected outputs: created or updated records, generated report, started process, notification, audit log, and explainable action summary.

## Output Format
Return:
- `Intent classification`: action type and confidence.
- `Entity and filter model`: likely Dataverse tables, fields, relationships, and filters.
- `Pre-execution validation`: checks required before any action.
- `Action steps`: ordered logical operations.
- `User confirmation`: exact clarification or approval prompts.
- `Audit explanation`: what should be logged and how the action should explain itself.

