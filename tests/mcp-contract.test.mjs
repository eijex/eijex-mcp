import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  FACTORFORGE_CLAIM_BOUNDARY,
  buildFactorForgeOptimizeOutputSchema,
  buildFactorForgeUpstreamError,
  normalizeFactorForgeOptimizeResponse,
} from '../src/app/_lib/factorforge-agentops-contract.ts';

const syntheticLiveShape = {
  success: true,
  product_version: '3.4.x-synthetic',
  reference_policy_version: 'reference-policy-v1-synthetic',
  codon_reference_id: 'nbenthamiana_nbev11_active_default_synthetic',
  profile: 'balanced',
  host_profile: 'nbenthamiana',
  optimized_sequence: 'ATGTCTACCAACCCAAAGCCACAGCGT',
  optimized_length: 30,
  result_identifier: 'synthetic-result-001',
  validation_status: 'review_passed',
  metrics: {
    cai: 0.82,
    gc_percent: 46.7,
    length: 30,
    gc_target_reached: true,
    requested_gc_min_percent: 40,
    requested_gc_max_percent: 55,
  },
  constraint_report: { aa_identity: { passed: true } },
  qc_decision_matrix: { pass_rate: 1, type_iis_review: { passed: true } },
  acceptance_evaluation: { pass_rate: 1, passed_count: 4, total_count: 4 },
};

const syntheticConflictShape = {
  ...syntheticLiveShape,
  success: false,
  optimized_sequence: null,
  validation_status: 'review_blocked',
  automated_decision: 'rejected',
  metrics: {
    ...syntheticLiveShape.metrics,
    cai: 0.71,
    gc_percent: 68.4,
    gc_target_reached: false,
  },
  constraint_report: {
    gc_target: { passed: false, observed: 68.4, requested: '40-55%' },
    type_iis_review: { passed: false, observed: 'BsaI site present', requested: 'no Type IIS sites' },
  },
  qc_decision_matrix: { pass_rate: 0, gc_target: { passed: false }, type_iis_review: { status: 'failed' } },
  acceptance_evaluation: { pass_rate: 0, passed_count: 0, total_count: 4, gc_target: false },
};

test('factorforge_cds_optimize output schema advertises success/error/conflict contract', () => {
  const schema = buildFactorForgeOptimizeOutputSchema();
  assert.equal(schema.type, 'object');
  assert.deepEqual(schema.properties.status.enum, ['success', 'constraint_conflict', 'upstream_error']);
  assert.ok(schema.properties.negotiation);
  assert.ok(schema.properties.upstream_error);
  assert.ok(schema.properties.validationhub_handoff);
  assert.ok(schema.properties.claim_boundary);
});

test('normalizes synthetic live FactorForge shape without live upstream calls', () => {
  const normalized = normalizeFactorForgeOptimizeResponse(syntheticLiveShape, { profile: 'balanced', host: 'nbenthamiana' });
  assert.equal(normalized.status, 'success');
  assert.equal(normalized.result.optimized_sequence, syntheticLiveShape.optimized_sequence);
  assert.equal(normalized.metrics.gc_target_reached, true);
  assert.equal(normalized.upstream_summary.has_constraint_report, true);
  assert.equal(normalized.validationhub_handoff.registry_v0_schema_change_required, false);
  assert.equal(normalized.claim_boundary, FACTORFORGE_CLAIM_BOUNDARY);
});


test('normalization ignores non-public upstream profile echoes to preserve output schema', () => {
  const normalized = normalizeFactorForgeOptimizeResponse({ ...syntheticLiveShape, profile: 'private_profile' }, { profile: 'balanced', host: 'nbenthamiana' });
  assert.equal(normalized.status, 'success');
  assert.equal(normalized.profile, 'balanced');
});

test('detects 0% pass-rate conflicts and returns advisory-only Pareto negotiation', () => {
  const normalized = normalizeFactorForgeOptimizeResponse(syntheticConflictShape, { profile: 'balanced', host: 'nbenthamiana' });
  assert.equal(normalized.status, 'constraint_conflict');
  assert.equal(normalized.conflict?.code, 'ZERO_PASS_RATE_CONSTRAINT_CONFLICT');
  assert.ok(normalized.conflict?.failed_constraints.some((item) => item.axis === 'gc_window'));
  assert.ok(normalized.conflict?.failed_constraints.some((item) => item.axis === 'assembly_constraints'));
  assert.equal(normalized.negotiation?.advisory_only, true);
  assert.equal(normalized.negotiation?.auto_relaxed, false);
  assert.ok((normalized.negotiation?.pareto_frontier_candidates.length ?? 0) >= 2);
});


test('HTTP-200 FactorForge application errors normalize as upstream_error unless zero-pass conflict is present', () => {
  const normalized = normalizeFactorForgeOptimizeResponse({ success: false, error: 'optimizer rejected request' }, { profile: 'balanced', host: 'nbenthamiana' });
  assert.equal(normalized.status, 'upstream_error');
  assert.equal(normalized.upstream_error?.code, 'FACTORFORGE_APPLICATION_ERROR');
});

test('upstream errors are structured and do not expose submitted sequence material', () => {
  const upstreamError = buildFactorForgeUpstreamError(502, 'bad gateway echoed MSTNPKPQR private sequence', { profile: 'balanced', host: 'nbenthamiana' });
  assert.equal(upstreamError.status, 'upstream_error');
  assert.equal(upstreamError.result.optimized_sequence, null);
  assert.equal(upstreamError.upstream_error?.code, 'FACTORFORGE_HTTP_502');
  assert.equal(JSON.stringify(upstreamError).includes('MSTNPKPQR'), false);
});

test('MCP route advertises outputSchema for factorforge_cds_optimize', () => {
  const route = readFileSync(new URL('../src/app/api/mcp/route.ts', import.meta.url), 'utf8');
  assert.match(route, /name: 'factorforge_cds_optimize'/);
  assert.match(route, /outputSchema: buildFactorForgeOptimizeOutputSchema\(\)/);
  assert.match(route, /structuredContent/);
  assert.match(route, /Invalid factorforge_cds_optimize arguments: sequence is required/);
  assert.match(route, /Invalid factorforge_cds_optimize arguments: sequence exceeds maximum length/);
  assert.match(route, /isPublicFactorForgeProfile/);
  assert.match(route, /normalizeFactorForgeOptimizeResponse/);
});
