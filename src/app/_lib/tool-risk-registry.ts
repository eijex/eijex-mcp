export type RiskLevel = 'Low' | 'Medium' | 'High';

export interface ToolRiskEntry {
  risk: RiskLevel;
  forbidden_params?: string[];
  notes?: string;
}

const low: ToolRiskEntry = { risk: 'Low', forbidden_params: [] };

export const TOOL_RISK_REGISTRY: Record<string, ToolRiskEntry> = {
  factorforge_cds_optimize: low,
  factorforge_cds_compare: low,
  factorforge_cds_batch: low,
  query_pubmed: low,
  query_pdb: low,
  query_kegg: low,
  factorforge_verify_parameter: low,
  query_ncbi: low,
  query_uniprot: low,
  query_alphafold: low,
  query_interpro: low,
  prd_b_run_factorforge: { risk: 'Medium', forbidden_params: ['raw_sequence', 'hub_root', 'approval_status', 'sequence_material_ref', 'local_path'] },
  prd_b_commit_private_record: { risk: 'Medium', forbidden_params: ['approval_status', 'hub_root'] },
  prd_b_generate_approval_packet: { risk: 'Medium', forbidden_params: ['raw_sequence'] },
  prd_b_list_index: low,
  prd_b_get_private_record: { risk: 'Medium', forbidden_params: [] },
  prd_b_get_approval_status: low,
  prd_b_flush_public_projection: { risk: 'High', forbidden_params: ['approval_status'], notes: 'Irreversible public write. Requires prior human approval.' },
  prd_b_get_public_projection: low,
};

export const FORBIDDEN_TOOLS = [
  'approve_record',
  'reject_record',
  'request_changes',
  'set_approval_status',
  'prd_b_list_packets',
] as const;

const RISK_BURST_LIMIT = 5;
const RISK_BURST_WINDOW_MS = 60_000;
const riskBurstMap = new Map<string, { count: number; resetAt: number }>();

export function evaluateToolRisk(
  toolName: string,
  params: Record<string, unknown>,
  sessionId = 'global',
): void {
  if ((FORBIDDEN_TOOLS as readonly string[]).includes(toolName)) {
    throw riskError(404, `Tool not found: ${toolName}`);
  }
  const entry = TOOL_RISK_REGISTRY[toolName];
  if (!entry) return;
  for (const parameter of entry.forbidden_params ?? []) {
    if (parameter in params) {
      throw riskError(403, `Forbidden parameter '${parameter}' in tool '${toolName}'`);
    }
  }
  if (entry.risk === 'High') {
    console.warn(`[tool-risk-audit] high-risk tool invoked: ${toolName}`);
  }
  trackRiskBurst(sessionId, entry.risk);
}

function riskError(status: number, message: string): Error {
  const error = new Error(message) as Error & { status?: number };
  error.status = status;
  return error;
}

function trackRiskBurst(sessionId: string, risk: RiskLevel): void {
  if (risk === 'Low') {
    riskBurstMap.delete(sessionId);
    return;
  }
  const now = Date.now();
  const current = riskBurstMap.get(sessionId);
  const count = !current || now > current.resetAt ? 1 : current.count + 1;
  riskBurstMap.set(sessionId, { count, resetAt: now + RISK_BURST_WINDOW_MS });
  if (count >= RISK_BURST_LIMIT) {
    throw riskError(429, 'High/medium risk tool burst rejected');
  }
}
