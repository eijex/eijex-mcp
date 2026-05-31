---
name: eijex-bio-research
description: Use when conducting biotech research with eijex-mcp tools — guides tool selection order for autoimmune disease research and plant codon optimization workflows
---

# eijex Bio-Research Workflow

## Autoimmune Disease Research
1. `query_chembl(query="<target>", search_type="target")` → ChEMBL target ID
2. `query_chembl(query="...", search_type="activity", chembl_id="CHEMBL...")` → compound screening
3. `query_opentargets(query="<target>")` → disease-target evidence
4. `query_clinicaltrials(query="<indication>")` → active trials
5. `query_pubmed(query="<indication> <target>")` → recent literature

## Plant Codon Optimization
1. `factorforge_cds_optimize(sequence="...")` → CDS optimization
2. `query_pubmed(query="codon optimization N. benthamiana")` → references
3. `query_kegg(query="plant expression")` → pathway analysis

## Pathway Analysis (supplementary)
- KEGG: pathway overview
- `query_reactome(query="...")`: reaction-level detail
- `query_fda(drug_name="...")`: drug safety data
