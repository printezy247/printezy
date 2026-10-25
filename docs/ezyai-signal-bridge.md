# How a signal reaches the board

The public board at `/ezyai` is a **mirror**. The EzyAI bot
(`tradernonymous/EzyAi`, `@ezytradeai_bot`) is the only writer; the website
stores and renders what it is told. This document is the contract between the
two, and `docs/ezyai_signal_client.py` is a runnable reference client for it.

## Endpoint

```
POST /api/public/ezyai/signals
Authorization: Bearer <EZYAI_SIGNAL_KEY>   (falls back to EZYAI_ENTITLEMENT_KEY)
Content-Type: application/json
```

- One signal: the signal object as the body.
- A batch: `{ "signals": [ … ] }` — at most **50** per request.
- Every push is a **merge keyed on `external_id`**: fields absent from the
  payload keep their current values. Opening, ticking and closing are the same
  call, and a retry after a crash is harmless (no duplicate cards, no
  double-counted results).
- Responses: `200` all accepted, `207` mixed batch (per-signal results in the
  body), `400` nothing accepted / bad request, `401` bad key (the body names
  the compared env variable and SHA-256 fingerprints of both sides — never the
  secrets), `503` no key bound to the deployment.

## The three push shapes

### 1. Open — a new card appears

```json
{
  "external_id": "watch-4821",
  "symbol": "XAUUSD",
  "direction": "buy",
  "status": "pending",
  "setup": "London continuation",
  "timeframe": "H1",
  "entry_low": 2631.20,
  "entry_high": 2633.00,
  "stop_price": 2626.50,
  "tp1": 2640.00,
  "tp2": 2646.80,
  "rr": 2.4,
  "setup_score": 78
}
```

### 2. Tick — the rail moves

```json
{ "external_id": "watch-4821", "last_price": 2636.10 }
```

### 3. Close — the result counts

```json
{ "external_id": "watch-4821", "status": "tp", "result_r": 2.4, "result_pips": 490 }
```

`status` on close is one of `tp`, `be`, `sl` (or `cancelled` before a fill —
cancelled never counts toward performance). A watch alert fires per
subscriber, so dedup folds duplicate live cards into one (see
`src/lib/ezyai/dedup.ts`).

## Honesty rules the site enforces

- Performance counts from `EZYAI_TRACK_RECORD_SINCE`
  (2026-10-25 — the board relaunch), disclosed as "Counted from …".
- Below `EZYAI_MIN_TRACK_RECORD_SAMPLE` (10) closed signals the panel says
  "building track record" instead of publishing a jumpy win rate.
- The website never decides an outcome; it renders what the bot reports.

## Reference client

`docs/ezyai_signal_client.py` — a dependency-free Python example that builds
the three push shapes above and posts them with the bearer key. Keep it in
step with this document when the contract changes.
