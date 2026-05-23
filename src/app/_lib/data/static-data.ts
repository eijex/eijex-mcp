import { ProjectDefinition } from '../types';

export interface McpEntry {
  id: string;
  name: string;
  type: string;
  endpoint?: string;
  tools?: string[];
  when_to_use: string[];
  projects: string[] | 'all';
  install_status?: string;
}

export interface SkillEntry {
  id: string;
  name: string;
  source: string;
  install_location?: string;
  install_status: string;
  when_to_use: string[];
  projects: string[] | 'all';
}

export const PROJECTS: ProjectDefinition[] = [
  {
    id: 'mcp-server',
    name: 'mcp-server',
    path: 'mcp-server',
    description: 'Private MCP Server & AI Workflow Hub',
    status: 'ACTIVE',
    health: '100%',
  },
  {
    id: 'taskboard',
    name: 'taskboard',
    path: 'TaskBoard',
    description: 'AI-powered Kanban — Meeting/Email to Task',
    status: 'ACTIVE',
    health: '100%',
    referencesDomain: 'ai-product',
  },
  {
    id: 'plantformorg',
    name: 'plantformorg',
    path: 'PlantFormOrg',
    description: 'Global Plant Bio-Platform Infrastructure',
    status: 'RUNNING',
    health: '98%',
  },
  {
    id: 'candidax',
    name: 'Candidate X',
    path: 'CandidaX',
    description: 'Brain Co. — Alzheimer\'s detection & analysis AI (MRI/PET/CT, HIRA/ALeAD data)',
    status: 'ACTIVE',
    health: '96%',
  },
  {
    id: 'cybersecurity',
    name: 'cybersecurity',
    path: 'Cybersecurity',
    description: 'Enterprise Security Audit Toolkit',
    status: 'PROTECTED',
    health: '94%',
  },
];

export const MCP_REGISTRY: McpEntry[] = [
  {
    id: 'mcp-server',
    name: 'mcp-server MCP Server',
    type: 'http',
    endpoint: 'https://mcp-server-munkyukim86s-projects.vercel.app/api/mcp',
    install_status: 'installed',
    tools: [
      'list_projects',
      'get_project_snapshot',
      'get_model_recommendations',
      'get_session_logs',
      'add_session_log',
      'get_skill_template',
      'get_intelligence_briefing',
      'get_references',
      'get_mcp_registry',
    ],
    when_to_use: [
      '작업 시작 전 어떤 도구/스킬을 써야 할지 파악할 때',
      '프로젝트 메타데이터, AI 세팅 스냅샷 조회할 때',
      '주간 인텔리전스 브리핑(외부 뉴스 + 내 활동) 확인할 때',
      '도메인 레퍼런스(FDA, KISA, PubMed 등) 조회할 때',
      '모델 추천이 필요할 때',
    ],
    projects: 'all',
  },
  {
    id: 'context7',
    name: 'Context7 (Library Docs)',
    type: 'mcp',
    install_status: 'installed',
    tools: ['resolve-library-id', 'query-docs'],
    when_to_use: [
      '라이브러리 최신 문서/API 레퍼런스가 필요할 때',
      'Next.js, React, Python 패키지 등 공식 문서 조회할 때',
      '코드 작성 전 라이브러리 사용법 확인할 때',
    ],
    projects: 'all',
  },
];

export const SKILL_REGISTRY: SkillEntry[] = [
  {
    id: 'research',
    name: 'Domain Research Skill',
    source: 'local (.claude/skills/research/)',
    install_status: 'installed',
    when_to_use: [
      '최신 규제(FDA, KISA, HIRA) 업데이트 조사할 때',
      '관련 논문, 오픈소스 도구, 기술 표준 찾을 때',
      '바이오테크/보안 도메인 레퍼런스 리서치할 때',
    ],
    projects: ['plantformorg', 'candidax', 'cybersecurity', 'mcp-server'],
  },
  {
    id: 'yc-advisor',
    name: 'YC Advisor',
    source: 'agent-3-7/agent37-skills-collection',
    install_location: '~/.claude/skills/yc-advisor',
    install_status: 'installed',
    when_to_use: [
      '제품 전략, 시장 포지셔닝, 성장 전략 조언이 필요할 때',
      'Brain Co. / CandidaX 비즈니스 방향 검토할 때',
      '스타트업 관점에서 의사결정 검토할 때',
    ],
    projects: 'all',
  },
  {
    id: 'skill-creator',
    name: 'Skill Creator',
    source: 'anthropics/skills',
    install_location: '~/.claude/skills/skill-creator',
    install_status: 'installed',
    when_to_use: [
      '새 Claude Code 스킬을 작성하거나 기존 스킬 품질을 평가할 때',
      '스킬 성능 벤치마크, 스킬 설명 최적화가 필요할 때',
    ],
    projects: ['mcp-server'],
  },
  {
    id: 'modern-python',
    name: 'Modern Python',
    source: 'trailofbits/skills',
    install_location: '~/.claude/skills/modern-python',
    install_status: 'installed',
    when_to_use: [
      'uv, ruff, pytest 기반 Python 프로젝트 설정할 때',
      'scripts/monitoring/*.py 등 Python 코드 품질 개선할 때',
    ],
    projects: 'all',
  },
  {
    id: 'semgrep-rule-creator',
    name: 'Semgrep Rule Creator',
    source: 'trailofbits/skills',
    install_location: '~/.claude/skills/semgrep-rule-creator',
    install_status: 'installed',
    when_to_use: [
      'KISA/ISMS-P 기준 취약점 탐지 규칙 생성할 때',
      '보안 감사 자동화 규칙 작성할 때',
    ],
    projects: ['cybersecurity'],
  },
  {
    id: 'next-best-practices',
    name: 'Next.js Best Practices',
    source: 'vercel-labs/next-skills',
    install_location: '~/.claude/skills/next-best-practices',
    install_status: 'installed',
    when_to_use: [
      'Next.js App Router 패턴, 서버 컴포넌트 설계할 때',
      'Vercel 배포 최적화가 필요할 때',
    ],
    projects: ['taskboard', 'mcp-server'],
  },
  {
    id: 'next-cache-components',
    name: 'Next.js Cache Components',
    source: 'vercel-labs/next-skills',
    install_location: '~/.claude/skills/next-cache-components',
    install_status: 'installed',
    when_to_use: [
      'Groq/LLM 반복 호출 캐싱 전략이 필요할 때',
      'Next.js PPR, use cache 디렉티브 활용할 때',
    ],
    projects: ['taskboard', 'mcp-server'],
  },
  {
    id: 'agent-memory-systems',
    name: 'Agent Memory Systems',
    source: 'sickn33/antigravity-awesome-skills',
    install_location: '~/.claude/skills/agent-memory-systems',
    install_status: 'installed',
    when_to_use: [
      'AI 에이전트 컨텍스트/메모리 관리 패턴 설계할 때',
      '태스크 상태 추적, 중복 감지 로직 설계할 때',
    ],
    projects: ['taskboard', 'mcp-server'],
  },
  {
    id: 'agent-orchestrator',
    name: 'Agent Orchestrator',
    source: 'sickn33/antigravity-awesome-skills',
    install_location: '~/.claude/skills/agent-orchestrator',
    install_status: 'installed',
    when_to_use: [
      'Extract→Triage→Review 파이프라인 설계할 때',
      '멀티 에이전트 워크플로우 조율이 필요할 때',
    ],
    projects: ['taskboard', 'mcp-server'],
  },
  {
    id: 'database-design',
    name: 'Database Design',
    source: 'sickn33/antigravity-awesome-skills',
    install_location: '~/.claude/skills/database-design',
    install_status: 'installed',
    when_to_use: [
      'Neon PostgreSQL 스키마 설계, 인덱싱 최적화할 때',
      '태스크/프로젝트 데이터 모델 리팩터링할 때',
    ],
    projects: ['taskboard'],
  },
  {
    id: 'deep-research',
    name: 'Deep Research',
    source: 'sickn33/antigravity-awesome-skills',
    install_location: '~/.claude/skills/deep-research',
    install_status: 'installed',
    when_to_use: [
      '논문 검색, 규제 문서 수집, 정보 종합이 필요할 때',
      'PubMed, ClinicalTrials, FDA 자료 자율 리서치할 때',
    ],
    projects: ['candidax', 'plantformorg'],
  },
  {
    id: 'api-security-best-practices',
    name: 'API Security Best Practices',
    source: 'sickn33/antigravity-awesome-skills',
    install_location: '~/.claude/skills/api-security-best-practices',
    install_status: 'installed',
    when_to_use: [
      'API 보안 패턴 검토, OWASP Top 10 대응 설계할 때',
      '보안 감사 체크리스트 작성할 때',
    ],
    projects: ['cybersecurity', 'mcp-server'],
  },
  {
    id: 'uniprot-database',
    name: 'UniProt Database',
    source: 'K-Dense-AI/claude-scientific-skills',
    install_location: '~/.claude/skills/uniprot-database',
    install_status: 'installed',
    when_to_use: [
      '단백질 시퀀스, 기능 정보 조회할 때 (CD47, CD9 등)',
      'N. benthamiana 발현 단백질 분석할 때',
    ],
    projects: ['plantformorg', 'candidax'],
  },
  {
    id: 'zinc-database',
    name: 'ZINC Database',
    source: 'K-Dense-AI/claude-scientific-skills',
    install_location: '~/.claude/skills/zinc-database',
    install_status: 'installed',
    when_to_use: [
      '구매 가능한 화합물 검색, 가상 스크리닝할 때',
      '알츠하이머 약물 후보 탐색할 때',
    ],
    projects: ['candidax'],
  },
  {
    id: 'uspto-database',
    name: 'USPTO Database',
    source: 'K-Dense-AI/claude-scientific-skills',
    install_location: '~/.claude/skills/uspto-database',
    install_status: 'installed',
    when_to_use: [
      '특허 검색, 출원 이력 조회할 때',
      'IP 컨설팅 -- 선행기술 조사, 특허 분석할 때',
    ],
    projects: ['candidax', 'plantformorg'],
  },
  {
    id: 'writing',
    name: 'Scientific Writing',
    source: 'K-Dense-AI/claude-scientific-skills',
    install_location: '~/.claude/skills/writing',
    install_status: 'installed',
    when_to_use: [
      '논문, 연구보고서, 그랜트 제안서 작성할 때',
      '학술 문서 품질 향상이 필요할 때',
    ],
    projects: ['candidax', 'plantformorg'],
  },
];
