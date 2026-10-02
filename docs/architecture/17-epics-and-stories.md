# 17 · Epics and user stories

Format: **Epic → Capability → Story → Acceptance criteria → Technical tasks → Dependencies → Risks.** P0 stories are fully specified; P1 are outlined; P2/P3 are listed. Story ids are stable; reference them in commits and ADRs.

## Epic index

| Epic | Title | Priority | Workstreams |
|---|---|---|---|
| E1 | Project IR v2 | P0 (S3: P2) | 2, 11 |
| E2 | Operation engine and history | P0 | 9, 10, 11 |
| E3 | Component manifests and registry | P0 → P2 | 3 |
| E4 | Op-native editor core | P0 | 7, 8, 9 |
| E5 | UI AI Orchestrator | P0 → P2 | 4, 6, 9 |
| E6 | AI guardrails and review | P0 | 5 |
| E7 | Figma-grade canvas | P1 | 7, 8 |
| E8 | Cloud projects and tenancy | P1 | 1, 2 |
| E9 | RBAC, sharing, audit | P1 → P2 | 2, 13 |
| E10 | Deployment and operations | P1 → P2 | 1 |
| E11 | Collaboration | P1 → P2 | 10 |
| E12 | Export and renderers | P0 → P2 | 11, 12 |
| E13 | Security hardening | P0, continuous | 13 |
| E14 | Observability and cost control | P1 | 1, 6 |

---

## E1 · Project IR v2

### E1-S1 (P0) · Normalized, canonical IR with v1 migration
**Capability**: Portable app model. **Story**: As a developer, I want projects stored in a normalized, versioned IR so that edits, AI changes, sync and export all work on one stable model.

**Acceptance criteria**
- `schemaVersion: 2` zod schema with generated JSON Schema committed to `docs/schema/app.v2.schema.json`.
- `migrate1to2(v1)` converts every v1 feature (nested layout, per-page logic, `contractVersion`, bare type ids → `core.*@1`, token refs) with no data loss; `examples/contact-app.config.json` migrates and renders identically in Runtime.
- `serialize(doc)` is canonical: two semantically equal docs produce identical bytes; round-trip `parse(serialize(doc))` is identity.
- All existing `parseProject` safety checks (size, prototype keys, depth ≤ 60, unique ids/routes, referential checks) apply to v2.
- Importing a v1 file in the editor still works; exporting produces v2.

**Technical tasks**: `src/core/ir/schema.ts`, `migrate.ts`, `serialize.ts`, `children.ts` (derived ordering by fractional index); fractional-index util; golden fixtures `docs/schema/fixtures/v1/*.json` → expected v2; property tests for canonical serialization.
**Dependencies**: E3-S1 (type id mapping). **Risks**: hidden v1 variants in old localStorage backups → migrator tolerant mode with warnings.

### E1-S2 (P1) · Responsive values and breakpoints
Responsive prop values `{ base, sm, md, lg }`; breakpoints defined in theme; runtime emits media queries.

### E1-S3 (P2) · Workflows, rules, in-app permissions, `$env`/`$secret` references
---

## E2 · Operation engine and history

### E2-S1 (P0) · Core ops with validate/apply/invert and transactions
**Story**: As any actor (human, AI, import), I want every change expressed as a typed operation so that it can be validated, undone, audited and synced.

**Acceptance criteria**
- Op types from [11](11-project-ir.md#operations) implemented with versioned schemas.
- `apply(doc, op)` is pure and returns `{ doc, inverse }`; applying `inverse` restores a doc that serializes identically to the original (property-tested for random op sequences).
- `validate` rejects: unknown component type, prop not in manifest schema, forbidden props (`on*`, `dangerouslySetInnerHTML`, `srcDoc`), unsafe URLs/CSS, cycles, missing parents, slot violations, depth > 60, duplicate routes, dangling action/resource/validation references.
- Transactions are atomic: if op *k* fails, the doc is unchanged and the error names op *k* and the rule.
- 500-op transaction on a 5k-node doc validates + applies in < 100 ms on a mid-range laptop (bench).

**Technical tasks**: `src/core/ops/{schemas,apply,invert,validate,transaction}.ts`; structural-sharing updates; error model `{ opIndex, code, path, message }`; bench script.
**Dependencies**: E1-S1, E3-S1. **Risks**: inverse correctness for subtree removal → store full subtree in inverse; fuzz tests.

### E2-S2 (P1) · Named versions and restore (local, then cloud)
### E2-S3 (P2) · Op-log compaction and branch documents
---

## E3 · Component manifests and registry

### E3-S1 (P0) · One manifest registry for built-ins
**Story**: As a maintainer, I want each built-in component described by one manifest so that palette, inspector, runtime, AI and export can never disagree.

**Acceptance criteria**
- Manifest v1 schema ([04](04-component-plugin-architecture.md#component-contract-manifest-v1)) with JSON Schema output.
- 24 built-ins have manifests (`core.*`), generated once from `data/componentDefinitions.js` and hand-corrected; props have types, enums, limits; slots and events declared.
- Palette and inspector render from manifests; `ai/registry/components.ts` is replaced by a manifest-derived allow-list; `runtime/registry.jsx` maps manifest ids to implementations.
- A test fails if a manifest id lacks an implementation or vice versa.

**Technical tasks**: `src/core/registry/{manifest.schema.ts,builtins/*.json,resolve.ts}`; adapter from manifest props → inspector controls; remove duplicate registries after parity check.
**Dependencies**: none. **Risks**: inspector features not expressible in schema (conditions/validation builders) → `x-fw-control` custom controls.

### E3-S2 (P1) · Org components (T1) from ESM bundles with SRI, installed per project lockfile
AC outline: publish manifest+bundle via CLI; admin approves; appears in palette within 60 s without builder deploy; renders in sandbox-origin frame; export uses `source.npm`.
### E3-S3 (P1) · Schema compositions ("make component from selection") with instance overrides and variants
### E3-S4 (P2) · Marketplace (T2) with review, scanning, verified publishers, yank/kill-switch
### E3-S5 (P3) · T3 in-realm isolation experiment (SES/ShadowRealm)
---

## E4 · Op-native editor core

### E4-S1 (P0) · Doc store and transaction manager
**Story**: As a designer, I want every canvas, inspector, layers and page action to be undoable as one step per gesture, fast even on large pages.

**Acceptance criteria**
- All writes in `Canvas`, `DroppableComponent`, `PropertiesPanel`, `PageManager`, layers and `ProjectPanel` import go through the transaction manager; `setPages`/`updatePageLayout` direct writes removed (grep test).
- Undo/redo uses inverse ops; one drag = one entry; typing in a text prop coalesces within 500 ms; history bounded by count (200) and bytes.
- Canvas nodes subscribe per id; editing one prop re-renders only that node and its ancestors whose derived layout changed (React Profiler check).
- Existing browser checks from `docs/ARCHITECTURE.md` (insert, drag, search, select, inspector, undo/redo, reload restore, preview, JSX) still pass.

**Technical tasks**: Zustand doc slice (`nodes`, `pages`, indexes); `useNode(id)`; transaction manager with coalescing; adapt `layoutTree.js` consumers; `PageContext` becomes a façade then is removed.
**Dependencies**: E2-S1. **Risks**: large refactor across 1k-line components → do it screen by screen behind the façade.

### E4-S2 (P0) · IndexedDB persistence with migration
AC: snapshot + op log per project; migrate `react-ui-builder:pages-state` on first load; save status reflects actual durability; storage-evicted state detected with an export prompt.
---

## E5 · UI AI Orchestrator

### E5-S1 (P0) · Protocol, translator and dry-run validation
**Story**: As a user, I want AI requests turned into validated platform operations so that nothing the model says can change my project unchecked.

**Acceptance criteria**
- `fw.intent/1` schema for: createPage, createRoute, createLayout, addComponent, moveComponent, removeComponent, updateProps, bindData, createAction, addValidation, applyTheme (others rejected as unsupported with a clear diagnostic).
- Translator resolves `#refs`, generates deterministic ids from run id, groups ops per intent op, and returns diagnostics with op paths.
- Dry-run uses core `validate` on a copy; the orchestrator module imports no write/persistence code (architecture test).
- With the **mock adapter**, the "customer onboarding" fixture produces a valid ChangeSet; a fixture with an unknown component yields a rejection + repair hint.

**Technical tasks**: `src/orchestrator/{protocol,translator,changeset,diagnostics}.ts`; fixtures; architecture test.
**Dependencies**: E2-S1, E3-S1. **Risks**: protocol too narrow for real prompts → iterate with recorded transcripts (S-04).

### E5-S2 (P0) · Provider adapters, capabilities, routing, fallback
**Acceptance criteria**
- `IAIProvider` contract implemented by `mock`, `openai-compatible` (base URL + key + model; works with Ollama and LM Studio locally) and `webllm`.
- Capability ladder chooses json-schema → tools → json-mode → text extraction per model; the same fixture passes on at least two rungs.
- Router picks by required capabilities and user preference; on timeout/5xx/schema failure after 2 repairs it falls back to the next candidate; each attempt recorded in the local journal with tokens and latency.
- No vendor name outside `src/orchestrator/adapters/**` (lint).
- BYO keys held in memory/session only.

**Dependencies**: E5-S1. **Risks**: browser CORS for some providers → optional stateless proxy Worker (stage 1 optional).

### E5-S3 (P0) · Context index and retrieval tools
AC: L0–L3 index maintained incrementally from ops; `getOutline/getNodes/findNodes/listComponents/getLogic` tools; context for a 5k-node project stays under the configured budget (default 12k tokens); selection-scoped prompts include the selection.
### E5-S4 (P2) · Server-side orchestrator with org budgets, policy-based routing, embeddings retrieval
---

## E6 · AI guardrails and review

### E6-S1 (P0) · ChangeSet review and transactional apply
**Story**: As a user, I want to review AI proposals like a code review and accept all, some or none.

**Acceptance criteria**
- Review panel lists groups hierarchically with checkboxes, diagnostics and model/usage summary.
- Unticking a group unticks its dependents and shows why; ticking a dependent ticks its prerequisites.
- Accept applies exactly the selected ops as **one** transaction labelled "AI: <summary>"; a single undo removes all of it.
- Reject leaves the doc byte-identical; "Edit" applies selected ops to a draft that the user edits before committing.
- Journal records prompt hash, model, ops proposed, ops accepted, actor.

### E6-S2 (P0) · Policy, budgets and restricted operations
AC: default AI policy denies installing components, custom handlers, secrets/env, permissions; data-source URL creation requires explicit approval badge; per-run token cap and deadline enforced; taint from untrusted context escalates egress ops.
### E6-S3 (P1) · Ghost preview of ChangeSets on canvas
### E6-S4 (P2) · Org-level AI policy administration and audit export
---

## E7 · Figma-grade canvas (P1)
- **E7-S1** Canvas frame (iframe) rendering through the runtime interpreter in design mode; host↔frame protocol.
- **E7-S2** Overlay gesture engine: selection, hover, marquee, move/reorder with drop indicators, resize, using frame geometry.
- **E7-S3** Auto-layout controls (direction, gap, padding handles, align, hug/fill/fixed, wrap, grid).
- **E7-S4** Infinite canvas with multiple frames (pages × breakpoints × states), pan/zoom, minimap.
- **E7-S5** Multi-select, group/ungroup, copy/paste/duplicate across pages/projects, context menus, command palette over ops.
- **E7-S6** Lenses: data, logic, validation, a11y.
- **E7-S7** Inline text editing.

## E8 · Cloud projects and tenancy (P1)
- **E8-S1** Accounts (OIDC social + magic link), orgs, workspaces.
- **E8-S2** Upload local project; server op log + snapshots; sync.
- **E8-S3** RLS policies and cross-tenant tests.
- **E8-S4** Assets in object storage.

## E9 · RBAC, sharing, audit (P1 → P2)
- **E9-S1** Project roles and invitations; link sharing.
- **E9-S2** Audit log for security-relevant actions and AI decisions.
- **E9-S3** (P2) SSO/SCIM.

## E10 · Deployment and operations (P1 → P2)
- **E10-S1** Stage-1 hosting with CSP/security headers, preview deploys, CI (lint, test, build, golden exports).
- **E10-S2** Stage-2 API, Postgres, R2, job worker, backups + restore drill.

## E11 · Collaboration
- **E11-S1** (P1) Comments anchored to nodes; presence and cursors.
- **E11-S2** (P2) Real-time co-editing via server-sequenced ops.

## E12 · Export and renderers
- **E12-S1** (P0) Runtime + runtime-mode export read IR v2; boilerplate ZIP still builds and runs (automated).
- **E12-S2** (P1) Code-mode React + Vite emitter replacing `codeGenerator.js` / `fullAppGenerator.js`; golden projects build in CI.
- **E12-S3** (P2) Next.js and static HTML targets.

## E13 · Security hardening
### E13-S1 (P0) · Close known holes, enforce boundaries
AC: F1 fixed (no `dangerouslySetInnerHTML` of authored markup in editor origin; grep test); dependency-rule tests for `src/core` and `src/orchestrator`; CSP documented and applied via hosting headers; local-model libraries isolated in a worker; `backend/` documented as dev-only.
- **E13-S2** (P1) Sandbox origin for canvas frame; postMessage schema validation.
- **E13-S3** (P1) Egress gateway (SSRF protections) for any server-side fetch.

## E14 · Observability and cost control (P1)
- **E14-S1** OTel traces for API/orchestrator; Sentry for editor errors.
- **E14-S2** Usage metering and budgets per org.
