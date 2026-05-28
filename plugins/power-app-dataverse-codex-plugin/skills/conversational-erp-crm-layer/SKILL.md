---
name: conversational-erp-crm-layer
description: Use when designing a dialog-first ERP or CRM operating layer over Dataverse, Dynamics, or Power Platform apps. Produces architecture and interaction guidance only; it does not replace or control live applications.
---

# Conversational ERP CRM Layer

## Purpose
Design how Dataverse-based ERP and CRM processes can be operated through natural language instead of classic forms, ribbons, menus, and table navigation.

Use this skill for:
- Dynamics or Dataverse command experiences
- CRM pipeline actions by conversation
- service and operations workflows by chat
- process-first app modernization
- natural-language alternatives to form-heavy workflows

## V1 Boundary
This skill provides design and implementation guidance only. It does not control Dynamics, Power Apps, or Dataverse at runtime.

## Workflow
1. Identify the business process that should become conversational.
2. Replace screen navigation with user intents, commands, confirmations, and generated task views.
3. Map each conversational action to Dataverse records, business process flows, cloud flows, approvals, and reports.
4. Define how the user sees state: summary, next action, blockers, approvals, and audit evidence.
5. Preserve enterprise controls: permissions, approvals, DLP, logging, and rollback paths.

## Output Format
Return:
- `Conversational process`: process name, users, and target outcomes.
- `Intent catalog`: user utterances and supported commands.
- `Dataverse mapping`: tables, processes, flows, and reports involved.
- `Interaction model`: questions, confirmations, generated views, and status responses.
- `Enterprise controls`: security, audit, approvals, and failure handling.

