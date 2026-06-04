# Changelog

All notable changes to Eijex MCP are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Fixed
- **Profile enum** — `factorforge_cds_optimize` and batch route now expose only the 4 API-validated profiles (`balanced`, `high_cai`, `gc_target`, `assembly_friendly`); `ramp`, `viral_delivery`, and `ml_enhanced` removed from enum (were causing live HTTP 400 errors).

### Changed
- `factorforge_cds_optimize` description updated to FactorForge v3.1.9.
- ⚠ `gc_target` profile now targets ~60% GC by default (breaking change from v3.1.7); pass `target_gc=42.5` for old behavior.

---

## [1.1.0] — 2026-05-31

### Added
- `factorforge_cds_compare` — compare multiple optimization profiles side-by-side via `POST /api/optimize/compare`
- `factorforge_cds_batch` — optimize up to 20 sequences in a single request via `POST /api/optimize/batch`
- `ml_enhanced` profile added to `factorforge_cds_optimize` enum (FactorForge v3.1.6)
- Sequence length guardrail: 2000 amino acids maximum per sequence
- Rate limiting: 60 requests per minute per IP
- Health endpoint: `GET /api/health`

### Changed
- `factorforge_optimize_cds` renamed to `factorforge_cds_optimize` for naming consistency
- Version string updated to FactorForge CDS v3.1.6

---

## [1.0.0] — 2026-05-23

### Added
- Initial public release
- `factorforge_cds_optimize` — CDS optimization via FactorForge CDS
- `factorforge_verify_parameter` — design constant research workflow
- `query_pubmed`, `query_pdb`, `query_ncbi`, `query_uniprot`, `query_alphafold`
- `query_kegg`, `query_clinicaltrials`, `query_opentargets`, `query_fda`, `query_reactome`, `query_chembl`
- MIT license
- Public endpoint: `https://mcp.eijex.com/api/mcp`
