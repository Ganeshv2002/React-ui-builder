# 19 · Recommended technical spikes / POCs

Each spike is timeboxed, produces a short report in `docs/architecture/spikes/` and, if it changes a decision, an ADR.

| Id | Question | Timebox | Success looks like | Blocks |
|---|---|---|---|---|
| **S-01** | Can a normalized doc + op engine with structural sharing hit the [13](13-scalability.md) targets in React 19 + Zustand? | 3 days | Bench: 5k nodes, prop edit < 50 ms, undo < 16 ms | E2-S1, E4-S1 |
| **S-02** | Overlay gestures over an iframe frame: drag/reorder latency and correctness using reported geometry | 4 days | Smooth 60 fps drag, correct drop indicators in nested flex/grid, cross-origin variant works | E7 |
| **S-03** | Inline text editing inside the frame (contenteditable in frame vs overlay input) | 2 days | IME, undo coalescing, selection preserved | E7-S7 |
| **S-04** | Intent protocol viability across models: success rate of `fw.intent/1` on 20 prompts with 4 model classes (local 7–8B, small cloud, frontier ×2) on each capability rung | 4 days | ≥ 90% valid after ≤ 2 repairs on frontier/small cloud; local-model rate measured; protocol adjustments listed | E5-S1/S2 |
| **S-05** | Fractional indexing + server-sequenced ops under concurrency (simulated 5 clients) | 3 days | No lost inserts, no cycles, convergence | E11-S2 |
| **S-06** | In-realm isolation options (SES/Hardened JS, ShadowRealm status) vs iframes for T2 components | 2 days | Recommendation with browser support matrix | E3-S4 |
| **S-07** | ESM bundle loading with import maps sharing React between host runtime and component bundles; SRI; lazy loading | 2 days | A T1 component from a URL renders in the frame without rebuild | E3-S2 |
| **S-08** | Deterministic React emitter prototype from IR v2 for the contact example | 3 days | Generated app builds, passes generated tests, stable output across runs | E12-S2 |
| **S-09** | Hono API on Workers vs Node container with Neon/Supabase Postgres + RLS: latency, pooling, local dev ergonomics | 3 days | Chosen runtime with measured p95 and a documented local setup | E8 |
| **S-10** | Relationship between FrameWright runtime and `../SDUI` (`@ganesh/sdui-react`): merge, depend, or keep separate | 2 days | Decision ADR | E12, runtime roadmap |
| **S-11** | Switchboard as an optional orchestrator backend: map `IAIProvider` to a Switchboard run | 2 days | Adapter sketch and gaps list | E5-S4 |
| **S-12** | Re-verify vendor free tiers and prices used in [08](08-deployment-architecture.md) and [14](14-cost-model.md); re-check competitor capabilities in [02](02-competitive-research.md) | 1 day | Updated tables with dates and links | Stage-2 decisions |
| **S-13** | Local persistence: IndexedDB wrapper choice, eviction behaviour (`navigator.storage.persist`), size limits | 1 day | Chosen wrapper + persistence prompt UX | E4-S2 |
| **S-14** | Ghost preview rendering cost for large ChangeSets | 2 days | Preview of 500 ops < 200 ms | E6-S3 |

Recommended order: S-01 and S-04 before starting P0 implementation (they validate the two riskiest foundation bets), S-13 alongside E4-S2, the rest before their P1/P2 epics.
