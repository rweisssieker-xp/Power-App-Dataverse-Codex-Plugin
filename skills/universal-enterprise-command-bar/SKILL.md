---
name: universal-enterprise-command-bar
description: Use when designing a global natural-language command bar for Dataverse, Dynamics, Power Apps, or Power Platform actions. Produces command taxonomy and UX guidance only.
---

# Universal Enterprise Command Bar

## Purpose
Design a universal command bar that replaces process navigation with intent-based commands.

Use this skill for commands such as:
- `/create project from won opportunity`
- `/run compliance audit`
- `/fix orphaned contacts`
- `/show pipeline risks`
- `/start supplier onboarding`

## V1 Boundary
This skill produces command design guidance only. It does not implement a command bar or execute commands.

## Workflow
1. Define command categories: create, show, update, approve, run, analyze, fix, migrate, escalate, and close.
2. Define command syntax, synonyms, required slots, optional filters, and fallback questions.
3. Map commands to Dataverse tables, flows, business processes, reports, and governance checks.
4. Define preview and confirmation patterns for risky, bulk, or irreversible commands.
5. Define discoverability: examples, autocomplete behavior, role-aware suggestions, and command history.

## Output Format
Return:
- `Command catalog`: command names, examples, and aliases.
- `Slot model`: required and optional parameters.
- `Dataverse mapping`: target records, flows, reports, and actions.
- `Safety model`: preview, confirmation, approval, and audit.
- `UX behavior`: autocomplete, help, history, and role-aware suggestions.

