# Copilot Instructions — React UI Builder

> **Purpose:** These instructions steer GitHub Copilot to generate clean, efficient, original code for a React-based UI Builder that supports drag‑and‑drop composition and deterministic code generation.

---

## Project Structure
- `src/components/` – Predefined UI components (pure, composable)
- `src/builder/` – Canvas, selection, drag‑and‑drop primitives, inspector
- `src/utils/` – Codegen, schema, guards, formatting
- `src/data/` – Component metadata (props schema, defaults, icons)

## Technologies
- React 18 + Vite
- `react-dnd` (drag & drop)
- `react-icons`
- CSS Modules (scoped, no global bleed)
- Optional: XState for editor modes; Prettier for code formatting

---

## Goals (what “good” looks like)
- **Clean & efficient:** small, composable functions; avoid over‑render; stable refs/handlers.
- **Original code:** unique structure/phrasing — **no boilerplate dumps or copied snippets**.
- **Production‑grade:** imports present, props validated, error paths handled.
- **Deterministic codegen:** stable node IDs, sorted props, consistent formatting.

> **Plain English:** Keep the editor fast, the output predictable, and the generated app code dependency‑free.

---

## Non‑Negotiable Quality Bar
Copilot **must**:
1. Include all **imports** and **exports** (no missing symbols).
2. Use **functional components** and hooks only.
3. Guard **null/undefined** and empty arrays before access.
4. Provide **keys** for lists and **stable callbacks** (`useCallback`, `useMemo` when needed).
5. Keep **side effects** inside `useEffect` with correct dependency arrays.
6. Avoid **excess re‑renders**: pass primitive props when possible; memo heavy children.
7. Keep CSS Modules naming consistent: `Component.module.css` → `styles.foo`.
8. Emit **accessible** markup: labels for inputs, alt text for images, visible focus rings.
9. Prefer **early returns** over nested conditionals for readability.
10. Ensure **codegen output compiles**: valid JSX, no placeholder imports.
11. **Use a library for complex features.** If a feature is non‑trivial and a well‑maintained, lightweight library exists, **use it** for the **builder/editor** — but **never leak it into the generated code** (which must remain plain React, except `react-icons`).

---

## Coding Guidelines
### Components
- One responsibility per component; accept `className`; forward safe extras via `{...rest}`.
- Controlled inputs; lift state only if multiple children depend on it.
- Derive UI from a **schema**; don’t duplicate display logic.

### Drag & Drop
- Extract `Draggable`/`Droppable` wrappers; avoid duplicating DnD config.
- Prevent default on drops; guard self‑drop and circular parenting.

```ts
if (!target || draggedId === targetId || isDescendant(draggedId, targetId)) return;
```

### State & Modes (Editor)
- Keep editor state **serializable** (for undo/redo & export).
- If XState is used: separate **machine** from **view**; actions side‑effect free.

### Code Generation
- Centralize emit under `src/utils/codegen/*` with helpers:
  - `emitImport(name, from)`
  - `emitJSX(tag, props, children[])`
  - `formatWithPrettier(code)`
- Enforce **stable ordering** (props sorted, deterministic IDs, newline policy consistent).
- **No proprietary runtime** in emitted code — plain React only.

### Utilities
- Pure and side‑effect free; add small **input guards** (`assertNode`, `isContainer`).
- Prefer object maps over `switch` for extensibility.

### Styling
- CSS Modules only. No inline “magic numbers” unless derived from variables.
- Respect a11y: color contrast, focus ring visible, `aria-*` where relevant.

---

## Library & Dependencies Policy
**When to use a library**
- The feature is **complex** (virtualized lists, schema validation, rich text, code formatting).
- Library is **actively maintained**, has **TypeScript types**, is **tree‑shakeable/ESM**, and is **small** enough not to bloat the editor.

**Where libraries are allowed**
- **Editor/Builder only** (`src/builder`, `src/utils`) to speed development and reduce bugs.
- **Generated code must stay dependency‑free** (except `react`, `react-dom`, and optional `react-icons`).

**Examples**
- ✅ Editor‑only: `zustand` or XState (state), `prettier` (format), `zod` (schema), `react-virtual` (virtualization), `clsx` (class merging).
- 🚫 Generated output: do **not** emit `zod`, `zustand`, `xstate`, or custom runtime helpers.

**Integration rules**
- Wrap third‑party APIs behind **thin adapters** so we can swap later.
- Document the choice: *why this lib*, *bundle impact*, *alternatives considered*.
- Avoid overlapping libs (one validation lib project‑wide).

> **Plain English:** If it’s hairy and there’s a proven lib, use it — but only inside the editor. The user’s exported app should not depend on our editor’s libraries.

---

## Error‑Proofing Patterns
- Show friendly fallbacks:
  - Missing schema → empty state + “Add component” CTA.
  - Invalid JSON import → toast with reason; keep previous state.
- **Debounce** heavy operations (e.g., codegen on change).
- Defensive drag logic (see snippet above).

---

## Performance Guardrails
- Virtualize large trees/lists; avoid layout thrash.
- Memoize expensive children; prefer primitive props; avoid inline object/array props.
- Batch state updates; avoid unnecessary context churn (split contexts by concern).

---

## Generated Output Requirements
- Plain React (functional components), valid JSX, imports resolved.
- Stable node IDs; props are **sorted**; consistent formatting via Prettier.
- No builder‑only dependencies; keep output readable and maintainable.

---

## PR Checklist (for contributors & Copilot)
- [ ] Imports/exports complete; code builds with `vite` + TypeScript strict.
- [ ] All lists have keys; callbacks are stable where needed.
- [ ] Effects are correctly scoped; no accidental re‑render loops.
- [ ] CSS Modules applied; no global styles leaked.
- [ ] a11y: inputs labelled, images have `alt`, focus visible.
- [ ] Codegen is deterministic (IDs/props ordering stable) and compiles.
- [ ] Libraries used only where justified; none leaked into generated code.
- [ ] Added/updated unit tests or story usage where relevant.

---

**End of file** — keep this in the repo as `COPILOT_INSTRUCTIONS.md`. If adding new domains (e.g., a form builder or grid layout engine), extend **Library & Dependencies Policy** and **Generated Output Requirements** accordingly.
