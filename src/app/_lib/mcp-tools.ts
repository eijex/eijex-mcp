export interface McpParameter {
  name: string;
  type: 'string' | 'number' | 'boolean';
  required: boolean;
  description: string;
}

export interface McpToolDefinition {
  name: string;           // tool name (snake_case) — URL slug 겸용
  displayName: string;    // UI 표시명
  description: string;    // 한 줄 설명
  longDescription: string; // 상세 설명
  icon: string;           // 이모지
  tags: string[];
  parameters: McpParameter[];
  keyFeatures: string[];
  useCases: string[];
  relatedTools: string[]; // tool name 배열
}

export const ALL_TOOLS: McpToolDefinition[] = [
  {
    name: 'list_projects',
    displayName: 'list_projects',
    icon: '📋',
    description: '등록된 모든 프로젝트 목록을 반환합니다.',
    longDescription:
      'mcp-server MCP 서버에 등록된 모든 프로젝트의 목록과 메타데이터를 반환합니다. ' +
      '각 프로젝트의 ID, 이름, 설명, 경로, 상태 정보를 포함합니다. ' +
      'Claude Code 세션 시작 시 현재 어떤 프로젝트들이 등록되어 있는지 파악하는 데 활용합니다.',
    tags: ['Utility', 'Projects'],
    parameters: [],
    keyFeatures: [
      '프로젝트 ID, 이름, 경로, 설명 전체 반환',
      '활성 상태 여부 포함',
      '파라미터 없이 즉시 호출 가능',
      'static-data.ts 기반 — 항상 최신 목록 반영',
    ],
    useCases: [
      'Claude Code 세션 시작 시 등록된 프로젝트 목록 파악',
      '프로젝트 ID를 알아내어 다른 도구(get_project_snapshot) 연계 호출',
      '현재 작업 대상 프로젝트 확인',
    ],
    relatedTools: ['get_project_snapshot', 'get_session_logs'],
  },
  {
    name: 'get_project_snapshot',
    displayName: 'get_project_snapshot',
    icon: '📸',
    description: '특정 프로젝트의 AI 설정 스냅샷(에이전트, 스킬, 모델)을 반환합니다.',
    longDescription:
      '지정한 프로젝트의 현재 AI 설정 스냅샷을 반환합니다. ' +
      '어떤 에이전트와 스킬이 활성화되어 있는지, 어떤 IDE와 모델을 사용하고 있는지 확인할 수 있습니다. ' +
      'Claude Code 세션 컨텍스트 설정 시 이 정보를 기반으로 최적의 설정을 로드합니다.',
    tags: ['Context', 'Projects'],
    parameters: [
      {
        name: 'projectId',
        type: 'string',
        required: true,
        description: '조회할 프로젝트의 ID (list_projects로 확인 가능)',
      },
    ],
    keyFeatures: [
      '활성 에이전트 목록 반환',
      '활성 스킬 목록 반환',
      '현재 IDE 및 모델 설정 반환',
      '마지막 업데이트 일시 포함',
    ],
    useCases: [
      '세션 시작 시 프로젝트 컨텍스트 자동 로드',
      '다른 프로젝트로 전환 시 설정 비교',
      '현재 활성 스킬 목록 확인',
    ],
    relatedTools: ['list_projects', 'get_model_recommendations'],
  },
  {
    name: 'get_model_recommendations',
    displayName: 'get_model_recommendations',
    icon: '🤖',
    description: '작업 유형별 최적 AI 모델 추천 목록을 반환합니다.',
    longDescription:
      '특정 작업 유형(taskType)에 적합한 AI 모델 추천 목록을 반환합니다. ' +
      '구조화 추출, 복잡한 추론, 이미지 분석, 코드 생성 등 다양한 작업 유형별로 ' +
      '모델 선택 가이드를 제공합니다. taskType 생략 시 전체 목록을 반환합니다.',
    tags: ['AI', 'Models'],
    parameters: [
      {
        name: 'taskType',
        type: 'string',
        required: false,
        description: '필터링할 작업 유형 (예: extraction, reasoning, vision). 생략 시 전체 반환',
      },
    ],
    keyFeatures: [
      '작업 유형별 모델 추천 (Groq, Claude, OpenAI 등)',
      'IDE 및 토큰 수준 정보 포함',
      'taskType 필터링 지원',
      '선택 근거(notes) 포함',
    ],
    useCases: [
      '새 AI 기능 개발 시 모델 선택',
      '작업 복잡도에 따른 최적 모델 파악',
      '비용 대비 성능 최적화',
    ],
    relatedTools: ['get_project_snapshot', 'get_session_logs'],
  },
  {
    name: 'get_session_logs',
    displayName: 'get_session_logs',
    icon: '📊',
    description: 'AI 작업 세션 기록을 조회합니다.',
    longDescription:
      '저장된 AI 작업 세션 로그를 조회합니다. 어떤 프로젝트에서 어떤 모델과 IDE를 사용했는지, ' +
      '작업 유형과 토큰 사용량 등의 이력을 확인할 수 있습니다. ' +
      'projectId로 필터링하거나 limit으로 최근 N개만 가져올 수 있습니다.',
    tags: ['Logs', 'History'],
    parameters: [
      {
        name: 'projectId',
        type: 'string',
        required: false,
        description: '특정 프로젝트의 로그만 조회. 생략 시 전체 반환',
      },
      {
        name: 'limit',
        type: 'number',
        required: false,
        description: '반환할 최대 레코드 수. 기본값 50',
      },
    ],
    keyFeatures: [
      '프로젝트별 세션 이력 조회',
      '사용 모델 및 IDE 기록 포함',
      '작업 유형, 토큰 수, 날짜 정보 포함',
      'limit 파라미터로 최신 N개 조회',
    ],
    useCases: [
      '최근 작업 이력 파악',
      '모델별 사용 빈도 분석',
      '프로젝트별 AI 사용량 추적',
    ],
    relatedTools: ['add_session_log', 'get_model_recommendations'],
  },
  {
    name: 'add_session_log',
    displayName: 'add_session_log',
    icon: '✍️',
    description: '현재 AI 작업 세션을 기록합니다.',
    longDescription:
      '현재 진행 중인 AI 작업 세션 정보를 기록합니다. ' +
      '프로젝트 ID, 작업 유형, 사용 모델, IDE 정보를 필수로 입력하고 ' +
      '선택적으로 토큰 사용량과 메모를 추가할 수 있습니다. ' +
      '세션 종료 시 호출하여 작업 이력을 누적합니다.',
    tags: ['Logs', 'Write'],
    parameters: [
      {
        name: 'projectId',
        type: 'string',
        required: true,
        description: '작업한 프로젝트 ID',
      },
      {
        name: 'taskType',
        type: 'string',
        required: true,
        description: '작업 유형 (예: feature, bugfix, analysis, research)',
      },
      {
        name: 'model',
        type: 'string',
        required: true,
        description: '사용한 AI 모델 ID (예: claude-sonnet-4-6)',
      },
      {
        name: 'ide',
        type: 'string',
        required: true,
        description: '사용한 IDE (예: claude-code, vscode, cursor)',
      },
      {
        name: 'tokenUsed',
        type: 'number',
        required: false,
        description: '사용한 토큰 수 (선택)',
      },
      {
        name: 'notes',
        type: 'string',
        required: false,
        description: '작업 메모 (선택)',
      },
    ],
    keyFeatures: [
      '세션 작업 기록 저장',
      '프로젝트, 모델, IDE 필수 입력',
      '토큰 사용량 선택 기록',
      '메모 추가 가능',
    ],
    useCases: [
      '작업 완료 시 세션 이력 자동 기록',
      '모델별 토큰 사용량 추적',
      '프로젝트별 AI 작업 로그 축적',
    ],
    relatedTools: ['get_session_logs', 'list_projects'],
  },
  {
    name: 'get_skill_template',
    displayName: 'get_skill_template',
    icon: '📝',
    description: '새 프로젝트용 skill.md 템플릿을 반환합니다.',
    longDescription:
      '새 프로젝트에 AI 스킬을 설정할 때 사용하는 skill.md 파일의 표준 템플릿을 반환합니다. ' +
      '템플릿에는 프로젝트 설명, 주요 파일 경로, 개발 워크플로우 등의 섹션이 포함됩니다. ' +
      '반환된 템플릿을 각 프로젝트의 `.claude/skills/` 디렉토리에 저장하여 사용합니다.',
    tags: ['Skills', 'Template'],
    parameters: [
      {
        name: 'skillId',
        type: 'string',
        required: true,
        description: '템플릿을 가져올 스킬 ID (예: default, biotech, security)',
      },
    ],
    keyFeatures: [
      '표준 skill.md 템플릿 반환',
      '스킬 ID별 도메인 특화 템플릿',
      '즉시 .claude/skills/에 저장 가능한 형태',
      'MCP 서버 연동 컨텍스트 포함',
    ],
    useCases: [
      '새 프로젝트 시작 시 skill.md 초기화',
      '도메인별 표준 템플릿 적용',
      '기존 프로젝트 skill 구조 표준화',
    ],
    relatedTools: ['list_projects', 'get_project_snapshot'],
  },
  {
    name: 'get_operational_prompt_template',
    displayName: 'get_operational_prompt_template',
    icon: '🧭',
    description: '아키텍처 결정, 로그 트러블슈팅, 비용 감사용 공통 운영 프롬프트를 반환합니다.',
    longDescription:
      'instructions-library에 등록된 공통 운영 프롬프트 템플릿을 반환합니다. ' +
      '각 프로젝트에서 배포 전략을 결정하거나, 빌드/배포 로그를 진단하거나, 클라우드와 AI API 비용 노출을 점검할 때 사용합니다. ' +
      '템플릿은 초안 생성용이며 외부 AI에 사용할 때는 secrets, token, 환자/고객 데이터, 미공개 연구 데이터를 반드시 제거해야 합니다.',
    tags: ['Prompts', 'Operations', 'Safety'],
    parameters: [
      {
        name: 'templateId',
        type: 'string',
        required: false,
        description: 'architecture-decision | troubleshooting-log-analysis | cost-audit-finops. 생략 시 목록 반환',
      },
    ],
    keyFeatures: [
      '운영 프롬프트를 instructions-library에서 단일 관리',
      '프로젝트별 AGENTS.md에서 trigger phrase로 참조 가능',
      'MCP가 없을 때 로컬 docs/prompts/operations/ 파일로 fallback 가능',
      '외부 AI 사용 전 redaction 원칙 포함',
    ],
    useCases: [
      'Vercel, Fly.io, Docker, GitHub Actions 배포 선택지 비교',
      'CI/build/deploy/CORS/auth 실패 로그 진단',
      'OpenAI, Groq, Gemini, Microsoft API, Colab, cloud 비용 위험 점검',
    ],
    relatedTools: ['get_mcp_registry', 'get_project_snapshot', 'get_references'],
  },
];

export const TOOL_MAP: Record<string, McpToolDefinition> = Object.fromEntries(
  ALL_TOOLS.map((t) => [t.name, t])
);
