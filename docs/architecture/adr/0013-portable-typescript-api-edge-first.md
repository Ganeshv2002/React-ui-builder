# ADR-0013 · Portable TypeScript API (Hono, web-standard Request/Response), edge-first hosting

- **Status**: Proposed · **Date**: 2026-09-28 · **Workstreams**: 1

## Context
Free tiers favour edge functions, but they impose limits and invite proprietary APIs.

## Decision
The stage-2 API and orchestrator service are written with Hono against web-standard APIs so the same code runs on Cloudflare Workers, Node, Bun or a container. Platform bindings (KV, queues, secrets) sit behind small interfaces in one module. Heavy or long jobs run in a separate worker container with a Postgres-backed queue.

## Alternatives considered
Express (Node-only; the current prototype); platform-specific frameworks (lock-in); .NET (matches Switchboard but not the TypeScript core shared with the browser).

## Why chosen
Free or cheap at the start, portable later, and the same language as the core.

## Trade-offs
Edge limits (CPU time, connection pooling) require care; Postgres access needs a pooling driver.

## Migration path
Move from Workers to containers or Kubernetes without code changes beyond the binding module. Spike S-09.
