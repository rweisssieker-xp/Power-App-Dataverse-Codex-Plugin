---
name: ai-action-marketplace
description: Use when designing extensible Dataverse action packs, AI skills, workflow agents, industry modules, or reusable Dataverse skills. Produces marketplace architecture guidance only.
---

# AI Action Marketplace

## Purpose
Design a marketplace model where reusable Dataverse and Power Platform action packs can be discovered, governed, installed, and reused.

Use this skill for:
- action packs
- AI skills
- workflow agents
- industry modules
- reusable Dataverse skills
- partner extension models

## V1 Boundary
This skill designs marketplace structure and governance only. It does not publish, install, or execute marketplace packages.

## Workflow
1. Define the target extension type: action pack, workflow agent, industry module, skill, or connector guidance.
2. Define package metadata: name, owner, business domain, supported tables, required flows, permissions, policies, and dependencies.
3. Define trust controls: publisher verification, security review, DLP classification, risk rating, and approval before use.
4. Define lifecycle: versioning, compatibility, install, update, deprecation, rollback, and audit.
5. Define user discovery: categories, starter prompts, examples, and tenant-specific availability.

## Output Format
Return:
- `Package concept`: what the action pack or agent provides.
- `Metadata model`: owner, dependencies, permissions, policies, and supported scenarios.
- `Governance`: trust, review, approval, and risk controls.
- `Lifecycle`: versioning, install, update, rollback, and retirement.
- `Discovery experience`: categories, prompts, examples, and audience.

