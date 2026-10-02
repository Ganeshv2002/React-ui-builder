# 15 · Architecture conflicts and resolutions (integration pass)

Each workstream was analysed on its own first. This pass looks for places where one workstream's best answer breaks another's. Every resolution states the boundary chosen and what we give up.

### C1. Figma-like editing vs DOM rendering vs sandboxing
- **Tension**: Figma-grade gestures want one fast surface you fully control (custom renderer). Fidelity wants real DOM components. Security wants third-party components in a cross-origin iframe, which breaks naive drag/drop and synchronous measurement.
- **Resolution**: DOM content in a canvas *frame* (iframe) + gestures and chrome in an *overlay* in the editor, connected by an async geometry/patch protocol ([09](09-editor-canvas-architecture.md), [ADR-0004](adr/0004-dom-canvas-with-overlay.md), [ADR-0006](adr/0006-untrusted-code-cross-origin-sandbox.md)).
- **Trade-off**: one frame of latency for geometry during drags; more engineering than react-dnd in the same document. We accept it because it is the only design that satisfies fidelity *and* isolation.
- **Staging**: P0 frame same-origin with only T0 components; P1 moves the frame to the sandbox origin when T1 components arrive. Spike S-02 measures drag latency before P1.

### C2. Plugin architecture vs security
- **Tension**: extensibility wants arbitrary React; security wants no untrusted code.
- **Resolution**: trust tiers ([04](04-component-plugin-architecture.md)). Code runs only where its tier allows; manifests (data) are all the editor, AI and validators ever read. Schema compositions cover most "custom component" needs with zero code.
- **Trade-off**: T2/T3 components are less interactive in the editor (nested iframes, placeholders), marketplace needs review cost.

### C3. Multi-tenancy vs plugin execution
- **Tension**: org A's component code must never see org B's data, and shared infrastructure (CDN, canvas origin) is shared.
- **Resolution**: the canvas frame holds exactly one project's data and no credentials; bundles are immutable public-or-org-scoped URLs; private-org bundles are served with signed, short-lived URLs; server never executes component code (no SSR of untrusted code). Per-org sandbox subdomains (`<org>.fw-usercontent.net`) in stage 3 to separate storage/cookie scopes further.
- **Trade-off**: no server-side rendering of T2/T3 components (thumbnails for those are captured client-side).

### C4. AI generation vs component registry
- **Tension**: models "know" popular libraries and want to invent components/props; the registry only allows installed ones.
- **Resolution**: the model is given top-k manifest summaries for the task and may only reference installed ids; unknown ids are rejected with a repair hint listing the closest installed components. AI may *suggest* installing a component as a `questions` item, never install it.
- **Trade-off**: lower "wow" on first prompts in sparse registries; mitigated by a solid built-in set (form, file upload, table, tabs, modal, stepper) in P1.

### C5. AI operations vs Project IR
- **Tension**: the AI needs a stable, forgiving, high-level vocabulary; the core needs strict, fine-grained, versioned ops that evolve.
- **Resolution**: two levels — *intent ops* (AI protocol) compiled deterministically to *core ops* ([05](05-ai-orchestrator.md)). Both are versioned JSON Schemas; the translator is the only coupling and has golden tests.
- **Trade-off**: a translator to maintain. Cheaper than retraining prompts on every core change.

### C6. Collaboration vs undo/redo
- **Tension**: global undo is wrong with multiple editors; CRDT undo is hard; snapshot undo (today) is incompatible with concurrent edits.
- **Resolution**: per-user undo of inverse ops, applied as new ops; LWW semantics; skipped inverses reported ([10](10-collaboration.md)). Introduced in P0 even though collaboration is P2, so the undo model never has to change.
- **Trade-off**: undo can occasionally overwrite a collaborator's later change to the same property (same as Figma); surfaced via toast.

### C7. Collaboration (CRDT merge-first) vs guardrails (validate-first)
- **Tension**: CRDTs merge any concurrent change; guardrails must reject invalid changes before others see them.
- **Resolution**: server-sequenced, validate-then-broadcast ops ([ADR-0011](adr/0011-collaboration-server-sequenced-ops.md)); Yjs only as a future transport if offline multi-editing becomes a requirement, with a validation hook on the server.
- **Trade-off**: weaker offline multi-user editing.

### C8. Free hosting vs scalability
- **Tension**: free tiers impose runtimes (Workers limits), suspend databases, and invite vendor-specific APIs.
- **Resolution**: stage 1 is local-first with no server state (nothing to outgrow). Stage 2 uses portable standards (Hono, Postgres, S3, OIDC) so every vendor is swappable ([08](08-deployment-architecture.md), [ADR-0013](adr/0013-portable-typescript-api-edge-first.md)). Heavy work goes to a job worker, not edge functions.
- **Trade-off**: we forgo convenient proprietary features (e.g. vendor-specific realtime DBs).

### C9. Code export vs proprietary runtime
- **Tension**: a runtime interpreter enables live updates and SDUI; users fear lock-in; clean code can't be re-imported.
- **Resolution**: both modes from the same IR ([ADR-0012](adr/0012-dual-export-runtime-and-code.md)); the runtime is open-source and self-hostable; code mode is idiomatic and independent. Round-trip from code is explicitly out of scope.
- **Trade-off**: two outputs to test; golden-project CI covers both.

### C10. Semantic model vs designer freedom
- **Tension**: designers want freeform placement; semantics and maintainable code want flow layout and typed components.
- **Resolution**: auto-layout first, absolute positioning allowed per node (flagged by the a11y/responsive lint); "sketch" frames (P3) for free exploration that don't export.
- **Trade-off**: some Figma habits need unlearning.

### C11. Deterministic state vs AI nondeterminism
- **Resolution**: nondeterminism is confined to the *proposal*; once accepted, ops are recorded verbatim, so replay is deterministic. Deterministic id generation from the run id keeps diffs stable across re-validation.

### C12. Local-first (stage 1) vs multi-tenant cloud (stage 2)
- **Tension**: data in IndexedDB now, Postgres later; two sources of truth risk.
- **Resolution**: the local store *is* the same op log + snapshot model; cloud sync uploads it; after sync, the server is authoritative and the local store becomes a cache. Unsynced local projects remain local until the user uploads them.

### C13. AI independence vs quality
- **Tension**: provider-neutral protocols can't use each vendor's best features.
- **Resolution**: capability negotiation ladder ([05](05-ai-orchestrator.md)) uses the best feature a model *declares* (structured output, tools, vision) behind a neutral interface. Quality differs by model; safety does not.

### C14. Strict CSP vs in-browser ML libraries
- **Tension**: WebLLM/ONNX bundles trigger eval warnings (`docs/ARCHITECTURE.md` known limits); a strict CSP forbids eval.
- **Resolution**: run local-model adapters in a dedicated worker or iframe with its own relaxed CSP; the editor document keeps a strict CSP.
