---
name: context-aware-dataverse-ai
description: Use when designing Dataverse AI behavior that adapts to user role, department, permissions, language, preferences, data context, relationships, business logic, policies, and organizational rules. Produces design guidance only and performs no live tenant inspection.
---

# Context-Aware Dataverse AI

## Purpose
Design AI actions that understand the enterprise context around a Dataverse request before recommending or planning an operation.

Use this skill when the user needs:
- role-aware or department-aware action behavior
- permission-sensitive defaults
- relationship and dependency context
- business-rule-aware decision support
- localized or personalized Dataverse actions
- policy-aware recommendations

## V1 Boundary
This skill creates context models and design guidance only. It does not read user profiles, permissions, Dataverse metadata, policies, or organizational data from a live tenant.

## Workflow
1. Identify the actor context: role, team, business unit, department, language, preferences, and operating channel.
2. Identify the data context: tables, relationships, record ownership, lifecycle state, dependencies, and related processes.
3. Identify the policy context: business rules, compliance constraints, approval rules, security policies, DLP constraints, and data sensitivity.
4. Define context resolution order: explicit user input, current record or conversation context, known defaults, metadata, then clarification questions.
5. Define personalization boundaries so convenience never bypasses permission, approval, audit, or policy checks.

## Output Format
Return:
- `Context model`: user, data, process, policy, and organizational context.
- `Resolution strategy`: where each context value should come from.
- `Defaulting rules`: safe defaults and when to ask the user.
- `Permission-sensitive behavior`: what changes by role or scope.
- `Implementation guidance`: Dataverse, Power Apps, and Power Automate areas to inspect or build.

