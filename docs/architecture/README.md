# FrameWright architecture index

**Start here.** This is the single entry point for humans and AI sessions. It should be enough to find the right document or module without scanning the repository. Status: **research and design, proposed** (2026-09-28). Nothing here is implemented yet unless [00-current-state](00-current-state.md) says it exists.

## In one paragraph

FrameWright is a visual builder for production applications. A **deterministic core** (Project IR v2 + operation engine + component manifests + policy) sits at the centre. The editor, the **UI AI Orchestrator**, collaborators, importers and plugins are all clients that submit **operations** to it; nothing else can change a project. Renderers (the React runtime interpreter) and emitters (code export) are pure functions of the IR. AI providers sit behind adapters and only ever produce **proposals** that are validated and approved by a person before becoming operations.

## Deliverables (the 19 requested)

| # | Deliverable | Document | Workstreams |
|---|---|---|---|
| — | Current-state baseline | [00-current-state](00-current-state.md) | all |
| 1 | Product capability map | [01-capability-map](01-capability-map.md) | 14 |
| 2 | Competitive / R&D findings | [02-competitive-research](02-competitive-research.md) | 14 |
| 3 | Proposed high-level architecture | [03-high-level-architecture](03-high-level-architecture.md) | all |
| 4 | Component / plugin architecture | [04-component-plugin-architecture](04-component-plugin-architecture.md) | 3 |
| 5 | UI AI Orchestrator architecture (incl. adapter layer) | [05-ai-orchestrator](05-ai-orchestrator.md) | 4, 6 |
| 6 | AI guardrail architecture | [06-ai-guardrails](06-ai-guardrails.md) | 5 |
| 7 | Data architecture | [07-data-architecture](07-data-architecture.md) | 2 |
| 8 | Deployment architecture | [08-deployment-architecture](08-deployment-architecture.md) | 1 |
| 9 | Editor / canvas architecture (incl. Figma study) | [09-editor-canvas-architecture](09-editor-canvas-architecture.md) | 7, 8 |
| 10 | Collaboration architecture | [10-collaboration](10-collaboration.md) | 10 |
| 11 | Project IR proposal (incl. renderers and export) | [11-project-ir](11-project-ir.md) | 11, 12 |
| 12 | Security / threat model | [12-security-threat-model](12-security-threat-model.md) | 13 |
| 13 | Scalability strategy (incl. AI context indexing) | [13-scalability](13-scalability.md) | 9 |
| 14 | Cost model | [14-cost-model](14-cost-model.md) | 1 |
| 15 | Architecture conflicts and resolutions | [15-conflicts-and-resolutions](15-conflicts-and-resolutions.md) | integration |
| 16 | Prioritized roadmap, smallest first architecture, implementation order | [16-roadmap](16-roadmap.md) | integration |
| 17 | Epics and user stories | [17-epics-and-stories](17-epics-and-stories.md) | all |
| 18 | Acceptance criteria for phase 1 | [18-phase1-acceptance-criteria](18-phase1-acceptance-criteria.md) | P0 |
| 19 | Technical spikes / POCs | [19-spikes](19-spikes.md) | all |

## Reading order

| If you want to… | Read |
|---|---|
| Understand the whole design in 15 minutes | this file → [03](03-high-level-architecture.md) → [16](16-roadmap.md) → [15](15-conflicts-and-resolutions.md) |
| Start implementing the next story | [16](16-roadmap.md#implementation-order-stories-one-at-a-time) → story in [17](17-epics-and-stories.md) → linked ADR |
| Work on AI | [05](05-ai-orchestrator.md), [06](06-ai-guardrails.md), ADR-0007, ADR-0008 |
| Work on the data model | [11](11-project-ir.md), ADR-0002, ADR-0003 |
| Work on components/plugins | [04](04-component-plugin-architecture.md), ADR-0005, ADR-0006 |
| Assess security | [12](12-security-threat-model.md), [06](06-ai-guardrails.md) |

## Architecture decision records

| ADR | Decision |
|---|---|
| [0001](adr/0001-record-architecture-decisions.md) | Record decisions; this index is the entry point |
| [0002](adr/0002-project-ir-normalized-document.md) | Project IR v2: normalized document, stable ids, canonical serialization |
| [0003](adr/0003-operations-single-mutation-path.md) | Operations are the single mutation path |
| [0004](adr/0004-dom-canvas-with-overlay.md) | DOM canvas frames + editor overlay, not Canvas/WebGL |
| [0005](adr/0005-component-manifest-and-trust-tiers.md) | Component manifest contract and trust tiers |
| [0006](adr/0006-untrusted-code-cross-origin-sandbox.md) | Untrusted code only on a sandbox origin |
| [0007](adr/0007-ui-ai-orchestrator-boundary.md) | UI AI Orchestrator boundary; Switchboard concepts, not dependency |
| [0008](adr/0008-ai-changes-as-reviewable-changesets.md) | AI output = reviewable ChangeSets of ops |
| [0009](adr/0009-local-first-v1-postgres-later.md) | Local-first V1; Postgres + S3 later |
| [0010](adr/0010-tenancy-shared-schema-rls.md) | Shared-schema tenancy with RLS |
| [0011](adr/0011-collaboration-server-sequenced-ops.md) | Collaboration via server-sequenced ops; Yjs deferred |
| [0012](adr/0012-dual-export-runtime-and-code.md) | Runtime mode and code mode export |
| [0013](adr/0013-portable-typescript-api-edge-first.md) | Portable TypeScript API, edge-first |
| [0014](adr/0014-secrets-by-reference.md) | Secrets by reference only |

New ADRs copy [adr/0000-template.md](adr/0000-template.md).

## Vocabulary

**Project IR** (the portable app model, `format: "framewright"`) · **Node** (a component instance, flat map entry) · **Slot** (named children area) · **Manifest** (component contract JSON) · **Trust tier** (T0–T3) · **Lockfile** (project's pinned component versions) · **Op** (core operation, e.g. `node.setProp@1`) · **Transaction** (atomic op group with an actor) · **Inverse** (op that undoes an op) · **Intent op** (AI protocol operation, `fw.intent/1`) · **ChangeSet** (validated, grouped ops proposed by AI) · **Actor** (user, ai-run, plugin, system) · **Canvas frame** (iframe rendering the IR) · **Overlay** (editor layer for selection/guides) · **Lens** (semantic overlay: data, logic, validation, a11y) · **Adapter** (provider implementation of `IAIProvider`) · **Journal** (append-only run/audit record).

## Invariants (do not break without an ADR)

1. Every write to project state goes through `ops.apply` in a transaction. No second path.
2. JSON never contains executable code; behaviour references registered handlers by id.
3. AI output is inert data until validated by the core *and* approved by a person; the orchestrator cannot import apply or persistence code.
4. No vendor name outside `src/orchestrator/adapters/**`.
5. `src/core/**` imports no React, DOM or network code.
6. Third-party or user-authored code never runs in the editor origin.
7. Secrets are references; values never enter the IR, AI context, logs or exports.
8. Same IR + same ops ⇒ byte-identical serialization.
9. Every schema bump ships a migrator and golden tests; older files always import.
10. Layers above `platform.*` in the IR contain no renderer-specific concepts.

## Where to change what (target layout; created as stories land)

| Task | Place |
|---|---|
| Change the project model | `src/core/ir/` (+ migrator, fixtures in `docs/schema/fixtures/`, ADR if breaking) |
| Add or change an operation | `src/core/ops/` (schema, apply, invert, validate, tests) |
| Add a built-in component | manifest in `src/core/registry/builtins/`, implementation mapping in `src/runtime/registry.jsx` |
| Add an AI provider | `src/orchestrator/adapters/<name>/` implementing `IAIProvider`; config only elsewhere |
| Add an AI intent op | `src/orchestrator/protocol/` + translator + fixtures |
| Change AI policy defaults | `src/core/policy/` |
| Change export output | `src/emit/` (code mode) or `src/utils/configAppGenerator.js` (runtime mode) |
| Change the current editor shell | `src/builder/` (see `docs/ARCHITECTURE.md` for today's runtime map) |

## Related

- Today's runtime map: [`docs/ARCHITECTURE.md`](../ARCHITECTURE.md)
- Current JSON schema (v1): [`docs/schema/app.schema.json`](../schema/app.schema.json)
- Prior art on this machine: `../Switchboard` (AI control plane), `../SDUI` (server-driven UI engine)
