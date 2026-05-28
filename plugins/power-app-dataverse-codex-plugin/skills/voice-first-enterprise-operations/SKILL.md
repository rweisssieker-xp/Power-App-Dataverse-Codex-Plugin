---
name: voice-first-enterprise-operations
description: Use when designing voice-first Dataverse and Power Platform operations for mobile, Teams calls, headsets, or Copilot-style interfaces. Produces interaction and safety guidance only.
---

# Voice-First Enterprise Operations

## Purpose
Design Dataverse actions that can be safely started, reviewed, confirmed, and explained through voice.

Use this skill for:
- voice-created records
- spoken workflow starts
- voice report retrieval
- voice approvals
- Teams call action capture
- mobile and headset-first enterprise workflows

## V1 Boundary
This skill creates voice interaction designs only. It does not capture audio, transcribe speech, call Teams, or execute Dataverse operations.

## Workflow
1. Define the voice channel, user context, environmental constraints, and supported commands.
2. Design speech-friendly confirmations for record creation, updates, approvals, and bulk operations.
3. Require read-back for critical fields, high-risk changes, amounts, dates, names, and selected records.
4. Define fallback to visual UI when ambiguity, risk, or data density is too high for voice.
5. Define audit evidence: transcript, confirmation phrase, timestamp, user identity, and action summary.

## Output Format
Return:
- `Voice scenario`: user, channel, and business task.
- `Voice command model`: supported utterances and slots.
- `Confirmation flow`: read-back, clarification, and approval prompts.
- `Fallback rules`: when to switch to visual review.
- `Audit evidence`: what must be logged for compliance.

