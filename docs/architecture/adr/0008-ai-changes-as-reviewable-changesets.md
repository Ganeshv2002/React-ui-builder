# ADR-0008 · AI output becomes reviewable ChangeSets of operations; no direct mutation, no raw code

- **Status**: Proposed · **Date**: 2026-09-28 · **Workstreams**: 4, 5

## Context
AI must never mutate application state directly or generate unrestricted code.

## Decision
Models produce `fw.intent/1` proposals. The orchestrator compiles them to core ops, validates them in a dry run and returns a ChangeSet (grouped ops, dependencies, diagnostics, usage). Only the editor applies ops, only after the user accepts all ops or a dependency-closed subset, as one transaction with actor `ai-run`. The orchestrator cannot import apply or persistence code (architecture test). Restricted ops are denied, or require explicit approval, by policy.

## Alternatives considered
AI generates React code (structurally unreviewable; bypasses registry and policy); AI calls mutating ops directly as tools (no human gate; prompt injection becomes action).

## Why chosen
The worst a model can do is propose something a person rejects.

## Trade-offs
Less "magic" than auto-apply; the protocol must grow with the product.

## Migration path
P2 may allow auto-apply for cosmetic-only op classes by org policy, still journaled.
