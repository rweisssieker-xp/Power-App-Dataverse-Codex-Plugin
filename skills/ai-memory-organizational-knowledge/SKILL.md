---
name: ai-memory-organizational-knowledge
description: Use when designing organizational memory for Dataverse AI actions, including user behavior, processes, preferences, common actions, approval patterns, and company language. Produces memory design guidance only.
---

# AI Memory And Organizational Knowledge

## Purpose
Design enterprise-safe memory that makes Dataverse AI actions more personalized, consistent, and process-aware.

Use this skill for:
- user preference and frequent-action memory
- approval pattern learning
- company terminology and process vocabulary
- intelligent defaults
- adaptive process recommendations
- organizational knowledge capture

## V1 Boundary
This skill designs memory structures and governance only. It does not store, retrieve, or learn from live organizational data.

## Workflow
1. Identify useful memory categories: user behavior, preferences, frequent actions, approval patterns, company language, and process history.
2. Classify each memory item by sensitivity, owner, retention, consent, and access scope.
3. Define how memory should influence defaults without bypassing validation, permissions, or approvals.
4. Define review and correction flows for wrong memory, stale defaults, or policy conflicts.
5. Define audit and transparency requirements so users know which memory influenced an action.

## Output Format
Return:
- `Memory categories`: what the system should remember and why.
- `Access and retention`: owner, scope, consent, retention, and deletion model.
- `Personalization rules`: safe defaults and forbidden shortcuts.
- `Transparency`: how memory influence is explained.
- `Governance risks`: privacy, compliance, and stale-context controls.

