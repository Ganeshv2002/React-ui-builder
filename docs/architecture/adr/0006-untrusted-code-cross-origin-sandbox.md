# ADR-0006 · Third-party and user code runs only on a separate sandbox origin

- **Status**: Proposed · **Date**: 2026-09-28 · **Workstreams**: 3, 8, 13

## Context
Component and plugin code from orgs, marketplace publishers or AI could steal sessions or data if it runs in the editor origin. `CustomComponentRenderer` already renders authored markup in the editor origin.

## Decision
The canvas frame is served from a separate registrable domain with no credentials and a strict CSP; the editor talks to it only through a schema-validated postMessage protocol. Interactive T2 components get nested per-package iframes; T3 code runs in opaque-origin per-instance iframes with `connect-src 'none'`, or is shown as a placeholder. The editor origin never evaluates third-party code. The server never executes component code.

## Alternatives considered
Same origin with review only (one bad package compromises every user); SES / ShadowRealm (not broadly available; spike S-06); server-side rendering (moves the risk to our servers).

## Why chosen
Origin isolation is enforced by the browser, not by our validation logic.

## Trade-offs
Async communication, React duplicated in the frame, an extra hosting domain, harder debugging.

## Migration path
P0: only T0 components; the frame may be same-origin; retire the unsafe renderer. P1: the sandbox origin is live before T1 ships.
