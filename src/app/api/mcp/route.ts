/**
 * Eijex MCP Server
 * Protocol: JSON-RPC 2.0 over HTTP (Streamable HTTP transport)
 *
 * Connect from an MCP client (.mcp.json):
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

const AGENTOPS_URL = process.env.EIJEX_AGENTOPS_URL ?? 'http://127.0.0.1:8787';
const AGENTOPS_TOKEN = process.env.EIJEX_AGENTOPS_TOKEN ?? '';
const PRD_B_FORBIDDEN_PARAMS = ['hub_root', 'raw_sequence', 'approval_status', 'local_path', 'sequence_material_ref'];

function assertNoPrdBForbiddenParams(args: Record<string, unknown>): void {
  for (const key of PRD_B_FORBIDDEN_PARAMS) {
    if (key in args) throw new Error(`Forbidden parameter: ${key}`);
  }
}

async function callAgentOps(method: 'GET' | 'POST', path: string, body?: unknown): Promise<unknown> {
  if (!AGENTOPS_TOKEN) return 'PRD-B tools require EIJEX_AGENTOPS_TOKEN to be configured on the server.';
  const resp = await fetch(`${AGENTOPS_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${AGENTOPS_TOKEN}` },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(30000),
  });
  if (!resp.ok) return `agentOps error: HTTP ${resp.status}\n${await resp.text().catch(() => '')}`;
  return resp.json();
}

const TOOLS = [
  {
    name: 'factorforge_cds_optimize',
    description: 'Generate an in-silico synonymous DNA coding sequence (CDS) candidate from a protein sequence using FactorForge CDS v3.2.0. Supports N. benthamiana (default) and Tobacco BY-2 (--host by2). Returns sequence-level metrics and rule-scan output; wet-lab validation is required.',
    inputSchema: {
      type: 'object',
      properties: {
        sequence: {
          type: 'string',
          description: 'Amino acid sequence (single-letter code, e.g. "MSKGEELFTG...")',
        },
        profile: {
          type: 'string',
          description: 'Public design profile: balanced | high_cai | gc_target | assembly_friendly (default: balanced)',
          enum: ['balanced', 'high_cai', 'gc_target', 'assembly_friendly'],
        },
      },
      required: ['sequence'],
    },
  },
  {
    name: 'factorforge_cds_compare',
    description: 'Compare multiple public FactorForge CDS design profiles side-by-side for the same protein sequence. Returns CAI, GC%, and composite score for each profile in a single call.',
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
    description: 'Generate in-silico CDS candidates for multiple protein sequences in a single request using FactorForge CDS. Accepts up to 20 sequences. Returns CAI, GC%, and designed CDS for each.',
    inputSchema: {
      type: 'object',
      properties: {
        sequences: {
          type: 'array',
          description: 'Array of protein sequences to process. Each item: { id: string, sequence: string }. Max 20.',
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
          enum: ['balanced', 'high_cai', 'gc_target', 'assembly_friendly'],
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
        query: { type: 'string', description: 'Search keywords (e.g. "codon usage Nicotiana benthamiana")' },
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
    name: 'query_interpro',
    description: 'Search InterPro for protein domain architecture by UniProt accession.',
    inputSchema: {
      type: 'object', additionalProperties: false,
      properties: { uniprot_accession: { type: 'string', description: 'UniProt accession' } },
      required: ['uniprot_accession'],
    },
  },
  // PRD-B schemas deliberately exclude paths, raw sequences, and approval mutations.
  {
    name: 'prd_b_run_factorforge', description: 'Run FactorForge through the local agentOps boundary.',
    inputSchema: { type: 'object', additionalProperties: false, properties: {
      protein_sequence_hash: { type: 'string' },
      sequence_ref_type: { type: 'string', enum: ['synthetic_fixture_id', 'server_local_fasta_id'] },
      sequence_ref_id: { type: 'string' }, optimization_profile: { type: 'string' },
      host: { type: 'string', enum: ['nbenthamiana', 'by2'] },
    }, required: ['protein_sequence_hash', 'sequence_ref_type', 'sequence_ref_id'] },
  },
  {
    name: 'prd_b_commit_private_record', description: 'Commit an approval_required private record.',
    inputSchema: { type: 'object', additionalProperties: false, properties: {
      protein_sequence_hash: { type: 'string' }, run_result: { type: 'object' }, intake_id: { type: 'string' },
    }, required: ['protein_sequence_hash', 'run_result', 'intake_id'] },
  },
  {
    name: 'prd_b_generate_approval_packet', description: 'Generate a local human-review packet.',
    inputSchema: { type: 'object', additionalProperties: false, properties: { protein_sequence_hash: { type: 'string' } }, required: ['protein_sequence_hash'] },
  },
  {
    name: 'prd_b_list_index', description: 'List sanitized private-record index entries.',
    inputSchema: { type: 'object', additionalProperties: false, properties: {
      filter_status: { type: 'string', enum: ['approval_required', 'approved', 'rejected', 'changes_requested', 'all'] },
      limit: { type: 'number' },
    } },
  },
  {
    name: 'prd_b_get_private_record', description: 'Read-only sanitized private-record view.',
    inputSchema: { type: 'object', additionalProperties: false, properties: {
      protein_sequence_hash: { type: 'string' }, include_cli_metrics: { type: 'boolean' },
    }, required: ['protein_sequence_hash'] },
  },
  {
    name: 'prd_b_get_approval_status', description: 'Read approval status.',
    inputSchema: { type: 'object', additionalProperties: false, properties: { protein_sequence_hash: { type: 'string' } }, required: ['protein_sequence_hash'] },
  },
  {
    name: 'prd_b_flush_public_projection', description: 'Flush a previously approved public projection.',
    inputSchema: { type: 'object', additionalProperties: false, properties: { protein_sequence_hash: { type: 'string' } }, required: ['protein_sequence_hash'] },
  },
  {
    name: 'prd_b_get_public_projection', description: 'Read a sanitized public projection.',
    inputSchema: { type: 'object', additionalProperties: false, properties: { protein_sequence_hash: { type: 'string' } }, required: ['protein_sequence_hash'] },
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
        `**Designed DNA (5'→3')**`,
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

    // ── factorforge_verify_parameter ──────────────────────────────────
    case 'factorforge_verify_parameter': {
      const param = args.param as string;
      const currentValue = args.current_value as string;
      const hypothesis = (args.hypothesis as string) || '';
      const extraKeywords = (args.keywords as string) || '';

      const baseKeywords = `${param.replace(/_/g, ' ').toLowerCase()} codon usage Nicotiana benthamiana CDS`;
      const searchTerms = [
        `"${baseKeywords}"`,
        `"GC content plant CDS design"`,
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
        `What is the evidence-supported review range for \`${param}\` in FactorForge CDS design?`,
        `Is the current value **${currentValue}** supported by published literature?`,
        ``,
        `### STEP 1 — Literature Search`,
        `Run these queries with \`query_pubmed\` (max_results: 10 each):`,
        ...searchTerms.map((t) => `- ${t}`),
        ``,
        `### STEP 2 — Structural Reference`,
        `Run with \`query_pdb\`: \`"plant codon usage CDS design"\``,
        ``,
        `### STEP 3 — Pathway Context`,
        `Run with \`query_kegg\`: \`"plant codon usage"\` (organism: nta = N. tabacum proxy)`,
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

    case 'query_interpro': {
      const accession = (args.uniprot_accession as string).trim().toUpperCase();
      const resp = await fetch(
        `https://www.ebi.ac.uk/interpro/api/entry/all/protein/UniProt/${accession}/?format=json`,
        { signal: AbortSignal.timeout(10000) }
      );
      if (resp.status === 404) return `No InterPro entries for "${accession}".`;
      if (!resp.ok) return `InterPro API error: HTTP ${resp.status}`;

      type InterProFragment = { start?: number; end?: number };
      type InterProLocation = { fragments?: InterProFragment[] };
      type InterProProtein = { entry_protein_locations?: InterProLocation[] };
      type GoTerm = { id?: string; name?: string; category?: string };
      type PathwayTerm = { id?: string; name?: string; source?: string };
      type InterProMeta = {
        accession?: string; name?: string; type?: string; short_name?: string;
        source_database?: string; description?: string;
        go_terms?: GoTerm[]; pathway_terms?: PathwayTerm[];
        member_databases?: Record<string, unknown>;
      };
      const data = await resp.json() as {
        count?: number;
        results?: Array<{ metadata?: InterProMeta; proteins?: InterProProtein[] }>;
      };

      const results = data.results ?? [];
      if (results.length === 0) return `No InterPro domain entries found for "${accession}".`;

      const entries = results.slice(0, 10).map((r) => {
        const m = r.metadata ?? {};
        const locations = (r.proteins?.[0]?.entry_protein_locations ?? [])
          .flatMap((loc) => loc.fragments ?? [])
          .filter((f) => f.start != null && f.end != null)
          .map((f) => ({ start: f.start as number, end: f.end as number }));
        return {
          accession: m.accession ?? '',
          name: m.name ?? '',
          type: m.type ?? '',
          short_name: m.short_name ?? '',
          source_database: m.source_database ?? '',
          description: m.description ? m.description.slice(0, 300) : '',
          locations,
          member_databases: Object.keys(m.member_databases ?? {}),
          go_terms: (m.go_terms ?? []).slice(0, 5).map((g) => ({ id: g.id ?? '', name: g.name ?? '', category: g.category ?? '' })),
          pathway_terms: (m.pathway_terms ?? []).slice(0, 3).map((p) => ({ id: p.id ?? '', name: p.name ?? '', source: p.source ?? '' })),
        };
      });

      return JSON.stringify({
        query: accession,
        result_count: data.count ?? results.length,
        results: entries,
        provenance: 'interpro_api_normalized_summary',
      }, null, 2);
    }

    case 'prd_b_run_factorforge': {
      assertNoPrdBForbiddenParams(args);
      return formatAgentOps(await callAgentOps('POST', '/prd-b/run-factorforge', {
        protein_sequence_hash: args.protein_sequence_hash,
        sequence_ref: { type: args.sequence_ref_type, id: args.sequence_ref_id },
        optimization_profile: args.optimization_profile ?? 'balanced',
        host: args.host ?? 'nbenthamiana',
        scoring_contract_version: 'v1.1',
      }));
    }
    case 'prd_b_commit_private_record': {
      assertNoPrdBForbiddenParams(args);
      return formatAgentOps(await callAgentOps('POST', '/prd-b/commit-private-record', {
        protein_sequence_hash: args.protein_sequence_hash, run_result: args.run_result, intake_id: args.intake_id,
      }));
    }
    case 'prd_b_generate_approval_packet': {
      assertNoPrdBForbiddenParams(args);
      return formatAgentOps(await callAgentOps('POST', '/prd-b/generate-approval-packet', { protein_sequence_hash: args.protein_sequence_hash }));
    }
    case 'prd_b_list_index': {
      assertNoPrdBForbiddenParams(args);
      const qs = new URLSearchParams();
      if (args.filter_status) qs.set('filter_status', String(args.filter_status));
      if (args.limit) qs.set('limit', String(args.limit));
      return formatAgentOps(await callAgentOps('GET', `/prd-b/list-index?${qs}`));
    }
    case 'prd_b_get_private_record': {
      assertNoPrdBForbiddenParams(args);
      const hash = encodeURIComponent(String(args.protein_sequence_hash));
      return formatAgentOps(await callAgentOps('GET', `/prd-b/get-private-record/${hash}?include_cli_metrics=${args.include_cli_metrics ? 'true' : 'false'}`));
    }
    case 'prd_b_get_approval_status': {
      assertNoPrdBForbiddenParams(args);
      return formatAgentOps(await callAgentOps('GET', `/prd-b/get-approval-status/${encodeURIComponent(String(args.protein_sequence_hash))}`));
    }
    case 'prd_b_flush_public_projection': {
      // PRD-B GOVERNANCE INVARIANT: no_public_projection_default = true
      // Run and commit never create public projections. Projection requires
      // explicit human approval outside MCP, audited packet/hash validation,
      // and an explicit flush invocation. MCP approval tools remain absent.
      assertNoPrdBForbiddenParams(args);
      return formatAgentOps(await callAgentOps('POST', '/prd-b/flush-public-projection', { protein_sequence_hash: args.protein_sequence_hash }));
    }
    case 'prd_b_get_public_projection': {
      assertNoPrdBForbiddenParams(args);
      return formatAgentOps(await callAgentOps('GET', `/prd-b/get-public-projection/${encodeURIComponent(String(args.protein_sequence_hash))}`));
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

function formatAgentOps(result: unknown): string {
  return typeof result === 'string' ? result : JSON.stringify(result, null, 2);
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
    version: '1.2.0',
    description: 'Eijex MCP Server — CDS design, bioinformatics lookup, and structured workflow tools',
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
          serverInfo: { name: 'eijex-mcp', version: '1.2.0' },
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
