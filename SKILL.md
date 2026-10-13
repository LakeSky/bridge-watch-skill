---
name: bridge-watch
description: Look up blockchain address labels, explain a transaction, detect address clusters and query CCTP bridge flows on Base/Ethereum through the Bridge Watch MCP endpoint. Use when a user asks who owns or controls a crypto address, what a transaction did, whether two addresses belong to the same entity, or how much USDC moved across CCTP. Free tier = 3 anonymous calls/day; after that $0.01-$0.05 per call, paid in USDC on Base over x402.
---

# Bridge Watch — pay-per-call on-chain address intelligence

Remote MCP endpoint: `https://agentsapi.top/mcp` (streamable HTTP, JSON-RPC 2.0).
Alternative local stdio bridge: `npx -y bridge-watch-mcp`.

## When to use

- "Who is `0x…`?" / "Is this address an exchange, a bridge, a scam?"
- "Explain this tx" / "What did this transfer do?"
- "Are these two addresses the same entity?"
- "How much USDC crossed CCTP recently?"

## Step 1 — try the free tier first (no wallet, no key)

`get_label` and `list_paid_endpoints` are free for 3 calls per IP per day
(500/day site-wide). `initialize` and `tools/list` are always free.

```bash
curl -s https://agentsapi.top/mcp \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_label","arguments":{"address":"0x833589fcd6edb6e08f4c7c32d4f71b54bda02913"}}}'
```

A `X-MCP-Free-Trial: 1` response header means the free tier paid for this call.
`get_label` with **no** `address` argument returns a working demo result
(USDC on Base) — useful to check connectivity without spending a credit.

## Step 2 — when you get HTTP 402

402 is a payment challenge, not an error. It means: free tier exhausted, or the
tool is not in the free set. The body carries the full x402 v2 offer
(`accepts[]`, `payTo`, `amount`, `hint`).

- Network: **Base**. Asset: **USDC**. `payTo` = `0x381cdbb664608bf7b1dd4f9403a572c1c57332c2`
- 1 USDC = 100 credits (`creditPerUsdc`=100).
- Send the exact USDC amount to `payTo` on Base, then retry the **same request**
  with your own address as a Bearer token:
  `-H 'Authorization: Bearer 0x<YOUR_PAYING_ADDRESS>'`
- Credits accumulate on that address and are spent on later calls, so one
  transfer can fund many calls.

## Tools and price

Prices below were read from the live endpoint card
(`GET https://agentsapi.top/mcp`) and are identical to the amounts in the 402
challenge. Do not hardcode them elsewhere — re-read the card if in doubt.

| tool | credits | USDC | what it returns |
| --- | --- | --- | --- |
| `get_label` | 1 | 0.01 | labels / entity attribution for one address |
| `list_paid_endpoints` | 1 | 0.01 | the current paid REST endpoint catalogue |
| `query_alerts` | 1 | 0.01 | recent monitoring alerts |
| `alert_stats` | 1 | 0.01 | alert volume aggregates |
| `explain_transaction` | 2 | 0.02 | human-readable decoding of one tx |
| `track_cctp` | 3 | 0.03 | CCTP cross-chain USDC flows |
| `detect_cluster` | 5 | 0.05 | addresses controlled by the same entity |

## Practical notes

- Only `tools/call` is billed. `initialize`, `tools/list`, `resources/*`,
  `prompts/*` and other protocol methods are free.
- If you are behind a shared NAT, the 3/day free quota may already be consumed
  by someone else on the same IP — go straight to step 2.
- Coverage changes over time. Use `GET https://agentsapi.top/statusz`
  (`labels.count`) for the current number of labelled addresses; never quote a
  remembered number.
- Machine-readable discovery docs: `/.well-known/x402`, `/openapi.json`,
  `/llms.txt`.
