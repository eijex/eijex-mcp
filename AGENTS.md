# Eijex MCP Agent Operating Rules

> Implementation rules for any coding agent working in this repo.

---

## 1. Repo Role

Eijex MCP is the **public API gateway repo**. It exposes FactorForge CDS and public
biomedical database lookups (PubMed, PDB, NCBI, UniProt, AlphaFold, KEGG,
ClinicalTrials.gov, Open Targets, FDA, Reactome, ChEMBL) to MCP-compatible clients.

- App: `src/` (Next.js App Router, API routes under `src/app/api/`)
- Build/data generation: `scripts/generate-data.mjs`
- Skills: `skills/`
- Workflows: `workflows/`
- Plugin manifest: `.claude-plugin/plugin.json`

This repo does **not** implement CDS design logic itself — `factorforge_cds_*` tools
proxy to FactorForge CDS (`https://github.com/eijex/factorforge-cds`). Optimization
behavior, codon tables, and scoring live there, not here.

## 2. Stack

- Next.js (App Router) + TypeScript
- Public endpoint: `https://mcp.eijex.com/api/mcp`
- Deployed on Vercel (`vercel.json`)

## 3. Branch & Commit Conventions

Branch naming:
```
feat/short-description
fix/short-description
docs/short-description
chore/short-description
```

Commit message format:
```
feat: add query_reactome tool
fix: correct rate-limit header on /api/optimize/batch
docs: update README tool table
chore: bump version to 1.3.0
```

## 4. Source of Truth

Before editing, read in this order:

1. Current repo code (`src/app/api/`)
2. `README.md` — public tool table and connect instructions
3. `SECURITY.md` — privacy/scope boundaries
4. `CHANGELOG.md` — most recent entry for current contract

## 5. Scope Guardrails

Do not change without an explicit job:
- Tool/profile enums that mirror FactorForge's public API surface (`balanced`,
  `high_cai`, `gc_target`, `assembly_friendly`) — these must stay in sync with
  FactorForge CDS's actual validated profiles, not diverge independently.
- Rate limit and sequence-length guardrails (`README.md` "Safety & Privacy").

## 6. Claims Policy

Do not add any of the following to code comments, docstrings, tool descriptions, or docs:

- "increases yield"
- "guarantees expression"
- "validated expression optimizer"
- "wet-lab proven"

Eijex MCP is a **public API gateway** to in-silico tools. It does not provide medical,
clinical, diagnostic, regulatory, or legal advice. Public claims must stay limited to
tool availability, request/response shape, and rate/privacy limits.

## 7. Code Style & Testing

Before submitting a PR:

```bash
npm run lint
npm run build
```

**No automated test suite exists yet** — there is no `tests/` directory and no `test`
script in `package.json`. Until one is added, manually verify any route-handler change
against `https://mcp.eijex.com/api/health` and the affected tool endpoint before
merging. Do not claim "tests passing" in a completion report unless a test command was
actually run.

## 8. Security

Do **not** open a public GitHub issue for security vulnerabilities.
Report via [GitHub Private Vulnerability Reporting](https://github.com/eijex/eijex-mcp/security/advisories/new)
or privately to: eijex.lab@gmail.com

Submitted sequences must not be logged or stored. See `SECURITY.md` for full scope.

## 9. Do Not Commit

- `.env`, `.env.local`, secrets of any kind
- `CLAUDE.md`, `.claude/` (other than `.claude-plugin/`) — internal workflow files, not for public repo

## 10. Completion Report

After completing a job, print to terminal:

```
=== JOB NNN COMPLETE ===
Files created/modified: [list]
Test results: [results or N/A — see §7, no suite exists yet]
Notes: [if any, otherwise none]
========================
```

## 11. Public Document Checklist

After any change, update the relevant public-facing files before pushing:

| Change type | Files to update |
|-------------|----------------|
| New tool / API change | `README.md` (Available Tools table), `CHANGELOG.md` |
| Bug fix | `CHANGELOG.md` |
| Version bump | `package.json`, `.claude-plugin/plugin.json` (keep in sync), `CHANGELOG.md` |
| FactorForge profile/version sync | `README.md`, `CHANGELOG.md` — confirm against FactorForge's `docs/release-checklist-template.md` MCP GitHub / MCP site rows |

## 12. Public Surface Coverage

| Surface | URL | Key checks |
|---------|-----|-----------|
| MCP site | https://mcp.eijex.com | tool descriptions match current FactorForge version |
| GitHub repo | https://github.com/eijex/eijex-mcp | README tool table, version in `package.json` |
| Eijex homepage | https://www.eijex.com (Products section) | "Eijex MCP" card links resolve correctly |
