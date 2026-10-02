# ADR-0007 · UI AI Orchestrator is a separate module with provider adapters; Switchboard concepts, not a dependency

- **Status**: Proposed · **Date**: 2026-09-28 · **Workstreams**: 4, 6

## Context
`src/ai` calls WebLLM directly. The goal is support for any current or future provider without builder changes, using the "UI AI Orchestrator" concept. `../Switchboard` (.NET) already implements capability routing, policy decisions, taint and a journal.

## Decision
`src/orchestrator/` (TypeScript; later its own package/service) owns the protocol, context retrieval, prompt recipes, routing, repair and translation to ops. Providers implement `IAIProvider` in `src/orchestrator/adapters/*`; no vendor name appears elsewhere. It runs in the browser (stage 1) and as a stateless edge function or service (stage 2+) from the same code. It adopts Switchboard's invariants (operator-asserted governance, a policy decision before every call, taint, journal) but does not depend on Switchboard; Switchboard can be added as an adapter.

## Alternatives considered
Call providers from the editor (couples UI to vendors); a third-party LLM gateway only (solves routing, not UI semantics or guardrails); Switchboard as a mandatory backend (adds a .NET service and hosting cost at stage 1 and cannot run in the browser).

## Why chosen
Provider independence with zero hosting cost at stage 1, and a clean seam for enterprise routing later.

## Trade-offs
Re-implements a subset of Switchboard routing in TypeScript.

## Migration path
Spike S-11 maps the adapter contract onto Switchboard runs.
