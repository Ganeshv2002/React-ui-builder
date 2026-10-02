# ADR-0004 · DOM-rendered canvas frames with an editor overlay (hybrid), not Canvas/WebGL

- **Status**: Proposed · **Date**: 2026-09-28 · **Workstreams**: 7, 8

## Context
The product edits applications made of real React components. Figma uses a custom renderer because its output is graphics.

## Decision
Render real components with the runtime interpreter (design mode) inside a canvas frame (iframe). Draw selection, handles, guides, drop indicators, lenses and presence in an overlay in the editor, driven by geometry the frame reports. Canvas/WebGL only for a minimap and zoomed-out thumbnails.

## Alternatives considered
Canvas 2D / WebGL (must re-implement every component, text editing and layout; third-party React impossible); SVG (weak for forms and text); DOM without an overlay (today: event conflicts, fiddly nested drop targets).

## Why chosen
Exact fidelity, native accessibility and text editing, browser layout equals production layout, plugin components work, and the frame doubles as the security boundary (ADR-0006).

## Trade-offs
Async geometry adds latency; large zoom-outs of many frames need bitmap caching; more complex than react-dnd.

## Migration path
P0 keeps the current canvas but on ops; P1 introduces the frame (same-origin), then moves it to the sandbox origin. Spike S-02 validates drag latency first.
