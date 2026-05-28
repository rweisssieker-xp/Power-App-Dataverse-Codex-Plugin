---
name: enduser-first-ux
description: Use when designing zero-technical-knowledge Dataverse AI experiences where users do not need table, form, flow, or solution knowledge. Produces UX guidance only.
---

# Enduser-First UX

## Purpose
Design Dataverse AI experiences for business users who should not need to understand tables, forms, flows, or Dataverse architecture.

Use this skill for:
- natural-language-only workflows
- business-user action prompts
- zero-navigation process experiences
- role-specific task views
- clarification questions
- confidence-building confirmations

## V1 Boundary
This skill produces UX strategy and interaction design guidance only. It does not modify Power Apps UI or Dataverse configuration.

## Workflow
1. Translate technical Dataverse concepts into business language.
2. Hide implementation details unless they matter for consent, audit, risk, or user trust.
3. Ask only business-relevant clarification questions.
4. Present previews in terms of outcomes, affected records, risk, approvals, and next steps.
5. Provide graceful failure states that explain what is missing and how to proceed.

## Output Format
Return:
- `Business-user journey`: steps in non-technical language.
- `Hidden complexity`: Dataverse details the system handles internally.
- `Clarification prompts`: questions phrased for business users.
- `Trust moments`: preview, confirmation, explanation, and audit.
- `Failure states`: understandable recovery guidance.

