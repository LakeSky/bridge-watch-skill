# bridge-watch-skill

An [Agent Skill](https://docs.claude.com/en/docs/agents-and-tools/agent-skills)
that teaches any coding agent how to use **Bridge Watch** — a pay-per-call
on-chain address intelligence endpoint (`https://agentsapi.top/mcp`) — including
how to pay it over x402 without an API key.

## Why this exists

Bridge Watch is a remote MCP server. Directories and README files tell an agent
*that* it exists; they rarely tell it *how to pay*. This skill closes that gap:
it documents the free tier, the exact 402 flow, and the per-tool prices, so an
agent can go from zero to a real answer in one round trip.

## Install

Copy `SKILL.md` into your agent's skills directory, or point the agent at this
repo. No dependencies, no build step.

```
SKILL.md                     # the skill itself
scripts/bridge-watch-call.mjs  # zero-dependency caller (free tier + Bearer credits)
```

## Quick try

```bash
# free tier, no wallet needed
node scripts/bridge-watch-call.mjs get_label '{"address":"0x833589fcd6edb6e08f4c7c32d4f71b54bda02913"}'

# after funding credits, spend them with your own address
node scripts/bridge-watch-call.mjs explain_transaction '{"tx":"0x..."}' --bearer 0xYourPayingAddress
```

## Related

- npm stdio bridge: `bridge-watch-mcp` (`npx -y bridge-watch-mcp`)
- MCP registry: `top.agentsapi/bridge-watch`
- Endpoint: `https://agentsapi.top/mcp`

## Honest scope

Being listed anywhere is not the same as being used, and being used is not the
same as being paid for. Prices and the free tier in `SKILL.md` are read from the
live endpoint card; re-read it before quoting numbers.

MIT licensed.
