# React UI Builder architecture

## Runtime map

- `src/main.jsx` loads global styles and mounts `App.jsx`.
- `App.jsx` supplies Mantine and the builder theme. The active editor is `src/builder/UIBuilder/UIBuilder.jsx`.
- `PageProvider` (`src/contexts/PageContext.jsx`) owns pages, routes, the current layout and 20 snapshots of undo history per page. It debounces localStorage writes by 200 ms and exposes actual save status.
- Zustand (`src/store/editorStore.js`) owns selection, preview/export visibility, dimensions, zoom and custom component registration. Layout data stays in PageProvider.
- `componentRegistry/index.js` joins definitions in `data/componentDefinitions.js` to the nested component implementations and export metadata.
- A layout is an array of `{ id, type, props, children? }` nodes. Canvas and DroppableComponent use react-dnd to insert, nest and move those nodes. ResizableComponent handles component sizing.
- PropertiesPanel derives content fields from registry definitions. It also exposes styles, reusable variants, conditions and validation where supported by the selected component.
- PreviewFrame renders the layout through registry components in an iframe with component CSS. It inherits React context and follows the selected viewport dimensions and zoom.
- CodeViewer uses `codeGenerator.js` for a single-page module and `fullAppGenerator.js` plus `componentTemplates.js` for the complete app. These are separate export paths.

## Portable JSON projects

A project can be exported as one JSON file (`format: "framewright"`, `schemaVersion: 1`) that holds every page, route, layout, theme token and page behavior. The generated JSON Schema lives in `docs/schema/app.schema.json`; `examples/contact-app.config.json` is a working two-page sample.

- `src/runtime/project.js` defines the zod schema (`projectSchema`, `logicSchema`), `parseProject` and `createProject`. PageContext uses these for `exportProject` / `importProject` and keeps one undo step for the last import.
- `src/runtime/theme.js` normalizes theme files: Framewright/DTCG-style JSON tokens or a single CSS `:root` block of custom properties. Style values reference tokens as `{ "$token": "color.brand" }`, and the inspector offers a token picker next to color, size, spacing and font fields. Tokens are exposed to pages as `--fw-*` CSS variables.
- `src/runtime/engine.js` runs page behavior declared in `logic`: `state`, `resources` (HTTP requests), named `actions` (`setState`, `request`, `navigate`, `validate`, `custom`), `effects` on mount or state change, and `validation` rule groups. Values bind with `{ "$state": "path" }` and `{ "$event": "value" }`. JSON never contains executable code; `custom` actions call handler IDs registered in code.
- `src/runtime/registry.jsx` and `adapters.jsx` map component type IDs to implementations. The type ID and public props are the contract, so an implementation can be swapped without touching JSON. Breaking prop changes bump the adapter `version` and supply `migrate(props, fromVersion)`. Unknown types render as placeholders and are preserved on export.
- `src/runtime/Runtime.jsx` renders a parsed project with hash routes (`#/thanks`).
- `src/builder/ProjectPanel/` is the Project settings dialog (header "Project" and palette buttons): export/import JSON, theme import/export, per-page behavior JSON, and the React boilerplate download.
- `src/utils/configAppGenerator.js` builds the boilerplate ZIP: the runtime, component sources, `src/app.config.json`, `src/handlers.js` and the schema. After the first download, only `src/app.config.json` needs replacing when the design changes.

## Persistence and optional services

The active page editor saves locally under `react-ui-builder:pages-state`. The Express backend in `backend/` provides project, component and variant APIs with filesystem storage. ProjectPersistence and VariantPersistence implement separate caches and API calls; they are not the source of the active page context's autosave. A successful local save does not indicate server synchronization.

AI creation runs through CreateComponentModal and `src/ai/`, including WebLLM, NLP matching and vision captioning. Models can require downloads and GPU support. This pass retains those features without changing model behavior.

## Active versus legacy files

Many modules exist both as flat files and in same-name directories. App imports the nested UIBuilder. Its imports use the nested palette, canvas, inspector, preview and component implementations. Flat duplicates have not been removed because other consumers must be audited before deletion.

## Editor revamp

The shell now groups Insert, Pages and Layers in one sidebar; maintains a page selector; uses searchable keyboard-accessible component tiles; and keeps AI creation visible. The center has history, device and zoom controls, actual fit-to-view, a labeled artboard and selection status. The inspector shows editable canvas settings when nothing is selected, and grouped property/style controls for a selection. The quick guide documents keyboard shortcuts and storage behavior.

Figma concept: https://www.figma.com/design/QsBzu1LtI6IplbUzTpEgZ6?node-id=2-129

The implementation was expanded after feedback that the initial concept was too sparse. Existing DropZone.css edits are preserved.

## Known limits

- Full-app export uses a separate, older template generator; custom AI components and all advanced combinations still need broader export parity testing.
- Variant API actions need the backend; the editor can read cached variants without it.
- The existing AI/ONNX bundles cause build size and third-party eval warnings.
- This is a desktop editor with a minimum workspace width of 760 px, not a phone editing UI.

## Verification (2026-09-28)

- Production build passes; eight unit tests pass, including new coverage for shortcut modifier handling and non-empty export props.
- Browser checks passed: click insertion, drag insertion, search, layer selection, inspector tabs, content editing, undo/redo, state restoration after reload, mobile artboard fit, preview rendering and generated JSX.
- Complete-app ZIP downloaded successfully. Its HomePage.jsx includes the edited button text.
- Repository-wide ESLint reports existing issues in legacy modules, contexts and property controls. Targeted lint passes for the rewritten shell, palette, canvas, preview and updated code generator.
- AI model generation, server variant writes and exhaustive full-app export parity were not verified.

## Verification of JSON projects (2026-09-28)

- 19 unit tests pass, including runtime schema, theme parsing and Runtime rendering.
- Importing `examples/contact-app.config.json` and exporting it again produces identical JSON.
- In Preview, the example's validation messages and navigation to `/thanks` work.
- JSON and CSS theme files import; token pickers apply tokens on the canvas and export them as `$token` references.
- The React boilerplate generated from the example installs, builds and runs, including validation and hash navigation.
- Network requests from `request` actions were not exercised against a live API.
