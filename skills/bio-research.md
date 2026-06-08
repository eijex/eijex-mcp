---
name: eijex-bio-research
description: Use when conducting biotech research with eijex-mcp tools — guides tool selection order for database lookup and plant CDS design workflows
---

# eijex Bio-Research Workflow

## Autoimmune Disease Research
1. `query_chembl(query="<target>", search_type="target")` → ChEMBL target ID
2. `query_chembl(query="...", search_type="activity", chembl_id="CHEMBL...")` → compound screening
3. `query_opentargets(query="<target>")` → disease-target evidence
4. `query_clinicaltrials(query="<indication>")` → active trials
5. `query_pubmed(query="<indication> <target>")` → recent literature

## Plant CDS Design
1. `factorforge_cds_optimize(sequence="...")` → single-sequence CDS candidate generation
2. `factorforge_cds_compare(sequence="...", profiles="balanced,high_cai,gc_target")` → compare profiles
3. `factorforge_cds_batch(sequences=[...])` → generate candidates for multiple sequences at once (max 20)
4. `query_pubmed(query="codon usage N. benthamiana CDS design")` → references
5. `query_kegg(query="plant codon usage")` → pathway context

## Pathway Analysis (supplementary)
- KEGG: pathway overview
- `query_reactome(query="...")`: reaction-level detail
- `query_fda(drug_name="...")`: drug safety data
