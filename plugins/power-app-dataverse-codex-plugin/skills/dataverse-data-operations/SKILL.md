---
name: dataverse-data-operations
description: Use when planning Dataverse data quality, duplicate detection, ownership repair, migration, classification, normalization, or bulk data operations. Produces safe operation plans only and performs no data changes.
---

# Dataverse Data Operations

## Purpose
Plan safe AI-assisted data operations for Dataverse environments.

Use this skill for:
- duplicate detection and merge planning
- orphaned or ownerless record repair
- bulk ownership changes
- missing classification or region assignment
- contact/account normalization
- migration readiness and cleanup
- relationship and reference repair

## V1 Boundary
This skill does not read or mutate data in Dataverse. It creates operation plans, validation checklists, and implementation guidance.

## Workflow
1. Identify the target data set, table scope, filters, business unit boundaries, and expected record count.
2. Define detection rules for duplicates, invalid references, missing ownership, incomplete classifications, or inconsistent values.
3. Require a preview phase that lists selected records, proposed changes, excluded records, and confidence levels.
4. Define approval and rollback strategy for every bulk or irreversible change.
5. Specify audit fields, evidence records, and before/after reporting.

## Output Format
Return:
- `Operation summary`: data issue and desired business outcome.
- `Selection logic`: candidate tables, filters, joins, and exclusions.
- `Validation rules`: quality checks before changes.
- `Change plan`: proposed updates or migration steps.
- `Safety controls`: preview, approvals, rollback, and audit.
- `Reporting`: before/after metrics and exception handling.

