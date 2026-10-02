# ADR-0014 · Secrets are referenced by name, never stored in the IR, prompts or exports

- **Status**: Proposed · **Date**: 2026-09-28 · **Workstreams**: 2, 5, 12, 13

## Context
Resources (`request` actions) need API keys; projects are exported, shared and sent (partly) to AI models.

## Decision
The IR can contain `{ "$secret": "NAME" }` and `{ "$env": "NAME" }` references only. Secret values live in the platform secret store (stage 2, envelope-encrypted per org) or in the exported app's environment. Values are resolved server-side (proxy) or at build/deploy time of the exported app, and never reach the editor canvas, AI context, logs or exports. BYO AI keys in stage 1 stay in memory or session storage only.

## Alternatives considered
Encrypted secrets inside the IR (keys must reach the client to use them; export leaks them).

## Why chosen
A secret that is never in the document cannot leak through the document.

## Trade-offs
Calls that need secrets require a backend or proxy; previewing them needs a configured environment.

## Migration path
Per-org KMS keys (BYOK) in stage 3.
