/**
 * Eijex MCP Server
 * Protocol: JSON-RPC 2.0 over HTTP (Streamable HTTP transport)
 *
 * Connect from Claude Code (.mcp.json):
 *   { "mcpServers": { "eijex": { "type": "http", "url": "https://mcp.eijex.com/api/mcp" } } }
 *
 * Connect from VSCode Copilot (settings.json):
 *   { "mcp": { "servers": { "eijex": { "type": "http", "url": "https://mcp.eijex.com/api/mcp" } } } }
 */

import { NextRequest, NextResponse } from 'next/server';

// ── Rate limiting (in-memory, per serverless instance) ────────────────
const RATE_LIMIT = 60;
const RATE_WINDOW_MS = 60_000;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

// ── Tool definitions ───────────────────────────────────────────────────

const TOOLS = [
  {
    name: 'factorforge_cds_optimize',
    description: 'Optimize a protein sequence into a codon-adapted DNA coding sequence (CDS) for expression in Nicotiana benthamiana using FactorForge CDS v3.1.6. Default uses constraint-based DP feasibility design; profile-based design modes are available when specified.',
    inputSchema: {
      type: 'object',
      properties: {
        sequence: {
          type: 'string',
          description: 'Amino acid sequence (single-letter code, e.g. "MSKGEELFTG...")',
        },
        profile: {
          type: 'string',
          description: 'Optimization profile: balanced | high_cai | gc_target | assembly_friendly | ramp | viral_delivery | ml_enhanced (default: balanced)',
          enum: ['balanced', 'high_cai', 'gc_target', 'assembly_friendly', 'ramp', 'viral_delivery', 'ml_enhanced'],
        },
      },
      required: ['sequence'],
    },
  },
  {
    name: 'factorforge_cds_compare',
    description: 'Compare multiple FactorForge CDS optimization profiles side-by-side for the same protein sequence. Returns CAI, GC%, and composite score for each profile in a single call.',
    inputSchema: {
      type: 'object',
      properties: {
        sequence: {
          type: 'string',
          description: 'Amino acid sequence (single-letter code)',
        },
        profiles: {
          type: 'string',
          description: 'Comma-separated profiles to compare (e.g. "balanced,high_cai,gc_target"). Default: balanced,high_cai,gc_target',
        },
      },
      required: ['sequence'],
    },
  },
  {
    name: 'factorforge_cds_batch',
    description: 'Optimize multiple protein sequences in a single request using FactorForge CDS. Accepts up to 20 sequences. Returns CAI, GC%, and optimized CDS for each.',
    inputSchema: {
      type: 'object',
      properties: {
        sequences: {
          type: 'array',
          description: 'Array of sequences to optimize. Each item: { id: string, sequence: string }. Max 20.',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              sequence: { type: 'string' },
            },
            required: ['sequence'],
          },
        },
        profile: {
          type: 'string',
          description: 'Optimization profile applied to all sequences (default: balanced)',
          enum: ['balanced', 'high_cai', 'gc_target', 'assembly_friendly', 'ramp', 'viral_delivery', 'ml_enhanced'],
        },
      },
      required: ['sequences'],
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
  {
    name: 'query_ncbi',
    description: 'Search NCBI protein or nucleotide database and return sequence summaries and accession numbers.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Gene or protein name, or accession number (e.g. "GFP Aequorea victoria", "NP_005219")' },
        db: { type: 'string', description: 'Database: protein | nucleotide (default: protein)', enum: ['protein', 'nucleotide'] },
        max_results: { type: 'number', description: 'Maximum results (default: 3, max: 5)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'query_uniprot',
    description: 'Search UniProt for protein entries — accession, gene names, organism, function, and sequence length.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Protein name, gene symbol, or UniProt accession (e.g. "GFP", "P42212")' },
        organism: { type: 'string', description: 'Organism filter (e.g. "human", "Aequorea victoria")' },
        max_results: { type: 'number', description: 'Maximum results (default: 5, max: 10)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'query_alphafold',
    description: 'Fetch AlphaFold structure prediction for a protein by UniProt accession. Returns confidence scores and structure download links.',
    inputSchema: {
      type: 'object',
      properties: {
        uniprot_accession: { type: 'string', description: 'UniProt accession (e.g. "P42212"). Use query_uniprot first to find the accession.' },
      },
      required: ['uniprot_accession'],
    },
  },
  {
    name: 'query_opentargets',
    description: 'Search Open Targets Platform for gene targets or diseases and their associations.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Gene symbol or disease name (e.g. "EGFR", "Parkinson disease")' },
        entity: { type: 'string', description: 'Search entity: target | disease (default: target)', enum: ['target', 'disease'] },
        max_results: { type: 'number', description: 'Maximum results (default: 5, max: 10)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'query_fda',
    description: 'Search OpenFDA for drug adverse events, drug labels, or medical device reports. Useful for drug safety research, pharmacovigilance, and regulatory intelligence.',
    inputSchema: {
      type: 'object',
      properties: {
        drug_name: { type: 'string', description: 'Drug name or active ingredient (e.g. "aspirin", "ibuprofen")' },
        report_type: { type: 'string', description: 'Report type: adverse_event | label (default: adverse_event)', enum: ['adverse_event', 'label'] },
        max_results: { type: 'number', description: 'Maximum results (default: 5, max: 10)' },
      },
      required: ['drug_name'],
    },
  },
  {
    name: 'query_reactome',
    description: 'Search Reactome for biological pathways. Returns pathway names, stable IDs, and hierarchy. Complements KEGG with human-curated reaction-level detail.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Pathway or molecule keyword (e.g. "AQP4", "neuroinflammation", "codon")' },
        species: { type: 'string', description: 'Species filter (default: "Homo sapiens")' },
        max_results: { type: 'number', description: 'Maximum results (default: 5, max: 10)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'query_chembl',
    description: 'Search ChEMBL for bioactive compounds, drug targets, and bioactivity data. Useful for drug discovery, target validation, and compound screening.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Target name or compound keyword (e.g. "AQP4", "aquaporin-4")' },
        search_type: {
          type: 'string',
          description: 'target = find protein targets | compound = find small molecules | activity = get bioactivity data for a known ChEMBL target ID (default: target)',
          enum: ['target', 'compound', 'activity'],
        },
        chembl_id: { type: 'string', description: 'ChEMBL target ID (e.g. "CHEMBL2093872"). Required when search_type=activity.' },
        max_results: { type: 'number', description: 'Maximum results (default: 5, max: 10)' },
      },
      required: ['query'],
    },
  },
];

// ── Tool handlers ──────────────────────────────────────────────────────

async function handleTool(name: string, args: Record<string, unknown>): Promise<string> {
  switch (name) {

    // ── factorforge_cds_optimize ──────────────────────────────────────
    case 'factorforge_cds_optimize': {
      const sequence = args.sequence as string;
      const profile = (args.profile as string) || 'balanced';

      if (!sequence || sequence.trim().length === 0) {
        return 'Error: sequence is required.';
      }
      if (sequence.trim().length > 2000) {
        return 'Error: sequence exceeds maximum length of 2000 amino acids.';
      }

      const resp = await fetch('https://factorforge.eijex.com/api/optimize', {
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
        `Powered by [FactorForge CDS](https://factorforge.eijex.com) (AGPL-3.0)`,
      ].filter((l) => l !== undefined).join('\n').trim();
    }

    // ── factorforge_cds_compare ───────────────────────────────────────
    case 'factorforge_cds_compare': {
      const sequence = args.sequence as string;
      const profiles = ((args.profiles as string) || 'balanced,high_cai,gc_target').split(',').map((p) => p.trim());

      if (!sequence || sequence.trim().length === 0) {
        return 'Error: sequence is required.';
      }

      const resp = await fetch('https://factorforge.eijex.com/api/optimize/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sequence: sequence.trim().toUpperCase(), profiles }),
        signal: AbortSignal.timeout(60000),
      });

      if (!resp.ok) {
        const errText = await resp.text().catch(() => '');
        return `FactorForge API error: HTTP ${resp.status}\n${errText}`;
      }

      const data = await resp.json() as {
        results?: Array<{
          profile: string;
          cai?: number;
          gc_percent?: number;
          score?: number;
          dna?: string;
        }>;
      };

      const results = data.results ?? [];
      if (results.length === 0) return 'No comparison results returned.';

      const header = `| Profile | CAI | GC% | Score |`;
      const divider = `|---------|-----|-----|-------|`;
      const rows = results.map((r) =>
        `| ${r.profile} | ${r.cai?.toFixed(4) ?? 'N/A'} | ${r.gc_percent?.toFixed(1) ?? 'N/A'}% | ${r.score?.toFixed(4) ?? 'N/A'} |`
      );

      return [
        `## FactorForge CDS Profile Comparison`,
        `Sequence length: ${sequence.trim().length} aa | Host: Nicotiana benthamiana`,
        '',
        header,
        divider,
        ...rows,
        '',
        `Powered by [FactorForge CDS](https://factorforge.eijex.com) (AGPL-3.0)`,
      ].join('\n');
    }

    // ── factorforge_cds_batch ─────────────────────────────────────────
    case 'factorforge_cds_batch': {
      const sequences = args.sequences as Array<{ id?: string; sequence: string }>;
      const profile = (args.profile as string) || 'balanced';

      if (!sequences || sequences.length === 0) {
        return 'Error: sequences array is required.';
      }
      if (sequences.length > 20) {
        return 'Error: maximum 20 sequences per batch request.';
      }
      for (const s of sequences) {
        if (!s.sequence || s.sequence.trim().length === 0) return 'Error: each sequence must be non-empty.';
        if (s.sequence.trim().length > 2000) return 'Error: each sequence must be 2000 amino acids or fewer.';
      }

      const payload = {
        sequences: sequences.map((s, i) => ({
          id: s.id ?? `seq_${i + 1}`,
          sequence: s.sequence.trim().toUpperCase(),
        })),
        profile,
      };

      const resp = await fetch('https://factorforge.eijex.com/api/optimize/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(120000),
      });

      if (!resp.ok) {
        const errText = await resp.text().catch(() => '');
        return `FactorForge API error: HTTP ${resp.status}\n${errText}`;
      }

      const data = await resp.json() as {
        results?: Array<{ id: string; cai?: number; gc_percent?: number; dna?: string; error?: string }>;
      };

      const results = data.results ?? [];
      if (results.length === 0) return 'No batch results returned.';

      const header = `| ID | CAI | GC% | Length |`;
      const divider = `|----|-----|-----|--------|`;
      const rows = results.map((r) =>
        r.error
          ? `| ${r.id} | — | — | Error: ${r.error} |`
          : `| ${r.id} | ${r.cai?.toFixed(4) ?? 'N/A'} | ${r.gc_percent?.toFixed(1) ?? 'N/A'}% | ${r.dna?.length ?? 'N/A'} nt |`
      );

      return [
        `## FactorForge CDS Batch Optimization`,
        `Profile: ${profile} | Sequences: ${results.length} | Host: Nicotiana benthamiana`,
        '',
        header,
        divider,
        ...rows,
        '',
        `Powered by [FactorForge CDS](https://factorforge.eijex.com) (AGPL-3.0)`,
      ].join('\n');
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
        `- \`src/factorforge/engines/profile/scoring.py\``,
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
        `  source_file: src/factorforge/engines/profile/scoring.py`,
        '```',
        ``,
        `---`,
        `*Generated by factorforge_verify_parameter — start with STEP 1 using query_pubmed.*`,
      ].join('\n');
    }

    // ── query_ncbi ────────────────────────────────────────────────────
    case 'query_ncbi': {
      const query = args.query as string;
      const db = (args.db as string) || 'protein';
      const maxResults = Math.min((args.max_results as number) || 3, 5);

      const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=${db}&term=${encodeURIComponent(query)}&retmax=${maxResults}&retmode=json`;
      const searchResp = await fetch(searchUrl, { signal: AbortSignal.timeout(8000) });
      if (!searchResp.ok) return `NCBI search failed: HTTP ${searchResp.status}`;

      const searchData = await searchResp.json() as { esearchresult?: { idlist?: string[] } };
      const ids = searchData.esearchresult?.idlist ?? [];
      if (ids.length === 0) return `No NCBI ${db} entries found for "${query}".`;

      const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=${db}&id=${ids.join(',')}&retmode=json`;
      const summaryResp = await fetch(summaryUrl, { signal: AbortSignal.timeout(8000) });
      if (!summaryResp.ok) return `NCBI summary failed: HTTP ${summaryResp.status}`;

      const summaryData = await summaryResp.json() as { result?: Record<string, { title?: string; accessionversion?: string; slen?: number; organism?: string }> };
      const result = summaryData.result ?? {};

      const lines = ids.map((id) => {
        const e = result[id];
        if (!e) return null;
        const acc = e.accessionversion ?? id;
        const org = e.organism ? ` [${e.organism}]` : '';
        const len = e.slen ? ` | ${e.slen} aa` : '';
        return `**${acc}**${org}${len}\n  ${e.title ?? '(no title)'}\n  🔗 https://www.ncbi.nlm.nih.gov/${db}/${acc}`;
      }).filter(Boolean);

      return `## NCBI ${db.charAt(0).toUpperCase() + db.slice(1)} — "${query}" (${lines.length} results)\n\n${lines.join('\n\n')}`;
    }

    // ── query_uniprot ─────────────────────────────────────────────────
    case 'query_uniprot': {
      const query = args.query as string;
      const organism = args.organism as string | undefined;
      const maxResults = Math.min((args.max_results as number) || 5, 10);

      const searchTerm = organism ? `${query} AND organism_name:${organism}` : query;
      const fields = 'accession,gene_names,protein_name,organism_name,reviewed,sequence_length';
      const url = `https://rest.uniprot.org/uniprotkb/search?query=${encodeURIComponent(searchTerm)}&format=json&size=${maxResults}&fields=${fields}`;

      const resp = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!resp.ok) return `UniProt search failed: HTTP ${resp.status}`;

      const data = await resp.json() as {
        results?: Array<{
          primaryAccession?: string;
          genes?: Array<{ geneName?: { value: string } }>;
          proteinDescription?: { recommendedName?: { fullName?: { value: string } } };
          organism?: { scientificName?: string };
          entryType?: string;
          sequence?: { length?: number };
        }>
      };

      const entries = data.results ?? [];
      if (entries.length === 0) return `No UniProt entries found for "${query}".`;

      const lines = entries.map((e) => {
        const acc = e.primaryAccession ?? '';
        const gene = e.genes?.[0]?.geneName?.value ?? '';
        const proteinName = e.proteinDescription?.recommendedName?.fullName?.value ?? '(no name)';
        const org = e.organism?.scientificName ?? '';
        const reviewed = e.entryType?.includes('Swiss-Prot') ? '★ reviewed' : 'unreviewed';
        const len = e.sequence?.length ? ` | ${e.sequence.length} aa` : '';
        const genePart = gene ? ` (${gene})` : '';
        return `**${acc}** — ${proteinName}${genePart}\n  ${org}${len} | ${reviewed}\n  🔗 https://www.uniprot.org/uniprotkb/${acc}`;
      });

      return `## UniProt — "${query}" (${lines.length} results)\n\n${lines.join('\n\n')}`;
    }

    // ── query_alphafold ───────────────────────────────────────────────
    case 'query_alphafold': {
      const accession = (args.uniprot_accession as string).trim().toUpperCase();

      const resp = await fetch(`https://alphafold.ebi.ac.uk/api/prediction/${accession}`, {
        signal: AbortSignal.timeout(8000),
      });

      if (resp.status === 404) return `No AlphaFold prediction for "${accession}". Use query_uniprot to confirm the accession.`;
      if (!resp.ok) return `AlphaFold API error: HTTP ${resp.status}`;

      const data = await resp.json() as Array<{
        gene?: string;
        uniprotAccession?: string;
        uniprotDescription?: string;
        organismScientificName?: string;
        uniprotStart?: number;
        uniprotEnd?: number;
        modelCreatedDate?: string;
        latestVersion?: number;
        isReviewed?: boolean;
        pdbUrl?: string;
        cifUrl?: string;
        paeImageUrl?: string;
      }>;

      if (data.length === 0) return `No AlphaFold predictions for "${accession}".`;

      const p = data[0];
      const gene = p.gene ? ` (${p.gene})` : '';
      const organism = p.organismScientificName ? `\n- **Organism**: ${p.organismScientificName}` : '';
      const coverage = (p.uniprotStart && p.uniprotEnd) ? `\n- **Coverage**: residues ${p.uniprotStart}–${p.uniprotEnd}` : '';
      const version = p.latestVersion ? `\n- **Model**: v${p.latestVersion}, created ${p.modelCreatedDate ?? 'N/A'}` : '';
      const reviewed = p.isReviewed ? '★ Swiss-Prot reviewed' : 'TrEMBL unreviewed';

      return [
        `## AlphaFold — ${p.uniprotAccession ?? accession}${gene}`,
        ``,
        `**${p.uniprotDescription ?? '(no description)'}**`,
        `- ${reviewed}${organism}${coverage}${version}`,
        ``,
        `**Structure Links**`,
        p.pdbUrl ? `- PDB: ${p.pdbUrl}` : null,
        p.cifUrl ? `- CIF: ${p.cifUrl}` : null,
        p.paeImageUrl ? `- PAE: ${p.paeImageUrl}` : null,
        ``,
        `🔗 https://alphafold.ebi.ac.uk/entry/${p.uniprotAccession ?? accession}`,
      ].filter((l) => l !== null).join('\n').trim();
    }

    // ── query_opentargets ─────────────────────────────────────────────
    case 'query_opentargets': {
      const query = args.query as string;
      const entity = (args.entity as string) || 'target';
      const maxResults = Math.min((args.max_results as number) || 5, 10);

      const gqlQuery = {
        query: `query Search($q: String!, $size: Int!, $entities: [String!]) {
          search(queryString: $q, entityNames: $entities, page: {index: 0, size: $size}) {
            hits { id entity name description }
            total
          }
        }`,
        variables: { q: query, size: maxResults, entities: [entity] },
      };

      const resp = await fetch('https://api.platform.opentargets.org/api/v4/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gqlQuery),
        signal: AbortSignal.timeout(10000),
      });

      if (!resp.ok) return `Open Targets API error: HTTP ${resp.status}`;

      const data = await resp.json() as {
        data?: { search?: { hits?: Array<{ id: string; name: string; description?: string }>; total?: number } }
      };

      const hits = data.data?.search?.hits ?? [];
      if (hits.length === 0) return `No Open Targets results for "${query}" (entity: ${entity}).`;

      const lines = hits.map((h) => {
        const desc = h.description ? `\n  ${h.description.slice(0, 160)}${h.description.length > 160 ? '…' : ''}` : '';
        const url = entity === 'disease'
          ? `https://platform.opentargets.org/disease/${h.id}`
          : `https://platform.opentargets.org/target/${h.id}`;
        return `**${h.name}** \`${h.id}\`${desc}\n  🔗 ${url}`;
      });

      const label = entity === 'disease' ? 'Diseases' : 'Targets';
      return `## Open Targets ${label} — "${query}" (${lines.length} results)\n\n${lines.join('\n\n')}`;
    }

    // ── query_fda ─────────────────────────────────────────────────────────
    case 'query_fda': {
      const drugName = args.drug_name as string;
      const reportType = (args.report_type as string) || 'adverse_event';
      const maxResults = Math.min((args.max_results as number) || 5, 10);

      let url: string;
      if (reportType === 'label') {
        url = `https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${encodeURIComponent(drugName)}"+openfda.generic_name:"${encodeURIComponent(drugName)}"&limit=${maxResults}`;
      } else {
        url = `https://api.fda.gov/drug/event.json?search=patient.drug.medicinalproduct:"${encodeURIComponent(drugName)}"&limit=${maxResults}`;
      }

      const resp = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (resp.status === 404) return `No FDA records found for "${drugName}".`;
      if (!resp.ok) return `OpenFDA API error: HTTP ${resp.status}`;

      const data = await resp.json() as {
        results?: Array<Record<string, unknown>>;
        meta?: { results?: { total?: number } };
      };

      const results = data.results ?? [];
      if (results.length === 0) return `No FDA records found for "${drugName}".`;

      const total = data.meta?.results?.total ?? results.length;

      if (reportType === 'adverse_event') {
        const lines = results.map((r, i) => {
          const drugs = (r['patient'] as Record<string, unknown>)?.['drug'] as Array<Record<string, unknown>> | undefined;
          const reactions = (r['patient'] as Record<string, unknown>)?.['reaction'] as Array<Record<string, unknown>> | undefined;
          const drugNames = (drugs ?? []).slice(0, 3).map((d) => d['medicinalproduct'] as string).filter(Boolean).join(', ');
          const reactionNames = (reactions ?? []).slice(0, 3).map((rx) => rx['reactionmeddrapt'] as string).filter(Boolean).join(', ');
          return `**${i + 1}.** Drugs: ${drugNames || 'N/A'}\n  Reactions: ${reactionNames || 'N/A'}`;
        });
        return `## OpenFDA Adverse Events — "${drugName}" (${total.toLocaleString()} total)\n\n${lines.join('\n\n')}`;
      } else {
        const lines = results.map((r, i) => {
          const openfda = r['openfda'] as Record<string, string[]> | undefined;
          const brandName = (openfda?.['brand_name'] ?? [])[0] ?? 'N/A';
          const genericName = (openfda?.['generic_name'] ?? [])[0] ?? 'N/A';
          const indications = ((r['indications_and_usage'] as string) || '').slice(0, 200);
          return `**${i + 1}.** ${brandName} (${genericName})\n  ${indications}...`;
        });
        return `## OpenFDA Drug Labels — "${drugName}"\n\n${lines.join('\n\n')}`;
      }
    }

    // ── query_reactome ──────────────────────────────────────────────────────
    case 'query_reactome': {
      const query = args.query as string;
      const species = (args.species as string) || 'Homo sapiens';
      const maxResults = Math.min((args.max_results as number) || 5, 10);

      const searchUrl = `https://reactome.org/ContentService/search/query?query=${encodeURIComponent(query)}&types=Pathway&species=${encodeURIComponent(species)}&cluster=true&Start=0&rows=${maxResults}`;
      const resp = await fetch(searchUrl, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(8000),
      });

      if (!resp.ok) return `Reactome API error: HTTP ${resp.status}`;

      const data = await resp.json() as {
        results?: Array<{
          entries?: Array<{
            stId?: string;
            name?: string;
            type?: string;
            species?: string[];
            exactType?: string;
          }>;
          typeName?: string;
        }>;
      };

      const pathways: Array<{ stId: string; name: string }> = [];
      for (const group of data.results ?? []) {
        for (const entry of group.entries ?? []) {
          if (entry.stId && entry.name) {
            pathways.push({ stId: entry.stId, name: entry.name });
          }
        }
        if (pathways.length >= maxResults) break;
      }

      if (pathways.length === 0) return `No Reactome pathways found for "${query}" in ${species}.`;

      const lines = pathways.slice(0, maxResults).map((p, i) =>
        `**${i + 1}.** ${p.name}\n  ID: ${p.stId} | 🔗 https://reactome.org/PathwayBrowser/#/${p.stId}`
      );

      return `## Reactome Pathways — "${query}" (${species})\n\n${lines.join('\n\n')}`;
    }

    // ── query_chembl ────────────────────────────────────────────────────────
    case 'query_chembl': {
      const q = String(args.query ?? '');
      const searchType = String(args.search_type ?? 'target');
      const chemblId = args.chembl_id ? String(args.chembl_id) : null;
      const maxResults = Math.min(Number(args.max_results ?? 5), 10);

      let url: string;
      if (searchType === 'activity' && chemblId) {
        url = `https://www.ebi.ac.uk/chembl/api/data/activity?target_chembl_id=${encodeURIComponent(chemblId)}&format=json&limit=${maxResults}`;
      } else if (searchType === 'compound') {
        url = `https://www.ebi.ac.uk/chembl/api/data/molecule/search?q=${encodeURIComponent(q)}&format=json&limit=${maxResults}`;
      } else {
        url = `https://www.ebi.ac.uk/chembl/api/data/target/search?q=${encodeURIComponent(q)}&format=json&limit=${maxResults}`;
      }

      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (!res.ok) throw new Error(`ChEMBL API error: ${res.status}`);
      const data = await res.json() as Record<string, unknown>;

      const items =
        (data.targets as unknown[]) ??
        (data.molecules as unknown[]) ??
        (data.activities as unknown[]) ??
        [];

      if (items.length === 0) return `No ChEMBL results found for: ${q}`;
      return JSON.stringify({ source: 'ChEMBL', search_type: searchType, query: q, results: items }, null, 2);
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
    version: '1.1.0',
    description: 'Eijex MCP Server — Codon optimization + biomedical databases + AI workflow tools',
    transport: 'streamable-http',
    endpoint: '/api/mcp',
    tools: TOOLS.length,
    source: 'https://github.com/eijex/eijex-mcp',
  });
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ jsonrpc: '2.0', id: null, error: { code: -32000, message: 'Rate limit exceeded. Max 60 requests per minute.' } }, { status: 429 });
  }

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
          serverInfo: { name: 'eijex-mcp', version: '1.1.0' },
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
