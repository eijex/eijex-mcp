export const FACTORFORGE_CLAIM_BOUNDARY =
  'FactorForge MCP outputs are in-silico CDS design-review artifacts only; they are not experimental validation, synthesis-acceptance decisions, regulatory advice, or comparative biological-performance evidence.';

export type FactorForgeMcpStatus = 'success' | 'constraint_conflict' | 'upstream_error';

export interface FactorForgeOptimizeRequestContext {
  profile: string;
  host?: string;
}

export interface FactorForgeMetricSummary {
  cai: number | null;
  gc_percent: number | null;
  length_nt: number | null;
  gc_target_reached: boolean | null;
  requested_gc_min_percent: number | null;
  requested_gc_max_percent: number | null;
}

export interface FactorForgeFailedConstraint {
  axis: string;
  code: string;
  observed: unknown;
  requested: unknown;
  source: string;
}

export interface FactorForgeParetoCandidate {
  candidate_id: string;
  relax: string[];
  preserve: string[];
  expected_tradeoff: string;
  suggested_request_delta: Record<string, unknown>;
}

export interface FactorForgeNegotiation {
  advisory_only: true;
  auto_relaxed: false;
  relaxable_axes: string[];
  pareto_frontier_candidates: FactorForgeParetoCandidate[];
}

export interface FactorForgeValidationHubHandoff {
  registry_v0_schema_change_required: false;
  implementation_status: 'documented_interface_only';
  artifact_hash_fields: string[];
  notes: string;
}

export interface FactorForgeMcpOptimizeResult {
  status: FactorForgeMcpStatus;
  tool: 'factorforge_cds_optimize';
  profile: string;
  host: string;
  metrics: FactorForgeMetricSummary;
  result: {
    optimized_sequence: string | null;
    optimized_length_nt: number | null;
    result_identifier: string | null;
    validation_status: string | null;
  };
  conflict?: {
    code: 'ZERO_PASS_RATE_CONSTRAINT_CONFLICT';
    message: string;
    failed_constraints: FactorForgeFailedConstraint[];
  };
  upstream_error?: {
    code: string;
    message: string;
  };
  negotiation?: FactorForgeNegotiation;
  validationhub_handoff: FactorForgeValidationHubHandoff;
  claim_boundary: string;
  upstream_summary: {
    product_version: string | null;
    reference_policy_version: string | null;
    codon_reference_id: string | null;
    has_constraint_report: boolean;
    has_qc_decision_matrix: boolean;
    has_acceptance_evaluation: boolean;
  };
}

export const PUBLIC_FACTORFORGE_PROFILES = ['balanced', 'high_cai', 'gc_target', 'assembly_friendly'] as const;

export function isPublicFactorForgeProfile(value: unknown): value is typeof PUBLIC_FACTORFORGE_PROFILES[number] {
  return typeof value === 'string' && (PUBLIC_FACTORFORGE_PROFILES as readonly string[]).includes(value);
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function numberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function boolOrNull(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

function stringOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function lower(value: unknown): string {
  return typeof value === 'string' ? value.toLowerCase() : '';
}

function readNested(record: Record<string, unknown>, path: string[]): unknown {
  let current: unknown = record;
  for (const part of path) {
    const obj = asRecord(current);
    if (!(part in obj)) return undefined;
    current = obj[part];
  }
  return current;
}

export function buildFactorForgeOptimizeOutputSchema(): Record<string, unknown> {
  return {
    type: 'object',
    additionalProperties: false,
    properties: {
      status: { type: 'string', enum: ['success', 'constraint_conflict', 'upstream_error'] },
      tool: { type: 'string', const: 'factorforge_cds_optimize' },
      profile: { type: 'string', enum: PUBLIC_FACTORFORGE_PROFILES },
      host: { type: 'string' },
      metrics: {
        type: 'object',
        additionalProperties: true,
        properties: {
          cai: { type: ['number', 'null'] },
          gc_percent: { type: ['number', 'null'] },
          length_nt: { type: ['number', 'null'] },
          gc_target_reached: { type: ['boolean', 'null'] },
          requested_gc_min_percent: { type: ['number', 'null'] },
          requested_gc_max_percent: { type: ['number', 'null'] },
        },
      },
      result: {
        type: 'object',
        additionalProperties: true,
        properties: {
          optimized_sequence: { type: ['string', 'null'] },
          optimized_length_nt: { type: ['number', 'null'] },
          result_identifier: { type: ['string', 'null'] },
          validation_status: { type: ['string', 'null'] },
        },
      },
      conflict: {
        type: 'object',
        additionalProperties: false,
        properties: {
          code: { type: 'string', const: 'ZERO_PASS_RATE_CONSTRAINT_CONFLICT' },
          message: { type: 'string' },
          failed_constraints: { type: 'array', items: { type: 'object' } },
        },
      },
      upstream_error: {
        type: 'object',
        additionalProperties: false,
        properties: {
          code: { type: 'string' },
          message: { type: 'string' },
        },
      },
      negotiation: {
        type: 'object',
        additionalProperties: false,
        properties: {
          advisory_only: { type: 'boolean', const: true },
          auto_relaxed: { type: 'boolean', const: false },
          relaxable_axes: { type: 'array', items: { type: 'string' } },
          pareto_frontier_candidates: { type: 'array', items: { type: 'object' } },
        },
      },
      validationhub_handoff: { type: 'object' },
      claim_boundary: { type: 'string' },
      upstream_summary: { type: 'object' },
    },
    required: ['status', 'tool', 'profile', 'host', 'metrics', 'result', 'validationhub_handoff', 'claim_boundary', 'upstream_summary'],
  };
}

export function buildFactorForgeUpstreamError(
  statusCode: number,
  _upstreamText: string,
  context: FactorForgeOptimizeRequestContext,
): FactorForgeMcpOptimizeResult {
  const result = baseResult(context, {}, {});
  return {
    ...result,
    status: 'upstream_error',
    upstream_error: {
      code: `FACTORFORGE_HTTP_${statusCode}`,
      message: `FactorForge upstream returned HTTP ${statusCode}. Upstream body omitted to avoid echoing submitted sequence material. No automatic retry or constraint relaxation was performed.`,
    },
  };
}

export function normalizeFactorForgeOptimizeResponse(
  data: unknown,
  context: FactorForgeOptimizeRequestContext,
): FactorForgeMcpOptimizeResult {
  const root = asRecord(data);
  const metrics = asRecord(root.metrics);
  const result = baseResult(context, root, metrics);
  const failedConstraints = detectFailedConstraints(root, metrics);
  const zeroPassRate = isZeroPassRateConflict(root, failedConstraints);

  if (!zeroPassRate && (root.success === false || typeof root.error === 'string')) {
    return {
      ...result,
      status: 'upstream_error',
      upstream_error: {
        code: 'FACTORFORGE_APPLICATION_ERROR',
        message: 'FactorForge returned an application-level error without a 0% constraint-conflict signal. Error details are intentionally summarized without echoing submitted sequence material.',
      },
    };
  }

  if (!zeroPassRate) return result;

  const relaxableAxes = Array.from(new Set(failedConstraints.map((item) => item.axis)));
  return {
    ...result,
    status: 'constraint_conflict',
    conflict: {
      code: 'ZERO_PASS_RATE_CONSTRAINT_CONFLICT',
      message: 'FactorForge reported a 0% pass-rate or all-constraint conflict. The MCP server did not relax constraints or rerun optimization; the options below are advisory tradeoffs for an agent/human to consider explicitly.',
      failed_constraints: failedConstraints,
    },
    negotiation: {
      advisory_only: true,
      auto_relaxed: false,
      relaxable_axes: relaxableAxes,
      pareto_frontier_candidates: buildParetoFrontierCandidates(relaxableAxes, result.metrics, context.profile),
    },
  };
}

function baseResult(
  context: FactorForgeOptimizeRequestContext,
  root: Record<string, unknown>,
  metrics: Record<string, unknown>,
): FactorForgeMcpOptimizeResult {
  const optimizedSequence = stringOrNull(root.optimized_sequence) ?? stringOrNull(root.dna);
  const metadata = asRecord(root.metadata);
  return {
    status: 'success',
    tool: 'factorforge_cds_optimize',
    profile: isPublicFactorForgeProfile(root.profile) ? root.profile : context.profile,
    host: context.host ?? stringOrNull(root.host_profile) ?? 'nbenthamiana',
    metrics: {
      cai: numberOrNull(metrics.cai),
      gc_percent: numberOrNull(metrics.gc_percent),
      length_nt: numberOrNull(metrics.length) ?? numberOrNull(root.optimized_length) ?? (optimizedSequence ? optimizedSequence.length : null),
      gc_target_reached: boolOrNull(metrics.gc_target_reached),
      requested_gc_min_percent: numberOrNull(metrics.requested_gc_min_percent),
      requested_gc_max_percent: numberOrNull(metrics.requested_gc_max_percent),
    },
    result: {
      optimized_sequence: optimizedSequence,
      optimized_length_nt: numberOrNull(root.optimized_length) ?? (optimizedSequence ? optimizedSequence.length : null),
      result_identifier: stringOrNull(root.result_identifier),
      validation_status: stringOrNull(root.validation_status),
    },
    validationhub_handoff: {
      registry_v0_schema_change_required: false,
      implementation_status: 'documented_interface_only',
      artifact_hash_fields: ['input_fasta_sha256', 'output_fasta_sha256', 'registry_constants_sha256'],
      notes: 'Future Registry v0 handoff should register only public-safe artifact hashes, tool version metadata, and non-confidential summaries. This MCP contract does not store or log raw/private sequences and does not modify the Registry v0 schema.',
    },
    claim_boundary: FACTORFORGE_CLAIM_BOUNDARY,
    upstream_summary: {
      product_version: stringOrNull(root.product_version) ?? stringOrNull(metadata.product_version),
      reference_policy_version: stringOrNull(root.reference_policy_version) ?? stringOrNull(metadata.reference_policy_version),
      codon_reference_id: stringOrNull(root.codon_reference_id) ?? stringOrNull(metadata.codon_reference_id),
      has_constraint_report: Object.keys(asRecord(root.constraint_report)).length > 0,
      has_qc_decision_matrix: Object.keys(asRecord(root.qc_decision_matrix)).length > 0 || asArray(root.qc_decision_matrix).length > 0,
      has_acceptance_evaluation: Object.keys(asRecord(root.acceptance_evaluation)).length > 0,
    },
  };
}

function detectFailedConstraints(root: Record<string, unknown>, metrics: Record<string, unknown>): FactorForgeFailedConstraint[] {
  const failures: FactorForgeFailedConstraint[] = [];
  if (metrics.gc_target_reached === false) {
    failures.push({
      axis: 'gc_window',
      code: 'GC_TARGET_NOT_REACHED',
      observed: { gc_percent: metrics.gc_percent },
      requested: {
        min_percent: metrics.requested_gc_min_percent,
        max_percent: metrics.requested_gc_max_percent,
      },
      source: 'metrics.gc_target_reached',
    });
  }

  const acceptance = asRecord(root.acceptance_evaluation);
  collectBooleanFailures(acceptance, 'acceptance_evaluation', failures);
  collectDecisionFailures(root.qc_decision_matrix, 'qc_decision_matrix', failures);
  collectDecisionFailures(root.constraint_report, 'constraint_report', failures);

  return coalesceFailures(failures);
}

function collectBooleanFailures(value: unknown, source: string, failures: FactorForgeFailedConstraint[], prefix = ''): void {
  const record = asRecord(value);
  for (const [key, val] of Object.entries(record)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof val === 'boolean' && val === false) {
      failures.push({ axis: inferAxis(path), code: `${path.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}_FAILED`, observed: false, requested: true, source });
    } else if (val && typeof val === 'object' && !Array.isArray(val)) {
      collectBooleanFailures(val, source, failures, path);
    }
  }
}

function collectDecisionFailures(value: unknown, source: string, failures: FactorForgeFailedConstraint[]): void {
  const items = Array.isArray(value) ? value : Object.entries(asRecord(value)).map(([key, val]) => ({ key, val }));
  for (const item of items) {
    const record = asRecord(item);
    const nested = asRecord(record.val);
    const name = stringOrNull(record.name) ?? stringOrNull(record.check_id) ?? stringOrNull(record.constraint) ?? stringOrNull(record.key) ?? stringOrNull(nested.name) ?? stringOrNull(nested.check_id) ?? stringOrNull(nested.constraint) ?? 'constraint';
    const status = lower(record.status ?? record.decision ?? nested.status ?? nested.decision);
    const passed = record.passed ?? record.pass ?? nested.passed ?? nested.pass;
    const failed = passed === false || ['fail', 'failed', 'blocked', 'reject', 'rejected'].includes(status);
    if (failed) {
      failures.push({ axis: inferAxis(name), code: `${name.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}_FAILED`, observed: { status: status || passed }, requested: 'pass', source });
    }
  }
}

function isZeroPassRateConflict(root: Record<string, unknown>, failures: FactorForgeFailedConstraint[]): boolean {
  const acceptance = asRecord(root.acceptance_evaluation);
  const passRate = numberOrNull(acceptance.pass_rate) ?? numberOrNull(acceptance.pass_rate_percent);
  if (passRate === 0) return true;

  const passedCount = numberOrNull(acceptance.passed_count) ?? numberOrNull(acceptance.pass_count);
  const totalCount = numberOrNull(acceptance.total_count) ?? numberOrNull(acceptance.total);
  if (passedCount === 0 && totalCount !== null && totalCount > 0) return true;

  const matrixPassRate = numberOrNull(readNested(root, ['qc_decision_matrix', 'pass_rate']))
    ?? numberOrNull(readNested(root, ['decision_summary', 'pass_rate']))
    ?? numberOrNull(readNested(root, ['decision_summary', 'pass_rate_percent']));
  if (matrixPassRate === 0) return true;

  const automatedDecision = lower(root.automated_decision ?? readNested(root, ['decision_summary', 'automated_decision']));
  return failures.length > 0 && ['reject', 'rejected', 'blocked', 'no_pass', 'zero_pass'].some((token) => automatedDecision.includes(token));
}

function coalesceFailures(failures: FactorForgeFailedConstraint[]): FactorForgeFailedConstraint[] {
  const seen = new Set<string>();
  return failures.filter((failure) => {
    const key = `${failure.axis}:${failure.code}:${failure.source}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function inferAxis(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('gc')) return 'gc_window';
  if (n.includes('cai')) return 'cai_target';
  if (n.includes('mfe')) return 'mfe_review';
  if (n.includes('type_iis') || n.includes('restriction') || n.includes('moclo') || n.includes('assembly')) return 'assembly_constraints';
  if (n.includes('host')) return 'host_profile';
  if (n.includes('acceptance') || n.includes('decision')) return 'acceptance_criteria';
  return 'design_constraints';
}

function buildParetoFrontierCandidates(
  axes: string[],
  metrics: FactorForgeMetricSummary,
  profile: string,
): FactorForgeParetoCandidate[] {
  const candidates: FactorForgeParetoCandidate[] = [];
  if (axes.includes('gc_window')) {
    candidates.push({
      candidate_id: 'relax_gc_window_preserve_cai',
      relax: ['gc_window'],
      preserve: ['amino_acid_identity', 'public_profile_scope', 'no_silent_relaxation'],
      expected_tradeoff: `Accept observed GC ${metrics.gc_percent ?? 'N/A'}% or widen the requested GC interval while keeping the current profile (${profile}).`,
      suggested_request_delta: { profile, gc_constraint_mode: 'widen_or_advisory_review' },
    });
  }
  if (axes.includes('cai_target')) {
    candidates.push({
      candidate_id: 'relax_cai_target_preserve_gc_review',
      relax: ['cai_target'],
      preserve: ['amino_acid_identity', 'gc_window_review'],
      expected_tradeoff: 'Lower the CAI target or compare against balanced/high_cai profiles explicitly; do not reinterpret CAI scoring semantics.',
      suggested_request_delta: { compare_profiles: ['balanced', 'high_cai'] },
    });
  }
  if (axes.includes('assembly_constraints')) {
    candidates.push({
      candidate_id: 'prioritize_assembly_friendly_profile',
      relax: ['cai_target', 'gc_window'],
      preserve: ['assembly_constraints', 'amino_acid_identity'],
      expected_tradeoff: 'Try the public assembly_friendly profile to prioritize Type IIS / assembly-oriented review over CAI or narrow GC targets.',
      suggested_request_delta: { profile: 'assembly_friendly' },
    });
  }
  if (axes.includes('mfe_review')) {
    candidates.push({
      candidate_id: 'treat_mfe_as_review_axis',
      relax: ['mfe_review'],
      preserve: ['amino_acid_identity', 'deterministic_review'],
      expected_tradeoff: 'Treat MFE as a review flag unless an explicitly approved design contract makes it a hard constraint.',
      suggested_request_delta: { mfe_constraint_mode: 'advisory_review' },
    });
  }
  if (candidates.length === 0) {
    candidates.push({
      candidate_id: 'compare_public_profiles_without_auto_relaxation',
      relax: axes.length ? axes : ['design_constraints'],
      preserve: ['amino_acid_identity', 'public_profile_scope', 'no_silent_relaxation'],
      expected_tradeoff: 'Run an explicit compare call across public profiles and choose a human-approved tradeoff; MCP will not silently relax constraints.',
      suggested_request_delta: { compare_profiles: PUBLIC_FACTORFORGE_PROFILES },
    });
  }
  return candidates;
}
