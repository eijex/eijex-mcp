import test from 'node:test';
import assert from 'node:assert/strict';
import { optimizationRequest, optimizeViaHttp, toolCallResult } from '../src/app/_lib/factorforge-proxy.ts';

for (const [engine, mode, objective] of [
  ['profile', 'profile', undefined], ['dp', 'profile', 'feasibility_best'],
  ['dp_v2_1', 'profile', 'dp_v2_1'], ['dp_v2_1_1', 'profile', 'dp_v2_1_1'],
  ['slm', 'slm', undefined], ['dual_compare', 'dual_compare', undefined],
]) test(`preserves ${engine} routing`, () => {
  const request = optimizationRequest({ sequence: ' MAA ', engine });
  assert.equal(request.sequence, 'MAA'); assert.equal(request.mode, mode); assert.equal(request.objective, objective);
});
test('default uses HTTP and returned provenance, including zero metrics', async () => {
  let called = false;
  const text = await optimizeViaHttp({ sequence: 'MAA' }, async (url, init) => {
    called = true; assert.equal(url, 'https://factorforge.eijex.com/api/optimize');
    assert.equal(JSON.parse(init.body).profile, 'balanced');
    return Response.json({ success: true, optimized_sequence: 'ATGGCTGCT', product_version: '9.8.7', metrics: { cai: 0, gc_percent: 0 } });
  });
  assert.ok(called); assert.match(text, /9.8.7/); assert.match(text, /0\.0000/); assert.match(text, /Not reported/);
});
test('server/network/malformed/unsuccessful responses become MCP tool errors without leaking details', async () => {
  for (const fetcher of [async () => { throw Error('private path'); }, async () => new Response('private input', { status: 503 }),
    async () => new Response('invalid'), async () => Response.json({ error: 'private input' })]) {
    const result = await toolCallResult(() => optimizeViaHttp({ sequence: 'MAA' }, fetcher));
    assert.equal(result.isError, true); assert.doesNotMatch(result.content[0].text, /private/);
  }
});
test('rejects unsupported or persistent calls before contacting upstream', async () => {
  for (const args of [{ sequence: 'MAA', save_db: true }, { sequence: 'MAA', engine: 'bogus' }, { sequence: 'A'.repeat(2001) }, {}]) {
    assert.throws(() => optimizationRequest(args));
  }
});
