# 00 · Current-state baseline (2026-09-28)

Branch `editor-revamp-json-projects`, commit `975ab8d`. Everything in this folder is measured against this baseline. Paths are relative to the repository root.

## What exists and is worth keeping

| Area | Where | Assessment |
|---|---|---|
| Portable project format (`format: "framewright"`, `schemaVersion: 1`) | `src/runtime/project.js` | Strong seed of the Project IR. Zod schema, 5 MB cap, prototype-key rejection, referential checks (actions, resources, routes, validation groups), effect self-write detection, nesting cap of 60. |
| Declarative logic (state, resources, actions, effects, validation) | `src/runtime/engine.js` | Correct instinct: JSON describes intent, code executes. `custom` actions call registered handler IDs, never code in JSON. `safeURL` blocks `javascript:`/`data:`. |
| Theme tokens (DTCG-style JSON or CSS `:root`) | `src/runtime/theme.js` | Alias resolution, cycle detection, CSS-injection filtering, 2,000-token cap. Becomes the design-token layer as-is. |
| Contract-versioned component registry | `src/runtime/registry.jsx`, `adapters.jsx` | Type ID + public props are the contract, `version` + `migrate(props, from)`. This is the right shape for the plugin system; it is just not yet data-driven. |
| Interpreter runtime | `src/runtime/Runtime.jsx` | Strips `on*`, `dangerouslySetInnerHTML`, `srcDoc`, `ref`, `key` from JSON props. Hash routing. |
| Runtime-mode export | `src/utils/configAppGenerator.js` | Boilerplate ZIP where only `app.config.json` changes afterwards. Proven to install, build and run. |
| Editor shell | `src/builder/UIBuilder/UIBuilder.jsx` and siblings | Revamped shell (Insert/Pages/Layers, zoom, fit, artboard, inspector). DOM-based canvas with react-dnd. |
| Local LLM experiments | `src/ai/` (WebLLM, NLP match, vision caption, zod `ComponentSpecSchema`, registry validator) | Useful as a first "local provider" and as evidence that validation-before-apply is already the intent. |

## Structural gaps (what the architecture must fix)

1. **Four component registries.** `data/componentDefinitions.js` (palette/inspector), `builder/componentRegistry/index.js` (canvas + export paths), `runtime/registry.jsx` (runtime), `ai/registry/components.ts` (AI allow-list derived from `defaultProps`). They can disagree; the AI allow-list is inferred rather than declared. → one manifest per component ([04](04-component-plugin-architecture.md)).
2. **No mutation layer.** Canvas, inspector, page manager and import all call `setPages`/`updatePageLayout` with whole new layouts (`src/contexts/PageContext.jsx`). Undo is 20 full-layout snapshots per page. There is no place to validate, audit, replay, sync or review a change. → operation protocol ([11](11-project-ir.md), [ADR-0003](adr/0003-operations-single-mutation-path.md)).
3. **Nested tree as the working model.** Layout is `{id,type,props,children[]}` recursively; every edit is a tree walk (`utils/layoutTree.js`) and a full re-render. Fine for the portable file, wrong for the editor at thousands of nodes and for collaboration. → normalized document ([ADR-0002](adr/0002-project-ir-normalized-document.md)).
4. **Three export generators.** `codeGenerator.js` (single page), `fullAppGenerator.js` + `componentTemplates.js` (app ZIP), `configAppGenerator.js` (runtime ZIP). Parity is already a known limit. → one IR-driven emitter pipeline ([11](11-project-ir.md#export)).
5. **Unsafe custom-component path.** `src/components/CustomComponentRenderer/CustomComponentRenderer.jsx` substitutes props into a JSX string and renders it with `dangerouslySetInnerHTML`. Any AI- or user-authored markup (and any prop value) becomes HTML in the editor origin: stored XSS. → retire or sandbox ([12](12-security-threat-model.md), [ADR-0006](adr/0006-untrusted-code-cross-origin-sandbox.md)).
6. **Backend is a prototype.** `backend/` is Express with filesystem storage; `middleware/auth.js` accepts any API key of 10+ characters and also reads it from the query string; 50 MB JSON bodies; no tenancy. It is not the source of truth for the active editor (localStorage is). → replaced by the API in [08](08-deployment-architecture.md); keep only as a local dev server until then.
7. **AI is provider-coupled and emits components, not changes.** `src/ai/index.ts` calls WebLLM directly and returns a `ComponentSpec`. No proposal/review step, no provider abstraction. → UI AI Orchestrator ([05](05-ai-orchestrator.md), [06](06-ai-guardrails.md)).
8. **Mixed JS/TS, flat + nested duplicates** of many modules (called out in `docs/ARCHITECTURE.md`). New core modules should be TypeScript and live in one place.

## The "UI AI Orchestrator" reference

No folder with that name exists on this machine. Two sibling projects carry the concept and were read for this design:

- `../Switchboard` (.NET): a capability-routed AI control plane: resources, capabilities, deterministic late-binding router, policy decisions (Allow/Deny/RequireApproval), scoped grants, content-trust taint, one append-only journal, "no vendor names in core logic" enforced by tests.
- `../SDUI` (`@ganesh/sdui-react`): a server-driven UI engine with registries for components, actions, validators, mappers, themes, with register/override/extend/lazy semantics.

The orchestrator design in [05](05-ai-orchestrator.md) adopts Switchboard's invariants and vocabulary and treats SDUI as prior art for the runtime registries. If the real UI AI Orchestrator lives elsewhere, [05](05-ai-orchestrator.md) is the only file that needs reconciling.
