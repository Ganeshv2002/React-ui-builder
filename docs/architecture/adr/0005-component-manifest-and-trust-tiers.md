# ADR-0005 · Component manifest contract and trust tiers

- **Status**: Proposed · **Date**: 2026-09-28 · **Workstreams**: 3, 13

## Context
Four registries exist; components are compiled into the builder; AI allow-lists are inferred from default props.

## Decision
Every component is a JSON manifest (id, semver, source, props JSON Schema, defaults, editor hints, slots, events, actions, variants, tokens, permissions, compatibility, dependencies, runtime needs, declarative migrations, docs). The editor, inspector, AI, validators and emitters read only manifests. Implementations are loaded by id: built-in, ESM bundle by URL with SRI, or a composition (no code). The trust tier (T0 built-in, T1 org-approved, T2 marketplace, T3 untrusted) is assigned by the registry and decides where code may run. Projects pin versions in a lockfile.

## Alternatives considered
Module Federation (host-build coupling; remotes run in the host realm); npm install at editor runtime (impossible in a browser); code-only registration as in `../SDUI` (fine for developers, not for untrusted tenants).

## Why chosen
No builder redeploy to add components, one source of truth, safe defaults for AI and governance.

## Trade-offs
Authors must write a manifest (a CLI can infer a draft from TypeScript props); declarative migrations are less flexible than code.

## Migration path
Built-ins first (P0), T1 bundles (P1), marketplace (P2). `contractVersion` in v1 maps to manifest major versions.
