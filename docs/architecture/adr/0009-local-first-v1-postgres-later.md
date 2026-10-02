# ADR-0009 · Local-first V1; Postgres and S3-compatible storage for the cloud stage

- **Status**: Proposed · **Date**: 2026-09-28 · **Workstreams**: 1, 2

## Context
The active editor already saves to localStorage; `backend/` is an Express prototype with filesystem storage and placeholder auth.

## Decision
Stage 1 stores projects in IndexedDB as snapshot + op log (the same logical model as the server), with JSON export as backup. Stage 2 adds Postgres (metadata, op log, audit, RLS) and S3-compatible object storage (snapshots, assets, bundles, exports). The existing `backend/` is dev-only and not deployed.

## Alternatives considered
Firebase/Firestore (proprietary query model, lock-in); a document database (weaker relational integrity for tenancy and RBAC); keeping the filesystem backend (no tenancy, no concurrency).

## Why chosen
Zero hosting cost now, no dead end later.

## Trade-offs
No sharing until stage 2; users must export for backup in stage 1.

## Migration path
"Upload project" pushes the local op log; afterwards the server is authoritative and IndexedDB is a cache.
