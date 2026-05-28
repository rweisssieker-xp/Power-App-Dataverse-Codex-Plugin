---
name: workflow-orchestrator
description: Use when designing multi-step Dataverse, Dynamics, Power Apps, or Power Automate workflows controlled through natural language. Produces orchestration plans only and does not run workflows.
---

# Workflow Orchestrator

## Purpose
Design autonomous or semi-autonomous enterprise workflows where an AI action runtime plans steps, asks for missing information, routes approvals, and monitors progress.

Use this skill for examples such as:
- supplier onboarding
- opportunity-to-project conversion
- customer escalation handling
- quarter closing
- compliance audit preparation
- service ticket triage

## V1 Boundary
This skill creates workflow designs and implementation guidance only. It does not start Power Automate flows, update Dataverse, send Teams messages, or monitor live processes.

## Workflow
1. Define the workflow objective, initiating user, success state, and stopping conditions.
2. Break the process into deterministic steps, AI-assisted decisions, user confirmations, approvals, and external integrations.
3. Map each step to Dataverse records, Power Automate flows, business process flows, plugin logic, notifications, and documents where relevant.
4. Add orchestration controls: retries, timeouts, escalation, human handoff, dependency checks, and partial completion handling.
5. Define monitoring outputs: status timeline, pending approvals, failed steps, evidence, and next best action.

## Output Format
Return:
- `Workflow objective`: concise business outcome.
- `Process map`: ordered phases and responsibilities.
- `Dataverse/Power Platform components`: tables, flows, apps, plugins, and integrations to inspect or build.
- `Decision and approval points`: questions, thresholds, and approvers.
- `Failure handling`: retries, escalations, manual fallback, and rollback guidance.
- `Monitoring view`: status, evidence, and progress signals.

