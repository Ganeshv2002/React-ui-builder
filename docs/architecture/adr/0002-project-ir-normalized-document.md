# ADR-0002 · Project IR v2: normalized document with stable ids and canonical serialization

- **Status**: Proposed · **Date**: 2026-09-28 · **Workstreams**: 2, 9, 10, 11

## Context
IR v1 (`src/runtime/project.js`) is a nested tree per page. The editor clones whole layouts per edit, undo stores snapshots, and concurrent edits or fine-grained AI diffs are impractical.

## Decision
IR v2 stores nodes in a flat map keyed by stable id with `parent`, `slot` and a fractional-index `order`; pages reference a root node; children are derived. Serialization is canonical (sorted keys, normalized values). v1 remains importable through a pure `migrate1to2`. Renderer-specific data lives only under `platform.<renderer>`.

## Alternatives considered
- Keep the nested tree and add ops on top: every op becomes a tree search; concurrent inserts conflict on array indices.
- Store pages and nodes as relational rows: breaks export, versioning and branching as a unit.
- Adopt a CRDT document format (Yjs) as the IR: ties the portable format to a library's binary encoding.

## Why chosen
O(1) node access, per-node subscriptions, conflict-free sibling ordering, trivial op payloads, stable diffs for AI review, and a readable portable JSON.

## Trade-offs
Portable JSON is less human-readable than a nested tree (mitigated by a "pretty tree" export view); migration code to maintain.

## Migration path
v1 files import forever. If a CRDT is adopted later (ADR-0011 upgrade path), the IR maps to one Y.Map per node; the portable JSON format does not change.
