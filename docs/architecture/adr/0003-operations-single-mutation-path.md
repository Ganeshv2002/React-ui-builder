# ADR-0003 · Operations are the single mutation path for humans, AI, import, plugins and collaboration

- **Status**: Proposed · **Date**: 2026-09-28 · **Workstreams**: 4, 5, 9, 10, 11

## Context
Today components call `setPages` / `updatePageLayout` directly (`src/contexts/PageContext.jsx`). There is nowhere to validate, audit, review, undo precisely or sync.

## Decision
All changes are versioned JSON operations applied by a pure core: `validate(doc, op)`, `apply(doc, op) → { doc, inverse }`, grouped into atomic transactions with an actor. No other write path exists. AI intent ops are compiled into these core ops (ADR-0008).

## Alternatives considered
- Snapshot diffs (compute a JSON patch after the fact): loses intent; poor for review and collaboration.
- Redux-style actions without inverses: undo needs snapshots again.
- Direct mutation with Immer patches as the protocol: ties the protocol to a library's patch format.

## Why chosen
One mechanism provides undo, audit, AI review, validation, persistence (op log) and collaboration.

## Trade-offs
Up-front refactor of editor components; every new feature must define its ops.

## Migration path
Introduced behind a `PageContext` façade, screen by screen; the op log format becomes the server event store in stage 2.
