# ADR-0011 · Collaboration via server-sequenced ops with property-level LWW; Yjs deferred

- **Status**: Proposed · **Date**: 2026-09-28 · **Workstreams**: 9, 10

## Context
Collaboration is not V1, but V1 must not preclude it, and every change must pass guardrail validation.

## Decision
When collaboration ships (P2), a room per document validates and sequences ops, appends them to the op log and broadcasts them; clients apply optimistically and rebase; conflicts resolve last-writer-wins per property; sibling order uses fractional indexes; moves are cycle-checked on the server. Undo is per user via inverse ops (already P0). Presence is ephemeral.

## Alternatives considered
OT (tree transforms too complex); Yjs/Automerge CRDTs (merge-before-validate conflicts with guardrails, though strong offline support); pure event sourcing without a sequencer.

## Why chosen
Keeps validation authoritative and matches the op model already needed for AI and undo.

## Trade-offs
Weaker offline multi-user editing; LWW can overwrite simultaneous edits to the same property.

## Migration path
Ops map onto Y.Map/Y.Array updates; switching to Yjs changes transport and merge, not the IR or editor. Spike S-05 validates convergence.
