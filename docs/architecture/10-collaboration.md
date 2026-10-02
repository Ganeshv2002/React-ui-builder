# 10 · Collaboration architecture (Workstream 10)

Not V1. The V1 requirement is **not to make it impossible**: stable node ids, op-based mutations, per-user undo, and fractional ordering keys are introduced in P0 for that reason.

## Approaches compared

| Approach | How it works | Fits a tree of components with props? | Offline | Undo | Server needs | Verdict |
|---|---|---|---|---|---|---|
| **Operational Transformation** (Google Docs) | Server transforms concurrent ops against each other | Transform functions for every pair of op types on a tree are notoriously hard | Poor | Hard | Central server | Reject |
| **CRDT – Yjs** | Shared types (Y.Map, Y.Array, Y.Text) merge automatically | Good: nodes as Y.Map, children as Y.Array; tree moves need care (no native move → delete+insert loses identity unless modelled as parent pointer + order key) | Excellent | `Y.UndoManager` per origin | Relay/persistence (y-websocket, Hocuspocus, Liveblocks, PartyKit) | Strong option for P2+ if offline multi-editing matters |
| **CRDT – Automerge** | JSON-like CRDT documents with history | Good; move op support evolving | Excellent | Build on history | Sync server | Good, heavier; smaller ecosystem for editors |
| **Event sourcing** | Append-only ordered log of domain events | Excellent for audit, history, replay | N/A by itself | Via inverses | Log store | Use for persistence regardless |
| **Server-authoritative ops, property-level LWW** (Figma's published approach) | Client sends ops; server orders them (sequence), resolves conflicts per property (last writer wins), validates tree moves (no cycles); clients apply optimistically and rebase | Excellent — it's our op model | Limited (queue while offline, rebase on reconnect; conflicts resolve LWW) | Per-user inverse ops | Room server per document | **Choose for P2** |

**Decision** → [ADR-0011](adr/0011-collaboration-server-sequenced-ops.md): server-sequenced ops with property-level LWW, fractional indexing for sibling order, parent-pointer tree with server cycle check. Persisted as the op log (event sourcing). Yjs remains an upgrade path: our op types map onto Y.Map/Y.Array updates, so a later switch changes the transport and merge layer, not the IR or the editor.

## Why this fits our constraints

- Validation must be **authoritative** (component allow-lists, policy, AI approval). With a server-sequenced log, the server validates each op before it becomes visible to others. Pure peer CRDTs merge first and validate later, which conflicts with guardrails.
- Our ops are already small and property-granular (`node.setProp`), so LWW per property rarely loses meaningful work.
- Tree integrity (no cycles, no orphan nodes, slot constraints) is easy to check centrally.

## Model details

```mermaid
sequenceDiagram
  participant A as Client A
  participant R as Room (per document)
  participant B as Client B
  participant DB as Op log
  A->>A: apply op locally (optimistic), keep in pending queue
  A->>R: op {clientId, clientOpId, baseSeq}
  R->>R: validate (schema, registry, policy, tree)
  R->>DB: append (seq = n+1)
  R-->>A: ack seq n+1
  R-->>B: broadcast op seq n+1
  B->>B: rebase own pending ops over n+1, apply
  Note over R: rejected op → nack with reason; A rolls back that op
```

- **Ordering of children**: each child has an `order` key (fractional index string, e.g. `"a0V"`). Inserts between two siblings generate a key between them; concurrent inserts never conflict. Children arrays are *derived* by sorting.
- **Moves**: `node.move {id, parent, order}`; server rejects moves creating cycles; concurrent moves of the same node → LWW.
- **Delete vs edit**: edit on a deleted node is dropped (and reported to the editor, which can offer "restore"); deletes are tombstoned until compaction so undo can restore.
- **Text**: prop strings are LWW. If collaborative rich text inside a single prop becomes necessary (long content blocks), that prop can use Y.Text as an embedded CRDT (P3).

## Presence, cursors, comments

- **Presence** (who's here, selection, viewport, cursor) is ephemeral: sent through the room at ≤ 20 Hz, never persisted, rendered in the overlay.
- **Comments**: threads anchored to `{documentId, nodeId, frameId, offset}` with a fallback to the last known position when the node is deleted; stored in Postgres (`comment_threads`, `comments`), not in the IR, so commenting doesn't need edit permission and doesn't pollute history.

## Undo with collaborators

- Per-user undo stacks of *inverse ops*. Undo sends the inverse as new ops. If the inverse targets a property someone else changed afterwards, the default is to still apply (LWW, like Figma) but show a toast; delete-inverse for a node another user already deleted is skipped.
- AI ChangeSets are one undo entry for the user who accepted them.

## Offline

Stage 1 is offline by nature (local-first). In collaborative projects, offline edits queue with `baseSeq`; on reconnect the client rebases. If the queue is large or conflicts are many, the client offers "save my offline changes as a branch" instead of force-merging.

## Version history

Versions = named `seq` pointers (+ snapshots). "View at version" renders the snapshot read-only; "restore" = new ops; "branch" = new document from snapshot; "merge branch" (P3) = three-way diff over node ids/props shown in the same review UI as AI ChangeSets.

## Infrastructure

- Stage 2: room = one Cloudflare Durable Object per document (single-threaded actor, fits "one sequencer per doc"), or a Node WebSocket service with sticky routing by document id. Rooms flush to Postgres.
- Stage 3: room service sharded by document id per cell.

Stories: epic **E11** in [17](17-epics-and-stories.md).
