#!/usr/bin/env node
/**
 * bridge-watch-call.mjs — zero-dependency caller for the Bridge Watch MCP endpoint.
 *
 *   node bridge-watch-call.mjs <tool> '<json-arguments>' [--bearer 0xYourAddress] [--raw]
 *
 * - prints the tool result, or
 * - on HTTP 402 prints the payment challenge (amount / payTo / hint) so you can
 *   fund credits and retry with --bearer.
 *
 * No API key, no wallet, no dependencies. Node >= 18.
 */
'use strict';
const https = require('node:https');

const URL_DEFAULT = 'https://agentsapi.top/mcp';
const argv = process.argv.slice(2);
const flag = (n) => {
  const i = argv.indexOf('--' + n);
  return i >= 0 ? argv[i + 1] : null;
};
const tool = argv.find((a) => !a.startsWith('--') && !a.startsWith('{'));
const rawArgs = argv.find((a) => a.startsWith('{')) || '{}';
const bearer = flag('bearer');
const raw = argv.includes('--raw');

if (!tool) {
  console.error('usage: node bridge-watch-call.mjs <tool> \'<json>\' [--bearer 0x..] [--raw]');
  process.exit(1);
}

let args;
try {
  args = JSON.parse(rawArgs);
} catch {
  console.error('arguments must be valid JSON, got: ' + rawArgs);
  process.exit(1);
}

const body = JSON.stringify({
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/call',
  params: { name: tool, arguments: args },
});

const headers = { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' };
if (bearer) headers.Authorization = 'Bearer ' + bearer;

const req = https.request(URL_DEFAULT, { method: 'POST', headers }, (res) => {
  let buf = '';
  res.setEncoding('utf8');
  res.on('data', (c) => (buf += c));
  res.on('end', () => {
    const free = res.headers['x-mcp-free-trial'] || res.headers['X-MCP-Free-Trial'];
    const status = res.headers['x-mcp-free-trial-status'] || res.headers['X-MCP-Free-Trial-Status'];
    const remain = res.headers['x-mcp-free-trial-remaining'] || res.headers['X-MCP-Free-Trial-Remaining'];
    if (free || status) {
      console.error(`[free-tier] used=${free || '-'} status=${status || '-'} remaining=${remain || '-'}`);
    }
    if (raw) {
      console.log(buf);
      return;
    }
    if (res.statusCode === 402) {
      let j = null;
      try { j = JSON.parse(buf); } catch { /* keep raw */ }
      console.error('HTTP 402 — payment required (not an error, a challenge)');
      if (j && j.accepts && j.accepts[0]) {
        const a = j.accepts[0];
        console.error(JSON.stringify({ payTo: a.payTo, amount: a.amount, asset: a.asset, network: a.network, hint: j.hint || a.hint }, null, 2));
      } else {
        console.error(buf.slice(0, 2000));
      }
      console.error('After sending USDC to payTo, retry with: --bearer <your-address>');
      process.exitCode = 2;
      return;
    }
    // SSE-shaped responses: take the last data: line
    const lines = buf.split('\n').filter((l) => l.startsWith('data:')).map((l) => l.slice(5).trim());
    const payload = lines.length ? lines[lines.length - 1] : buf;
    try {
      const j = JSON.parse(payload);
      const c = j.result && j.result.content;
      if (Array.isArray(c)) console.log(c.map((x) => x.text || JSON.stringify(x)).join('\n'));
      else console.log(JSON.stringify(j, null, 2));
    } catch {
      console.log(buf.slice(0, 4000));
    }
    if (res.statusCode >= 400) process.exitCode = 1;
  });
});
req.on('error', (e) => {
  console.error('request failed: ' + e.message);
  process.exitCode = 1;
});
req.end(body);
