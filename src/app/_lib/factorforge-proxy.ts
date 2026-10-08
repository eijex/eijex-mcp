/** Public HTTP bridge; sequence inputs are neither written to disk nor logged. */
export class ToolExecutionError extends Error {}

const profiles = ['balanced', 'high_cai', 'gc_target', 'assembly_friendly'];
const engines = ['profile', 'dp', 'dp_v2_1', 'dp_v2_1_1', 'slm', 'dual_compare'];
type Result = {
  success?: boolean; error?: string; optimized_sequence?: string; product_version?: string;
  metrics?: { cai?: number; gc_percent?: number };
  provenance?: { engine_id?: string; engine_version?: string; engine_status?: string };
  comparison?: unknown;
};

export function optimizationRequest(args: Record<string, unknown>) {
  const sequence = typeof args.sequence === 'string' ? args.sequence.trim().toUpperCase() : '';
  if (!sequence || sequence.length > 2000) throw new ToolExecutionError('Sequence must contain 1–2000 amino acids.');
  const profile = args.profile ?? 'balanced';
  const engine = args.engine ?? 'profile';
  const host = args.host ?? 'nbenthamiana';
  if (!profiles.includes(String(profile)) || !engines.includes(String(engine)) || !['nbenthamiana', 'by2'].includes(String(host))) {
    throw new ToolExecutionError('Unsupported profile, engine, or host.');
  }
  if (args.save_db === true) throw new ToolExecutionError('Public MCP does not persist designs; use the permissioned persistence adapter.');
  const mode = engine === 'slm' || engine === 'dual_compare' ? engine : 'profile';
  const objective = engine === 'dp' ? 'feasibility_best' : engine === 'dp_v2_1' || engine === 'dp_v2_1_1' ? engine : undefined;
  return { sequence, profile, host, mode, ...(objective ? { objective } : {}), return_candidates: true };
}

export async function optimizeViaHttp(args: Record<string, unknown>, fetcher: typeof fetch = fetch): Promise<string> {
  const request = optimizationRequest(args);
  let response: Response;
  try {
    response = await fetcher('https://factorforge.eijex.com/api/optimize', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request), signal: AbortSignal.timeout(60000),
    });
  } catch {
    throw new ToolExecutionError('FactorForge request failed or timed out.');
  }
  // Do not relay upstream exception text, paths, or echoed sequence inputs.
  if (!response.ok) throw new ToolExecutionError(`FactorForge API returned HTTP ${response.status}. Research engines may be disabled on this deployment.`);
  let result: Result;
  try { result = await response.json() as Result; }
  catch { throw new ToolExecutionError('FactorForge returned an invalid JSON response.'); }
  if (!result || result.error || result.success === false || typeof result.optimized_sequence !== 'string' || !result.optimized_sequence) {
    throw new ToolExecutionError('FactorForge did not return a successful design.');
  }
  const metric = (value: number | undefined, digits: number) => typeof value === 'number' && Number.isFinite(value) ? value.toFixed(digits) : 'N/A';
  return [
    '## FactorForge CDS Optimization',
    `Product: ${result.product_version ?? 'Not reported'} | Host: ${request.host}`,
    `Engine: ${result.provenance?.engine_id ?? 'Not reported'} ${result.provenance?.engine_version ?? ''} | Status: ${result.provenance?.engine_status ?? 'Not reported'}`,
    '- Evidence boundary: in-silico design; no expression, yield, or experimental-validity claim.',
    `- CAI: ${metric(result.metrics?.cai, 4)}`, `- GC%: ${metric(result.metrics?.gc_percent, 1)}`,
    '', '**Sequence (FASTA)**', '```fasta', `>factorforge-${request.profile}`, result.optimized_sequence, '```',
    ...(result.comparison ? ['', '**Engine comparison**', '```json', JSON.stringify(result.comparison, null, 2), '```'] : []),
  ].join('\n');
}

export async function toolCallResult(operation: () => Promise<string>) {
  try { return { content: [{ type: 'text', text: await operation() }] }; }
  catch (error) {
    return { isError: true, content: [{ type: 'text', text: error instanceof ToolExecutionError ? error.message : 'Tool execution failed.' }] };
  }
}
