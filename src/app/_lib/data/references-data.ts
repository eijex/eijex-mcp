/**
 * Domain reference sources embedded for Vercel serverless deployment.
 * Source files: .claude/skills/research/references/*.md
 * Last synced: 2026-03-13
 */

export const REFERENCES: Record<string, string> = {
  biotech: `# Biotech / Pharma / Medical Research Sources

> last_reviewed: 2026-03-10
> review_cadence: semi-annual (반기 1회)

바이오텍, 제약, 의료기기, 정밀의료 도메인 리서치 소스 목록.

## 규제 기관 (Regulatory)

### FDA (미국)
- **공지/가이던스**: https://www.fda.gov/regulatory-information/search-fda-guidance-documents
- **신약 승인**: https://www.fda.gov/drugs/drug-approvals-and-databases
- **의료기기**: https://www.fda.gov/medical-devices/device-advice-comprehensive-regulatory-assistance
- **AI/ML SaMD**: https://www.fda.gov/medical-devices/software-medical-device-samd/artificial-intelligence-and-machine-learning-aiml-enabled-medical-devices
- **검색팁**: \`site:fda.gov [키워드] guidance 2025\` (연도 필터 활용)

### EMA (유럽)
- **가이던스**: https://www.ema.europa.eu/en/human-regulatory/research-development/scientific-guidelines
- **승인 현황**: https://www.ema.europa.eu/en/medicines

### EFSA (유럽식품안전청) — PlantForm / CodonForge
- **공지**: https://www.efsa.europa.eu/en/publications
- **GMO 패널**: https://www.efsa.europa.eu/en/topics/topic/genetically-modified-organisms
- **검색팁**: \`site:efsa.europa.eu plant expression 2025\`

### USDA APHIS (미국 농무부) — PlantForm / CodonForge
- **Biotechnology Regulatory Services**: https://www.aphis.usda.gov/aphis/ourfocus/biotechnology
- **규제 공지**: https://www.aphis.usda.gov/aphis/newsroom/stakeholder-info/sa_biotechnology
- **SECURE Rule (식물 GMO)**: https://www.aphis.usda.gov/aphis/ourfocus/biotechnology/brs-news-and-information
- **검색팁**: \`site:aphis.usda.gov plant-made pharmaceutical 2025\`

### Health Canada — PlantForm / CodonForge
- **생물의약품 가이던스**: https://www.canada.ca/en/health-canada/services/drugs-health-products/biologics-radiopharmaceuticals-genetic-therapies.html
- **식물 유래 단백질**: \`site:canada.ca plant-derived biologic 2025\`
- **RSS 없음** → Google Alerts 설정 권장: \`"Health Canada" "plant" "biologic"\`

### 식약처 (한국)
- **공지사항**: https://www.mfds.go.kr/brd/m_99/list.do
- **의약품 정보**: https://nedrug.mfds.go.kr

### 한국 의료 규제 — Alzheimer / CandidaX

#### HIRA (건강보험심사평가원)
- **공지**: https://www.hira.or.kr/bbsDummy.do?pgmid=HIRAA020002000000
- **급여 기준**: https://www.hira.or.kr/ra/ropni/getRopniList.do
- **AI 의료기기 급여**: \`site:hira.or.kr AI 의료기기 급여기준 2025\`

#### 보건복지부
- **공지사항**: https://www.mohw.go.kr/react/al/sal0301ls.jsp
- **바이오헬스 정책**: \`site:mohw.go.kr 바이오헬스 AI 2025\`
- **RSS 없음** → Google Alerts 설정 권장: \`"보건복지부" "AI 의료기기"\`

---

## 논문 데이터베이스

### PubMed (최우선)
- **URL**: https://pubmed.ncbi.nlm.nih.gov
- **검색팁 (연도 고정)**: \`[키워드] AND ("2024"[dp] OR "2025"[dp])\`
- **검색팁 (최근 30일)**: \`[키워드] AND ("last 30 days"[dp])\`
- **검색팁 (최근 90일)**: \`[키워드] AND ("3 months"[dp])\`
- **필터**: Free full text, Review articles
- **새 자료 없으면 SKIP** — 날짜 범위 내 결과 0건이면 해당 소스 건너뜀

### bioRxiv / medRxiv (프리프린트)
- **URL**: https://www.biorxiv.org / https://www.medrxiv.org
- **주의**: peer-review 전 논문, 확정된 연구 아님

### Google Scholar
- **URL**: https://scholar.google.com
- **검색팁**: 인용수 높은 것 우선, 최근 5년 필터

---

## 임상시험 / 데이터

### ClinicalTrials.gov
- **URL**: https://clinicaltrials.gov
- **활용**: 특정 타겟/적응증의 임상 현황 파악

### GEO (유전체 데이터)
- **URL**: https://www.ncbi.nlm.nih.gov/geo
- **활용**: RNA-seq, 마이크로어레이 공개 데이터셋

### ADNI (알츠하이머 뇌영상 이니셔티브) — Alzheimer 프로젝트
- **URL**: https://adni.loni.usc.edu
- **활용**: MRI/PET 뇌영상, 바이오마커, 인지기능 종단 데이터
- **접근**: 계정 등록 후 데이터 신청 필요

### Alzforum — Alzheimer 프로젝트
- **URL**: https://www.alzforum.org
- **활용**: 알츠하이머 신약/바이오마커 최신 뉴스, 논문 큐레이션
- **검색팁**: \`site:alzforum.org biomarker 2025\`

---

## 식물 발현 / 코돈 최적화 (PlantForm / CodonForge)

### HIVE-CUT (코돈 사용 테이블)
- **URL**: https://hive.biochemistry.gwu.edu/dna.cgi?cmd=cut
- **활용**: 숙주별 코돈 사용 빈도 — N. benthamiana 포함

### Kazusa (코돈 사용 DB)
- **URL**: https://www.kazusa.or.jp/codon
- **활용**: 식물/미생물 codon usage table — CodonForge CAI 계산 기준

### JGI (Joint Genome Institute) — 게놈 데이터
- **URL**: https://phytozome-next.jgi.doe.gov
- **활용**: 식물 게놈 시퀀스, 유전자 발현 데이터
- **검색팁**: \`Nicotiana benthamiana genome expression\`

---

## 약물 발굴 / 신약 데이터 (CandidaX)

### ChEMBL
- **URL**: https://www.ebi.ac.uk/chembl
- **활용**: 약물-타겟 상호작용, IC50 데이터, 임상 단계 화합물
- **API**: https://www.ebi.ac.uk/chembl/api/data/

### DrugBank
- **URL**: https://go.drugbank.com
- **활용**: 약물 메커니즘, 적응증, 부작용, ADMET 데이터
- **오픈 데이터**: https://go.drugbank.com/releases/latest (일부 무료)

---

## 유튜브 / 컨퍼런스

### 주요 채널/컨퍼런스
- EWSC (European Workshop on Signal and Computational Medicine)
- ASCO (미국 임상종양학회)
- AACR (미국 암연구학회)
- NeurIPS / ICML (AI/ML in healthcare)

### 유튜브 리서치 방법
1. 강연 제목 + 발표자 검색
2. 자막/트랜스크립트 확인 (자동 자막도 유용)
3. 강연 내 인용 논문 따라가기

---

## 오픈소스 / GitHub

### 바이오인포매틱스 도구
- **Bioconductor**: https://www.bioconductor.org (R 패키지)
- **BioPython**: https://biopython.org
- **검색**: \`github.com [키워드] bioinformatics stars:>100\`

### 주요 키워드 (CodonForge/CandidaX 관련)
- \`precision oncology AI\`
- \`biomarker discovery machine learning\`
- \`drug target prediction deep learning\`
- \`EHR clinical NLP\`

---

## 리서치 우선순위

\`\`\`
1순위: FDA/EMA 공식 가이던스 (규제 컴플라이언스)
2순위: PubMed peer-reviewed 논문 (과학적 근거)
3순위: ClinicalTrials (시장/임상 현황)
4순위: GitHub 오픈소스 (구현 참고)
5순위: 컨퍼런스/유튜브 (최신 트렌드)
\`\`\`
`,

  security: `# Security Audit / Compliance Research Sources

> last_reviewed: 2026-03-10
> review_cadence: quarterly (분기 1회)

보안 감사, 컴플라이언스, 취약점 점검 도메인 리서치 소스 목록.

---

## 한국 규제 기관 (1순위)

### KISA (한국인터넷진흥원) — 핵심
- **보안 공지 / 취약점**: https://www.kisa.or.kr/공지사항
- **인터넷침해대응센터(KrCERT)**: https://www.krcert.or.kr
  - 주간 위협 동향, CVE 한국어 분석, 보안 업데이트 권고
- **ISMS-P 인증 기준**: https://isms.kisa.or.kr
- **암호 알고리즘 가이드(SEED 등)**: https://seed.kisa.or.kr
- **검색팁**: \`site:kisa.or.kr 가이드라인 2025\`

### 행정안전부 (MOIS)
- **전자정부 보안**: https://www.mois.go.kr → 정보화정책 → 정보보호
- **개인정보 보호 포털**: https://www.privacy.go.kr (가이드라인 문서)
- **정보보호 및 개인정보보호 관리체계 인증(ISMS-P)**: 행안부·과기정통부 공동 고시
- **주요 문서**: "전자정부 SW 개발·운영자를 위한 소프트웨어 개발보안 가이드"
- **검색팁**: \`행안부 소프트웨어 개발보안 가이드 2024\`

### 금융감독원 (FSS) + 금융보안원 (FSI)
- **전자금융감독규정**: https://www.fss.or.kr → 법규/제도 → 전자금융
- **금융보안원 가이드**: https://www.fsec.or.kr → 자료실
  - "금융회사 모의해킹 가이드", "클라우드 보안 가이드", "API 보안 체크리스트"
- **검색팁**: \`금융보안원 취약점 점검 가이드 2025\`

### 개인정보보호위원회 (PIPC)
- **가이드라인**: https://www.pipc.go.kr → 법령·자료 → 가이드라인
- **핵심 고시**: "개인정보 안전성 확보조치 기준" (정기 개정)
- **개인정보 영향평가**: https://pia.privacy.go.kr

### 과학기술정보통신부 (MSIT)
- **정보보호 제품**: https://www.msit.go.kr → 정보보호 정책
- **국가 사이버안보 기본계획**: 검색 \`과기부 국가사이버안보 기본계획\`

### 국가사이버안보센터 (NCSC)
- **위협 정보**: https://www.ncsc.go.kr
- **국가·공공기관 대상**: APT 동향, 침해사고 분석 보고서

### NIS (국가정보원) — 사이버안보
- **사이버안보 지침**: https://www.nis.go.kr → 사이버안보 → 공개자료
- **국가·공공기관 보안 요구사항**: 클라우드 보안, AI 보안 가이드라인
- **검색팁**: \`site:nis.go.kr 사이버안보 가이드 2025\`

---

## 국제 표준 (2순위)

### NIST (미국 국가표준기술연구소)
- **Cybersecurity Framework (CSF) 2.0**: https://www.nist.gov/cyberframework
- **SP 800 시리즈**: https://csrc.nist.gov/publications/sp800
  - SP 800-53 (보안통제), SP 800-171 (CUI 보호), SP 800-61 (침해사고 대응)
- **NVD (취약점 DB)**: https://nvd.nist.gov
- **AI 보안 프레임워크 (AI RMF)**: https://www.nist.gov/artificial-intelligence
- **검색팁**: \`site:nvd.nist.gov CVE-2025 [라이브러리명]\`

### OWASP
- **Top 10 Web**: https://owasp.org/www-project-top-ten
- **Top 10 LLM/AI**: https://owasp.org/www-project-top-10-for-large-language-model-applications
- **ASVS (App Security Verification Standard)**: https://owasp.org/www-project-application-security-verification-standard
- **Cheat Sheet Series**: https://cheatsheetseries.owasp.org (구현 단계 참고)
- **Testing Guide (WSTG)**: https://owasp.org/www-project-web-security-testing-guide

### CIS (Center for Internet Security)
- **CIS Controls v8**: https://www.cisecurity.org/controls
- **CIS Benchmarks**: https://www.cisecurity.org/cis-benchmarks
  - AWS, GCP, Azure, Kubernetes, Docker, Ubuntu 등 설정 기준 — 무료 PDF

### CISA (미국 사이버보안인프라보안청)
- **Known Exploited Vulnerabilities (KEV)**: https://www.cisa.gov/known-exploited-vulnerabilities-catalog
- **Advisories**: https://www.cisa.gov/news-events/cybersecurity-advisories
- **Secure by Design**: https://www.cisa.gov/securebydesign

### ISO/IEC
- **ISO 27001** (ISMS 인증 기준): https://www.iso.org/standard/27001
- **ISO 27002** (통제 구현 가이드): 접근제어, 암호화, 물리보안
- **ISO 27017** (클라우드 보안), **ISO 27018** (개인정보+클라우드)

---

## 의료 / 바이오 보안 (CodonForge, CandidaX 관련)

### HIPAA (미국)
- **Security Rule**: https://www.hhs.gov/hipaa/for-professionals/security/index.html
- **HHS 가이던스**: https://www.hhs.gov/hipaa/for-professionals/security/guidance/index.html
- **검색팁**: \`HIPAA security rule EHR cloud 2024\`

### FDA 소프트웨어 / AI 의료기기 보안
- **의료기기 사이버보안**: https://www.fda.gov/medical-devices/digital-health-center-excellence/cybersecurity
- **Premarket 가이던스**: "Cybersecurity in Medical Devices" (2023년 최신)
- **AI/ML SaMD**: https://www.fda.gov/medical-devices/software-medical-device-samd/artificial-intelligence-and-machine-learning-aiml-enabled-medical-devices

### 식약처 (한국)
- **의료기기 사이버보안 가이드**: https://www.mfds.go.kr → 의료기기 → 소프트웨어

### ISMS-P 의료 기관 특화 적용 기준
- **적용 대상**: 500병상 이상 의료기관, 개인정보 처리 규모 5만명 이상
- **의료 특화 통제항목**: 의료정보시스템 접근통제, 전자의무기록(EMR) 보안, 원격진료 보안
- **KISA ISMS-P 인증 현황**: https://isms.kisa.or.kr/main/ispims/issue/ (인증기관 목록)
- **검색팁**: \`ISMS-P 의료기관 인증 사례 2025\`

---

## 취약점 / 위협 인텔리전스 (실시간)

### CVE / NVD
- **CVE 검색**: https://cve.mitre.org
- **NVD 상세**: https://nvd.nist.gov/vuln/search
- **NVD API (최근 7일)**: \`https://services.nvd.nist.gov/rest/json/cves/2.0?pubStartDate=[DATE]&pubEndDate=[DATE]\`
- **GitHub Security Advisories**: https://github.com/advisories
- **검색팁**: \`[라이브러리]:[버전] site:nvd.nist.gov\`
- **새 자료 없으면 SKIP** — 해당 라이브러리 CVE 7일 내 0건이면 스킵

### Snyk / OSS 취약점
- **Snyk Vulnerability DB**: https://security.snyk.io
- **OSV (Open Source Vulnerabilities)**: https://osv.dev (Google 관리)
- **검색**: \`npm audit\`, \`pip audit\`, \`trivy\`

### Exploit DB / PoC
- **Exploit DB**: https://www.exploit-db.com
- **GitHub PoC**: \`github.com topic:CVE-[year]-[number]\`

---

## 보안 감사 도구 / 오픈소스

### SAST (정적 분석)
- **Semgrep Rules**: https://semgrep.dev/r (규칙 검색)
- **CodeQL**: https://codeql.github.com (GitHub Actions 연동)
- **Bandit** (Python): \`pip install bandit\`

### DAST (동적 분석)
- **OWASP ZAP**: https://www.zaproxy.org
- **Burp Suite Community**: https://portswigger.net/burp

### SCA (소프트웨어 구성 분석)
- **OWASP Dependency-Check**: https://owasp.org/www-project-dependency-check
- **Grype / Syft** (컨테이너): https://github.com/anchore

### 컴플라이언스 자동화
- **OpenSCAP**: https://www.open-scap.org (SCAP 기반 자동 점검)
- **Prowler** (AWS): https://github.com/prowler-cloud/prowler

---

## 리서치 우선순위

\`\`\`
1순위: KISA / 행안부 고시 (한국 법적 컴플라이언스 필수)
2순위: 금감원 / 금보원 (금융 도메인)
3순위: NIST / OWASP (국제 기술 표준)
4순위: NVD / KrCERT / Snyk (실시간 취약점)
5순위: CIS / ISO (심화 설정 기준)
\`\`\`
`,

  general: `# General / Open-Source / Tech Research Sources

> last_reviewed: 2026-03-10
> review_cadence: annual (연간 1회)

GitHub 오픈소스, 기술 생태계, AI/MCP 관련 리서치 소스.

## Anthropic / Claude 생태계

### 공식 소스
- **Claude Code 문서**: https://docs.anthropic.com/en/docs/claude-code/overview
- **Anthropic API 문서**: https://docs.anthropic.com/en/api
- **Anthropic 블로그 (모델 출시/뉴스)**: https://www.anthropic.com/news
- **Claude.ai changelog**: https://claude.ai/changelog (신규 기능 공지)
- **GitHub Releases (claude-code)**: https://github.com/anthropics/claude-code/releases

### MCP 생태계
- **MCP 공식 스펙**: https://github.com/modelcontextprotocol/specification
- **MCP 서버 목록**: https://github.com/modelcontextprotocol/servers
- **MCP 문서**: https://modelcontextprotocol.io/docs
- **검색**: \`github.com topic:mcp-server stars:>50\`

---

## AI 모델 / 인프라 추적

### Groq
- **모델 목록/가격**: https://console.groq.com/docs/models
- **Groq 블로그**: https://wow.groq.com/blog
- **새 모델 공지**: https://twitter.com/GroqInc (또는 블로그)

### HuggingFace
- **신규 모델 (daily papers)**: https://huggingface.co/papers
- **모델 트렌딩**: https://huggingface.co/models?sort=trending
- **특화 모델 검색**: \`huggingface.co models [도메인] (예: protein, codon, medical)\`

### OpenAI / Google DeepMind (경쟁사 동향)
- **OpenAI 블로그**: https://openai.com/blog
- **Google DeepMind**: https://deepmind.google/discover/blog

---

## 기술 문서 / API

### 공식 문서 우선
- Context7 MCP로 최신 문서 조회: \`/mcp__plugin_context7_context7__query-docs\`
- **검색팁**: 버전 명시 (예: \`Next.js 15\`, \`Python 3.12\`)

### 주요 프레임워크 Release 추적
- **PyTorch**: https://github.com/pytorch/pytorch/releases
- **Next.js**: https://github.com/vercel/next.js/releases
- **FastAPI**: https://github.com/tiangolo/fastapi/releases
- **검색팁**: GitHub \`[repo]/releases\` — "Breaking change" 키워드 필터

### 기술 블로그
- Anthropic Blog: https://www.anthropic.com/news
- Hacker News: https://news.ycombinator.com (커뮤니티 반응)
- Vercel Blog: https://vercel.com/blog

---

## 리서치 우선순위

\`\`\`
1순위: 공식 문서 (Context7 또는 직접 접근)
2순위: GitHub 공식 repo (stars 높고 최근 업데이트)
3순위: Anthropic/공식 블로그 (모델 출시, API 변경)
4순위: Groq/HuggingFace (모델/가격 변동)
5순위: 커뮤니티 (HN, Reddit r/MachineLearning)
\`\`\`
`,

  'ai-product': `# AI Product / Dev Tools Research Sources

> last_reviewed: 2026-03-30
> review_cadence: quarterly (분기 1회)

TaskBoard, AI 개발 도구, LLM API, 생산성 플랫폼 관련 리서치 소스.

## LLM API / 모델

### Groq
- **모델 목록/가격**: https://console.groq.com/docs/models
- **블로그**: https://wow.groq.com/blog
- **Releases**: https://github.com/groq/groq-python/releases

### Anthropic
- **Claude 모델 업데이트**: https://www.anthropic.com/news
- **API 문서**: https://docs.anthropic.com/en/api
- **Claude Code 릴리즈**: https://github.com/anthropics/claude-code/releases

### OpenAI (경쟁사 동향)
- **블로그**: https://openai.com/blog
- **API changelog**: https://platform.openai.com/docs/changelog

---

## 배포 인프라

### Vercel
- **블로그 (Next.js 업데이트)**: https://vercel.com/blog
- **Next.js Releases**: https://github.com/vercel/next.js/releases
- **Vercel changelog**: https://vercel.com/changelog

### Neon (PostgreSQL serverless)
- **블로그**: https://neon.tech/blog
- **Releases**: https://github.com/neondatabase/neon/releases

---

## AI 에이전트 / MCP 생태계

- **MCP 공식 스펙**: https://github.com/modelcontextprotocol/specification
- **MCP 서버 목록**: https://github.com/modelcontextprotocol/servers
- **MCP 문서**: https://modelcontextprotocol.io/docs
- **검색**: \`github.com topic:mcp-server stars:>50\`

---

## 트렌드 / 신규 도구 발견

### Product Hunt
- **AI 카테고리**: https://www.producthunt.com/topics/artificial-intelligence
- **오늘의 제품**: https://www.producthunt.com

### Hacker News
- **메인**: https://news.ycombinator.com
- **Show HN (새 프로젝트)**: https://news.ycombinator.com/show
- **검색팁**: \`site:news.ycombinator.com [키워드]\`

### GitHub
- **트렌딩 (TypeScript)**: https://github.com/trending/typescript?since=weekly
- **트렌딩 (Python)**: https://github.com/trending/python?since=weekly
- **AI 도구 검색**: \`github.com topic:ai-tools stars:>500\`
- **Task 관리 검색**: \`github.com topic:task-management stars:>200\`

---

## 리서치 우선순위

\`\`\`
1순위: Anthropic/Groq 공식 발표 (API 변경·요금 변동 직접 영향)
2순위: Vercel/Next.js Releases (배포 환경 변경)
3순위: Product Hunt AI (경쟁 도구 동향)
4순위: HN Show (참고할 오픈소스 발견)
5순위: GitHub Trending (구현 패턴 참고)
\`\`\`
`,
};

export const REFERENCE_DOMAINS = Object.keys(REFERENCES);
