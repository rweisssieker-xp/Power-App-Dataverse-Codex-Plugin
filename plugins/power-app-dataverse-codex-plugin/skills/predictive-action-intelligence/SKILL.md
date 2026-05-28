---
name: predictive-action-intelligence
description: Use when designing proactive Dataverse recommendations such as churn risk, follow-up needs, API limit risks, compliance violations, pipeline risk, or next-best actions. Produces analysis design only.
---

# Predictive Action Intelligence

## Purpose
Design proactive recommendations that detect Dataverse risks and suggest actions before users ask.

Use this skill for:
- pipeline risk analysis
- churn and follow-up recommendations
- flow/API limit risk warnings
- compliance risk detection
- stale record and process bottleneck detection
- next-best-action recommendations

## V1 Boundary
This skill produces prediction and recommendation design guidance only. It does not train models, query Dataverse, monitor flows, or create alerts.

## Workflow
1. Define the prediction target and business outcome.
2. Identify candidate signals from Dataverse records, relationships, status changes, activity history, flow runs, and process milestones.
3. Define recommendation types: warn, explain, ask, create task, start workflow, escalate, or request approval.
4. Define confidence, evidence, thresholds, false-positive handling, and user feedback capture.
5. Define governance: who can see predictions, when action requires approval, and how explanations are logged.

## Output Format
Return:
- `Prediction scenario`: risk or opportunity to detect.
- `Signals`: data and process indicators to inspect.
- `Recommendation model`: suggested actions and confidence thresholds.
- `Explainability`: evidence and rationale shown to the user.
- `Governance`: visibility, approvals, feedback, and audit.

