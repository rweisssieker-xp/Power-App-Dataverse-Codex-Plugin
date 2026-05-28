---
name: universal-action-engine
description: Use when designing the central runtime concept that interprets natural language, business intent, context, roles, and history into Dataverse operations, Power Automate flows, APIs, plugins, business processes, and multi-step workflows. Produces architecture guidance only.
---

# Universal Action Engine

## Purpose
Design the central action runtime that turns authorized enterprise intent into a governed action plan across Dataverse and Power Platform.

Use this skill when a user needs to plan:
- natural-language enterprise actions
- role-aware Dataverse operations
- Power Automate flow orchestration
- API or plugin-backed actions
- business process flow automation
- multi-step action execution plans

## V1 Boundary
This skill produces architecture, contracts, and implementation guidance only. It does not connect to Dataverse, call APIs, run flows, execute plugins, or mutate records.

## Workflow
1. Capture natural language, business intent, actor role, current context, and historical-action assumptions.
2. Convert the request into an action graph covering Dataverse operations, flows, APIs, plugins, business processes, and workflow steps.
3. Define each action node with inputs, validation, permissions, dependencies, side effects, audit output, and confirmation rules.
4. Add orchestration controls for sequencing, retries, human approval, fallback, and rollback.
5. Define implementation boundaries between AI planner, policy checker, Dataverse connector, flow runner, audit service, and user interaction layer.

## Output Format
Return:
- `Runtime concept`: concise description of the universal action engine.
- `Action graph`: action nodes, dependencies, and execution order.
- `Platform mapping`: Dataverse operations, flows, APIs, plugins, and business processes.
- `Control plane`: permissions, policies, approvals, simulation, and audit.
- `Implementation blueprint`: components and interfaces to build in a future runtime.

