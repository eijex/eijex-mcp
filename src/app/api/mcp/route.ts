/**
 * Eijex MCP Server
 * Protocol: JSON-RPC 2.0 over HTTP (Streamable HTTP transport)
 *
 * Connect from Claude Code (.mcp.json):
 *   { "mcpServers": { "eijex": { "type": "http", "url": "https://eijex-mcp.vercel.app/api/mcp" } } }
 *
 * Connect from VSCode Copilot (settings.json):
 *   { "mcp": { "servers": { "eijex": { "type": "http", "url": "https://eijex-mcp.vercel.app/api/mcp" } } } }
 */

import { NextRequest, NextResponse } from 'next/server';

// ── Tool definitions ───────────────────────────────────────────────────

const TOOLS = [
  {
    name: 'factorforge_optimize_cds',
    description: 'Optimize a protein sequence into a codon-adapted DNA coding sequence (CDS) for expression in Nicotiana benthamiana using the FactorForge v2 rule-based engine.',
    inputSchema: {
      type: 'object',
      properties: {
        sequence: {
          type: 'string',
          description: 'Amino acid sequence (single-letter code, e.g. "MSKGEELFTG...")',
        },
        profile: {
          type: 'string',
          description: 'Optimization profile: balanced | high_cai | gc_target | assembly_friendly | ramp | viral_delivery (default: balanced)',
          enum: ['balanced', 'high_cai', 'gc_target', 'assembly_friendly', 'ramp', 'viral_delivery'],
        },
      },
      required: ['sequence'],
    },
  },
  {
    name: 'query_pubmed',
    description: 'Search PubMed for scientific literature. Useful for biotech research, drug discovery, clinical evidence, and domain-specific literature reviews.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search keywords (e.g. "codon optimization Nicotiana benthamiana")' },
        max_results: { type: 'number', description: 'Maximum number of results (default: 5, max: 10)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'query_pdb',
    description: 'Search the RCSB Protein Data Bank for 3D protein structures. Useful for structural biology, drug target analysis, and protein engineering.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Protein name or PDB ID (e.g. "CD47", "1TZV")' },
        max_results: { type: 'number', description: 'Maximum number of structures (default: 5)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'query_kegg',
    description: 'Search KEGG for biological pathways. Useful for pathway analysis, drug target discovery, and systems biology.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Pathway keyword (e.g. "Alzheimer", "neurodegeneration")' },
        organism: { type: 'string', description: 'Organism code (default: hsa = human, mmu = mouse)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'query_clinicaltrials',
    description: 'Search ClinicalTrials.gov for registered clinical trials. Useful for competitive intelligence, trial design, and patient eligibility research.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search keywords (e.g. "type 2 diabetes GLP-1", "Alzheimer tau immunotherapy")' },
        status: { type: 'string', description: 'Trial status filter: RECRUITING | ACTIVE_NOT_RECRUITING | COMPLETED (optional)' },
        max_results: { type: 'number', description: 'Maximum number of trials (default: 5)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'factorforge_verify_parameter',
    description: 'Initialize a structured 0→7 step research workflow to verify or update a FactorForge design constant (e.g. GC_OPT_MIN, CAI_THRESHOLD). Returns a ready-to-execute research plan with pre-filled PubMed queries and decision gates.',
    inputSchema: {
      type: 'object',
      properties: {
        param: {
          type: 'string',
          description: 'Parameter name as it appears in the codebase (e.g. "GC_OPT_MIN", "CAI_THRESHOLD", "RAMP_WINDOW")',
        },
        current_value: {
          type: 'string',
          description: 'Current value in the codebase (e.g. "55.0", "0.80")',
        },
        hypothesis: {
          type: 'string',
          description: 'Optional: what you expect the correct value to be, or why you are questioning the current value',
        },
        keywords: {
          type: 'string',
          description: 'Optional: additional PubMed keywords to include (e.g. "Nicotiana benthamiana transient expression")',
        },
      },
      required: ['param', 'current_value'],
    },
  },
];

// ── Tool handlers ──────────────────────────────────────────────────────

async function handleTool(name: string, args: Record<string, unknown>): Promise<string> {
  switch (name) {

    // ── factorforge_optimize_cds ──────────────────────────────────────
    case 'factorforge_optimize_cds': {
      const sequence = args.sequence as string;
      const profile = (args.profile as string) || 'balanced';

      if (!sequence || sequence.trim().length === 0) {
        return 'Error: sequence is required.';
      }

      const resp = await fetch('https://factorforge-cds.vercel.app/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sequence: sequence.trim().toUpperCase(), profile }),
        signal: AbortSignal.timeout(30000),
      });

      if (!resp.ok) {
        const errText = await resp.text().catch(() => '');
        return `FactorForge API error: HTTP ${resp.status}\n${errText}`;
      }

      const data = await resp.json() as {
        dna?: string;
        metrics?: { cai?: number; gc_percent?: number; length?: number };
        warnings?: string[];
        profile?: string;
      };

      const dna = data.dna ?? '';
      const m = data.metrics ?? {};
      const warnings = (data.warnings ?? []).map((w) => `⚠️ ${w}`).join('\n');

      return [
        `## FactorForge CDS Optimization Result`,
        `Profile: ${data.profile ?? profile} | Host: Nicotiana benthamiana`,
        '',
        `**Metrics**`,
        `- CAI: ${m.cai?.toFixed(4) ?? 'N/A'} (target ≥ 0.80)`,
        `- GC%: ${m.gc_percent?.toFixed(1) ?? 'N/A'}% (target 55–65%)`,
        `- Length: ${m.length ?? dna.length} nt`,
        '',
        `**Optimized DNA (5'→3')**`,
        '```',
        dna || '(no sequence returned)',
        '```',
        warnings ? `\n${warnings}` : '',
        '',
        `Powered by [FactorForge CDS](https://factorforge-cds.vercel.app) (Apache 2.0)`,
      ].filter((l) => l !== undefined).join('\n').trim();
    }

    // ── query_pubmed ──────────────────────────────────────────────────
    case 'query_pubmed': {
      const query = args.query as string;
      const maxResults = Math.min((args.max_results as number) || 5, 10);

      const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${maxResults}&retmode=json&sort=relevance`;
      const searchResp = await fetch(searchUrl, { signal: AbortSignal.timeout(8000) });
      if (!searchResp.ok) return `PubMed search failed: HTTP ${searchResp.status}`;

      const searchData = await searchResp.json() as { esearchresult?: { idlist?: string[] } };
      const ids = searchData.esearchresult?.idlist ?? [];
      if (ids.length === 0) return `No PubMed results for "${query}".`;

      const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json`;
      const summaryResp = await fetch(summaryUrl, { signal: AbortSignal.timeout(8000) });
      if (!summaryResp.ok) return `PubMed summary failed: HTTP ${summaryResp.status}`;

      const summaryData = await summaryResp.json() as { result?: Record<string, { title?: string; authors?: Array<{ name: string }>; pubdate?: string; source?: string }> };
      const result = summaryData.result ?? {};

      const lines = ids.map((id) => {
        const paper = result[id];
        if (!paper) return null;
        const authors = (paper.authors ?? []).slice(0, 3).map((a) => a.name).join(', ');
        const moreAuthors = (paper.authors ?? []).length > 3 ? ' et al.' : '';
        return `**${paper.title ?? '(no title)'}**\n  ${authors}${moreAuthors} | ${paper.source ?? ''} ${paper.pubdate ?? ''}\n  🔗 https://pubmed.ncbi.nlm.nih.gov/${id}/`;
      }).filter(Boolean);

      return `## PubMed — "${query}" (${lines.length} results)\n\n${lines.join('\n\n')}`;
    }

    // ── query_pdb ─────────────────────────────────────────────────────
    case 'query_pdb': {
      const query = args.query as string;
      const maxResults = (args.max_results as number) || 5;

      const searchPayload = {
        query: { type: 'terminal', service: 'full_text', parameters: { value: query } },
        return_type: 'entry',
        request_options: { paginate: { start: 0, rows: maxResults } },
      };

      const searchResp = await fetch('https://search.rcsb.org/rcsbsearch/v1/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(searchPayload),
        signal: AbortSignal.timeout(8000),
      });
      if (!searchResp.ok) return `PDB search failed: HTTP ${searchResp.status}`;

      const searchData = await searchResp.json() as { result_set?: Array<{ identifier: string; score: number }> };
      const entries = searchData.result_set ?? [];
      if (entries.length === 0) return `No PDB structures found for "${query}".`;

      const detailPromises = entries.slice(0, maxResults).map(async (e) => {
        const detailResp = await fetch(`https://data.rcsb.org/rest/v1/core/entry/${e.identifier}`, { signal: AbortSignal.timeout(5000) });
        if (!detailResp.ok) return `${e.identifier}: detail fetch failed`;
        const detail = await detailResp.json() as { struct?: { title?: string }; rcsb_entry_info?: { resolution_combined?: number[] } };
        const title = detail.struct?.title ?? '(no title)';
        const res = detail.rcsb_entry_info?.resolution_combined?.[0];
        const resStr = res ? ` | Resolution: ${res}Å` : '';
        return `**${e.identifier}** — ${title}${resStr}\n  🔗 https://www.rcsb.org/structure/${e.identifier}`;
      });

      const details = await Promise.all(detailPromises);
      return `## PDB — "${query}" (${details.length} results)\n\n${details.join('\n\n')}`;
    }

    // ── query_kegg ────────────────────────────────────────────────────
    case 'query_kegg': {
      const query = args.query as string;
      const organism = (args.organism as string) || 'hsa';

      const searchResp = await fetch(`https://rest.kegg.jp/find/pathway/${encodeURIComponent(query)}`, { signal: AbortSignal.timeout(8000) });
      if (!searchResp.ok) return `KEGG search failed: HTTP ${searchResp.status}`;

      const text = await searchResp.text();
      const allLines = text.trim().split('\n').filter(Boolean);
      if (allLines.length === 0) return `No KEGG pathways found for "${query}".`;

      const orgLines = allLines.filter((l) => l.startsWith(`path:${organism}`));
      const displayLines = (orgLines.length > 0 ? orgLines : allLines).slice(0, 8);

      const formatted = displayLines.map((line) => {
        const [id, ...nameParts] = line.split('\t');
        const pathId = id.replace('path:', '');
        return `**${pathId}** — ${nameParts.join(' ')}\n  🔗 https://www.kegg.jp/pathway/${pathId}`;
      });

      const orgNote = orgLines.length > 0 ? ` (${organism})` : ' (all organisms)';
      return `## KEGG Pathways — "${query}"${orgNote} (${formatted.length} results)\n\n${formatted.join('\n\n')}`;
    }

    // ── query_clinicaltrials ──────────────────────────────────────────
    case 'query_clinicaltrials': {
      const query = args.query as string;
      const status = args.status as string | undefined;
      const maxResults = (args.max_results as number) || 5;

      const params = new URLSearchParams({
        'query.term': query,
        'pageSize': String(maxResults),
        'format': 'json',
        'fields': 'NCTId,BriefTitle,OverallStatus,Phase,Condition,StartDate,PrimaryCompletionDate',
      });
      if (status) params.set('filter.overallStatus', status);

      const resp = await fetch(`https://clinicaltrials.gov/api/v2/studies?${params}`, { signal: AbortSignal.timeout(10000) });
      if (!resp.ok) return `ClinicalTrials.gov search failed: HTTP ${resp.status}`;

      const data = await resp.json() as { studies?: Array<{ protocolSection?: { identificationModule?: { nctId?: string; briefTitle?: string }; statusModule?: { overallStatus?: string; startDateStruct?: { date?: string } }; designModule?: { phases?: string[] }; conditionsModule?: { conditions?: string[] } } }> };
      const studies = data.studies ?? [];
      if (studies.length === 0) return `No clinical trials found for "${query}".`;

      const lines = studies.map((s) => {
        const id = s.protocolSection?.identificationModule;
        const st = s.protocolSection?.statusModule;
        const design = s.protocolSection?.designModule;
        const cond = s.protocolSection?.conditionsModule;
        const nctId = id?.nctId ?? '';
        const phase = (design?.phases ?? []).join(', ') || 'N/A';
        const conditions = (cond?.conditions ?? []).slice(0, 2).join(', ');
        return `**${nctId}** — ${id?.briefTitle ?? '(no title)'}\n  Status: ${st?.overallStatus ?? 'N/A'} | Phase: ${phase} | Start: ${st?.startDateStruct?.date ?? ''}\n  Conditions: ${conditions}\n  🔗 https://clinicaltrials.gov/study/${nctId}`;
      });

      return `## ClinicalTrials.gov — "${query}" (${lines.length} results)\n\n${lines.join('\n\n')}`;
    }

    // ── factorforge_verify_parameter ──────────────────────────────────
    case 'factorforge_verify_parameter': {
      const param = args.param as string;
      const currentValue = args.current_value as string;
      const hypothesis = (args.hypothesis as string) || '';
      const extraKeywords = (args.keywords as string) || '';

      const baseKeywords = `${param.replace(/_/g, ' ').toLowerCase()} codon optimization Nicotiana benthamiana`;
      const searchTerms = [
        `"${baseKeywords}"`,
        `"GC content plant transient expression CDS"`,
        `"codon usage ${extraKeywords || 'N. benthamiana recombinant protein'}"`,
      ];

      return [
        `## FactorForge Parameter Verification Workflow`,
        ``,
        `**Parameter**: \`${param}\``,
        `**Current value**: ${currentValue}`,
        `**Hypothesis**: ${hypothesis || '(none provided)'}`,
        ``,
        `---`,
        ``,
        `### STEP 0 — Question Definition`,
        `What is the evidence-based optimal value for \`${param}\` in FactorForge CDS optimization?`,
        `Is the current value **${currentValue}** supported by published literature?`,
        ``,
        `### STEP 1 — Literature Search`,
        `Run these queries with \`query_pubmed\` (max_results: 10 each):`,
        ...searchTerms.map((t) => `- ${t}`),
        ``,
        `### STEP 2 — Structural Reference`,
        `Run with \`query_pdb\`: \`"plant codon optimized gene expression"\``,
        ``,
        `### STEP 3 — Pathway Context`,
        `Run with \`query_kegg\`: \`"plant gene expression"\` (organism: nta = N. tabacum proxy)`,
        ``,
        `> ⛔ **GATE 3.5 — Literature Review Decision**`,
        `> Collect PMIDs from Steps 1–3. Record the reported value range.`,
        `> **Question**: Does published evidence support the current value of **${currentValue}**?`,
        `> Answer: yes / no / unclear — before proceeding to STEP 4.`,
        ``,
        `### STEP 4 — Quantify Evidence`,
        `- Count studies reporting a value or range for this parameter`,
        `- Note the consensus range (e.g. 50–65% for GC content)`,
        `- Is the current value **${currentValue}** within the reported consensus?`,
        ``,
        `### STEP 5 — Consensus Check`,
        `- Minimum evidence threshold: n ≥ 3 independent studies`,
        `- Calculate weighted midpoint from the reported ranges`,
        `- Flag contradicting papers`,
        ``,
        `### STEP 6 — Code Impact Analysis`,
        `Before changing, confirm which files define this constant:`,
        `- \`src/factorforge/engines/v2/scoring.py\``,
        `- \`api/optimize.py\` (may have a separate DEFAULT_ variant — independent decision)`,
        ``,
        `> ⛔ **GATE 6.5 — Update Decision**`,
        `> Recommend: **Keep at ${currentValue}** — or — **Update to [new value]**`,
        `> Justification: [PMIDs], n=[X] studies, consensus range=[range], mean=[value]`,
        ``,
        `### STEP 7 — Report`,
        `Record result in \`parameter_registry.yaml\`:`,
        '```yaml',
        `${param}:`,
        `  current_value: ${currentValue}`,
        `  recommended_value: # fill in`,
        `  pmids: []`,
        `  n_studies: 0`,
        `  verified: ${new Date().toISOString().slice(0, 10)}`,
        `  source_file: src/factorforge/engines/v2/scoring.py`,
        '```',
        ``,
        `---`,
        `*Generated by factorforge_verify_parameter — start with STEP 1 using query_pubmed.*`,
      ].join('\n');
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// ── JSON-RPC helpers ───────────────────────────────────────────────────

function ok(id: unknown, result: unknown) {
  return NextResponse.json({ jsonrpc: '2.0', id, result });
}

function err(id: unknown, code: number, message: string) {
  return NextResponse.json({ jsonrpc: '2.0', id, error: { code, message } });
}

// ── Route handlers ─────────────────────────────────────────────────────

export async function GET() {
  return NextResponse.json({
    name: 'eijex-mcp',
    version: '1.0.0',
    description: 'Eijex MCP Server — Codon optimization + biomedical databases + AI workflow tools',
    transport: 'streamable-http',
    endpoint: '/api/mcp',
    tools: TOOLS.length,
    source: 'https://github.com/eijex/mcp-server',
  });
}

export async function POST(req: NextRequest) {
  let body: { jsonrpc: string; id?: unknown; method: string; params?: unknown };

  try {
    body = await req.json();
  } catch {
    return err(null, -32700, 'Parse error');
  }

  const { id, method, params } = body;

  try {
    switch (method) {
      case 'initialize':
        return ok(id, {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: { name: 'eijex-mcp', version: '1.0.0' },
        });

      case 'notifications/initialized':
        return new NextResponse(null, { status: 204 });

      case 'tools/list':
        return ok(id, { tools: TOOLS });

      case 'tools/call': {
        const { name, arguments: args = {} } = params as {
          name: string;
          arguments?: Record<string, unknown>;
        };
        const text = await handleTool(name, args);
        return ok(id, { content: [{ type: 'text', text }] });
      }

      case 'ping':
        return ok(id, {});

      default:
        return err(id, -32601, `Method not found: ${method}`);
    }
  } catch (e) {
    return err(id, -32603, String(e));
  }
}
