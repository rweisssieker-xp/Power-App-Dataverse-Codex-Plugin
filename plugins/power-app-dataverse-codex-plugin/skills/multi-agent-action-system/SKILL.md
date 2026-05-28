---
name: multi-agent-action-system
description: Use when designing specialized Dataverse AI agents for sales, operations, compliance, data stewardship, ALM, or other enterprise action domains. Produces an operating model only and does not run agents.
---

# Multi-Agent Action System

## Purpose
Design a multi-agent operating model for Dataverse and Power Platform actions.

Use this skill to define:
- Sales Agent for quotes, forecasts, pipeline, and customer analysis
- Operations Agent for processes, tickets, and escalations
- Compliance Agent for audits, DLP, policies, and risk analysis
- Data Steward Agent for data quality, duplicates, ownership, and validation
- ALM Agent for deployments, solution checks, and dependency validation

## V1 Boundary
This skill defines roles, responsibilities, handoffs, and governance only. It does not spawn or operate live agents.

## Workflow
1. Identify the business domain and required specialist agents.
2. Assign each agent clear responsibilities, allowed decisions, required evidence, and escalation boundaries.
3. Define handoff contracts between agents: input, output, confidence, risks, and approvals.
4. Define shared memory and audit requirements while avoiding unauthorized cross-domain data exposure.
5. Define governance: owner, approval model, monitoring, failure handling, and human override.

## Output Format
Return:
- `Agent map`: specialist agents and responsibilities.
- `Handoff model`: inputs, outputs, confidence, and escalation rules.
- `Shared context`: what can be shared and what must stay restricted.
- `Governance model`: approvals, audit, monitoring, and override.
- `Implementation path`: skills, flows, queues, and Dataverse structures to design.

