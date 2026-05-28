---
name: explainable-actions
description: Use when designing explanations for Dataverse AI actions, including why an action is recommended, what data was used, which rules applied, dependencies, and expected impact. Produces explanation guidance only.
---

# Explainable Actions

## Purpose
Design explanations that make every AI-planned Dataverse action traceable and understandable.

Use this skill when a user needs to explain:
- why an action is recommended
- which data influenced the action
- which rules or policies apply
- which dependencies or records are affected
- what impact the action will have
- what was done after approval

## V1 Boundary
This skill creates explanation structures and review guidance only. It does not inspect or log live action execution.

## Workflow
1. Identify the action, affected records, decision rules, source data, and expected business impact.
2. Separate user-friendly explanation from technical trace details.
3. Include permission, policy, dependency, and approval context.
4. Define before-action and after-action explanation requirements.
5. Define audit storage guidance: summary, evidence, actor, timestamp, selected records, decision rationale, and approval trail.

## Output Format
Return:
- `User explanation`: concise business-language rationale.
- `Technical trace`: data, rules, dependencies, and checks.
- `Impact statement`: records, processes, and users affected.
- `Audit payload`: fields that should be stored.
- `Questions or gaps`: missing evidence before the action can be trusted.

