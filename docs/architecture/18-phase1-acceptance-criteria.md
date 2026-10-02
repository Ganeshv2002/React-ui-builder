# 18 · Acceptance criteria for the first implementation phase (Foundation)

The Foundation (P0) is done when **all** of the following hold. Each item names how it is verified. Story-level criteria live in [17](17-epics-and-stories.md).

## A. Model and compatibility
| # | Criterion | Verification |
|---|---|---|
| A1 | Every v1 project (the example, plus any `react-ui-builder:pages-state` backup) imports, migrates to v2 and renders the same in Runtime | Golden tests + visual check of `examples/contact-app.config.json` |
| A2 | Export → import → export yields byte-identical JSON | Unit test |
| A3 | IR v2 JSON Schema and manifest JSON Schema are generated and committed under `docs/schema/` | CI check that generated = committed |
| A4 | The runtime-mode boilerplate generated from the example installs, builds and runs, with validation and navigation working | CI job (previously manual) |

## B. Single mutation path
| # | Criterion | Verification |
|---|---|---|
| B1 | No component writes project state except through the transaction manager | Grep/lint rule: no `setPages(` or `updatePageLayout(` outside the store |
| B2 | Undo/redo of any gesture restores a byte-identical document | Property test over random op sequences + browser check |
| B3 | Invalid ops (unknown type, unknown prop, forbidden prop, unsafe URL/CSS, cycle, dangling reference) are rejected with a precise error and leave state unchanged | Unit tests per rule |
| B4 | Editor browser checks listed in `docs/ARCHITECTURE.md` still pass | Manual or Playwright script |

## C. Registry
| # | Criterion | Verification |
|---|---|---|
| C1 | Palette, inspector, runtime and AI read one manifest registry; the old AI registry inference is removed | Code search + test |
| C2 | Adding a built-in means adding one manifest + one implementation mapping; a test fails if either is missing | Unit test |

## D. AI pipeline
| # | Criterion | Verification |
|---|---|---|
| D1 | The prompt "Create a customer onboarding page with personal details, address, and KYC verification" produces a ChangeSet that validates (mock adapter fixture, and at least one real model via the OpenAI-compatible adapter against a local Ollama) | Automated (mock) + manual (real) |
| D2 | The user can accept all, accept selected (dependency closure enforced), edit, or reject; accepted ops apply as one undo step | Browser check |
| D3 | A proposal containing an unknown component, an `on*` prop, a `javascript:` URL, or a restricted op is never applied; the user sees why | Fixtures |
| D4 | Switching between two different adapters requires no change outside the adapter config | Test + code review |
| D5 | Token cap and deadline abort a run cleanly and report usage | Test with a slow mock |
| D6 | A 5k-node synthetic project produces a context under the configured budget | Unit test on the index |
| D7 | Each run is recorded in the local journal (model, tokens, latency, proposed/accepted op ids) | Unit test |

## E. Performance
| # | Criterion | Verification |
|---|---|---|
| E1 | On a 5k-node page, a prop edit updates the canvas in < 50 ms and selection in < 16 ms (mid-range laptop) | Bench + Profiler |
| E2 | 500-op ChangeSet validates + applies in < 100 ms | Bench |

## F. Security
| # | Criterion | Verification |
|---|---|---|
| F1 | No authored markup is rendered with `dangerouslySetInnerHTML` in the editor origin | Grep test |
| F2 | `src/core/**` has no React/DOM/network imports; `src/orchestrator/**` cannot import apply/persistence; vendor names only in adapters | Architecture tests |
| F3 | BYO AI keys never reach IndexedDB, exports, logs or telemetry | Test + review |
| F4 | Hosting config sets CSP, `X-Content-Type-Options`, `Referrer-Policy`, frame-ancestors | Header check on preview deploy |

## G. Documentation (ADLC)
| # | Criterion | Verification |
|---|---|---|
| G1 | `docs/architecture/README.md` index points to every new module and ADR; "where to change what" table updated | Review |
| G2 | Each merged story updates the relevant doc and, if it changes a decision, adds or supersedes an ADR | PR checklist |
