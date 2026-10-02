# 13 · Scalability strategy (Workstream 9)

## Targets (editor, mid-range laptop)

| Scenario | Target |
|---|---|
| 5,000 nodes on one page, 200 pages, 300 installed components | Select/hover < 16 ms; prop edit → canvas update < 50 ms; drag at 60 fps |
| Project open (IR 5 MB) | Interactive < 2 s (render visible frames first) |
| AI ChangeSet of 500 ops | Validate < 100 ms (worker); apply < 100 ms; one undo step |
| Undo/redo | < 16 ms regardless of document size |

Today every edit clones the page layout (`JSON.parse(JSON.stringify(...))` in `PageContext.jsx`), stores 20 full snapshots per page, and re-renders the canvas tree from the root. That is O(document) per keystroke.

## Techniques and where they apply

| Technique | Apply | Notes |
|---|---|---|
| **Normalized state** | P0 | `nodes` map by id ([11](11-project-ir.md)); children derived and cached per parent |
| **Command/op architecture** | P0 | Ops touch O(1) nodes; the store records dirty ids per transaction |
| **Immutable updates with structural sharing** | P0 | Replace only changed node objects; unchanged nodes keep identity so `memo` works |
| **Selective subscriptions** | P0 | Zustand (already used) with per-node selectors: `useNode(id)`; the canvas renders `<NodeView id>` components that subscribe to their own node only |
| **Memoisation** | P0 | `React.memo` on NodeView; derived data (resolved tokens, bindings) cached by input identity |
| **Indexed project structures** | P0/P1 | Maintained incrementally from ops: `byParent`, `byType`, `byPage`, `refsTo` (actions/resources/tokens → nodes), `nameIndex` for search |
| **Virtualized panels** | P1 | Layers tree, palette, token lists via windowing (e.g. `@tanstack/react-virtual`) |
| **Lazy loading** | P1 | Pages load on demand (document chunks per page in storage); component bundles lazy per manifest; inspector controls lazy |
| **Incremental rendering** | P1 | Render only frames in the viewport; off-screen frames become cached bitmaps or skeletons; React transitions for non-urgent updates |
| **Worker threads** | P1 | Validation of large ChangeSets, indexing, codegen, search, AI context assembly in a Web Worker; SharedArrayBuffer not required |
| **Undo/redo via inverse ops** | P0 | O(ops) not O(document); memory bounded by op size; history cap by count *and* bytes |
| **CRDT / server sequencing** | P2 | [10](10-collaboration.md); ops remain the unit |
| **Caching** | P1+ | Snapshots in IndexedDB/object storage; manifest cache with ETags; CDN for bundles; server-side projections for listings |
| **Geometry batching** | P1 | Frame reports node rects once per animation frame via ResizeObserver/IntersectionObserver, only for visible nodes |

## Large component libraries

- Palette shows manifests (JSON, few KB each), never loads bundles until an instance renders.
- Manifest search index (name, category, tags, `docs.aiHint`) built once per lockfile change.
- Bundles shared across frames within the canvas iframe via an import map.

## AI-generated modifications at scale

- ChangeSets validated in a worker in one pass against a copy-on-write view.
- Ghost preview renders only affected subtrees.
- Large proposals are chunked by group so review stays usable (collapse by page/section).

## AI context indexing

The orchestrator must never need the whole project. The index is layered, each layer cheap to serialise in a compact, deterministic text form:

| Level | Content | Size (typical) | Used for |
|---|---|---|---|
| L0 Project card | name, pages (id, name, path), installed component ids + one-line hints, token names by group, app-state keys | 1–3 KB | Every request |
| L1 Page outline | indented tree: `id type "label/text" [slot] {bindings} !events` truncated to depth/width budget | 1–10 KB/page | Page-scoped requests |
| L2 Node detail | full props, bindings, rules, validation for requested ids | per node | Edits to specific nodes |
| L3 Symbol index | actions, resources, validation groups, rules, where each is referenced | 1–5 KB | Logic requests |
| L4 Semantic search | name/text search (P0: lexical); embeddings via pgvector/in-browser (P2) | query-based | "the checkout form's email field" |
| Manifests | summaries for candidates (top-k by task relevance, via existing `nlp/match.ts` ranking) | 0.2–1 KB each | Component choice |

Retrieval is **progressive**: the orchestrator sends L0 + the user's selection (L2 for selected ids + L1 of their page), then the model may call read-only tools `getOutline(pageId)`, `getNodes(ids)`, `findNodes(query)`, `listComponents(query)`, `getLogic(pageId)`. Budgets cap total context tokens per run; the index is updated incrementally from ops, so it's always current. For models without tool support, the orchestrator does one heuristic retrieval pass (selection + lexical matches of prompt terms) before the call.

## Server-side scale

See [08](08-deployment-architecture.md): partitioned op log, snapshots in object storage, projections for listings, room sharding per document, orchestrator queue with per-org concurrency, cells.

## Measurement

- A `bench/` harness (P1) generates synthetic documents (1k/5k/20k nodes) and measures select, edit, drag, undo, validate, codegen; run in CI with thresholds.
- Editor RUM: interaction latency (INP) and long tasks reported via OpenTelemetry web SDK (opt-in).
