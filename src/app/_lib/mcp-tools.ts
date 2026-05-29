export interface McpParameter {
  name: string;
  type: 'string' | 'number' | 'boolean';
  required: boolean;
  description: string;
}

export type McpToolGroup = 'agent' | 'skill' | 'workflow';

export interface McpToolDefinition {
  name: string;
  displayName: string;
  description: string;
  longDescription: string;
  icon: string;
  group: McpToolGroup;
  tags: string[];
  parameters: McpParameter[];
  keyFeatures: string[];
  useCases: string[];
  relatedTools: string[];
}

export const ALL_TOOLS: McpToolDefinition[] = [
  // ── Agents ────────────────────────────────────────────────────────────
  {
    name: 'factorforge_optimize_cds',
    displayName: 'factorforge_optimize_cds',
    icon: '🧬',
    group: 'agent',
    description: 'Optimize a protein sequence into a codon-adapted DNA CDS for N. benthamiana.',
    longDescription:
      'Converts an amino acid sequence into an optimized coding DNA sequence (CDS) for expression in Nicotiana benthamiana. ' +
      'Uses the FactorForge v3.x stable design path: DP feasibility design, profile-based rule scanning, Golden Gate domestication, and output. ' +
      'Returns CAI score, GC%, and the optimized DNA sequence.',
    tags: ['FactorForge', 'Biotech', 'DNA'],
    parameters: [
      { name: 'sequence', type: 'string', required: true, description: 'Amino acid sequence (single-letter code)' },
      { name: 'profile', type: 'string', required: false, description: 'balanced | high_cai | gc_target | assembly_friendly' },
    ],
    keyFeatures: [
      'Rule-based codon optimization for N. benthamiana',
      'CAI and GC% metrics',
      'Golden Gate / MoClo compatible domestication',
      'Multiple optimization profiles',
    ],
    useCases: [
      'Plant-based recombinant protein expression',
      'Synthetic gene design for agroinfiltration',
      'Codon optimization for transient expression systems',
    ],
    relatedTools: ['query_pubmed', 'query_pdb'],
  },

  // ── Skills ────────────────────────────────────────────────────────────
  {
    name: 'query_pubmed',
    displayName: 'query_pubmed',
    icon: '📄',
    group: 'skill',
    description: 'Search PubMed for scientific literature.',
    longDescription:
      'Searches PubMed via NCBI E-utilities and returns paper titles, authors, journal, and links. ' +
      'Useful for biotech research, drug discovery, clinical evidence, and domain-specific literature reviews.',
    tags: ['Literature', 'Research', 'Biotech'],
    parameters: [
      { name: 'query', type: 'string', required: true, description: 'Search keywords' },
      { name: 'max_results', type: 'number', required: false, description: 'Max results (default 5, max 10)' },
    ],
    keyFeatures: [
      'Real-time PubMed search via NCBI E-utilities',
      'Returns title, authors, journal, date, and DOI link',
      'Sorted by relevance',
    ],
    useCases: [
      'Literature review for a specific protein or drug',
      'Finding clinical evidence for a biomarker',
      'Tracking recent papers on a research topic',
    ],
    relatedTools: ['query_clinicaltrials', 'query_kegg'],
  },
  {
    name: 'query_pdb',
    displayName: 'query_pdb',
    icon: '🔬',
    group: 'skill',
    description: 'Search the RCSB Protein Data Bank for 3D protein structures.',
    longDescription:
      'Searches RCSB PDB for protein structures by name or PDB ID. ' +
      'Returns structure titles, resolution, and direct links. ' +
      'Useful for structural biology, drug target analysis, and protein engineering.',
    tags: ['Structure', 'Protein', 'Biotech'],
    parameters: [
      { name: 'query', type: 'string', required: true, description: 'Protein name or PDB ID (e.g. "EGFR", "1IVO")' },
      { name: 'max_results', type: 'number', required: false, description: 'Max results (default 5)' },
    ],
    keyFeatures: [
      'Full-text search via RCSB search API',
      'Returns PDB ID, title, resolution',
      'Direct link to RCSB structure page',
    ],
    useCases: [
      'Finding 3D structures for a target protein',
      'Structural analysis for drug design',
      'Protein engineering reference lookup',
    ],
    relatedTools: ['query_pubmed', 'factorforge_optimize_cds'],
  },
  {
    name: 'query_kegg',
    displayName: 'query_kegg',
    icon: '🗺️',
    group: 'skill',
    description: 'Search KEGG for biological pathways.',
    longDescription:
      'Searches the KEGG pathway database for biological pathways related to a keyword. ' +
      'Supports organism filtering (human, mouse, etc.). ' +
      'Useful for pathway analysis, drug target discovery, and systems biology.',
    tags: ['Pathway', 'Systems Biology', 'Biotech'],
    parameters: [
      { name: 'query', type: 'string', required: true, description: 'Pathway keyword (e.g. "Alzheimer", "neurodegeneration")' },
      { name: 'organism', type: 'string', required: false, description: 'Organism code (default: hsa = human)' },
    ],
    keyFeatures: [
      'KEGG REST API search',
      'Organism-specific pathway filtering',
      'Direct link to KEGG pathway viewer',
    ],
    useCases: [
      'Identifying disease-related pathways',
      'Drug target pathway mapping',
      'Systems biology analysis',
    ],
    relatedTools: ['query_pubmed', 'query_clinicaltrials'],
  },
  {
    name: 'query_clinicaltrials',
    displayName: 'query_clinicaltrials',
    icon: '🏥',
    group: 'skill',
    description: 'Search ClinicalTrials.gov for registered clinical trials.',
    longDescription:
      'Searches ClinicalTrials.gov v2 API for clinical trials by keyword and status. ' +
      'Returns trial ID, title, status, phase, conditions, and start date. ' +
      'Useful for competitive intelligence, trial design, and patient eligibility.',
    tags: ['Clinical', 'Trials', 'Research'],
    parameters: [
      { name: 'query', type: 'string', required: true, description: 'Search keywords (e.g. "type 2 diabetes GLP-1")' },
      { name: 'status', type: 'string', required: false, description: 'RECRUITING | ACTIVE_NOT_RECRUITING | COMPLETED' },
      { name: 'max_results', type: 'number', required: false, description: 'Max results (default 5)' },
    ],
    keyFeatures: [
      'ClinicalTrials.gov API v2',
      'Status filtering (recruiting, completed, etc.)',
      'Returns NCT ID, phase, conditions, timeline',
    ],
    useCases: [
      'Competitive intelligence for a drug target',
      'Finding recruiting trials for a condition',
      'Trial design reference lookup',
    ],
    relatedTools: ['query_pubmed', 'query_kegg'],
  },

  {
    name: 'query_ncbi',
    displayName: 'query_ncbi',
    icon: '🧫',
    group: 'skill',
    description: 'Search NCBI protein or nucleotide database for sequence summaries and accession numbers.',
    longDescription:
      'Searches NCBI via E-utilities and returns accession numbers, organism, and sequence length. ' +
      'Supports protein and nucleotide databases. ' +
      'Useful for finding reference sequences before codon optimization.',
    tags: ['Sequence', 'NCBI', 'Biotech'],
    parameters: [
      { name: 'query', type: 'string', required: true, description: 'Gene/protein name or accession (e.g. "GFP Aequorea victoria")' },
      { name: 'db', type: 'string', required: false, description: 'protein | nucleotide (default: protein)' },
      { name: 'max_results', type: 'number', required: false, description: 'Max results (default 3, max 5)' },
    ],
    keyFeatures: [
      'NCBI E-utilities esearch + esummary',
      'Returns accession, organism, sequence length',
      'Supports protein and nucleotide databases',
    ],
    useCases: [
      'Finding reference protein sequences for codon optimization',
      'Retrieving accession numbers for downstream analysis',
      'Cross-checking sequence identity before design',
    ],
    relatedTools: ['query_uniprot', 'factorforge_optimize_cds'],
  },
  {
    name: 'query_uniprot',
    displayName: 'query_uniprot',
    icon: '🔗',
    group: 'skill',
    description: 'Search UniProt for protein entries — accession, gene names, organism, function, and sequence length.',
    longDescription:
      'Searches UniProt via the REST API and returns protein entries with accession, gene names, organism, reviewed status, and sequence length. ' +
      'Swiss-Prot reviewed entries are flagged. ' +
      'Use the returned accession with query_alphafold for structure prediction lookup.',
    tags: ['Protein', 'UniProt', 'Biotech'],
    parameters: [
      { name: 'query', type: 'string', required: true, description: 'Protein name, gene symbol, or UniProt accession (e.g. "GFP", "P42212")' },
      { name: 'organism', type: 'string', required: false, description: 'Organism filter (e.g. "human", "Aequorea victoria")' },
      { name: 'max_results', type: 'number', required: false, description: 'Max results (default 5, max 10)' },
    ],
    keyFeatures: [
      'UniProt REST API search',
      'Flags Swiss-Prot reviewed entries',
      'Returns accession, gene, organism, length',
    ],
    useCases: [
      'Finding UniProt accession before querying AlphaFold',
      'Checking protein annotation and review status',
      'Cross-species protein lookup',
    ],
    relatedTools: ['query_alphafold', 'query_pdb', 'query_ncbi'],
  },
  {
    name: 'query_alphafold',
    displayName: 'query_alphafold',
    icon: '🧩',
    group: 'skill',
    description: 'Fetch AlphaFold structure prediction for a protein by UniProt accession.',
    longDescription:
      'Queries the AlphaFold Protein Structure Database (EBI) for a predicted 3D structure. ' +
      'Returns model version, organism, coverage, and direct download links for PDB, CIF, and PAE files. ' +
      'Use query_uniprot first to find the UniProt accession.',
    tags: ['Structure', 'AlphaFold', 'Biotech'],
    parameters: [
      { name: 'uniprot_accession', type: 'string', required: true, description: 'UniProt accession (e.g. "P42212"). Use query_uniprot to find it.' },
    ],
    keyFeatures: [
      'AlphaFold EBI API — no API key required',
      'Returns PDB, CIF, and PAE download links',
      'Includes model version and organism coverage',
    ],
    useCases: [
      'Fetching predicted 3D structure for a target protein',
      'Downloading PAE data for domain boundary analysis',
      'Checking AlphaFold model coverage before wet-lab design',
    ],
    relatedTools: ['query_uniprot', 'query_pdb'],
  },
  {
    name: 'query_opentargets',
    displayName: 'query_opentargets',
    icon: '🎯',
    group: 'skill',
    description: 'Search Open Targets Platform for gene targets or diseases and their associations.',
    longDescription:
      'Searches the Open Targets Platform via GraphQL API for target genes or diseases. ' +
      'Returns Ensembl IDs, names, and descriptions. ' +
      'Useful for target identification, disease association lookup, and drug target prioritization.',
    tags: ['Target', 'Disease', 'Biotech'],
    parameters: [
      { name: 'query', type: 'string', required: true, description: 'Gene symbol or disease name (e.g. "EGFR", "Parkinson disease")' },
      { name: 'entity', type: 'string', required: false, description: 'target | disease (default: target)' },
      { name: 'max_results', type: 'number', required: false, description: 'Max results (default 5, max 10)' },
    ],
    keyFeatures: [
      'Open Targets GraphQL API — free, no key required',
      'Search targets (Ensembl ID) or diseases (EFO ID)',
      'Returns name, description, and platform link',
    ],
    useCases: [
      'Target identification and prioritization',
      'Disease-gene association lookup',
      'Drug target landscape mapping',
    ],
    relatedTools: ['query_pubmed', 'query_clinicaltrials'],
  },
  {
    name: 'query_fda',
    displayName: 'query_fda',
    icon: '💊',
    group: 'skill',
    description: 'Search OpenFDA for drug adverse events and labels.',
    longDescription: 'Queries OpenFDA (FAERS 2000만+ 이상반응 보고, 약물 라벨)으로 약물 안전성 데이터를 검색한다. CandidaX CNS 약물 안전성 조사에 활용.',
    tags: ['FDA', 'Drug Safety', 'CandidaX'],
    parameters: [
      { name: 'drug_name', type: 'string', required: true, description: 'Drug name or active ingredient' },
      { name: 'report_type', type: 'string', required: false, description: 'adverse_event | label (default: adverse_event)' },
      { name: 'max_results', type: 'number', required: false, description: 'Max results (default 5, max 10)' },
    ],
    keyFeatures: ['FAERS 이상반응 데이터', 'Drug label 정보', '인증 불필요'],
    useCases: ['CNS 약물 안전성 조사', '약물 이상반응 빈도 파악', 'CandidaX 약물 리스크 분석'],
    relatedTools: ['query_opentargets', 'query_pubmed'],
  },
  {
    name: 'query_reactome',
    displayName: 'query_reactome',
    icon: '🔬',
    group: 'skill',
    description: 'Search Reactome for curated biological pathways.',
    longDescription: 'Reactome 인간 큐레이션 경로 DB에서 분자 메커니즘 경로를 검색한다. KEGG 보완 — 반응 수준 상세 경로 제공.',
    tags: ['Pathways', 'Systems Biology', 'FactorForge'],
    parameters: [
      { name: 'query', type: 'string', required: true, description: 'Pathway or molecule keyword' },
      { name: 'species', type: 'string', required: false, description: 'Species (default: Homo sapiens)' },
      { name: 'max_results', type: 'number', required: false, description: 'Max results (default 5, max 10)' },
    ],
    keyFeatures: ['인간 큐레이션 경로', 'KEGG 보완', '반응 수준 상세'],
    useCases: ['분자 메커니즘 경로 조사', 'FactorForge 단백질 기능 경로 분석', 'CandidaX 질환 메커니즘'],
    relatedTools: ['query_kegg', 'query_opentargets'],
  },

  // ── Workflows ─────────────────────────────────────────────────────────
  {
    name: 'factorforge_verify_parameter',
    displayName: 'factorforge_verify_parameter',
    icon: '🔍',
    group: 'workflow',
    description: 'Initialize a structured 0→7 step research workflow to verify or update a FactorForge design constant.',
    longDescription:
      'Generates a ready-to-execute parameter verification plan for any FactorForge constant (e.g. GC_OPT_MIN, CAI_THRESHOLD). ' +
      'Returns pre-filled PubMed search queries, decision gates at steps 3.5 and 6.5, and a registry output template. ' +
      'Start with query_pubmed to execute each step.',
    tags: ['FactorForge', 'Workflow', 'Verification'],
    parameters: [
      { name: 'param', type: 'string', required: true, description: 'Parameter name as it appears in the codebase (e.g. "GC_OPT_MIN")' },
      { name: 'current_value', type: 'string', required: true, description: 'Current value in the codebase (e.g. "55.0")' },
      { name: 'hypothesis', type: 'string', required: false, description: 'What you expect the correct value to be, or why you are questioning the current value' },
      { name: 'keywords', type: 'string', required: false, description: 'Additional PubMed keywords (e.g. "Nicotiana benthamiana transient expression")' },
    ],
    keyFeatures: [
      '0→7 step structured research workflow',
      'Pre-filled PubMed search queries for each parameter',
      'Decision gates at STEP 3.5 and STEP 6.5',
      'Registry output template for traceability',
    ],
    useCases: [
      'Verify GC% thresholds against published literature',
      'Validate CAI cutoff values for N. benthamiana expression',
      'Re-evaluate any FactorForge scoring constant with new evidence',
    ],
    relatedTools: ['factorforge_optimize_cds', 'query_pubmed', 'query_pdb'],
  },
];

export const TOOL_MAP: Record<string, McpToolDefinition> = Object.fromEntries(
  ALL_TOOLS.map((t) => [t.name, t])
);
