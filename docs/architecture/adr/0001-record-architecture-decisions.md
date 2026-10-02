# ADR-0001 · Record architecture decisions and keep an index for humans and AI sessions

- **Status**: Proposed · **Date**: 2026-09-28 · **Workstreams**: all

## Context
The project is developed across AI sessions (Codex, Claude) that start without memory. Rediscovering structure by scanning the repo is slow and error-prone.

## Decision
Keep architecture in `docs/architecture/` with `README.md` as the single entry point (reading order, vocabulary, invariants, "where to change what"). Record significant decisions as ADRs in `docs/architecture/adr/` using `0000-template.md`. Every story that changes a decision adds or supersedes an ADR; every new module is added to the index.

## Alternatives considered
Only `docs/ARCHITECTURE.md` (too coarse); a wiki outside the repo (drifts from code); code comments only (not discoverable).

## Why chosen
The same pattern already works in `../Switchboard/docs/project-index.md`; it is cheap and versioned with the code.

## Trade-offs
Discipline cost per PR.

## Migration path
`docs/ARCHITECTURE.md` stays as the "current runtime map" and links here; once P0 lands, it is folded into the index.
