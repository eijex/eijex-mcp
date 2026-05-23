export interface McpParameter {
  name: string;
  type: 'string' | 'number' | 'boolean';
  required: boolean;
  description: string;
}

export interface McpToolDefinition {
  name: string;
  displayName: string;
  description: string;
  longDescription: string;
  icon: string;
  tags: string[];
  parameters: McpParameter[];
  keyFeatures: string[];
  useCases: string[];
  relatedTools: string[];
}

export const ALL_TOOLS: McpToolDefinition[] = [
  {
    name: 'factorforge_optimize_cds',
    displayName: 'factorforge_optimize_cds',
    icon: '🧬',
    description: 'Optimize a protein sequence into a codon-adapted DNA CDS for N. benthamiana.',
    longDescription:
      'Converts an amino acid sequence into an optimized coding DNA sequence (CDS) for expression in Nicotiana benthamiana. ' +
      'Uses the FactorForge v2 rule-based engine: reverse translation, rule scanning, Golden Gate domestication, and output. ' +
      'Returns CAI score, GC%, and the optimized DNA sequence.',
    tags: ['FactorForge', 'Biotech', 'DNA'],
    parameters: [
      { name: 'sequence', type: 'string', required: true, description: 'Amino acid sequence (single-letter code)' },
      { name: 'profile', type: 'string', required: false, description: 'balanced | high_cai | gc_target | assembly_friendly | ramp | viral_delivery' },
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
  {
    name: 'query_pubmed',
    displayName: 'query_pubmed',
    icon: '📄',
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
    description: 'Search the RCSB Protein Data Bank for 3D protein structures.',
    longDescription:
      'Searches RCSB PDB for protein structures by name or PDB ID. ' +
      'Returns structure titles, resolution, and direct links. ' +
      'Useful for structural biology, drug target analysis, and protein engineering.',
    tags: ['Structure', 'Protein', 'Biotech'],
    parameters: [
      { name: 'query', type: 'string', required: true, description: 'Protein name or PDB ID (e.g. "CD47", "1TZV")' },
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
    description: 'Search ClinicalTrials.gov for registered clinical trials.',
    longDescription:
      'Searches ClinicalTrials.gov v2 API for clinical trials by keyword and status. ' +
      'Returns trial ID, title, status, phase, conditions, and start date. ' +
      'Useful for competitive intelligence, trial design, and patient eligibility.',
    tags: ['Clinical', 'Trials', 'Research'],
    parameters: [
      { name: 'query', type: 'string', required: true, description: 'Search keywords (e.g. "NMOSD AQP4")' },
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
];

export const TOOL_MAP: Record<string, McpToolDefinition> = Object.fromEntries(
  ALL_TOOLS.map((t) => [t.name, t])
);
