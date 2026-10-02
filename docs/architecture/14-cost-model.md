# 14 · Cost model: free → early users → scale

> Indicative monthly USD, based on typical public pricing known up to mid-2026. Re-price before decisions (spike S-12). Formulas matter more than the numbers.

## Cost drivers

1. **AI inference** — dominates at every stage if the platform pays for it.
2. Database compute + storage (op logs grow with editing activity).
3. Object storage + egress (exports, assets, bundles). Zero-egress storage (R2) removes the main surprise.
4. Realtime connections (collaboration).
5. Observability volume.
6. People time (on-call, security reviews for marketplace) — not modelled here.

## AI cost formula

```
cost/run ≈ (input_tokens × price_in + output_tokens × price_out) × (1 + repair_rate)
input ≈ 1.5k (system + protocol) + 2k (L0/L1 context) + tool round-trips
output ≈ 0.5–4k (intent ops)
```

Rough run cost bands (per page-sized generation, ~6k in / 3k out):
- Local model (WebLLM/Ollama): **$0** to the platform (user's hardware).
- Small/fast cloud models: **≈ $0.001–0.01** per run.
- Frontier models: **≈ $0.03–0.15** per run.

With 1,000 active users × 30 runs/month: small models ≈ $30–300; frontier ≈ $900–4,500. Hence: BYO key and local models first; platform-paid AI only with plan credits, per-org budgets, and routing that prefers the cheapest model meeting the task's capability and quality tier ([05](05-ai-orchestrator.md)). Prompt caching of the static protocol/system prefix, where providers offer it, cuts input cost substantially.

## Stage estimates

| Item | Stage 1 · hobby (≤ 50 users, local-first) | Stage 2 · early (≈ 1k MAU, 100 orgs) | Stage 3 · scale (≈ 100k MAU, 5k orgs) |
|---|---|---|---|
| Static hosting + CDN | $0 | $0–20 | $200–2k (WAF, bot mgmt) |
| API compute | $0 (optional Worker free tier) | $5–50 (Workers paid or 1–2 small containers) | $2k–15k (autoscaled, per cell) |
| Postgres | $0 | $20–100 (managed, PITR) | $3k–20k (HA, replicas, per cell) |
| Object storage + egress | $0 | $1–20 | $300–3k |
| Cache/KV | $0 | $0–15 | $300–2k |
| Collab rooms | — | $0–30 | $1k–8k |
| Job workers | — | $5–25 | $1k–5k |
| Observability | $0 (free tiers) | $0–50 | $2k–15k |
| Email/auth | $0 | $0–20 | $200–1k (+ SSO broker if bought) |
| Domain, misc | $1–2 | $5–20 | $500+ |
| **Infra subtotal** | **≈ $0–10** | **≈ $50–350** | **≈ $10k–70k** |
| AI (platform-paid) | $0 (local / BYO) | $50–1k with credits & budgets | Pass-through with margin, or BYO for enterprise |

## Cost controls by stage

- **Stage 1**: no platform keys by default; local models; client-side exports; no servers.
- **Stage 2**: plan limits (projects, storage, AI credits); per-org/day AI budgets with hard stops; op-log compaction; snapshot dedupe by hash; budget alerts at 50/80/100%; preview environments auto-expire.
- **Stage 3**: cells sized for utilisation; reserved/committed-use discounts; tiered log retention (hot 7d, cold 90d, archive); per-tenant cost attribution (org_id tags on AI runs, storage prefixes, room minutes) for pricing and anomaly detection.

## Pricing implications (for product, not decided here)

A free tier is sustainable if AI is local/BYO and storage is capped. Paid plans should price AI as credits (not unlimited), and enterprise as BYO model endpoint + dedicated cell.
