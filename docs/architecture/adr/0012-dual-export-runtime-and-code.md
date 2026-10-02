# ADR-0012 · Two export modes from one IR: runtime mode and deterministic code mode

- **Status**: Proposed · **Date**: 2026-09-28 · **Workstreams**: 11, 12

## Context
Three generators exist (`codeGenerator.js`, `fullAppGenerator.js`, `configAppGenerator.js`) with known parity gaps. Users must not depend on the SaaS to run their apps.

## Decision
Runtime mode (exists, `configAppGenerator.js`): app + open-source runtime + `app.config.json`. Code mode: a deterministic, idiomatic React + Vite project (pages, routes, CSS modules with token variables, zod validation, typed API functions, generated tests), formatted with pinned Prettier. Both are pure functions of the IR and tested with golden projects in CI. `codeGenerator.js` and `fullAppGenerator.js` are replaced by the code-mode emitter.

## Alternatives considered
Runtime only (lock-in perception); code only (loses live updates and SDUI); round-trip code import (very high cost; out of scope).

## Why chosen
Removes the lock-in objection while keeping the live-runtime advantage.

## Trade-offs
Two outputs to maintain.

## Migration path
Other renderers (Next.js, static, React Native) are additional emitters; the "no renderer concepts above platform bindings" rule keeps them possible.
