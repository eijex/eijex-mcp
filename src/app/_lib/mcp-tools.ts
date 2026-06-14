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
    name: 'factorforge_cds_optimize',
    displayName: 'factorforge_cds_optimize',
    icon: '🧬',
    group: 'agent',
    description: 'Generate an in-silico synonymous CDS candidate for N. benthamiana.',
    longDescription:
      'Converts an amino acid sequence into a synonymous coding DNA sequence (CDS) candidate for Nicotiana benthamiana-oriented design review. ' +
      'Uses the FactorForge v3.2.0 stable design path: DP feasibility design, profile-based rule scanning, Type IIS site review, and output. ' +
      'Returns CAI score, GC%, and the designed DNA sequence.',
    tags: ['FactorForge', 'Biotech', 'DNA'],
    parameters: [
      { name: 'sequence', type: 'string', required: true, description: 'Amino acid sequence (single-letter code)' },
      { name: 'profile', type: 'string', required: false, description: 'balanced | high_cai | gc_target | assembly_friendly' },
    ],
    keyFeatures: [
      'Constraint-based DP feasibility design (v3.2.0)',
      'CAI and GC% metrics',
      'Golden Gate / MoClo-oriented Type IIS site review',
      'Multiple public design profiles (balanced, high_cai, gc_target, assembly_friendly)',
    ],
    useCases: [
      'Plant CDS design review',
      'Agroinfiltration-oriented sequence review',
      'Synonymous CDS candidate generation',
    ],
    relatedTools: ['factorforge_cds_compare', 'query_pubmed', 'query_pdb'],
  },
  {
    name: 'factorforge_cds_compare',
    displayName: 'factorforge_cds_compare',
    icon: '📊',
    group: 'agent',
    description: 'Compare multiple FactorForge CDS design profiles side-by-side.',
    longDescription:
      'Runs multiple public FactorForge CDS design profiles on the same protein sequence in a single call. ' +
      'Returns a comparison table with CAI, GC%, and composite score for each profile. ' +
      'Useful for reviewing metric trade-offs before selecting a candidate design.',
    tags: ['FactorForge', 'Biotech', 'DNA'],
    parameters: [
      { name: 'sequence', type: 'string', required: true, description: 'Amino acid sequence (single-letter code)' },
      { name: 'profiles', type: 'string', required: false, description: 'Comma-separated profiles (default: balanced,high_cai,gc_target)' },
    ],
    keyFeatures: [
      'Side-by-side profile comparison',
      'CAI, GC%, composite score per profile',
      'Single API call for multiple profiles',
    ],
    useCases: [
      'Reviewing public profile trade-offs before final CDS design',
      'Comparing trade-offs between CAI and GC%',
    ],
    relatedTools: ['factorforge_cds_optimize', 'query_pubmed'],
  },
  {
    name: 'factorforge_cds_batch',
    displayName: 'factorforge_cds_batch',
    icon: '⚡',
    group: 'agent',
    description: 'Generate CDS candidates for up to 20 protein sequences in a single request.',
    longDescription:
      'Runs FactorForge CDS design on multiple protein sequences in one API call. ' +
      'Returns CAI, GC%, and designed DNA for each sequence. ' +
      'All sequences use the same profile. Maximum 20 sequences per request.',
    tags: ['FactorForge', 'Biotech', 'DNA'],
    parameters: [
      { name: 'sequences', type: 'string', required: true, description: 'Array of { id, sequence } objects (max 20)' },
      { name: 'profile', type: 'string', required: false, description: 'Profile applied to all sequences (default: balanced)' },
    ],
    keyFeatures: [
      'Up to 20 sequences per call',
      'CAI, GC%, and designed CDS per sequence',
      'Single profile applied to all sequences',
    ],
    useCases: [
      'Reviewing a panel of protein variants',
      'Batch processing for library design',
    ],
    relatedTools: ['factorforge_cds_optimize', 'factorforge_cds_compare'],
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
    relatedTools: ['query_kegg'],
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
    relatedTools: ['query_pubmed', 'factorforge_cds_optimize'],
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
    relatedTools: ['query_pubmed'],
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
      'Useful for finding reference sequences before CDS design review.',
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
      'Finding reference protein sequences for CDS design review',
      'Retrieving accession numbers for downstream analysis',
      'Cross-checking sequence identity before design',
    ],
    relatedTools: ['query_uniprot', 'factorforge_cds_optimize'],
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
      'Review CAI cutoff values for N. benthamiana CDS design',
      'Re-evaluate any FactorForge scoring constant with new evidence',
    ],
    relatedTools: ['factorforge_cds_optimize', 'query_pubmed', 'query_pdb'],
  },
];

export const TOOL_MAP: Record<string, McpToolDefinition> = Object.fromEntries(
  ALL_TOOLS.map((t) => [t.name, t])
);
