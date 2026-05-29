---
name: eijex-bio-research
description: Use when conducting biotech research with eijex-mcp tools — guides tool selection order for CandidaX (NMOSD/AQP4-IgG) and PlantFormOrg (codon optimization) workflows
---

# eijex Bio-Research Workflow

## CandidaX — NMOSD/AQP4-IgG Research
1. `query_chembl(query="AQP4", search_type="target")` → ChEMBL target ID 확보
2. `query_chembl(query="...", search_type="activity", chembl_id="CHEMBL...")` → 화합물 스크리닝
3. `query_opentargets(query="AQP4")` → 질환-타겟 증거
4. `query_clinicaltrials(query="NMOSD AQP4")` → 진행 중 임상
5. `query_pubmed(query="NMOSD AQP4-IgG")` → 최신 문헌

## PlantFormOrg — 코돈 최적화
1. `factorforge_optimize_cds(sequence="...")` → CDS 최적화
2. `query_pubmed(query="codon optimization N. benthamiana")` → 레퍼런스
3. `query_kegg(query="plant expression")` → 경로 분석

## 경로 분석 (보완)
- KEGG: 경로 개요
- `query_reactome(query="...")`: 반응 레벨 상세
- `query_fda(drug_name="...")`: 약물 안전성
