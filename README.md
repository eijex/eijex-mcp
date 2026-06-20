# Eijex MCP

**Eijex MCP** is a public Model Context Protocol server that exposes Eijex bioinformatics, literature lookup, and FactorForge CDS design/review tools to MCP-compatible clients.

## Connect

```json
{
  "mcpServers": {
    "eijex": {
      "type": "http",
      "url": "https://mcp.eijex.com/api/mcp"
    }
  }
}
```

## Available Tools

| Tool | Description |
|------|-------------|
| `factorforge_cds_optimize` | Generate an in-silico synonymous CDS candidate with pre-synthesis sequence-review metrics |
| `factorforge_cds_compare` | Compare multiple public CDS design profiles side-by-side (CAI, GC%, score) |
| `factorforge_cds_batch` | Generate CDS candidates for up to 20 sequences in a single request |
| `factorforge_verify_parameter` | Research workflow to verify or update a FactorForge design constant |
| `query_pubmed` | Search PubMed for scientific literature |
| `query_pdb` | Search RCSB PDB for 3D protein structures |
| `query_ncbi` | Search NCBI for protein/nucleotide sequences |
| `query_uniprot` | Search UniProt for protein sequences and annotations |
| `query_alphafold` | Fetch AlphaFold predicted protein structures |
| `query_kegg` | Search KEGG for biological pathways |
| `query_clinicaltrials` | Search ClinicalTrials.gov for registered trials |
| `query_opentargets` | Search Open Targets for drug targets and disease associations |
| `query_fda` | Search FDA adverse events and drug labels via OpenFDA |
| `query_reactome` | Search Reactome for biological pathways and reactions |
| `query_chembl` | Search ChEMBL for bioactive compounds and drug targets |
| `get_model_recommendations` | Get AI model recommendations by task type |
| `get_skill_template` | Get a reusable skill template for a new project domain |
| `get_operational_prompt_template` | Get reusable operational prompt templates |

## Safety & Privacy

Eijex MCP provides database lookup and in-silico workflow tools only. It does not provide medical, clinical, diagnostic, treatment, regulatory, or legal advice.

**Do not submit patient data, confidential partner data, proprietary sequences, or unpublished constructs to the public MCP endpoint.** Use local FactorForge or a private MCP deployment for sensitive work.

FactorForge CDS generates in-silico CDS design candidates and pre-synthesis review artifacts. It does not guarantee expression, yield, synthesis acceptance, folding, glycosylation, regulatory approval, or biological activity. Wet-lab validation is required.

## Related

- [FactorForge CDS](https://factorforge.eijex.com) — CDS design and pre-synthesis sequence review for plant workflows
- [mcp.eijex.com](https://mcp.eijex.com) — Web UI

## Get in Touch

- **GitHub Issues** — bugs, features: [github.com/eijex/eijex-mcp/issues](https://github.com/eijex/eijex-mcp/issues)
- **Email** — eijex.lab@gmail.com
- **FactorForge** — [factorforge.eijex.com](https://factorforge.eijex.com)
- **Lab** — [www.eijex.com](https://www.eijex.com)
