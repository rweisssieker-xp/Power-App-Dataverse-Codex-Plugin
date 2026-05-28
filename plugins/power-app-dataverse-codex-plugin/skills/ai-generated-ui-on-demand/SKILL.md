---
name: ai-generated-ui-on-demand
description: Use when planning dynamic task-specific forms, dashboards, tables, wizards, approval dialogs, or input masks generated for Dataverse and Power Apps scenarios. Produces UI plans only and generates no live UI.
---

# AI-Generated UI On Demand

## Purpose
Design situational user interfaces that show only the fields, actions, and context needed for the current Dataverse task.

Use this skill for:
- task-specific forms
- generated dashboards
- approval dialogs
- data cleanup wizards
- guided record creation
- exception handling screens

## V1 Boundary
This skill plans UI behavior, field selection, and interaction flows only. It does not generate, deploy, or modify Power Apps screens.

## Workflow
1. Define the current task, target user, and decision the UI must support.
2. Select only relevant fields, records, actions, warnings, and evidence.
3. Define UI type: form, table, wizard, dashboard, approval dialog, or review panel.
4. Add validation, confirmation, explainability, and accessibility requirements.
5. Map UI elements to Dataverse fields, views, forms, command actions, custom pages, or canvas app components.

## Output Format
Return:
- `Task UI goal`: what the generated UI helps the user complete.
- `UI pattern`: form, table, wizard, dashboard, approval dialog, or review panel.
- `Displayed context`: fields, records, warnings, and explanations.
- `Actions`: available buttons or commands and their confirmation rules.
- `Power Platform mapping`: components to inspect or build.

