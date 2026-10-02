# ADR-0010 · Multi-tenancy: shared schema with org_id everywhere and Postgres RLS

- **Status**: Proposed · **Date**: 2026-09-28 · **Workstreams**: 2, 13

## Context
Stage 2 introduces organisations; isolation must be strong without per-tenant infrastructure.

## Decision
Every tenant-owned row carries `org_id`; the API authorizes every request centrally; Postgres RLS policies enforce `org_id = current_setting('app.org_id')` as defence in depth. Object keys are prefixed `org/<id>/`.

## Alternatives considered
Schema per tenant or database per tenant (operational cost and migrations × N at small scale).

## Why chosen
Cheapest model that still has a database-enforced isolation layer.

## Trade-offs
Noisy neighbours share resources until cells exist; RLS needs care in query planning.

## Migration path
Move an org to a dedicated database or regional cell by copying rows by `org_id` and replaying the op log tail.
